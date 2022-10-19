import { IIntentRecognizerResult, IRecognizeContext } from "botbuilder";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { IWatsonAssistantRecognizer } from "../../../src/business/conversation/bot/IWatsonAssistantRecognizer";

export class WatsonMockupRecognizer implements IWatsonAssistantRecognizer {
  manualCachedRecognize(message: string, locale: string): Promise<MessageResponse> {
    return this.manualRecognize(message);
  }
  recognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void {
    throw new Error("Method not implemented.");
  }

  public manualRecognize(message: string): Promise<MessageResponse> {
    return new Promise<MessageResponse>((resolve, reject) => resolve({
      "entities": [
        {
          "entity": "sys-number",
          "location": [
            0,
            4
          ],
          "value": "6.55",
          "confidence": 1,
          "metadata": {
            "numeric_value": 6.55
          }
        },
        {
          "entity": "sys-currency",
          "location": [
            0,
            6
          ],
          "value": "6.55",
          "confidence": 1,
          "metadata": {
            "numeric_value": 6.55,
            "unit": "USD"
          }
        },
        {
          "entity": "deleteParameter",
          "location": [
            5,
            6
          ],
          "value": "$",
          "confidence": 0.9658504128456116
        }
      ],
    } as unknown as MessageResponse));
  }

  public onRecognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void {
    throw new Error("Method not implemented.");
  }
}