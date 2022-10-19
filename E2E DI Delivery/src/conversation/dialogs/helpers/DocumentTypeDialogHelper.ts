import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { WaterfallStepContext } from "botbuilder-dialogs";
import { DialogNames } from "../../values/DialogNames";
import { InputRepository } from "../../../data/storage/InputRepository";
import { DeliveryStatusDialog } from "../DeliveryStatusDialog";

export class DocumentTypeDialogHelper {
  private userInput: InputRepository;
  constructor() {
    this.userInput = InputRepository.getInstance();
  }

  public saveDocumentType = async (step: WaterfallStepContext, type: DeliveryDocumentType): Promise<void> => {
    const reference = (await this.userInput.get(step.context)).reference;
    await this.userInput.save(step.context, reference, type);
  }

  public async replaceWithDeliveryStatusDialog(step: WaterfallStepContext<{}>, documentType: DeliveryDocumentType) {
    await this.saveDocumentType(step, documentType);
    return await step.replaceDialog(DeliveryStatusDialog.name);
  }
  public resetUserInput = async (step: WaterfallStepContext): Promise<void> => {
    await InputRepository.getInstance().resetUserInput(step.context);
  }
}
