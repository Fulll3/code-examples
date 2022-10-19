import { TurnContext } from "botbuilder-core";
import {
  ComponentDialog,
  WaterfallDialog,
  DialogTurnResult,
  WaterfallStepContext,
  NumberPrompt,
  PromptValidatorContext,
  ConfirmPrompt,
  ChoicePrompt,
} from "botbuilder-dialogs";
import { DialogStateRepository } from "../../data/storage/DialogStateRepository";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { DialogStack } from "../DialogStack";
import { LocalizedMessages } from "../LocalizedMessages";
import { DialogNames } from "../values/DialogNames";
import { DialogUtil } from "./helpers/DialogUtil";
import { FeedbackDialog } from "./FeedbackDialog";
import { CustomChoicesFactory } from "./helpers/CustomChoicesFactory";
import { CustomChoices } from "./helpers/CustomChoises";
import { HeroCardHelper } from "./helpers/HeroCardHelper";

export class ChoiceDialog extends ComponentDialog {

  private localization: LocalizedMessages = new LocalizedMessages(ChoiceDialog.name);
  private dialogStateRepository = DialogStateRepository.getInstance();

  private userDataRepository = UserDataRepository.getInstance();

  constructor(private feedBackDialog: FeedbackDialog) {
    super(ChoiceDialog.name);
    this.addDialog(
      new WaterfallDialog(DialogNames.WaterfallDialog, [
        this.sendPrompt.bind(this),
      ])
    );
    DialogStack.registerDialog(this, this.feedBackDialog, FeedbackDialog.name);
  }

  private sendPrompt = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const shouldSendFeedbackToUser = await this.shouldSendFeedback(
      step.context
    );
    if (shouldSendFeedbackToUser) {
      return await step.replaceDialog(FeedbackDialog.name);
    }

    const prompt = await this.localization.getTranslation(
      step.context,
      "promptUserForDocumentType"
    );
    const cutomChoices = CustomChoicesFactory.getCustomChoices(step);
    const channel = step.context.activity.channelId;
    const choices = await DialogUtil.getInstance().getInitialOptionsLocalized(step.context);
    const activity = cutomChoices.getSuggestedChoicesAsActivity(choices, channel, prompt);
    await step.context.sendActivity(activity);
    return await step.endDialog();
  };

  private shouldSendFeedback = async (
    context: TurnContext
  ): Promise<boolean> => {
    const lastQuestionAskedDate =
      await this.userDataRepository.getLastFeedbackAskedDate(context);
    if (!lastQuestionAskedDate) {
      //first time asking for feedback
      return true;
    } else if (
      lastQuestionAskedDate &&
      this.isMoreThanSevenDaysFromLastFeedback(lastQuestionAskedDate)
    ) {
      return true;
    } else {
      return false;
    }
  };
  private isMoreThanSevenDaysFromLastFeedback = (lastQuestionAskedDate) => {
    const now = new Date(Date.now());
    lastQuestionAskedDate = new Date(lastQuestionAskedDate);
    const diffDays = this.dateDiffInDays(now, lastQuestionAskedDate);
    return diffDays >= 7;
  };
  private dateDiffInDays(a: Date, b: Date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }
}
