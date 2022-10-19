import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { IAssistantCache } from "./IAssistantCache";

// create type: result-packaging
type ResultPackaging = {
  result: MessageResponse;
  timestamp: number;
};

export const RAW_CACHE_CONST = 'RawCache';

export class RawCache implements IAssistantCache {
  private map: { [key: string]: ResultPackaging; };
  private acceptedTimeSpan: number;
  private calls: number;
  private callsThreshold: number;
  private assistant: AssistantV1;

  //#region Initialization 
  constructor(assistantService: AssistantV1, acceptedTimeSpan: number = 60000, callsThreshold: number = 25) {
    if (acceptedTimeSpan < 0) {
      throw Error('Invalid Argument: Assistant Cache time span should be positive.');
    }
    if (callsThreshold <= 0) {
      throw Error('Invalid Argument: Assistant Cache threshold should be greather than zero.');
    }
    this.acceptedTimeSpan = acceptedTimeSpan;
    this.callsThreshold = callsThreshold;
    this.assistant = assistantService;
    this.calls = 0;
    this.map = {};
  }
  //#endregion

  //#region Public Methods 
  public tag(): string {
    return RAW_CACHE_CONST;
  }

  public withTimeSpan(time: number) {
    if (time < 0) {
      throw Error('Invalid Argument: Assistant Cache time span should be positive.');
    }
    this.acceptedTimeSpan = time;
    return this;
  }

  public withCallsTreshold(threshold: number) {
    if (threshold <= 0) {
      throw Error('Invalid Argument: Assistant Cache threshold should be greather than zero.');
    }
    this.callsThreshold = threshold;
    return this;
  }

  public getTimeSpan(): number {
    return this.acceptedTimeSpan;
  }

  public getNumberOfReferences(): number {
    return Object.keys(this.map).length;
  }

  public message(params: AssistantV1.MessageParams, callback: (error: any, body: MessageResponse) => void) {
    const key = params.workspace_id + "_" + params.input.text;

    if (this.has(key) && this.isValid(key)) {
      callback(null, this.get(key));
      this.checkClear();
    } else {
      this.assistant.message(params, (err: any, response: MessageResponse) => {
        if (err) {
          callback(err, null);
        } else {
          this.set(key, response);
          callback(null, response);
        }
        this.checkClear();
      });
    }
  }
  //#endregion

  //#region Private Methods 
  private has(key: string): boolean {
    if (this.map[key] != undefined) {
      return true;
    }
    return false;
  }

  private set(key: string, value: MessageResponse): void {
    const cached: ResultPackaging = {
      result: value,
      timestamp: Date.now()
    };
    this.map[key] = cached;
  }

  private get(key: string): MessageResponse {
    return this.map[key].result;
  }

  private delete(key: string): void {
    delete this.map[key];
  }

  private checkClear(): void {
    this.calls++;
    if (this.calls == this.callsThreshold) {
      this.doClear();
      this.calls = 0;
    }
  }

  private doClear(): void {
    for (let key in this.map) {
      if (!this.isValid(key)) {
        this.delete(key);
      }
    }
  }

  private isValid(key: string): boolean {
    const cached = this.map[key];
    const elapsed = (Date.now() - cached.timestamp);

    if (elapsed < this.acceptedTimeSpan) {
      return true;
    }
    else {
      return false;
    }
  }
  //#endregion
}