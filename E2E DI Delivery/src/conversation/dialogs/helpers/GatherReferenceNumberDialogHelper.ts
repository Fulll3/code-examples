import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { WaterfallStepContext, PromptOptions } from "botbuilder-dialogs";
import { DialogNames } from "../../values/DialogNames";
import { InputRepository } from "../../../data/storage/InputRepository";
import { LocalizedMessages } from "../../LocalizedMessages";
import { DeliveryDocument } from "../../../domain/values/DeliveryDocument";
import { DialogStateRepository } from "../../../data/storage/DialogStateRepository";
import { v4 as generateUniqueID } from "uuid";
import { QuestionIdRepository } from "../../../data/storage/QuestionIdRepository";
import { DocumentTypeDialog } from "../DocumentTypeDialog";
import { DeliveryStatusDialog } from "../DeliveryStatusDialog";

export class GatherReferenceNumberDialogHelper {



  public recognizeDocument = (reference: string): DeliveryDocumentType => {
    return DeliveryDocument.recognizeType(reference);
  }

  public saveDocument = async (step: WaterfallStepContext, reference: string, type: DeliveryDocumentType): Promise<void> => {
    reference = reference.trim();
    await InputRepository.getInstance().save(step.context, reference, type);
  }

  public assignId = async (step: WaterfallStepContext): Promise<void> => {
    await QuestionIdRepository.getInstance().save(step.context, generateUniqueID());
  }

  public async replaceWithDeliveryStatusDialog(step: WaterfallStepContext, reference: string, documentType: DeliveryDocumentType) {
    await this.saveDocument(step, reference, documentType);
    return await step.replaceDialog(DeliveryStatusDialog.name);
  }

  public generatePromptOptions = async (step: WaterfallStepContext, localizationResponses: LocalizedMessages): Promise<PromptOptions> => {
    const promptOptions = {
      prompt: localizationResponses.getTranslation(step.context,"promptUserForReferenceNumber"),
    };
    return promptOptions;
  }

}
