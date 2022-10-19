import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { config } from "../../config";
import { DelegateCache } from "./DelegateCache";
import { DisabledCache } from "./DisabledCache";
import { RawCache } from "./RawCache";

let cacheOptions = config.get("AssistantCache");

const IMPLEMENTATION = cacheOptions.type;
const TIME_SPAN = cacheOptions.timeSpan;

export interface IAssistantCache {
  message: (params: AssistantV1.MessageParams, callback: (error: any, body: MessageResponse) => void) => void;
  tag: () => string;
}

export class AssistantCacheFactory {
  static get(assistant: AssistantV1, callsThreshold: number = 25): IAssistantCache {
    switch (IMPLEMENTATION) {
      case "raw":
        return new RawCache(assistant, TIME_SPAN * 1000, callsThreshold);
      case "delegate":
        return new DelegateCache(assistant, TIME_SPAN);
      default:
        return new DisabledCache(assistant);
    }
  }
}