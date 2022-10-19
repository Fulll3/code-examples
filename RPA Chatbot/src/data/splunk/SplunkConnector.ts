import * as axios from "axios";
import { Agent } from "https"
import * as fs from "fs";
import * as path from "path"
import { startTimer } from "winston";
import { start } from "applicationinsights";
import { ProcessStatus } from "../../domain/splunk/values/ProcessRun";
import { Logger } from "botanica";
import { Runtime } from "../../Runtime";
import { IHealthCheckable } from "../../monitoring/health/IHealthCheckable";
import { use } from "chai";



export type SplunkResultRow = {
  host: string;
  use_case: string;
  process: string;
  status: string;
  started: string;
  use_case_number: string;
  terminated?: string;
  completed?: string;
}

export type SplunkResponse = {
  data: {
    results: SplunkResultRow[];
  }
}

export type SessionResult = {
  ID: string[]
}

export type SplunkResultRowStatistics = {
  started_month: string;
  process: string;
  duration: string;
  number_of_executions: string;
}

export type SplunkResponseStatistics = {
  data: {
    results: SplunkResultRowStatistics[];
  }
}

export type RobotNumberSearchResult = {
  host:string;
  robot:string;
}

export class SplunkConnector implements IHealthCheckable {
  private axios: axios.AxiosInstance;
  private splunkService: any;
  private logger = new Logger(SplunkConnector.name)
  private companyCA = fs.readFileSync(path.join(__dirname, "/../../../ssl/Siemens CA 2016.cer"));
  constructor(
    private token: string,
    private host: string
  ) {
    if (!this.token) {
      throw new Error(`${SplunkConnector.name}: Token is not provided in constructor.`)
    }
    if (!this.host) {
      throw new Error(`${SplunkConnector.name}: Host is not provided in constructor.`)
    }
    this.axios = axios.default.create({
      headers: {
        "Authorization": `Bearer ${this.token}`
      },
      httpsAgent: new Agent({ ca: this.companyCA }),
    })

  }

  public async isHealthy(): Promise<boolean> {
    try {
      const results = await this.getSessionIds("IPA1425", null, null, null)
      return (!!results)
    } catch (error) {
      this.logger.error(`isHealthy() error "${error.message}"`);
      throw new Error(error);
    }

  }
  private getAuth = () => {
    //      sessionKey: this.token,
    // authorization: "Bearer",
    return {
      host: "https://demchdc7xcx.dc4ca.siemens.de",
      port: "9089",
      version: "8.0.7",
      scheme: "https"
    }
  }

  public getSessionIds = async (
    usecase: string,
    host: string,
    startTime: string,
    endTime: string,
  ): Promise<SessionResult[]> => {
    try {
      //SDMND0001645 IPA1645
      const hostSearchQuery = host ? `(host= "${host.toLowerCase()}" OR host= "${host.toUpperCase()}") ` : "";
      let processQuery;
      if (usecase) {
        if (this.isIPA(usecase)) {
          usecase = this.formatIPAUsecaseNumber(usecase);
          processQuery = `(process_name="${usecase}*" OR process="${usecase}*" OR process_name="MY*${usecase}*" OR process="MY*${usecase}*" OR process_name="IN_*${usecase}*" OR process="IN_*${usecase}*" OR process_name="JP*${usecase}*" OR process="JP*${usecase}*" OR process_name="TR*${usecase}*" OR process="TR*${usecase}*" OR process_name="USA_*${usecase}*" OR process="USA_*${usecase}*")`;
        } else {
          processQuery = `(process_name="${usecase}*" OR process="${usecase}*")`
        }
      } else {
        processQuery = ""
      }

      const searchQuery = `search index="blueprism" ID!=""  state!="started" ${hostSearchQuery} ${processQuery} NOT (process="Login" OR process="Logout" OR process="Send Queue Report" OR process_name="Login" OR process_name="Logout" OR process_name="Send Queue Report") | eval ID=if(isnull(ID),"",ID) | stats values(ID) as ID`
      const earliestTime = startTime ? startTime : "-30d";
      const lastestTime = endTime ? endTime : "now";
      const response = await this.searchData(searchQuery, earliestTime, lastestTime);
      return <SessionResult[]>response["data"]["results"];
    } catch (e) {
      this.logger.error('splunkResponse', e)
      throw new Error(e)
    }
  }
  public searchRobotNr = async (resourcename: string): Promise<RobotNumberSearchResult[]> => {
    try {
      const searchQuery = `search index=blueprism sourcetype=blueprism:SEdict earliest=-10y
      | eval host = upper(VC)
      | where host = "${resourcename}"
      | table host robot`
      const response = await this.searchData(searchQuery);
      return response.data.results;
    } catch (e) {
      this.logger.error('splunkResponse', e.response.data.messages[0].text)
      throw new Error(e)
    }
  }

