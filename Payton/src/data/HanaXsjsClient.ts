import { Env, Logger, SecretManager } from "botanica";
import * as fs from "fs";
import * as HttpsProxyAgent from "https-proxy-agent";
import * as path from "path";
import * as request from "request-promise-native";
import { RequestPromiseOptions } from "request-promise-native";
import { IHanaRowData } from "../business/data/HanaDataLake/IHanaRowData";
import { IHealthCheckable } from "../core/healthManager/IHealthCheckable";
import { HanaSchemaVersion } from "../core/QueryCreator";

export interface IHanaXsjsClient {
  getData(sql: string, params: string[]): Promise<IHanaRowData[]>
}

export class HanaXsjsClient implements IHanaXsjsClient, IHealthCheckable {
  private companyCA = fs.readFileSync(path.join(__dirname, "/../../ssl/Siemens CA 2016.cer"));
  private secretManager: SecretManager;
  private hanaUrl: Promise<string>;
  private readonly paramsSplitter: string = "|";
  private logger: Logger = new Logger("HanaXsjsClient");

  //#region Initialization 
  constructor(secretManager: SecretManager, private hanaSchemaVersion: HanaSchemaVersion) {
    this.secretManager = secretManager;
    this.loadHanaUrl();


  }
  private loadHanaUrl() {
    switch (this.hanaSchemaVersion) {
      case HanaSchemaVersion.Botanica:
        this.hanaUrl = this.secretManager.getSecret("HANA_URL_BOTANICA");
        break;
    }
  }

  //#endregion

  //#region Public Methods 
  public async isHealthy(): Promise<boolean> {
    var options = await this.generateRequestOptions("healthcheck", "healthcheck");

    options.transform = (body, response) => {
      return response.statusCode === 200;
    };

    return request(
      await this.hanaUrl,
      options
    ).catch(err => {
      this.logger.error(err);

      return false;
    });
  }

  public async getData(sql: string, params: string[]): Promise<IHanaRowData[]> {
    this.logger.info(sql);
    var options = await this.generateRequestOptions(sql, params.join(this.paramsSplitter));
    console.log(options);
    options.transform = (body, response) => {
      if (response.statusCode === 200) {
        return JSON.parse(body).result;
      } else {
        this.logger.error(JSON.stringify(body));
        return [];
      }
    };

    return request(
      await this.hanaUrl,
      options
    );
  }
  //#endregion

  //#region Private Methods 
  private async generateRequestOptions(body, params): Promise<RequestPromiseOptions> {
    return {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache'
      },
      qs: { "PARAMS": params },
      auth: await this.loadSecrets(),
      body: body,
      ca: this.companyCA
    } as request.RequestPromiseOptions;
  }

  private loadSecrets = async (): Promise<IHanaAuth> => {
    switch (this.hanaSchemaVersion) {
      case HanaSchemaVersion.Botanica:
        return {
          username: await this.secretManager.getSecret("HANA_USERNAME_BOTANICA"),
          password: await this.secretManager.getSecret("HANA_PASSWORD_BOTANICA")
        }
    }

  }
  //#endregion
}

export interface IHanaAuth {
  username: string;
  password: string;
}