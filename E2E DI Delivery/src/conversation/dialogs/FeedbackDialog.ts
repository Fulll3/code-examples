import {
  ComponentDialog,
  WaterfallStepContext,
  ConfirmPrompt,
  WaterfallDialog,
  PromptOptions,
  ChoicePrompt,
  DialogTurnStatus,
  ChoiceFactory,
  TextPrompt,
  DialogTurnResult,
} from "botbuilder-dialogs";
import { PromptNames } from "../values/PromptNames";
import { DialogNames } from "../values/DialogNames";
import { LocalizedMessages } from "../LocalizedMessages";
import { GatherReferenceNumberDialog } from "./GatherReferenceNumberDialog";
import { DocumentTypeDialog } from "./DocumentTypeDialog";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { DialogStateRepository } from "../../data/storage/DialogStateRepository";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { FeedbackType } from "../../monitoring/telemetry/FeedbackType";
import { ChoiceDialog } from "./ChoiceDialog";
import { DialogStack } from "../DialogStack";
import { Telemetry } from "../../monitoring/telemetry/Telemetry";
import { Choice } from "adaptivecards";
import { CustomChoicesFactory } from "./helpers/CustomChoicesFactory";
import { TurnContext } from "botbuilder-core";
import { DialogUtil } from "./helpers/DialogUtil";

export class FeedbackDialog extends ComponentDialog {
  private locatization: LocalizedMessages;
  private storage: UserDataRepository = UserDataRepository.getInstance();
  private readonly EMOJI_PROMPT = "emojiPrompt";
  private readonly CUSTOM_CONFIRM_PROMPT = "customConfirmPrompt";
  private readonly FEEDBACK_PROMP = "customFeedbackPrompt";
  constructor() {
    super(FeedbackDialog.name);
    this.addDialog(
      new WaterfallDialog(DialogNames.WaterfallDialog, [
        this.wasAnswerUseful.bind(this),
        this.EvaulateAndPromptFurtherFeedback.bind(this),
        this.EndDialogOrPromptCustomFeedback.bind(this),
        this.saveAdditionalFeeback.bind(this),
      ])
    )
      .addDialog(new ChoicePrompt(this.EMOJI_PROMPT))
      .addDialog(new ChoicePrompt(this.CUSTOM_CONFIRM_PROMPT))
      .addDialog(new TextPrompt(this.FEEDBACK_PROMP));

    this.locatization = new LocalizedMessages("FeedbackDialog");
  }
  private wasAnswerUseful = async (step: WaterfallStepContext) => {
    const date = new Date(Date.now());
    await this.storage.saveLastFeedbackAskedDate(step.context, date);
    const emojiChoices = ["😊", "😐", "😠"];
    const promptOptions: PromptOptions = {
      prompt: this.locatization.getTranslation(step.context, "promptFeedback"),
      choices: emojiChoices,
    };

    return await step.prompt(this.EMOJI_PROMPT, promptOptions);
  };
  private EvaulateAndPromptFurtherFeedback = async (
    step: WaterfallStepContext
  ) => {
    const index = step.result.index;
    let genericFeedback: FeedbackType;
    switch (index) {
      case 0:
        genericFeedback = FeedbackType.positive;
        break;
      case 1:
        genericFeedback = FeedbackType.neutral;
        break;
      case 2:
        genericFeedback = FeedbackType.negative;
        break;
      default:
        genericFeedback = FeedbackType.empty;
        break;
    }
    await this.storage.saveGenericFeedback(step.context, genericFeedback);

    return await step.prompt(this.CUSTOM_CONFIRM_PROMPT, {
      prompt: await this.locatization.getTranslation(step.context, "customFeedbackPrompt"),
      choices: await this.locatization.getTranslationChoices(
        step.context,
        "confirmChoices"
      ),
    });
  };
  private EndDialogOrPromptCustomFeedback = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const index = step.result.index;
    let promptCustomFeedback: boolean;
    switch (index) {
      case 0:
        promptCustomFeedback = true;
        break;
      case 1:
        promptCustomFeedback = false;
        break;
    }
    if (promptCustomFeedback) {
      return await step.prompt(
        this.FEEDBACK_PROMP,
        this.locatization.getTranslation(step.context, "CustomFeedbackText")
      );
    } else {
      const genericFeedback = await this.storage.getGenericFeedback(
        step.context
      );
      await this.locatization.sendMessage(step.context, "Thanks");
      Telemetry.trackFeedback(step.context.activity, genericFeedback, "");
      await this.storage.resetFeedbackData(step.context);
      await this.sendDeliveryTypeChoices(step);
      return await step.endDialog();
    }
  };
  private saveAdditionalFeeback = async (step: WaterfallStepContext) => {
    await this.locatization.sendMessage(step.context, "Thanks");
    const genericFeedback = await this.storage.getGenericFeedback(step.context);
    const additionalFeedback = step.context.activity.text;
    Telemetry.trackFeedback(
      step.context.activity,
      genericFeedback,
      additionalFeedback
    );
    await this.storage.resetFeedbackData(step.context);
    await this.sendDeliveryTypeChoices(step);
    return await step.endDialog();
  };

  private sendDeliveryTypeChoices = async (step: WaterfallStepContext) => {
    const cutomChoices = CustomChoicesFactory.getCustomChoices(step);
    const channel = step.context.activity.channelId;
    const choices = DialogUtil.getInstance().getInitialOptionsLocalized(step.context);
    const prompt = await this.locatization.getTranslation(step.context, "deliveryDocumentsPrompttext");
    const activity = cutomChoices.getSuggestedChoicesAsActivity(choices, channel, prompt);
    await step.context.sendActivity(activity);
  }
}
