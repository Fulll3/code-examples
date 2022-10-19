import { IIntentRecognizerResult, IRecognizeContext } from "botbuilder";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { WatsonAssistantRecognizer } from "../../../src/conversation/bot/WatsonAssistantRecognizer";

export class WatsonMockupRecognizer extends WatsonAssistantRecognizer {
  private intent: string;

  constructor(intent: string) {
    super(undefined);
    this.intent = intent;
  }

  public manualRecognize(message: string): Promise<MessageResponse> {
    throw new Error("Method not implemented.");
  }

  public onRecognize = (context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void => {
    var response = {
      "intents": [
        {
          "intent": this.intent,
          "confidence": 1
        }
      ],
      "entities": [],
      "input": {
        "text": "invoice status"
      },
      "output": {
        "generic": [],
        "text": [],
        "nodes_visited": [],
        "warning": "No dialog node condition matched to true in the last dialog round - context.nodes_visited is empty. Falling back to the root node in the next round.",
        "log_messages": [
          {
            "level": "warn",
            "msg": "No dialog node condition matched to true in the last dialog round - context.nodes_visited is empty. Falling back to the root node in the next round."
          }
        ]
      },
      "context": {
        "conversation_id": "3571e36d-aaf1-414f-9294-ae01bc3cb725",
        "system": {
          "initialized": true,
          "dialog_stack": [
            {
              "dialog_node": "root"
            }
          ],
          "dialog_turn_counter": 1,
          "dialog_request_counter": 1
        }
      }
    } as MessageResponse;
    const result: IIntentRecognizerResult = { score: 1.0, intent: "none" };
    this.adaptWatsonResponse(response, result, callback);
  }
}
