import { WaterfallStepContext, DialogTurnResult, ComponentDialog, ChoiceFactory, DialogTurnStatus } from "botbuilder-dialogs";
import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { LocalizedMessages } from "../../LocalizedMessages";
import { InputRepository } from "../../../data/storage/InputRepository";
import { DeliveryRepository } from "../../../data/storage/DeliveryRepository";
import { AdaptiveCards } from "../../AdaptiveCards";
import { DeliveryDocument } from "../../../domain/values/DeliveryDocument";
import { DialogNames } from "../../values/DialogNames";
import { FeedbackDialog } from "../FeedbackDialog";
import { Activity } from "botbuilder";
import { HeroCardHelper } from "./HeroCardHelper";
import { ChoiceDialog } from "../ChoiceDialog";
import { ItemSearchDialog } from "../ItemSearchDialog";

export class ItemSearchDialogHelper {
  private documents: DeliveryRepository;
  private userInput: InputRepository;
  private localizationReponses: LocalizedMessages;
  private adaptiveCardsHelper: AdaptiveCards;
  private readonly NEXT_PAGE_CODE = "nextPage";
  private readonly PREVIOUS_PAGE_CODE = "previousPage";

  constructor(
  ) {
    this.documents = DeliveryRepository.getInstance();
    this.userInput = InputRepository.getInstance();
    this.adaptiveCardsHelper = new AdaptiveCards();
    this.localizationReponses = new LocalizedMessages(ItemSearchDialogHelper.name);
  }

  public informNoItemFound = async (step: WaterfallStepContext): Promise<void> => {
    const input = await this.userInput.get(step.context);
    switch (input.type) {
      case DeliveryDocumentType.deliveryNoteNumber:
        return await this.localizationReponses.sendMessage(step.context, "noResultForDeliveryNote");
      case DeliveryDocumentType.purchaseOrderNumber:
        return await this.localizationReponses.sendMessage(step.context, "noResultForPurchaseOrder");
      case DeliveryDocumentType.salesOrderNumber:
        return await this.localizationReponses.sendMessage(step.context, "noResultForSalesOrder");
    }
  }

  public isPreviousPageSelected = (step: WaterfallStepContext): boolean => {
    const previousPageText = this.localizationReponses.getTranslation(step.context,this.PREVIOUS_PAGE_CODE);
    if (step.context.activity.text.toLocaleLowerCase() === previousPageText.toLocaleLowerCase()) {
      return true;
    } else {
      return false;
    }
  }
  public isNextPageSelected = (step: WaterfallStepContext): boolean => {
    const nextPageText = this.localizationReponses.getTranslation(step.context,this.NEXT_PAGE_CODE);
    if (step.context.activity.text.toLocaleLowerCase() === nextPageText.toLocaleLowerCase()) {
      return true;
    } else {
      return false;
    }
  }

  public userWantsToSeeOverviewTable= (step: WaterfallStepContext): boolean => {
    const backToOverviewTable = this.localizationReponses.getTranslation(step.context,"backToOverviewTable");
    return step.context.activity.text === backToOverviewTable;
  }

  public userWantsToRestartDialog = (step: WaterfallStepContext): boolean => {
    const newConversation = this.localizationReponses.getTranslation(step.context,"newConversation");
    return step.context.activity.text === newConversation;
  }
  public userWantsToSearchSpecificItem  = (step: WaterfallStepContext): boolean => {
    const specificItem = this.localizationReponses.getTranslation(step.context,"specificItemNumber");
    return step.context.activity.text === specificItem;
  }

  public showResult = async (step: WaterfallStepContext, document: DeliveryDocument): Promise<void> => {
    const input = await this.userInput.get(step.context);
    await this.adaptiveCardsHelper.showSingleResult(step, document, input.reference, input.type);
  }

  public getItemsFromSingleGroup = async (step: WaterfallStepContext, item: string): Promise<DeliveryDocument[]> => {
    const input = await this.userInput.get(step.context);
    const groups = await this.documents.getDocumentGroup(step.context, input.type);
    const index = await this.documents.getDocumentGroupIndex(step.context)
    return groups.findDocumentsByItem(index, input.type, item);
  }
  public getDocumentByItemAndSalesOrder = async (step: WaterfallStepContext, item: string, salesOrderNo: string): Promise<DeliveryDocument> => {
    const documents = await this.getItemsFromSingleGroup(step, item);
    return documents.find((document) => DeliveryDocument.equalItemIgnoringLeadingZeros(document.getSalesOrderNo(step.context), salesOrderNo))
  }
  public replaceWithFeedbackDialog = async (step: WaterfallStepContext, dialog: ComponentDialog) => {
    return await step.replaceDialog(FeedbackDialog.name);
  }
}