  public searchRunHistory = async (
    sessionIds: string[],
    startTime: string,
    endTime: string,
    statusFilter: ProcessStatus

  ): Promise<SplunkResponse> => {
    try {
      //SDMND0001645 IPA1645
      let sessionIdQuery = (typeof sessionIds) === "string" ? `ID="${sessionIds}"` : `ID IN(${sessionIds.map((sessionId) => `"${sessionId}"`).join(",")})`
      const stateSearchQuery = statusFilter ? `search status="${statusFilter}"` : ``;
      const searchQuery = `search index="blueprism" ID!="" ${sessionIdQuery} state!="started"  NOT (process="Login" OR process="Logout" OR process="Send Queue Report" OR process_name="Login" OR process_name="Logout" OR process_name="Send Queue Report")  |eval state=if(isnull(state),"running",state)    |eval combinedprocess=mvappend(process,process_name) | eval use_case=if(substr(combinedprocess,1,3)="IPA",substr(combinedprocess,1,7), substr(combinedprocess,1,12))| rex field=combinedprocess "(?<use_case_number>\\d{3,})" | eval started = if(state="running" OR state = "Created session:" ,strftime(_time,"%Y-%m-%d %H:%M:%S") ,null)|   eval terminated = if(state="terminated" OR state="Resolved abnormal termination of session" OR state = "stopped" OR state = "Session deleted",strftime(_time,"%Y-%m-%d %H:%M:%S") ,null)| eval completed = if(state="completed",strftime(_time,"%Y-%m-%d %H:%M:%S") ,null)| stats values(host) as host values(use_case_number) as use_case_number values(use_case) as use_case values(combinedprocess) as process values(state) as status min(started) as started max(completed) as completed max(terminated) as terminated BY ID  | sort started  |eval status = if(isnull(completed) AND isnull(terminated),"running",if(isnull(terminated),"completed", "terminated")) | fields host use_case_number use_case process status started completed terminated | sort started desc | ${stateSearchQuery}`
      const earliestTime = startTime ? startTime : "-30d";
      const lastestTime = endTime ? endTime : "now";
      let response: SplunkResponse;
      response = await this.searchData(searchQuery, earliestTime, lastestTime);
      return response
    } catch (e) {
      this.logger.error('splunkResponse', e)
      throw new Error(e)
    }
  }
  public searchProcessStatistics = async (
    usecase: string,
    startTime: string,
    endTime: string,

  ): Promise<SplunkResponseStatistics> => {
    try {
      //SDMND0001645 IPA1645
      const processQuery = `(process_name="${usecase}*" OR process="${usecase}*")`;
      const searchQuery = `search index=blueprism ${processQuery}| eval host=substr(upper(host),-4) | eval state=if(isnull(state),"running",state) | eval process_name=if(isnull(process_name),"",process_name) | eval process=if(isnull(process),"",process) | eval use_case=if(substr(process,1,3)="IPA",substr(process,1,7), substr(process,1,12)) | eval combinedprocess=mvappend(process,process_name) | eval ID=if(isnull(ID),"",ID) | search ID!="" state != "started" | eval dedupField=ID.state | dedup dedupField | eval started = if(state="running" OR state = "Created session:" ,strftime(_time,"%Y-%m-%d %H:%M:%S") ,null) | eval started_month = if(state="running" OR state = "Created session:" ,strftime(_time,"%Y-%m") ,null) | eval terminated = if(state="terminated" OR state="Resolved abnormal termination of session" OR state = "stopped" OR state = "Session deleted",strftime(_time,"%Y-%m-%d %H:%M:%S") ,null) | eval completed = if(state="completed",strftime(_time,"%Y-%m-%d %H:%M:%S") ,null) | stats values(host) as host values(use_case) as use_case values(combinedprocess) as process values(status) as status min(started) as started max(completed) as completed max(terminated) as terminated values(started_month) as started_month BY ID | eval status = if(isnull(completed) AND isnull(terminated),"running",if(isnull(terminated),"completed", "terminated")) | eval duration = if (status = "completed", round((strptime(completed ,"%Y-%m-%d %H:%M:%S.%3N") - strptime(started ,"%Y-%m-%d %H:%M:%S.%3N"))/60/60,2),if (status = "terminated", round((strptime(terminated ,"%Y-%m-%d %H:%M:%S.%3N") - strptime(started ,"%Y-%m-%d %H:%M:%S.%3N"))/60/60,2),null)) | fields host use_case process status started completed terminated duration started_month | search NOT(process="login" OR process="logout" OR process="Send Queue Report") started !="" duration!="" | stats values(process) as process2 count(started) as number_of_executions sum(duration) as duration BY started_month process| table process duration started_month number_of_executions | search process != "" | sort started_month asc  `
      const earliestTime = startTime ? startTime : "-180d";
      const lastestTime = endTime ? endTime : "now";
      let response: SplunkResponseStatistics;
      response = await this.searchData(searchQuery, earliestTime, lastestTime);
      return response
    } catch (e) {
      this.logger.error('splunkResponse', e)
      throw new Error(e)
    }
  }

  private isIPA = (usecase: string) => {
    return usecase.toLowerCase().startsWith("ipa");
  }

  private formatIPAUsecaseNumber = (usecase: string) => {
    const usecaseNumber = usecase.match(/\d*/)
    //remove replace leading 0 with asterix
    return `IPA*${Number(usecase.match(/\d+/g)[0]).toString()}`
  }
  private searchData(searchQuery: string, earliestTime?: string, lastestTime?: string) {
    var bodyFormData = this.getUrlSearchParams(searchQuery, earliestTime, lastestTime)
    const response = this.axios.request({
      url: `${this.host}/servicesNS/z003t17a/blue_prism/search/jobs`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: bodyFormData,
      params: {
        output_mode: "json",

        'count': 0
      }
    });
    return response;
  }

  private getUrlSearchParams = (searchQuery: string, earliestTime?: string, lastestTime?: string) => {
   let  params =  {
      "search": searchQuery,
      "exec_mode": "oneshot",
      'count': "0",
      "adhoc_search_level": "smart",
    }
    if(earliestTime) {
      params["earliest_time"] = earliestTime 
    }
    if(lastestTime) {
      params["latest_time"] = lastestTime
    }
    return new URLSearchParams(params);
  }

}