import { start } from "applicationinsights";
import { use } from "chai";
import moment = require("moment");
import { SpecificDateRange } from "../../conversation/dialogs/processStatus/UseCaseRunHistoryDialog";
import { SplunkConnector, SplunkResultRow } from "../../data/splunk/SplunkConnector";
import { Services } from "../../service/Services";
import { Utils } from "../../Utils";
import { SchedulesComposer } from "../schedules/SchedulesComposer";
import { Schedule } from "../schedules/values/Schedule";
import { ProcessRun, ProcessStatus } from "./values/ProcessRun";


export type SplunkSearchParams = {
  usecaseNumber?: string,
  robotNumber?: string,
  specificDateRange?: SpecificDateRange,
  onlyLastRun?: boolean,
  status?: ProcessStatus
}

export type ProcessStatisticsDetails = {
  process: string;
  duration: string;
  number_of_executions: string
}
export type ProcessStatisticsByMonth = {
  [key: string]: ProcessStatisticsDetails[]
}
export class SplunkSimple {
  constructor() {

  }
  public static getRobotNumber = async (resourcename: string) => {
    const resournameWithoutPort = resourcename.split(":")[0]
    const splunkConnector: SplunkConnector = Services.instance().get("SplunkConnector");
    const results = await splunkConnector.searchRobotNr(resournameWithoutPort);
    if (results.length > 0) {
      return results[0].robot;
    } else {
      return null;
    }
  }
  public static getProcessRuns = async (params: SplunkSearchParams, isUserFromSiemensEnergy: boolean): Promise<ProcessRun[]> => {
    const splunkConnector: SplunkConnector = Services.instance().get("SplunkConnector");
    let searchFromDate, searchUntilDate: string;
    let sessionIds = [];
    if (params.specificDateRange) {
      searchFromDate = SplunkSimple.formatDate(params.specificDateRange.startDate);
      searchUntilDate = SplunkSimple.formatDate(params.specificDateRange.endDate);
      sessionIds = await SplunkSimple.getSessionIds(splunkConnector, params, searchFromDate, searchUntilDate);
    } else {
      for (let monthsBack = 1; monthsBack <= 6; monthsBack++) {
        searchFromDate = SplunkSimple.formatDate(Utils.getDateBeforeMonths(monthsBack));
        searchUntilDate = SplunkSimple.formatDate(Utils.getDateBeforeMonths(monthsBack - 1));
        sessionIds = await SplunkSimple.getSessionIds(splunkConnector, params, searchFromDate, searchUntilDate);
        if (sessionIds.length > 0) {
          break;
        }
      }
    }
    if (sessionIds.length === 0) {
      return [];
    }
    const searchResults = await SplunkSimple.getScheduleAndProcessRuns(splunkConnector, isUserFromSiemensEnergy, searchFromDate, searchUntilDate, sessionIds, params)
    return SplunkSimple.processResults(searchResults.splunkResponse, searchResults.schedules, params)
  }



  public static getProcessStatistics = async (usecase: string, dateRange: SpecificDateRange): Promise<Map<string, ProcessStatisticsDetails[]>> => {
    const splunkConnector: SplunkConnector = Services.instance().get("SplunkConnector");
    const startTime = SplunkSimple.formatDate(dateRange.startDate);
    const endTime = SplunkSimple.formatDate(dateRange.endDate);
    const results = (await splunkConnector.searchProcessStatistics(usecase, startTime, endTime)).data.results;
    const groupResultsByMonth: ProcessStatisticsByMonth = Utils.groupBy(results, "started_month");
    return new Map(Object.entries(groupResultsByMonth).reverse());
  }


  public static getLatestSearchingDate = (): Date => {
    return Utils.getDateBeforeMonths(6)
  }
  private static formatHost = (resource: string): string => {
    const hostPrefix = `demchhc03aa`;
    const host = resource ? `${hostPrefix}${resource.padStart(3, "0")}` : undefined;
    return host;
  }


