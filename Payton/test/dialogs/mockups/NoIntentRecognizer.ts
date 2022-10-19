import { IIntentRecognizerResult, IRecognizeContext } from "botbuilder";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { WatsonAssistantRecognizer } from "../../../src/conversation/bot/WatsonAssistantRecognizer";

export class NoIntent extends WatsonAssistantRecognizer {
  constructor() {
    super(undefined);
  }

  public manualRecognize(message: string): Promise<MessageResponse> {
    throw new Error("Method not implemented.");
  }

  public onRecognize = (context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void => {
    const result: IIntentRecognizerResult = { score: 1.0, intent: "none" };
    callback(undefined, result);
  }
}