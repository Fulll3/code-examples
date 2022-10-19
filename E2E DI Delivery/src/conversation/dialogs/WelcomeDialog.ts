import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { LocalizedMessages } from "../LocalizedMessages";
import { DialogNames } from "../values/DialogNames";
import { GatherReferenceNumberDialog } from "./GatherReferenceNumberDialog";
import { Runtime } from "../../Runtime";
import { DocumentTypeDialog } from "./DocumentTypeDialog";
import { DialogStack } from "../DialogStack";
import { SelectLanguageDialog } from "./SelectLanguageDialog";

export class WelcomeDialog extends ComponentDialog {
  private localizationReponses: LocalizedMessages;

  constructor(
    private documentTypeDialog: DocumentTypeDialog
  ) {
    super(WelcomeDialog.name);
    this.localizationReponses = new LocalizedMessages(WelcomeDialog.name);
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.promptLanguage.bind(this),
      this.sendUserGreetings.bind(this),
    ]))
    DialogStack.registerDialog(this, this.documentTypeDialog, DocumentTypeDialog.name);
  }
  private promptLanguage = async (step: WaterfallStepContext) => {
    return await step.beginDialog(SelectLanguageDialog.name);
  }
  private sendUserGreetings = async (step: WaterfallStepContext) => {
  
    if (Runtime.isProd()) {
      await this.localizationReponses.sendMessage(step.context, "prodWelcomeUser");
    } else if (Runtime.isDev()) {
      await this.localizationReponses.sendMessage(step.context, "devWelcomeUser", ["QA Environment"]);
    } else if (Runtime.isLocal()) {
      await this.localizationReponses.sendMessage(step.context, "devWelcomeUser", ["Local Develpment Environment"]);
    } else {
      throw new Error(`Fix gitlab's vars or .vault-secrets.yaml file to include RUNTIME_ENV information`);
    }
    return await step.replaceDialog(DocumentTypeDialog.name);
  }
}
