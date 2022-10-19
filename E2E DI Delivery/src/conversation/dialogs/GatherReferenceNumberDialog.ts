import {
  ComponentDialog,
  WaterfallDialog,
  TextPrompt,
  DialogTurnResult,
  WaterfallStepContext,
  ChoiceFactory,
} from "botbuilder-dialogs";
import { DialogNames } from "../values/DialogNames";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";
import { GatherReferenceNumberDialogHelper } from "./helpers/GatherReferenceNumberDialogHelper";
import { PromptNames } from "../values/PromptNames";
import { DocumentTypeDialog } from "./DocumentTypeDialog";
import { LocalizedMessages } from "../LocalizedMessages";
import { DeliveryStatusDialog } from "./DeliveryStatusDialog";
import { SuggestedActions } from "botframework-schema";
import { InputRepository } from "../../data/storage/InputRepository";
import { DialogStack } from "../DialogStack";
import { HeroCardHelper } from "./helpers/HeroCardHelper";

export class GatherReferenceNumberDialog extends ComponentDialog {
  private helper: GatherReferenceNumberDialogHelper;
  private localizationResponses: LocalizedMessages;
  constructor(
    private deliveryStatusDialog: DeliveryStatusDialog
  ) {
    super(GatherReferenceNumberDialog.name);
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.promptUserForReferenceNumber.bind(this),
      this.tryToRecognizeInput.bind(this),
    ]))
      .addDialog(new TextPrompt(PromptNames.textPrompt));

    DialogStack.registerDialog(this, this.deliveryStatusDialog, DeliveryStatusDialog.name);

    this.helper = new GatherReferenceNumberDialogHelper();
    this.localizationResponses = new LocalizedMessages(GatherReferenceNumberDialog.name);
  }

  private promptUserForReferenceNumber = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {

    await this.helper.assignId(step);

    const promptOptions = await this.helper.generatePromptOptions(step, this.localizationResponses);
    return await step.prompt(PromptNames.textPrompt, promptOptions);
  }

  private tryToRecognizeInput = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const reference = step.context.activity.text;
    let documentType = await InputRepository.getInstance().getType(step.context);
    if (documentType === DeliveryDocumentType.uknown) {
      documentType == await this.helper.recognizeDocument(reference);
    }
    return await this.helper.replaceWithDeliveryStatusDialog(step, reference, documentType);
  }
}
