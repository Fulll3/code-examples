import {
  ComponentDialog,
  WaterfallDialog,
  DialogTurnResult,
  WaterfallStepContext,
  NumberPrompt,
  PromptValidatorContext,
  ConfirmPrompt,
  ChoicePrompt,
  DialogTurnStatus,
} from "botbuilder-dialogs";
import { DeliveryRepository } from "../../data/storage/DeliveryRepository";
import { DialogStateRepository } from "../../data/storage/DialogStateRepository";
import { InputRepository } from "../../data/storage/InputRepository";
import { DialogStack } from "../DialogStack";
import { LocalizedMessages } from "../LocalizedMessages";
import { DialogNames } from "../values/DialogNames";
import { PromptNames } from "../values/PromptNames";
import { ChoiceDialog } from "./ChoiceDialog";
import { DeliveryStatusDialog } from "./DeliveryStatusDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { DialogUtil } from "./helpers/DialogUtil";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { ItemSearchDialogHelper } from "./helpers/ItemSearchDialogHelper";
import { SingleGroupDialog } from "./SingleGroupDialog";

export class ItemSearchDialog extends ComponentDialog {
  private helper: ItemSearchDialogHelper;
  private documents: DeliveryRepository;
  private userInput: InputRepository;
  private localizedMessages: LocalizedMessages;
  constructor(
    feedbackDialog: FeedbackDialog,
    choiceDialog: ChoiceDialog
  ) {
    super(ItemSearchDialog.name);
    this.helper = new ItemSearchDialogHelper();
    this.userInput = InputRepository.getInstance();
    this.documents = DeliveryRepository.getInstance();
    this.localizedMessages = new LocalizedMessages(ItemSearchDialogHelper.name);
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.promptForItemNumber.bind(this),
      this.evaluateUserDecision.bind(this),
      this.searchForItem.bind(this),
      this.searchForItemWithSalesOrder.bind(this),
    ]))
      .addDialog(new NumberPrompt(PromptNames.numberPrompt, this.itemPromptValidator))
      .addDialog(new ChoicePrompt(PromptNames.choicePrompt));
    DialogStack.registerDialog(this, feedbackDialog, FeedbackDialog.name);
    DialogStack.registerDialog(this, choiceDialog, ChoiceDialog.name);
  }

  private promptForItemNumber = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const message = this.localizedMessages.getTranslation(step.context,"seeDetailsInstructions");
    const backToOverviewTable = this.localizedMessages.getTranslation(step.context,"backToOverviewTable");
    const specificItemNumber = this.localizedMessages.getTranslation(step.context,"specificItemNumber");
    const newConversation = this.localizedMessages.getTranslation(step.context,"newConversation");
    const activity = HeroCardHelper.getSuggestedAction(step.context.activity.channelId, [backToOverviewTable, specificItemNumber, newConversation], message);
    await step.context.sendActivity(activity);
    return { status: DialogTurnStatus.waiting };
  }
  private evaluateUserDecision = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    if (this.helper.userWantsToSeeOverviewTable(step)) {
      return await step.replaceDialog(SingleGroupDialog.name);
    } else if (this.helper.userWantsToRestartDialog(step)) {
      return await step.replaceDialog(ChoiceDialog.name)
    } else if (this.helper.userWantsToSearchSpecificItem(step)) {
      return await step.prompt(PromptNames.textPrompt, this.localizedMessages.getTranslation(step.context,"seeDetailsInstructions"))
    } else {
      return await step.next()
    }
  }
  private searchForItem = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const userMessage = step.context.activity.text;
    const itemNo = userMessage.match(/\d*/).input;
    const documents = await this.helper.getItemsFromSingleGroup(step, itemNo);
    if (documents.length === 1) {
      await this.helper.showResult(step, documents[0]);
    } else if (documents.length > 1) {
      await this.userInput.saveItemNo(step.context, itemNo);
      const salesOrders = documents.map((document) => document.getSalesOrderNo(step.context));
      const promptOptons = HeroCardHelper.getPromptOptions(step, salesOrders, this.localizedMessages.getTranslation(step.context,"salesOrderSelection"));
      return await step.prompt(PromptNames.choicePrompt, promptOptons);
    } else {
      await this.helper.informNoItemFound(step);
    }
    return await step.replaceDialog(ItemSearchDialog.name);
  }

  private searchForItemWithSalesOrder = async (step: WaterfallStepContext) => {
    const salesOrder = step.context.activity.text;
    const item = await this.userInput.getItemNo(step.context);
    const document = await this.helper.getDocumentByItemAndSalesOrder(step, item, salesOrder);
    await this.helper.showResult(step, document);
    return await step.replaceDialog(ItemSearchDialog.name);
  }
  private async itemPromptValidator(prompt: PromptValidatorContext<number>): Promise<boolean> {
    return (
      prompt.recognized.succeeded &&
      prompt.recognized.value > 0
    );
  }
}