  private static formatDate = (date: Date) => {
    if (date) {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      return moment(date).format("YYYY-MM-DDTHH:mm:ss") + "Z";
    } else {
      return ""
    }
  }

  private static getScheduleAndProcessRuns = async (splunkConnector: SplunkConnector, isUserFromSiemensEnergy: boolean, searchFromDate, searchUntilDate, sessionIds, params) => {
    const splunkResponsePromise = splunkConnector.searchRunHistory(
      sessionIds,
      searchFromDate,
      searchUntilDate,
      params.status
    );
    const schedulesPromise = SchedulesComposer.getSchedules({
      robotNumber: params.robotNumber,
      ipaNumber: params.usecaseNumber
    }, isUserFromSiemensEnergy)

    const [splunkResponse, schedules] = await Promise.all([splunkResponsePromise, schedulesPromise]);
    return {
      splunkResponse: splunkResponse.data.results,
      schedules
    };
  }

  private static processResults = (splunkResults: SplunkResultRow[], schedules: Schedule[], params: SplunkSearchParams): ProcessRun[] => {
    const allowedIpaNumbers = schedules.map((schedule) => schedule.getIpaNumber());
    splunkResults = splunkResults.filter((splunkResult) => splunkResult.use_case_number);
    splunkResults = splunkResults.filter((splunkResult) => allowedIpaNumbers.includes(splunkResult.use_case_number.padStart(4, "0")));
    if (splunkResults == undefined) {
      throw new Error(`${SplunkSimple.name} - getProcessRuns: no response from splunk search`)
    } else {
      let maxResults = 100;
      if (params.onlyLastRun) {
        const processNames = Array.from(new Set(splunkResults.map((splunkResult) => splunkResult.process)));
        const processAndRobotsMap = SplunkSimple.groupProcessAndRobots(processNames, splunkResults);
        const lastRunsPerProcessAndRobot = SplunkSimple.getProcessesPerLastRunInRobots(processAndRobotsMap, splunkResults);
        return lastRunsPerProcessAndRobot;
      } else if (params.status === ProcessStatus.terminated) {
        maxResults = 10;
      }
      maxResults = maxResults > splunkResults.length ? splunkResults.length : maxResults;
      const processRunArray: ProcessRun[] = [];
      let i = 0
      for (i; i < maxResults; i++) {
        processRunArray.push(ProcessRun.buildProcessRunFromSplunkResult(splunkResults[i]));
      }
      return processRunArray;
    }
  }

  private static getProcessesPerLastRunInRobots(processAndRobotsMap: Map<any, any>, splunkResults: SplunkResultRow[]) {
    const lastRunsPerProcess: ProcessRun[] = [];
    processAndRobotsMap.forEach((runningInRobots: string[], processName: string) => {
      runningInRobots.forEach((robotName) => {
        const lastRunForProcesInRobot = splunkResults.find((splunkResult) => robotName === splunkResult.host && processName === splunkResult.process);
        lastRunsPerProcess.push(ProcessRun.buildProcessRunFromSplunkResult(lastRunForProcesInRobot));
      });
    });
    return lastRunsPerProcess;
  }

  private static groupProcessAndRobots(processNames: string[], splunkResults: SplunkResultRow[]) {
    const processAndRobotsMap = new Map();
    processNames.forEach((processName) => {
      const runningInRobots = new Set(splunkResults.filter((splunkResult) => splunkResult.process === processName)
        .map((splunkResult) => splunkResult.host));
      processAndRobotsMap.set(processName, Array.from(runningInRobots));
    });
    return processAndRobotsMap;
  }

  private static async getSessionIds(splunkConnector: SplunkConnector, params: SplunkSearchParams, searchFromDate: any, searchUntilDate: string) {
    let sessionIds = [];
    const sessionResponse = (await splunkConnector.getSessionIds(
      params.usecaseNumber,
      SplunkSimple.formatHost(params.robotNumber),
      searchFromDate,
      searchUntilDate));
    sessionIds = sessionResponse.length > 0 ? sessionResponse[0].ID : [];
    return sessionIds;
  }


}