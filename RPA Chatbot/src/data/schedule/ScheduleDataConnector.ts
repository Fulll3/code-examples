import { Agent } from "https";
import *  as axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { IHealthCheckable } from "../../monitoring/health/IHealthCheckable";
import { Logger } from "botanica";

export type ScheduleSearchInputs = {
  ipaNumber?: string,
  robotNumber?: string
}
export interface IScheduleData {
  startpoint: string;
  calendarname: string;
  taskid: string;
  mode: string;
  nonworkingday: string;
  startdate: string;
  period: string;
  calendarid: string;
  nthofmonth: string;
  ScheduleID: string;
  workingweek: string;
  StopAfterTime: string;
  enddate: string;
  Schedulename: string;
  IPA_Number: string;
  endpoint: string;
  dayset: string;
  retired: string;
  unittype: string;
  resourcename: string;
  scheduledInRobots: string[];
}
export type ScheduleConnectorResults = {
  data: IScheduleData[]
}

export class ScheduleDataConnector implements IHealthCheckable {
  private axios: axios.AxiosInstance
  private logger: Logger;

  constructor(
    host: string,
    azureKey: string,
    cert: string,
    key: string,
    passphrase: string
  ) {
    key = fs.readFileSync(path.join(__dirname, "/../../../ssl/rpachatbot.siemens.com.key")).toString();
    cert = fs.readFileSync(path.join(__dirname, "/../../../ssl/S0002T9A_rpachatbot.siemens.com.cer")).toString();
    const httpsAgent = new Agent({ key, cert, passphrase });
    this.axios = axios.default.create({
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey
      },
      httpsAgent,
      baseURL: host
    })
    this.logger = new Logger(ScheduleDataConnector.name)
  }

  public async isHealthy(): Promise<boolean> {
    const input: ScheduleSearchInputs = {
      ipaNumber: "1425"
    }
    try {
      const results = await this.getSchedules(input);
      return (!!results);
    } catch(error) {
      this.logger.error(`isHealthy() error "${error.message} details: ${error.response.data.message}"`);
      throw new Error(error);
    }
  }

  public getSchedules = async (options: ScheduleSearchInputs): Promise<IScheduleData[]> => {
    try {
      if (!options.ipaNumber && !options.robotNumber) {
        throw new Error(`${ScheduleDataConnector.name}: either IPA number or robotNumber have to be provided `)
      }
      const filterQuery = this.createFilterQuery(options);
      const results = await this.axios.get(`c00055/digicharging/item?filter=${filterQuery}`);
      return results.data;
    } catch (error) {
      this.logger.error(`${ScheduleDataConnector.name}: getSchedules error "${error.message} details: ${error.response.data.message}"`);
      throw new Error(error.message);
    }
  }

  private createFilterQuery(options: ScheduleSearchInputs) {
    let filterQuery: string;
    if (options.ipaNumber && options.robotNumber) {
      filterQuery = `IPA_Number eq ${options.ipaNumber} &  resourcename eq DEMCHHC03AAR${options.robotNumber}:8811`;
    } else if (options.ipaNumber) {
      filterQuery = `IPA_Number eq ${options.ipaNumber}`;
    } else {
      filterQuery = `resourcename eq DEMCHHC03AAR${options.robotNumber}:8811`;
    }
    return filterQuery;
  }
}