import { ShowTypingMiddleware } from "botbuilder";
import {
  ChoiceFactory,
  ComponentDialog,
  DialogTurnResult,
  DialogTurnStatus,
  WaterfallDialog,
  WaterfallStepContext,
} from "botbuilder-dialogs";
import { Activity, ActivityTypes } from "botframework-schema";
import { UserRepository } from "../../../data/storage/UserRepository";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom, AdaptiveCardsFolder } from "../../AdaptiveCard";
import { DialogStack } from "../../DialogStack";
import { LocalizedMessages } from "../../LocalizedMessages";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { ScheduleCommands } from "../../commands/ScheduleCommands";
import { InitialOptionsDialog } from "../InitialOptionsDialog";
import { GatherInputHelper, SelectorSearchConfig } from "../GatherInputHelper";
import { GatherInputsDialog } from "../GatherInputsDialog";
import { ScheduleInfoDialog } from "./ScheduleInfoDialog";
import { WatsonAssistant } from "../../../domain/watson/WatsonAssistant";
import { HeroCardHelper } from "../../HeroCardHelper";

export class ScheduleMainDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(
    name: string,
    private storage: UserRepository,
    private watson: WatsonAssistant
    ) {
    super(name);
    this.addDialog(
      new WaterfallDialog(WaterfallDialog.name, [
        this.sendTopics.bind(this),
        this.routeResultsStep.bind(this),
        this.cleanUpStep.bind(this),
      ])
    ).addDialog(new GatherInputsDialog(GatherInputsDialog.name, storage))
      .addDialog(new ScheduleInfoDialog(ScheduleInfoDialog.name, storage));
    this.translator = new LocalizedMessages(ScheduleMainDialog.name, storage);
  }

  private sendTopics = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const options = Object.values(ScheduleCommands);
    const activity = HeroCardHelper.getSuggestedAction(step.context, options, "How can I help you?");
    await step.context.sendActivity(activity);

    return {
      status: DialogTurnStatus.waiting
    }
  };

  private routeResultsStep = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const dialog = this.watson.getDialogOptionsBasedOnRecognition(step.context);
    return await step.replaceDialog(dialog.dialogName, dialog.dialogOptions);    
  };

  private cleanUpStep = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    await this.storage.clear(step.context);
    return step.endDialog();
  };
}
