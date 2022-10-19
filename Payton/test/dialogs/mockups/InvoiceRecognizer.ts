import { IIntentRecognizerResult, IRecognizeContext } from "botbuilder";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { WatsonAssistantRecognizer } from "../../../src/conversation/bot/WatsonAssistantRecognizer";

export class InvoiceWatsonMockupRecognizer extends WatsonAssistantRecognizer {
  private addInvoiceEntity: boolean;

  constructor(addInvoiceEntity: boolean) {
    super(undefined);
    this.addInvoiceEntity = addInvoiceEntity;
  }

  public manualRecognize(message: string): Promise<MessageResponse> {
    throw new Error("Method not implemented.");
  }

  public onRecognize = (context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void => {
    var response = {
      "intents": [
        {
          "intent": "invoiceStatus",
          "confidence": 1
        }
      ],
      "entities":
        this.addInvoiceEntity
          ? [{
            "entity": "parameter",
            "location": [
              0,
              21
            ],
            "groups": [
              {
                "group": "group_0",
                "location": [
                  0,
                  21
                ]
              },
              {
                "group": "group_1",
                "location": [
                  15,
                  21
                ]
              }
            ],
            "value": "invoiceNumber",
            "confidence": 1
          }
          ]
          : [],
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

export function getMockupAdaptiveCardWithInvoiceNumber(): any {
  return {
    "type": "message",
    "agent": "botbuilder",
    "source": "console",
    "address": {
      "channelId": "console",
      "user": {
        "id": "user1",
        "name": "user1"
      },
      "bot": {
        "id": "bot",
        "name": "Bot"
      },
      "conversation": {
        "id": "user1Conversation"
      }
    },
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "type": "AdaptiveCard",
          "version": "1.0",
          "body": [
            {
              "type": "Container",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "This is the invoice information you provided:",
                  "wrap": true
                },
                {
                  "type": "FactSet",
                  "facts": [
                    {
                      "title": "Invoice Number:",
                      "value": "123456"
                    },
                    {
                      "title": "Amount:"
                    },
                    {
                      "title": "Date:",
                      "value": ""
                    },
                    {
                      "title": "PO Number:"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  };
}