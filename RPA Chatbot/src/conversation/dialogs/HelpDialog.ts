import { WaterfallStepContext, ComponentDialog, WaterfallDialog, DialogTurnResult } from "botbuilder-dialogs";
import { LocalizedMessages } from "../LocalizedMessages";
import { Logger } from "botanica";

/**
 * This dialog tries to help the user providing general information
 * about the bot.
 */
export class HelpDialog extends ComponentDialog {
  private readonly logger = new Logger(HelpDialog.name);

  constructor(
    private localization: LocalizedMessages,
  ) {
    super(HelpDialog.name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.sendHelpInstructions.bind(this),
    ]));
    this.logger.debug(`constructor initialized`);
  }

  private async sendHelpInstructions(step: WaterfallStepContext): Promise<DialogTurnResult> {
    await this.localization.sendMessage(step.context, "generalHelp");
    return step.endDialog();
  }
}