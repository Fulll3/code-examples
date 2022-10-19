import { WaterfallStepContext, ComponentDialog, WaterfallDialog, DialogTurnStatus } from "botbuilder-dialogs";
import { DialogNames } from "../values/DialogNames";
import { Runtime } from "../../Runtime";
import { LocalizedMessages } from "../LocalizedMessages";
import { WelcomeDialog } from "./WelcomeDialog";

export class HelpDialog extends ComponentDialog {
  private mainDialogLocalization: LocalizedMessages;
  private localization: LocalizedMessages;

  constructor() {
    super(HelpDialog.name);
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.sendUserGreetings.bind(this),
    ]));
    this.mainDialogLocalization = new LocalizedMessages(WelcomeDialog.name);
    this.localization = new LocalizedMessages(HelpDialog.name);
  }

  private sendUserGreetings = async (step: WaterfallStepContext) => {
    if (Runtime.isProd()) {
      await this.mainDialogLocalization.sendMessage(step.context, "prodWelcomeUser");
    } else if (Runtime.isDev()) {
      await this.mainDialogLocalization.sendMessage(step.context, "devWelcomeUser", ["QA Environment"]);
    } else if (Runtime.isLocal()) {
      await this.mainDialogLocalization.sendMessage(step.context, "devWelcomeUser", ["Local Develpment Environment"]);
    } else {
      throw new Error(`Fix gitlab's vars or .vault-secrets.yaml file to include RUNTIME_ENV information`);
    }
    await this.localization.sendMessage(step.context, "generalHelp");
   return {
     status: DialogTurnStatus.complete
   }
  }
}