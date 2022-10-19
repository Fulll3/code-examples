import { ICheckNumberConnector } from "../business/data/CheckNumber/ICheckNumberConnector";
import { ICheckNumberQuery } from "../business/data/CheckNumber/ICheckNumberQuery";
import { IDatastoreResult } from "../business/data/CheckNumber/IDatastoreResult";
import { CoreOptions } from "request";
import { Env, Logger } from "botanica";
import * as fs from "fs";
import * as path from "path";
import * as qs from "querystring";
import * as rp from "request-promise-native";
import request = require("request");

export class CheckNumberConnector implements ICheckNumberConnector {
  private companyCA: Buffer;
  private logger: Logger;
  private http: request.RequestAPI<rp.RequestPromise, rp.RequestPromiseOptions, request.RequiredUriUrl>;
  private static instance: CheckNumberConnector;

  private constructor(private url: string, private username: string, private password: string) {
    if (!this.url) {
      throw new Error(`[${CheckNumberConnector.name}]: Missing parameter, url is required`);
    }
    if (!this.username) {
      throw new Error(`[${CheckNumberConnector.name}]: Missing parameter, username is required`);
    }
    if (!this.password) {
      throw new Error(`[${CheckNumberConnector.name}]: Missing parameter, password is required`);
    }
    this.companyCA = fs.readFileSync(path.join(__dirname, "/../../ssl/Siemens CA 2016.cer"));
    this.logger = new Logger(CheckNumberConnector.name);
    this.http = rp;
  }

  public static getInstance(url?: string, username?: string, password?: string): CheckNumberConnector {
    if (!CheckNumberConnector.instance) {
      CheckNumberConnector.instance = new CheckNumberConnector(url, username, password);
    }

    return CheckNumberConnector.instance;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.http(
        this.getUrl(this.getQueryString({
          clearingDocumentNumber: "?",
          voucherNumber: "?",
        })),
        this.getRequest()
      );
      return true;
    } catch (error) {
      this.logger.error(`[${CheckNumberConnector.name}]: isHealthy error "${error.message}"`);
      return false;
    }
  }

  public async getData(inputParams: ICheckNumberQuery): Promise<IDatastoreResult[]> {
    if (!inputParams) {
      throw new Error(`[${CheckNumberConnector.name}]:getData(): at least voucher number is required`);
    }
    if (!inputParams.voucherNumber) {
      throw new Error(`[${CheckNumberConnector.name}]:getData(): at least voucher number is required`);
    }
    if (!inputParams.clearingDocumentNumber) {
      inputParams.clearingDocumentNumber = '';
    }
    const queryString = this.getQueryString(inputParams);
    this.logger.debug(`[${CheckNumberConnector.name}]: Next CheckNumber Query: ${queryString}`);

    const response = await this.http(
      this.getUrl(queryString),
      this.getRequest()
    );
    const dataStoreResult = JSON.parse(response);
    this.logger.debug(`[${CheckNumberConnector.name}]: Got ${dataStoreResult.length} results for Query: ${queryString}`);

    return dataStoreResult;
  }

  private getQueryString(inputParams: ICheckNumberQuery): string {
    return qs.stringify({
      clearingdocumentnumber: inputParams.clearingDocumentNumber, 
      vouchernumber: inputParams.voucherNumber 
    });
  }

  private getRequest(): CoreOptions {
    if (Env.get("NODE_ENV") !== "dev") {
      return {
        auth: this.getAuth(),
        ca: this.companyCA,
      }
    } else {
      return {
        auth: this.getAuth(),
        rejectUnauthorized: false,
      }
    }
  }

  private getUrl(queryString: string): string {
    return `${this.url}?${queryString}`;
  }

  private getAuth(): { username: string, password: string } {
    return {
      username: this.username, 
      password: this.password,
    }
  }
}
