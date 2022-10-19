// Based on LuisRecognizer.ts https://github.com/Microsoft/BotBuilder/blob/master/Node/core/src/dialogs/LuisRecognizer.ts
import { IIntentRecognizerResult, IntentRecognizer, IRecognizeContext } from 'botbuilder';
import { url } from 'inspector';
import { AssistantV1, ConversationV1 } from "watson-developer-cloud";
import { MessageResponse } from 'watson-developer-cloud/assistant/v1';
import { RuntimeIntent } from 'watson-developer-cloud/conversation/v1-generated';
import { IWatsonAssistantRecognizer } from '../../business/conversation/bot/IWatsonAssistantRecognizer';
import { config } from '../../config';
import { IHealthCheckable } from '../../core/healthManager/IHealthCheckable';
import { AssistantCacheFactory, IAssistantCache } from '../../core/utils/IAssistantCache';

export interface WatsonAssistantRecognizerConfig {
  username: string;
  password: string;
  workspace_id_EN: string;
  workspace_id_FR: string;
  url:string;
}

// https://console.bluemix.net/docs/services/conversation/develop-app.html#building-a-client-application
export class WatsonAssistantRecognizer extends IntentRecognizer implements IWatsonAssistantRecognizer, IHealthCheckable {
  private assistant: AssistantV1;
  private workspaces: { [locale: string]: string };
  private NLP_Treshold: number;
  private cachedAssistant: IAssistantCache;

  //#region Initialization 
  constructor(configuration: WatsonAssistantRecognizerConfig) {
    super();
    this.NLP_Treshold = config.get("NLP_Treshold");
    this.NLP_Treshold = this.NLP_Treshold ? this.NLP_Treshold : 0.65;

    if (configuration) {
      this.assistant = new AssistantV1({
        username: configuration.username,
        password: configuration.password,
        version: ConversationV1.VERSION_DATE_2017_05_26,
        url: configuration.url
      });
      this.workspaces = {
        "en": configuration.workspace_id_EN,
        "fr": configuration.workspace_id_FR
      };
      this.cachedAssistant = AssistantCacheFactory.get(this.assistant);
    }
  }
  //#endregion

  //#region Public Methods 
  public async isHealthy(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => this.assistant.message({
      workspace_id: this.workspaces["en"],
      input: {
        text: "What is status of my invoice?"
      }
    }, (err, body, response) => {
      if (response && response.statusCode == 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    }));
  }

  public async manualRecognize(message: string, locale: string): Promise<MessageResponse> {
    return new Promise<MessageResponse>(
      (resolve, reject) => {
        this.cachedAssistant.message(
          {
            workspace_id: this.getWorkspace(locale),
            input: {
              text: message
            }
          },
          (err: any, response: MessageResponse) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
        );
      }
    );
  }

  public async manualCachedRecognize(message: string, locale: string): Promise<MessageResponse> {
    return new Promise<MessageResponse>(
      (resolve, reject) => {
        this.cachedAssistant.message(
          {
            workspace_id: this.getWorkspace(locale),
            input: {
              text: message
            }
          },
          (err: any, response: MessageResponse) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
        );
      }
    );
  }

  public onRecognize(context: IRecognizeContext, callback: (err: Error, result: IIntentRecognizerResult) => void): void {
    const result: IIntentRecognizerResult = { score: 1.0, intent: "none" };
    if (context && context.message && context.message.text) {
      this.cachedAssistant.message({
        workspace_id: this.getWorkspace(context.locale),
        input: { text: context.message.text }
      }, (err: any, response: MessageResponse) => {
        if (err) {
          callback(err, null);
        } else {
          this.adaptWatsonResponse(
            response,
            result,
            callback
          );
        }
      });
    } else {
      callback(null, result);
    }
  }

  public topIntent(response: MessageResponse): RuntimeIntent {
    return response && response.intents.length > 0
      ? response.intents[0]
      : null;
  }
  //#endregion

  //#region Private Methods 
  protected adaptWatsonResponse(
    response: AssistantV1.MessageResponse,
    result: IIntentRecognizerResult,
    callback: (err: Error, result: IIntentRecognizerResult) => void
  ) {
    if (response.intents.length > 0 && response.intents[0].confidence > this.NLP_Treshold) {
      result.intent = response.intents[0].intent;
      result.score = response.intents[0].confidence;
    }

    result.intents = response.intents.map(i => ({ intent: i.intent, score: i.confidence }));
    result.entities = response.entities.map(e => ({
      type: e.entity,
      entity: e.value,
      score: e.confidence,
      startIndex: e.location[0],
      endIndex: e.location[1],
      metadata: e.metadata,
      groups: e.groups ? e.groups.map(g => ({
        group: g.group,
        startIndex: g.location[0],
        endIndex: g.location[1]
      })) : undefined
    }));

    callback(null, result);
  }

  private getWorkspace(locale: string) {
    return locale && this.workspaces[locale]
      ? this.workspaces[locale]
      : this.workspaces["en"]
  }
  //#endregion
}