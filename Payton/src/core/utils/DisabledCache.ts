import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { IAssistantCache } from "./IAssistantCache";

export const DISABLED_CACHE_CONST = 'DisabledCache';

export class DisabledCache implements IAssistantCache {
  private assistant: AssistantV1;

  //#region Initialization 
  constructor(assistantService: AssistantV1) {
    this.assistant = assistantService;
  }
  //#endregion

  //#region Public Methods 
  public message(params: AssistantV1.MessageParams, callback: (error: any, body: MessageResponse) => void) {
    this.assistant.message(params, (err: any, response: MessageResponse) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, response);
      }
    });
  }

  public tag(): string {
    return DISABLED_CACHE_CONST;
  }
  //#endregion
}