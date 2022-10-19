import {
  ComponentDialog,
  WaterfallDialog,
  DialogTurnResult,
  WaterfallStepContext,
  PromptOptions,
  ChoicePrompt,
  ListStyle
} from "botbuilder-dialogs";
import { DialogNames } from "../values/DialogNames";
import { PromptNames } from "../values/PromptNames";
import { DocumentTypeDialogHelper } from "./helpers/DocumentTypeDialogHelper";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";
import { LocalizedMessages } from "../LocalizedMessages";
import { DeliveryStatusDialog } from "./DeliveryStatusDialog";
import { InputRepository } from "../../data/storage/InputRepository";
import { GatherReferenceNumberDialog } from "./GatherReferenceNumberDialog";
import { DialogStack } from "../DialogStack";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { DialogUtil } from "./helpers/DialogUtil";
import { TurnContext } from "botbuilder-core";
import { Runtime } from "../../Runtime";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { Logger } from "botanica";

export class DocumentTypeDialog extends ComponentDialog {
  private helper: DocumentTypeDialogHelper;
  private localization: LocalizedMessages;
  constructor(
    gatherReferenceNumberDialog: GatherReferenceNumberDialog) {
    super(DocumentTypeDialog.name);
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.promptDocumentType.bind(this),
      this.routeResult.bind(this),
    ]));
    this.addDialog(new ChoicePrompt(PromptNames.choicePrompt));
    DialogStack.registerDialog(this, gatherReferenceNumberDialog, GatherReferenceNumberDialog.name);
    this.helper = new DocumentTypeDialogHelper();
    this.localization = new LocalizedMessages(DocumentTypeDialog.name);

  }
  private userSelectedChoiceFromMenu = async (turnContext: TurnContext,text: string) => {
    const choices = await DialogUtil.getInstance().getInitialOptionsLocalized(turnContext);
    for (const choice of choices) {
      if (text && text.toLocaleLowerCase() === choice.toLocaleLowerCase()) {
        return true;
      }
    }
    return false;
  }
  private promptDocumentType = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const continueSearching = await this.userSelectedChoiceFromMenu(step.context,step.context.activity.text);
    if (continueSearching) {
      return await step.next();
    } else {
      await this.helper.resetUserInput(step);
      const choices = await DialogUtil.getInstance().getInitialOptionsLocalized(step.context);
      const promptOptions = HeroCardHelper.getPromptOptions(step, choices, this.localization.getTranslation(step.context,"promptUserForDocumentType"))
      return await step.prompt(PromptNames.choicePrompt, promptOptions);
    }
  }

  private routeResult = async (step: WaterfallStepContext) => {
    const documentType = step.context.activity.text.toLocaleLowerCase().trim();
    const documentsTypesLocalized = DialogUtil.getInstance().getDocumentTypesLocalized(step.context);
    switch (documentType) {
      case documentsTypesLocalized.salesOrder.toLocaleLowerCase():
        await InputRepository.getInstance().saveType(step.context, DeliveryDocumentType.salesOrderNumber);
        break;
      case documentsTypesLocalized.purchaseOrder.toLocaleLowerCase():
        await InputRepository.getInstance().saveType(step.context, DeliveryDocumentType.purchaseOrderNumber);
        break;
      case documentsTypesLocalized.deliveryNumber.toLocaleLowerCase():
        await InputRepository.getInstance().saveType(step.context, DeliveryDocumentType.deliveryNoteNumber);
        break;
      case documentsTypesLocalized.customerPO.toLocaleLowerCase():
        await InputRepository.getInstance().saveType(step.context, DeliveryDocumentType.customerPo);
        break;
      case documentsTypesLocalized.unknown.toLocaleLowerCase():
        await InputRepository.getInstance().saveType(step.context, DeliveryDocumentType.uknown);
        break;
      default:
        throw new Error(`[${DocumentTypeDialog.name}]: Invalid document type not validated`);
    }
    return await step.replaceDialog(GatherReferenceNumberDialog.name);
  }

}


