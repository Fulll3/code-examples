import { ComponentDialog, WaterfallDialog, WaterfallStepContext, DialogTurnResult } from "botbuilder-dialogs";
import { LocalizedMessages } from "../LocalizedMessages";
import { Logger } from "botanica";
import { InitialOptionsDialog } from "./InitialOptionsDialog";

/**
 * This is responsible for introducing itself to the user and
 * continuing the conversation
 */
export class WelcomeDialog extends ComponentDialog {
  private readonly logger = new Logger(WelcomeDialog.name);

  constructor(
    private message: LocalizedMessages,
    private intialOptionsDialog: InitialOptionsDialog,
  ) {
    super(WelcomeDialog.name);
    if (!this.message) {
      throw new Error(`[${WelcomeDialog.name}]: constructor messages is required`);
    }
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.sendWelcomeMessage.bind(this),
    ]));
    this.logger.debug(`constructor initialized`);
  }

  private async sendWelcomeMessage(step: WaterfallStepContext): Promise<DialogTurnResult> {
    await this.message.sendMessage(step.context, "welcomeUser");
    return step.replaceDialog(InitialOptionsDialog.name, InitialOptionsDialog.createDialogOptions(false, true));
  }
}
