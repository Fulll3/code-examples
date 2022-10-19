import { RuntimeIntent, MessageOutput, RuntimeEntity } from "ibm-watson/assistant/v2";
import { WatsonAssistant as WatsonAssistantData } from "../../data/watson/WatsonAssistant";
import { AvailableLanguages } from "../../conversation/LocalizedMessages";
import { IRecognition } from "./IRecognition";
import { Logger } from "botanica";
import { TurnContext } from "botbuilder";
import { RECOGNITION, SELECTOR } from "../../middlewares/watson/WatsonAssistantMiddleware";
import { Selectors } from "../../data/storage/IPromptOptions";
import { ScheduleInfoDialog } from "../../conversation/dialogs/schedules/ScheduleInfoDialog";
import { ScheduleCommands } from "../../conversation/commands/ScheduleCommands";
import {  ProcessStatus, SpecificDateRange, UseCaseRunHistoryDialog } from "../../conversation/dialogs/processStatus/UseCaseRunHistoryDialog";
import { SelectorSearchConfig } from "../../conversation/dialogs/GatherInputHelper";
import { ExecutionsDialog } from "../../conversation/dialogs/processStatus/ExecutionsDialog";
import { ProcessRunningDialog } from "../../conversation/dialogs/processStatus/ProcessRunningDialog";
import {Moment} from "moment";
import moment = require("moment");
import { InitialOptionsDialog } from "../../conversation/dialogs/InitialOptionsDialog";
import { Utils } from "../../Utils";
import { FreeSlotsDialog } from "../../conversation/dialogs/robotStatus/FreeSlotsDialog";
enum SystemEntity  {
  date = "sys-date",
  number = "sys-number"
}
export type MatchedSelector = {
  selector: Selectors,
  value:string,
  number: string
}
type DialogRoutingTable = {
  [key: string]: DialogDetails;
};
export type DialogDetails = {
  dialogName: string;
  dialogOptions: any;
};
export class WatsonAssistant {
  private readonly logger = new Logger(WatsonAssistant.name);

