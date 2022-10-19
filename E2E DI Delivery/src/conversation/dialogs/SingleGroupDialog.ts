import { ComponentDialog, WaterfallDialog, WaterfallStepContext, DialogTurnResult } from "botbuilder-dialogs";
import { DialogNames } from "../values/DialogNames";
import { LocalizedMessages } from "../LocalizedMessages";
import { SingleGroupDialogHelper } from "./helpers/SingleGroupDialogHelper";
import { Feed } from "watson-developer-cloud/natural-language-understanding/v1-generated";
import { FeedbackDialog } from "./FeedbackDialog";
import { ItemSearchDialog } from "./ItemSearchDialog";
import { DialogStack } from "../DialogStack";
import { PromptNames } from "../values/PromptNames";

export class SingleGroupDialog extends ComponentDialog {
  private helper: SingleGroupDialogHelper;
  private localizationResponses: LocalizedMessages;
  constructor(
    feedbackDialog: FeedbackDialog,
    itemSearchDialog: ItemSearchDialog
  ) {
    super(SingleGroupDialog.name);
    this.helper = new SingleGroupDialogHelper();
    this.localizationResponses = new LocalizedMessages(SingleGroupDialog.name);

    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.displayResult.bind(this),
      this.saveSalesOrderAndContinueWithItemSearchDialog.bind(this)
    ]));

    DialogStack.registerDialog(this, feedbackDialog, FeedbackDialog.name);
    DialogStack.registerDialog(this, itemSearchDialog, ItemSearchDialog.name);
    DialogStack.registerChoicePrompt(this, PromptNames.choicePrompt);
  }

  private displayResult = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    return await this.helper.displayResult(step);
  }

  private saveSalesOrderAndContinueWithItemSearchDialog = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    return await this.helper.saveSalesOrderAndContinueWithItemSearchDialog(step);
  }
}
