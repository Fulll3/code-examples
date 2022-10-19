import * as AssistantV2 from "ibm-watson/assistant/v2";
import { RuntimeIntent, MessageOutput } from "ibm-watson/assistant/v2";
import { IamAuthenticator } from "ibm-watson/auth";
import { IHealthCheckable } from "../../../monitoring/health/IHealthCheckable";
import { Runtime } from "../../../Runtime";
import { Logger } from "botanica";
import { TurnContext } from "botbuilder";
import { LanguageRecognition } from "../LanguageRecognition";
import { CheckTypes } from "../../../service/CheckTypes";

export class WatsonAssistant implements IHealthCheckable {
  private assistant: AssistantV2;
  private sessionCreation: Date;
  private session: string;
  private logger: Logger;

  constructor(
    private version: string,
    private apiKey: string,
    private url: string,
    private assistantId: string,
    private confidenceThreshold: number
  ) {
    if (!version) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter. watson lib version is required`);
    }
    if (!apiKey) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter. watson key is required`);
    }
    if (!url) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter. watson url is required`);
    }
    if (!assistantId) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter. watson assistant id required`);
    }
    if (!confidenceThreshold) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter. watson confidenceThreshold id required`);
    }

    this.assistant = new AssistantV2({
      version: this.version,
      authenticator: new IamAuthenticator({ apikey: this.apiKey }),
      url: this.url,
      headers: {
        "X-Watson-Learning-Opt-Out": "true", // Prevent IBM usage of API requests data
      },
    });
    this.sessionCreation = new Date(1);
    this.logger = new Logger(WatsonAssistant.name + ":" + this.assistantId.split("-")[0]);
    if (Runtime.isLocal()) {
      this.logger.debug(`constructor initialized [${version}][${apiKey}][${url}][${assistantId}]`);
    } else {
      this.logger.debug(`constructor initialized`);
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const recognition = await this.getAssistantOutput("9700000000");
      return (!!recognition.entities && Array.isArray(recognition.entities) && recognition.entities.length > 0);
    } catch (error) {
      this.logger.debug(`isHealthy() error "${error.message}"`);
      throw error;
    }
  }
  public async recognize(context: TurnContext): Promise<LanguageRecognition> {
    console.log(`text untrimmed: ${context.activity.text}`)
    const text = context.activity.text.replace(/(\r\n|\n|\r)/gm, "")
    console.log(`text trimmed ${text}`)
    const rawRecognition = await this.getAssistantOutput(text);
    const recognition = new LanguageRecognition(this.confidenceThreshold);

    if (CheckTypes.hasContent(rawRecognition.intents)) {
      recognition.setIntent(rawRecognition.intents[0].intent);
      recognition.setConfidence(rawRecognition.intents[0].confidence);
    }
    if (CheckTypes.hasContent(rawRecognition.entities)) {
      for (const e of rawRecognition.entities) {
        const entityText = this.extractEntityValue(context, e);
        recognition.addEntity(e.value, e.confidence, e.entity, undefined, e.location[0], e.location[1], entityText); // TODO: improve if watson is going to be used
      }
    }
    console.log(`watson recognition: ${JSON.stringify(recognition)}`);
    return recognition;
  }

  private extractEntityValue = (context: TurnContext, entity: AssistantV2.RuntimeEntity): string => {
    return context.activity.text.slice(entity.location[0], entity.location[1]);
  }
  public async getAssistantOutput(text: string): Promise<MessageOutput> {
    try {
      const session = await this.getSession();
      return await this.message(text, session);
    } catch (error) {
      this.logger.debug(`getAssistantOutput(${text})`, error);
      throw error;
    }
  }

  private async getSession(): Promise<string> {
    if (this.currentSessionExpired()) {
      this.session = await this.createSession();
      this.sessionCreation = new Date();
      if (Runtime.isLocal()) {
        this.logger.debug(`New Session stablished: ${this.session}`);
      }
    }
    return this.session;
  }

  private async createSession(): Promise<string> {
    return this.assistant
      .createSession({ assistantId: this.assistantId })
      .then(response => response.result.session_id);
  }

  private async deleteSession(session: string): Promise<any> {
    return this.assistant.deleteSession({
      sessionId: session,
      assistantId: this.assistantId,
    });
  }

  private async message(text: string, session: string): Promise<MessageOutput> {
    return this.assistant.message({
      assistantId: this.assistantId,
      sessionId: session,
      input: { message_type: "text", text },
    })
      .then(response => response.result.output);
  }

  private currentSessionExpired(): boolean {
    const fourMinutes = 240000;
    const currentTime = new Date();
    const elapsed = currentTime.valueOf() - this.sessionCreation.valueOf();

    return elapsed > fourMinutes;
  }
}
