import { SplunkResultRow } from "../../../data/splunk/SplunkConnector";
import { Utils } from "../../../Utils";

export enum ProcessStatus {
  started= "started",
  running = "running",
  completed = "completed",
  terminated = "terminated",
  unknown = "unknown"
}

export class ProcessRun {
  constructor(
    private started: string,
    private host: string,
    private use_case: string,
    private use_case_number: string,
    private process: string,
    private status: string,
    private terminated?:string,
    private completed?: string
  ){

  }

  public static buildProcessRunFromSplunkResult = (result: SplunkResultRow) => {
    return new ProcessRun(
      result.started,
      result.host,
      result.use_case,
      result.use_case_number,
      result.process,
      result.status,
      result.terminated,
      result.completed
      )
  }

  public getStarted = (getOnlyDate= false, getOnlyTime = false) => {
    return Utils.formatDateToLocaleString(new Date(this.started), getOnlyDate, getOnlyTime);
  }
  public getHost = () => {
    return this.host;
  }
  public getUseCase = () => {
    return this.use_case;
  }
  public getProcessName = () => {
    return this.process;
  }
  public getStatus = (): ProcessStatus => {
    let status: ProcessStatus;
    switch (this.status) {
      case ProcessStatus.completed:
        status = ProcessStatus.completed;
        break;
      case ProcessStatus.running:
        status = ProcessStatus.running;
        break;
      case ProcessStatus.completed:
        status = ProcessStatus.completed;
        break;
      case ProcessStatus.terminated:
        status = ProcessStatus.terminated;
        break;
      default:
        status = ProcessStatus.unknown;
        break;
    }
    return status;
  }

  public isRunning = () => {
    return this.getStatus() === ProcessStatus.running;
  }
  public getFinishedAt = (getOnlyDate = false, getOnlyTime = false): string => {
    let finished;
     switch (this.getStatus()) {
      case ProcessStatus.completed:
        finished = Utils.formatDateToLocaleString(new Date(this.completed), getOnlyDate, getOnlyTime);
        break;
      case ProcessStatus.terminated:
        finished = Utils.formatDateToLocaleString(new Date(this.terminated), getOnlyDate, getOnlyTime);
        break;
      default:
        finished = "";
        break;
    }
    return finished;
  }

  public getMonthInWhichProcessStarted = (): number => {
    return new Date(this.started).getMonth();
  }

  public getRobotNumber = () => {
    return this.host.substring(this.host.length - 4, this.host.length).toUpperCase();
  }
}