import * as NodeCache from 'node-cache';
import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { IAssistantCache } from "./IAssistantCache";

export const DELEGATE_CACHE_CONST = 'DelegateCache';

export class DelegateCache implements IAssistantCache {
  private map: NodeCache;
  private assistant: AssistantV1;

  //#region Initialization 
  constructor(assistant: AssistantV1, acceptedTimeSpan: number = 60) {
    if (acceptedTimeSpan < 0) {
      throw Error('Invalid Argument: Assistant Cache time span should be positive.');
    }

    this.assistant = assistant;
    this.map = new NodeCache({ stdTTL: acceptedTimeSpan });
  }
  //#endregion

  //#region  Public Methods 
  public tag(): string {
    return DELEGATE_CACHE_CONST;
  }

  public message(params: AssistantV1.MessageParams, callback: (error: any, body: MessageResponse) => void) {
    const key = params.workspace_id + "_" + params.input.text;
    const result = this.map.get(key);

    if (typeof result !== "undefined") {
      callback(null, result as MessageResponse);
    } else {
      this.assistant.message(params, (err: any, response: MessageResponse) => {
        if (err) {
          callback(err, null);
        } else {
          this.map.set(key, response);
          callback(null, response);
        }
      });
    }
  }
  //#endregion
}