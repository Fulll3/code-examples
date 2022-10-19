import { IIntentRecognizer, IIntentRecognizerResult, IRecognizeContext } from "botbuilder";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";

export interface IWatsonAssistantRecognizer extends IIntentRecognizer {
  manualCachedRecognize(message: string, locale: string): Promise<MessageResponse>;
  manualRecognize(message: string, locale: string): Promise<MessageResponse>;
  onRecognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void;
}