import { BotServices } from "../../../service/resolution/BotServices";
import { ServiceTypes } from "../../../service/resolution/ServiceTypes";
import { WaterfallStepContext, DialogTurnResult, ComponentDialog } from "botbuilder-dialogs";
import { DialogNames } from "../../values/DialogNames";
import { LocalizedMessages } from "../../LocalizedMessages";
import { Runtime } from "../../../Runtime";
import { InputRepository } from "../../../data/storage/InputRepository";
import { DeliveryRepository } from "../../../data/storage/DeliveryRepository";
import { Telemetry } from "../../../monitoring/telemetry/Telemetry";
import { DeliveryAggregate } from "../../../domain/values/DeliveryAggregate";
import { HanaConnector } from "../../../data/hana/HanaConnector";
import { DeliveryPreprocessor } from "../../../domain/DeliveryPreprocessor";
import { DeliveryComposer } from "../../../domain/DeliveryComposer";
import { DeliveryDocument } from "../../../domain/values/DeliveryDocument";
import { GatherReferenceNumberDialog } from "../GatherReferenceNumberDialog";
import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { SingleGroupDialog } from "../SingleGroupDialog";
import { MultipleGroupsDialog } from "../MultipleGroupsDialog";
import { DocumentTypeDialog } from "../DocumentTypeDialog";
import { IHanaResult } from "../../../data/hana/IHanaResult";
import { IUserEnteredDocument } from "../../interfaces/IUserEnteredDocument";
import { Logger } from "botanica";
import { DialogResult } from "../../../monitoring/telemetry/DialogResult";
import { User } from "../../../domain/User";

export class DeliveryStatusDialogHelper {
  private userInput: InputRepository;
  private documents: DeliveryRepository;
  private localization: LocalizedMessages;

  constructor() {
    this.localization = new LocalizedMessages(DeliveryStatusDialogHelper.name);
    this.userInput = InputRepository.getInstance();
    this.documents = DeliveryRepository.getInstance();
  }

  public processDeliveryRelatedMilestones = async (
    step: WaterfallStepContext,
    documentReferenceNumber: string,
    rawData: IHanaResult[],
    document: IUserEnteredDocument,
    user: User
  ): Promise<DeliveryAggregate> => {
    let result: DeliveryAggregate;
    const documentType = document.type;
    try {
      result = DeliveryComposer.groupByCountry(step.context,
        DeliveryPreprocessor.sanitize(
          DeliveryPreprocessor.filterByCustomerId(rawData, user)
          , documentReferenceNumber, documentType,
        ), documentType);
    } catch (error) {
      result = new DeliveryAggregate(null);
    }
    Telemetry.trackHanaResults(step.context.activity, document, result);
    await this.documents.saveDocumentGroup(step.context, result);
    return result;
  }
  public sendConfirmationMessage = async (step: WaterfallStepContext): Promise<void> => {
    const userInput = await this.userInput.get(step.context);
    await step.context.sendActivity(this.localization.getTranslation(step.context, "confirmUserSearch", [
      DeliveryDocument.getReferenceDescription(step.context, userInput.type),
      userInput.reference,
    ]));
  }

  public noGroup = async (step: WaterfallStepContext, dialog: ComponentDialog): Promise<DialogTurnResult> => {
    const inputDocument = await this.userInput.get(step.context);
    await this.localization.sendMessage(step.context, "noResultsFound", [
      DeliveryDocument.getReferenceDescription(step.context, inputDocument.type),
    ]);
    Telemetry.trackConversationFulfillment(step.context.activity, DialogResult.itemNotFound);
    return await step.beginDialog(DocumentTypeDialog.name)
  }

  public singleGroup = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    await this.documents.saveDocumentGroupIndex(step.context, 0);
    return await step.replaceDialog(SingleGroupDialog.name);
  }

  public multipleGroups = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    return await step.replaceDialog(MultipleGroupsDialog.name);
  }
}
