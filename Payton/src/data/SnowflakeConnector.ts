import { Axios, AxiosResponse } from "axios";
import { Logger } from "botanica";
import { IHanaRowData } from "../business/data/HanaDataLake/IHanaRowData";
import { JWTGenerator } from "./finnavigate/JWTGenerator"
import * as SqlString from "sqlstring"
import { IHanaXsjsClient } from "./HanaXsjsClient";

export class SnowflakeConnector implements IHanaXsjsClient {
  private connector: Axios;
  private logger: Logger;
  private static instance: SnowflakeConnector;

  constructor(
    private url: string,
    private JWTGenerator: JWTGenerator
  ) {
    this.connector = new Axios({
      url,
      validateStatus: this.validateStatus
    });
    this.logger = new Logger(SnowflakeConnector.name);
  }

  public static getInstance(url?: string, JWTGenerator?: JWTGenerator): SnowflakeConnector {
    if (!SnowflakeConnector.instance) {
      SnowflakeConnector.instance = new SnowflakeConnector(url, JWTGenerator);
    }

    return SnowflakeConnector.instance;
  }

  public getData = async (sql: string, params: string[]): Promise<IHanaRowData[]> => {
    try {
      const joinedSql = SqlString.format(sql,params);
      const response = await this.connector.post(this.url, this.createBody(joinedSql), {
        headers: this.createHeaders(this.JWTGenerator.getToken()),
      })
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error(`[${SnowflakeConnector.name}]: getData error "${error.message}". Error reason: "${JSON.parse(error.response.data).message}"`);
      throw new Error(error.message);
    }

  }
  private parseResponse = (response: AxiosResponse<any, any>): IHanaRowData[] => {
    const data = JSON.parse(response.data).data;
    let parsedOutput: IHanaRowData[] = data.map((recordRow): IHanaRowData => {
      return {
        DocumentNumber: recordRow[0],
        DocumentDate: recordRow[1],
        VendorNumber: recordRow[2],
        PONumber: recordRow[3],
        CompanyCode: recordRow[4],
        Assignment: recordRow[5],
        PostingDate: recordRow[6],
        DocumentType: recordRow[7],
        PaymentBlock_DocLevel: recordRow[8],
        Document_PaymentMethod: recordRow[9],
        PaymentTerms: recordRow[10],
        ClearingDate: recordRow[11],
        ClearingDocument: recordRow[12],
        Name1: recordRow[14],
        Region: recordRow[15],
        InvoiceNumber: recordRow[16],
        BaselinePaymentDte: recordRow[17],
        Vendor_PaymentMethod: recordRow[18],
        PaymentBlock_VendorLevel: recordRow[19],
        LocalAmount: recordRow[20],
        DocumentAmount: recordRow[21],
        DocumentCurrency: recordRow[22],
        PBPrice: recordRow[23],
        PBDate: recordRow[24],
        PBQuality: recordRow[26],
        PBQuantity: recordRow[27],
        NetDueDate: recordRow[28],
        System: recordRow[30]
      }
    });
    return parsedOutput;
  }

  private validateStatus = (status) => {
    return status == 200;
  }

  private createBody = (sql: string) => {
    return JSON.stringify({
      statement: sql,
      timeout: 60,
      database: "GBS_BOTANICA_PROD",
      schema: "LANDING",
      warehouse: "GBS_BOTANICA_PROD_WH",
      role: "GBS_BOTANICA_PROD_READER_ROLE",
      bindings: {
        1: {
          type: "FIXED",
          value: "123"
        }
      }
    })
  }
  private createHeaders = (token: string) => {
    return {
      "Authorization": `Bearer ${token}`,
      "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
      "Accept": "*/*",
      "Content-Type": "application/json"
    }
  }

}