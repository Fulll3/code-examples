import { TurnContext } from "botbuilder";
import { ChoiceFactory, ComponentDialog, DialogInstance, DialogReason, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { UserRepository } from "../../../data/storage/UserRepository";
import { WatsonAssistant } from "../../../domain/watson/WatsonAssistant";
import { RobotStatusCommand } from "../../commands/RobotStatusCommands";
import { HeroCardHelper } from "../../HeroCardHelper";
import { LocalizedMessages } from "../../LocalizedMessages";
import { SelectorSearchConfig } from "../GatherInputHelper";
import { InitialOptionsDialog } from "../InitialOptionsDialog";
import { ProcessStatusDialog } from "../processStatus/ProcessStatusDialog";
import {  UseCaseRunHistoryDialog } from "../processStatus/UseCaseRunHistoryDialog";
import { FreeSlotsDialog } from "./FreeSlotsDialog";


export class RobotStatusRouteDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(name: string, 
    private storage: UserRepository,
    private watson: WatsonAssistant
    ) {
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.showOptionsStep.bind(this),
      this.routeResultsStep.bind(this)
    ]))
    .addDialog(new FreeSlotsDialog(FreeSlotsDialog.name, storage))
    .addDialog(new UseCaseRunHistoryDialog(UseCaseRunHistoryDialog.name, storage))
    .addDialog(new InitialOptionsDialog(InitialOptionsDialog.name, storage));

    this.translator = new LocalizedMessages(RobotStatusRouteDialog.name, this.storage);
  }

  private  showOptionsStep = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = Object.values(RobotStatusCommand); 
    const activity = HeroCardHelper.getSuggestedAction(step.context, options ,'You can select from following options.');
    await step.context.sendActivity(activity);
    return {
      status: DialogTurnStatus.waiting
    }
  }

  private  routeResultsStep = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const userText = step.context.activity.text.toLowerCase();
    if(userText === RobotStatusCommand.freeSlots.toLowerCase()){
      return await step.replaceDialog(FreeSlotsDialog.name)
    }
    const dialog = await this.watson.getDialogOptionsBasedOnRecognition(step.context, SelectorSearchConfig.robotOnly);
    return await step.replaceDialog(dialog.dialogName, dialog.dialogOptions);
  }  
}