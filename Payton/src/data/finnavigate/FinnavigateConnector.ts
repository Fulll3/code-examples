import { ICheckNumberConnector } from "../../business/data/CheckNumber/ICheckNumberConnector";
import { ICheckNumberQuery } from "../../business/data/CheckNumber/ICheckNumberQuery";
import { IDatastoreResult } from "../../business/data/CheckNumber/IDatastoreResult";
import { IHealthCheckable } from "../../core/healthManager/IHealthCheckable";
import { Axios, AxiosResponse } from "axios";
import { JWTGenerator } from "./JWTGenerator";
import { Logger } from "botanica";
import { IFinnavigateResult } from "../../business/data/CheckNumber/IFinnavigateResult";
export class FinnavigateConnector implements IHealthCheckable {
  private connector: Axios;
  private logger: Logger;
  private static instance: FinnavigateConnector;
  constructor(
    private url: string,
    private JWTGenerator: JWTGenerator
  ) {
    this.connector = new Axios({
      url,
      validateStatus: this.validateStatus
    });
    this.logger = new Logger(FinnavigateConnector.name);

  }

  public static getInstance(url?: string, JWTGenerator?: JWTGenerator): FinnavigateConnector {
    if (!FinnavigateConnector.instance) {
      FinnavigateConnector.instance = new FinnavigateConnector(url, JWTGenerator);
    }

    return FinnavigateConnector.instance;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const inputParams = {
        clearingDocumentNumber: "?",
        voucherNumber: "?",
      }
      const data = await this.connector.post(this.url, this.createBody(inputParams), {
        headers: this.createHeaders(this.JWTGenerator.getToken())
      })
      return Promise.resolve(true);
    } catch (error) {
      this.logger.error(`[${FinnavigateConnector.name}]: isHealthy error "${error.message}"`);
      return false;
    }
  }

  public getData = async (inputParams: ICheckNumberQuery): Promise<IFinnavigateResult[]> => {
    try{
      const response = await this.connector.post(this.url, this.createBody(inputParams), {
        headers: this.createHeaders(this.JWTGenerator.getToken()),
      }) 
      return this.parseResponse(response);
    } catch(error) {
      this.logger.error(`[${FinnavigateConnector.name}]: getData error "${error.message}". Error reason: "${JSON.parse(error.response.data).message}"`);
      throw new Error(error.message);
    }

  }

  private parseResponse = (response: AxiosResponse<any,any>): IFinnavigateResult[] => {
    const data = JSON.parse(response.data).data;
    let parsedOutput: IFinnavigateResult[] =  [];
    for (const recordRow of data) {
      parsedOutput.push({
        invoicenumber: recordRow[0],
        clearingdocumentNumber: recordRow[1],
        checknumber: recordRow[2],
        documentnumber: null
      })
    }
    return parsedOutput;
  }

  private validateStatus = (status) => {
    return status == 200;
  }

  private createBody = (inputParams: ICheckNumberQuery) => {


    return JSON.stringify({
      statement: this.createQuery(inputParams),
      timeout: 60
    })
  }
  private createQuery = (inputParams: ICheckNumberQuery) => {
  const query = `select * from DATASTORE_MIGR_PROD.DATASTORE_AG.FINNAVIGATE where INVOICENUMBER like '%${inputParams}%' OR CLEARINGDOCUMENTNUMBER like '%${inputParams}%' OR INVOICENUMBER like '%${inputParams.voucherNumber}%' OR CLEARINGDOCUMENTNUMBER like '%${inputParams.voucherNumber}%'`
  return query


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