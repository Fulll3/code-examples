import { ComponentDialog, WaterfallDialog, WaterfallStepContext, DialogTurnResult, DialogTurnStatus } from "botbuilder-dialogs";
import { LocalizedMessages } from "../LocalizedMessages";
import { WatsonAssistant } from "../../domain/watson/WatsonAssistant";
import { WelcomeDialog } from "./WelcomeDialog";
import { PromptNames } from "../values/PromptNames";
import { DialogStack } from "../DialogStack";
import { Logger } from "botanica";

import { BOT_CONTROL_APPROVE_RESPONSE, BOT_CONTROL_REJECT_RESPONSE } from "../../data/watson/Intents";
import { RECOGNITION } from "../../middlewares/watson/WatsonAssistantMiddleware";
import { HeroCardHelper } from "../HeroCardHelper";
import { InitialOptionsDialog } from "./InitialOptionsDialog";

/**
 * It acts uppon interruption recognition for restart requests.
 * Instead of directly restarting, first it asks for user confirmation.
 */
export class RestartDialog extends ComponentDialog {
  private readonly logger = new Logger(RestartDialog.name);
  private readonly CONFIRM_PROMPT: string = RestartDialog.name + ":" + PromptNames.confirm;

  constructor(
    private messages: LocalizedMessages,
    private watson: WatsonAssistant,
    private welcomeDialog: WelcomeDialog,
  ) {
    super(RestartDialog.name);
    if (!this.messages) {
      throw new Error(`[${RestartDialog.name}]: constructor messages is required`);
    }
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.askUserForConfirmation.bind(this),
      this.finalStep.bind(this),
    ]))
    DialogStack.registerDialog(this, this.welcomeDialog, WelcomeDialog.name);
    DialogStack.registerIntentPrompt(this, this.CONFIRM_PROMPT, this.watson, [
      BOT_CONTROL_APPROVE_RESPONSE,
      BOT_CONTROL_REJECT_RESPONSE,
    ]);
    this.logger.debug(`constructor initialized`);
  }

  private async askUserForConfirmation(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const promptMessage = await this.messages.getTranslation(step.context, "confirmRestart");
    const retryPromptMessage = await this.messages.getTranslation(step.context, "retryConfirmRestart");
    const activity = HeroCardHelper.getSuggestedAction(step.context, ["yes", "no"], promptMessage)
    await step.context.sendActivity(activity);
    return {
      status: DialogTurnStatus.waiting
    }
  }

  private async finalStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const recognition = step.context.turnState.get(RECOGNITION);
    if (this.watson.firstIntentIs(recognition.intents, BOT_CONTROL_APPROVE_RESPONSE)) {
      await step.parent.cancelAllDialogs()
      return await step.beginDialog(InitialOptionsDialog.name)
    } else {
      await this.messages.sendMessage(step.context, "userRejected");
      return await step.endDialog();
    }
  }
}
