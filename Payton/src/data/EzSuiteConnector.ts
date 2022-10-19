import { Logger } from "botanica";
import * as fs from "fs";
import * as path from "path";
import * as rp from "request-promise-native";
import { IEzSuiteConnector } from "../business/data/EzSuite/IEzSuiteConnector";
import { IEzSuiteConnectorParams } from "../business/data/EzSuite/IEzSuiteConnectorParams";
import { IEzSuiteInvoiceData } from "../business/data/EzSuite/IEzSuiteInvoiceData";
import { IHealthCheckable } from "../core/healthManager/IHealthCheckable";
import moment = require("moment");

export class EzSuiteConnector implements IEzSuiteConnector, IHealthCheckable {
  private companyCA = fs.readFileSync(path.join(__dirname, "/../../ssl/Siemens CA 2016.cer"));
  private logger: Logger = new Logger("EzSuiteConnector");

  private readonly paramsCodes = {
    socVendor: "socvendor",
    invoiceNumber: "invoice_number",
    invoiceDate: "invoice_date",
    invoiceAmount: "invoice_amount",
    invoiceCurrency: "invoice_currency",
    poNumber: "invoice_po_number"
  };

  private readonly devUrlEndpoint = "https://136.157.166.69:8444/api/invoices";
  private url = "";
  private userName: string;
  private password: string;


  //#region Initialization 
  constructor(url: string, userName: string, password: string) {
    this.url = url;
    this.userName = userName;
    this.password = password;
  }
  //#endregion

  //#region Public Methods 
  public async isHealthy(): Promise<boolean> {
    var url = this.generateUrl({
      socVendor: "SBT-SAP|544564",
      invoiceNumber: "healthcheck_123"
    } as IEzSuiteConnectorParams);

    return rp(url, {
      auth: {
        username: this.userName,
        password: this.password
      },
      ca: this.companyCA
    }).then(result => {
      return result.trim() === "[]";
    }).catch(err => {
      this.logger.error(err);

      return false;
    });
  }

  public getData(inputParams: IEzSuiteConnectorParams): Promise<IEzSuiteInvoiceData[]> {
    var urlWithParams = this.generateUrl(inputParams);
    this.logger.debug(urlWithParams);

    return rp(urlWithParams, {
      auth: {
        username: this.userName,
        password: this.password
      },
      ca: this.companyCA
    })
      .then(function (result) {
        return JSON.parse(result) as IEzSuiteInvoiceData[];
      });
  }
  //#endregion

  //#region Private Methods 
  private generateUrl(inputParams: IEzSuiteConnectorParams) {
    var listOfParams = [
      { key: this.paramsCodes.socVendor, value: inputParams.socVendor },
      { key: this.paramsCodes.invoiceNumber, value: inputParams.invoiceNumber },
      { key: this.paramsCodes.invoiceDate, value: inputParams.invoiceDate ? moment(inputParams.invoiceDate).format("DD-MM-YYYY") : inputParams.invoiceDate },
      { key: this.paramsCodes.invoiceAmount, value: inputParams.invoiceAmount },
      { key: this.paramsCodes.invoiceCurrency, value: inputParams.invoiceCurrency },
      { key: this.paramsCodes.poNumber, value: inputParams.poNumber }
    ];

    var params = listOfParams.map(item => {
      if (item.value) {
        return `${item.key}=${item.value}`;
      }
      else {
        return undefined;
      }
    }).filter(Boolean).join("&");

    return this.getEndpoint().concat(...["?", params]);
  }

  private getEndpoint() {
    return this.url
      ? this.url
      : this.devUrlEndpoint;
  }
  //#endregion
}