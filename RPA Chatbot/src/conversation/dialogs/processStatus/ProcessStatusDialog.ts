import { ExceptionData } from "applicationinsights/out/Declarations/Contracts";
import { ChoiceFactory, ComponentDialog, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { UserRepository } from "../../../data/storage/UserRepository";
import { ProcessStatusCommands } from "../../commands/ProcessStatusCommands";
import { LocalizedMessages } from "../../LocalizedMessages";
import { InitialOptionsDialog } from "../InitialOptionsDialog";
import { ExecutionsDialog } from "./ExecutionsDialog";
import {  ProcessStatus, SpecificDateRange, UseCaseRunHistoryDialog, UseCaseRunHistoryDialogOptions } from "./UseCaseRunHistoryDialog";
import { ProcessRunningDialog } from "./ProcessRunningDialog";
import { GatherInputDialogOptions } from "../GatherInputsDialog";
import { Selectors } from "../../../data/storage/IPromptOptions";

import { GatherInputHelper, SelectorSearchConfig } from "../GatherInputHelper";
import { WatsonAssistant } from "../../../domain/watson/WatsonAssistant";
import { HeroCardHelper } from "../../HeroCardHelper";


export class ProcessStatusDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(name: string, 
    private storage: UserRepository,
    private watson: WatsonAssistant){
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.sendTopics.bind(this),
      this.evaluateUserChoice.bind(this)
    ]))
    .addDialog(new ExecutionsDialog(ExecutionsDialog.name, this.storage))
    .addDialog(new UseCaseRunHistoryDialog(UseCaseRunHistoryDialog.name, this.storage))
    .addDialog(new ProcessRunningDialog(ProcessRunningDialog.name, this.storage));
    this.translator= new LocalizedMessages(ProcessStatusDialog.name, storage);
  }

  private sendTopics = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = Object.values(ProcessStatusCommands);
    const activity = HeroCardHelper.getSuggestedAction(step.context, options,"You can select from following options");
    await step.context.sendActivity(activity);
    return {
      status: DialogTurnStatus.waiting
    }
  }

  private evaluateUserChoice = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const dialog = this.watson.getDialogOptionsBasedOnRecognition(step.context);
    return await step.replaceDialog(dialog.dialogName, dialog.dialogOptions);    
    
  }
  public createDialogOptions = (
    searchConfig: SelectorSearchConfig,
    onlyLastRun: boolean,
    dateFilter?: SpecificDateRange,
    processStatusFilter?: ProcessStatus,
    numberOfResults?:number 
    ): UseCaseRunHistoryDialogOptions => {
    let selectorSettings = GatherInputHelper.getOptions(searchConfig);
    return {
      selectorSettings,
      onlyLastRun,
      dateFilter,
      processStatusFilter,
      numberOfResults
    }
  }

}