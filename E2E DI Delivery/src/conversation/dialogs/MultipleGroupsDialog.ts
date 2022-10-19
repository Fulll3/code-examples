import { ComponentDialog, WaterfallDialog, WaterfallStepContext, DialogTurnResult, DialogTurnStatus } from "botbuilder-dialogs";
import { DialogStack } from "../DialogStack";
import { DialogNames } from "../values/DialogNames";
import { FeedbackDialog } from "./FeedbackDialog";
import { MultipleGroupsDialogHelper } from "./helpers/MultipleGroupsDialogHelper";
import { SingleGroupDialog } from "./SingleGroupDialog";

export class MultipleGroupsDialog extends ComponentDialog {
  private helper: MultipleGroupsDialogHelper;
  constructor(
    private feedbackDialog: FeedbackDialog,
    private singleGroupDialog: SingleGroupDialog
  ) {
    super(MultipleGroupsDialog.name);
    this.helper = new MultipleGroupsDialogHelper();
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.promptForCountry.bind(this),
      this.routeToSingleGroup.bind(this),
    ]));
    DialogStack.registerDialog(this, this.feedbackDialog, FeedbackDialog.name);
    DialogStack.registerDialog(this, this.singleGroupDialog, SingleGroupDialog.name);
  }

  private promptForCountry = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    return await this.helper.promptForCountry(step);

  }

  private routeToSingleGroup = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const country = step.context.activity.text;

    try {
      const index = await this.helper.getDocumentIndexByCountry(step, country);
      return this.helper.routeToSingleGroup(step, index);
    } catch (error) {
      await this.helper.informNoItemFound(step);
      return await this.helper.replaceWithFeedbackDialog(step, this);
    }
  }
}