  constructor(
    private assistantConnector: WatsonAssistantData,
    private confidenceThreshold: number = 0.7,
  ) {
    if (!this.assistantConnector) {
      throw new Error(`[${WatsonAssistant.name}]: Missing parameter, English assistant is required`);
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
  public isGreeting = (context: TurnContext) => {
    const firstIntent = this.getFirstIntentAndEntities(this.getMiddlewareMessageOutput(context)).intent;
    return firstIntent === "General_Greetings"
  }
  public getMiddlewareMessageOutput(context: TurnContext):MessageOutput {
    return context.turnState.get(RECOGNITION)
  } 
  public getSelectorEntities(watsonOutput?: MessageOutput, context?: TurnContext): RuntimeEntity[] {
    watsonOutput = watsonOutput ? watsonOutput : this.getMiddlewareMessageOutput(context);
    const recognition = this.getFirstIntentAndEntities(watsonOutput);
    return recognition.entities ? recognition.entities.filter((entity) => entity.entity === SELECTOR) : [];
  }

  public getNumberEntities(watsonOutput: MessageOutput): RuntimeEntity[] {
    const recognition = this.getFirstIntentAndEntities(watsonOutput);
    return recognition.entities ? recognition.entities.filter((entity) => entity.entity === SystemEntity.number) : [];
  }
  public matchSelectors(context: TurnContext, selectorSequence: Selectors[], entities: RuntimeEntity[]): MatchedSelector[] {
    const matchedSelectors = [];
    for (const entity of entities ){
      const selector = selectorSequence.find((selectorName) => selectorName === entity.value);
      if(!!selector){
        const value = this.getEntityText(context, entity);
        const number = value.match(/\d+/)[0]
        const match =  {
          selector,
          value,
          number 
      }
      matchedSelectors.push(match);
    }
  }
  return matchedSelectors;
}
private getSpecificDateRange = (recognition: IRecognition, firstIntent: string): SpecificDateRange => {
  if(recognition.entities) {
    const lastWeek = recognition.entities.filter((entity) => entity.value === 'lastWeek');
    let startDate;
    let endDate;
    if(lastWeek && lastWeek.length > 0 ) {
      startDate= Utils.getDateBeforeDays(7);
      endDate = new Date()
    } else {
      const dateEntities = recognition.entities.filter((entity) => entity.entity === SystemEntity.date);
      startDate = dateEntities[0] ? new Date(dateEntities[0].value) : undefined;
      endDate = dateEntities[1] ? new Date(dateEntities[1].value) : undefined;
    }
    return {
      startDate,
      endDate
    }
  }
}

public getDialogOptionsBasedOnRecognition(context: TurnContext, selectorConfig?: SelectorSearchConfig):DialogDetails {
  const recognition: MessageOutput = context.turnState.get(RECOGNITION);
  const firstIntent = recognition.intents.length > 0 ? recognition.intents[0].intent: "fallBack";
  let specificDateRange = this.getSpecificDateRange(recognition,firstIntent);
  const routingTableIntentDialogName: DialogRoutingTable = {
    ShowAllSchedules: {
      dialogName: ScheduleInfoDialog.name,
      dialogOptions: ScheduleInfoDialog.createDialogOptions(ScheduleCommands.allSchedules)
    },
    NextRun: {
      dialogName: ScheduleInfoDialog.name,
      dialogOptions: ScheduleInfoDialog.createDialogOptions(ScheduleCommands.nextPlannedRun)
    },
    ShowRetiredSchedules: {
      dialogName: ScheduleInfoDialog.name,
      dialogOptions: ScheduleInfoDialog.createDialogOptions(ScheduleCommands.onlyRetiredSchedules)
    },
    IsRetired: {
      dialogName: ScheduleInfoDialog.name,
      dialogOptions: ScheduleInfoDialog.createDialogOptions(ScheduleCommands.retirementStatus)
    },
    LastRun: this.getLastRunDialogDetails(selectorConfig),
    HowManyHoursAndExecutions: {
      dialogName:ExecutionsDialog.name,
      dialogOptions: ExecutionsDialog.createDialogOptions()
    },
    IsProcessRunning: {
      dialogName:ProcessRunningDialog.name,
      dialogOptions: ProcessRunningDialog.createDialogOptions()
    },
    ShowTerminations: {
      dialogName: UseCaseRunHistoryDialog.name,
      dialogOptions: UseCaseRunHistoryDialog.createDialogOptions(SelectorSearchConfig.usecaseMandatoryRobotOptional, false, {startDate: Utils.getDateBeforeMonths(6), endDate: new Date()}, ProcessStatus.terminated,10,true)
    },
    ShowRuns: this.getShowRunsDialogDetails(specificDateRange, selectorConfig),
    FreeSlots:{
      dialogName: FreeSlotsDialog.name,
      dialogOptions: FreeSlotsDialog.createDialogOptions()
    },
    fallBack: {
      dialogName: InitialOptionsDialog.name,
      dialogOptions: InitialOptionsDialog.createDialogOptions(true)
    }

  };
  if(!firstIntent) {
    return undefined;
  }
  return routingTableIntentDialogName[firstIntent];
}
  private getLastRunDialogDetails(selectorConfig: SelectorSearchConfig): DialogDetails {
    const selector = selectorConfig ? selectorConfig : SelectorSearchConfig.useCaseAndRobotMandatory
    return {
      dialogName: UseCaseRunHistoryDialog.name,
      dialogOptions: UseCaseRunHistoryDialog.createDialogOptions(selector, true)
    };
  }

  private getShowRunsDialogDetails(specificDateRange: SpecificDateRange, selector?: SelectorSearchConfig): DialogDetails {
    const selectorSettings = selector ? selector : SelectorSearchConfig.usecaseMandatoryRobotOptional;
    return {
      dialogName: UseCaseRunHistoryDialog.name,
      dialogOptions: UseCaseRunHistoryDialog.createDialogOptions(selectorSettings, false, specificDateRange)
    };
  }

  public async getAssistantOutput(text: string, language: AvailableLanguages): Promise<MessageOutput> {
    const messageOutput = await this.assistantConnector.getAssistantOutput(text);
    this.logger.debug(JSON.stringify(messageOutput));
    if(messageOutput.intents.length > 0) {
      const filteredIntents =  messageOutput.intents.filter((intent) => intent.confidence >= this.confidenceThreshold);
      messageOutput.intents = filteredIntents;
    }
    return messageOutput;
  }
  public getEntityText(context: TurnContext, entity: RuntimeEntity){
    return context.activity.text.substring(entity.location[0],entity.location[1])
  }

  public normalizeEntity(recognition: MessageOutput, entity: string): string[] {
    return recognition
      .entities
      .filter(e => e.entity === entity)
      .map(e => e.value);
  }
}
