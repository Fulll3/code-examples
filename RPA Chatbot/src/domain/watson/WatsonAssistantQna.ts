import { RuntimeIntent, MessageOutput, RuntimeEntity, RuntimeResponseGeneric } from "ibm-watson/assistant/v2";
import { WatsonAssistant as WatsonAssistantData } from "../../data/watson/WatsonAssistant";
import { AvailableLanguages } from "../../conversation/LocalizedMessages";
import { IRecognition } from "./IRecognition";
import { Logger } from "botanica";
import { TurnContext } from "botbuilder";
import { RECOGNITION, SELECTOR } from "../../middlewares/watson/WatsonAssistantMiddleware";
import { Selectors } from "../../data/storage/IPromptOptions";
import { ScheduleInfoDialog } from "../../conversation/dialogs/schedules/ScheduleInfoDialog";
import { ScheduleCommands } from "../../conversation/commands/ScheduleCommands";
import { ProcessStatus, SpecificDateRange, UseCaseRunHistoryDialog } from "../../conversation/dialogs/processStatus/UseCaseRunHistoryDialog";
import { SelectorSearchConfig } from "../../conversation/dialogs/GatherInputHelper";
import { ExecutionsDialog } from "../../conversation/dialogs/processStatus/ExecutionsDialog";
import { ProcessRunningDialog } from "../../conversation/dialogs/processStatus/ProcessRunningDialog";
import { Moment } from "moment";
import moment = require("moment");
import { InitialOptionsDialog } from "../../conversation/dialogs/InitialOptionsDialog";
import { Utils } from "../../Utils";
import { FreeSlotsDialog } from "../../conversation/dialogs/robotStatus/FreeSlotsDialog";
import { HeroCardHelper } from "../../conversation/HeroCardHelper";
import { AdaptiveCardCustom } from "../../conversation/AdaptiveCard";
enum SystemEntity {
  date = "sys-date",
  number = "sys-number"
}

enum GenericResponseType {
  text = "text",
  option = "option",
  image = "image"
}
export class WatsonAssistantQna {
  private readonly logger = new Logger(WatsonAssistantQna.name);

  constructor(
    private assistantConnector: WatsonAssistantData,
    private confidenceThreshold: number = 0.7,
  ) {
    if (!this.assistantConnector) {
      throw new Error(`[${WatsonAssistantQna.name}]: Missing parameter, English assistant is required`);
    }
    this.logger.debug(`constructor initialized: [${this.confidenceThreshold}]`);
  }

  public firstIntentIs(intents: RuntimeIntent[], target: string): boolean {
    return (!!intents && Array.isArray(intents) && (intents.length > 0) && (intents[0].intent === target));
  }

  public getFirstConfidence(intents: RuntimeIntent[]): number {
    if (!!intents && Array.isArray(intents) && (intents.length > 0)) {
      return intents[0].confidence;
    }
    return 0;
  }

  public getFirstIntentAndEntities(watsonOutput: MessageOutput): IRecognition {
    const output = {} as IRecognition;
    if (!!watsonOutput && !!watsonOutput.intents && Array.isArray(watsonOutput.intents) && (watsonOutput.intents.length > 0)) {
      output.confidence = watsonOutput.intents[0].confidence;
      output.intent = watsonOutput.intents[0].intent;
    }
    if (!!watsonOutput && !!watsonOutput.entities && Array.isArray(watsonOutput.entities) && (watsonOutput.entities.length > 0)) {
      output.entities = watsonOutput.entities;
    }
    return output;
  }
  public getMiddlewareMessageOutput(context: TurnContext): MessageOutput {
    return context.turnState.get(RECOGNITION)
  }
  public getSelectorEntities(watsonOutput?: MessageOutput, context?: TurnContext): RuntimeEntity[] {
    watsonOutput = watsonOutput ? watsonOutput : this.getMiddlewareMessageOutput(context);
    const recognition = this.getFirstIntentAndEntities(watsonOutput);
    return recognition.entities ? recognition.entities.filter((entity) => entity.entity === SELECTOR) : undefined;
  }

  public getNumberEntities(watsonOutput: MessageOutput): RuntimeEntity[] {
    const recognition = this.getFirstIntentAndEntities(watsonOutput);
    return recognition.entities ? recognition.entities.filter((entity) => entity.entity === SystemEntity.number) : undefined;
  }


  public async getAssistantOutput(text: string): Promise<MessageOutput> {
    const messageOutput = await this.assistantConnector.getAssistantOutput(text);

    return messageOutput;
  }
  public async sendWelcomeMessage() {
    return await this.getAssistantOutput("");
  }

  public isFinalAnswer = (context: TurnContext, output: MessageOutput) => {
    const watsonResponses = output.generic;
    for (const assistantDialogAction of watsonResponses) {
      if(assistantDialogAction.response_type === GenericResponseType.option) {
        return false;
      }
    }
    return true;
  }
  public async replicateMessages(context: TurnContext, output: MessageOutput) {
    const watsonResponses = output.generic;
    for (const assistantDialogAction of watsonResponses) {
      switch (assistantDialogAction.response_type) {
        case GenericResponseType.text:
          await context.sendActivity(assistantDialogAction.text);
          break;
        case GenericResponseType.option:
          const suggestedActionActivity = this.createSuggestedActions(context, assistantDialogAction)
          await context.sendActivity(suggestedActionActivity);
          break;
        default:
          throw new Error(`unsoported Assistant response type: ${assistantDialogAction.response_type}`);
      }
    }

  }
  private createSuggestedActions = (context: TurnContext, assistantDialogAction: RuntimeResponseGeneric) => {
    const title = assistantDialogAction.title;
    const choices = assistantDialogAction.options.map((option) => option.value.input.text);
    return AdaptiveCardCustom.getActionCardAsActivity(title, choices)
  }
  public getEntityText(context: TurnContext, entity: RuntimeEntity) {
    return context.activity.text.substring(entity.location[0], entity.location[1])
  }

  public normalizeEntity(recognition: MessageOutput, entity: string): string[] {
    return recognition
      .entities
      .filter(e => e.entity === entity)
      .map(e => e.value);
  }
}
