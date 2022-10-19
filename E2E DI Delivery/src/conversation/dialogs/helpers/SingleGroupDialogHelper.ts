import { AdaptiveCards } from "../../AdaptiveCards";
import { LocalizedMessages } from "../../LocalizedMessages";
import { BotServices } from "../../../service/resolution/BotServices";
import { ServiceTypes } from "../../../service/resolution/ServiceTypes";
import { WaterfallStepContext, DialogTurnResult, ComponentDialog, PromptOptions, ListStyle } from "botbuilder-dialogs";
import { DialogNames } from "../../values/DialogNames";
import { InputRepository } from "../../../data/storage/InputRepository";
import { DeliveryRepository } from "../../../data/storage/DeliveryRepository";
import { DeliveryDocument } from "../../../domain/values/DeliveryDocument";
import { FeedbackDialog } from "../FeedbackDialog";
import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { ItemSearchDialog } from "../ItemSearchDialog";
import { PromptNames } from "../../values/PromptNames";
import { HeroCardHelper } from "./HeroCardHelper";
import { DialogUtil } from "./DialogUtil";
import { DeliveryComposer } from "../../../domain/DeliveryComposer";
import { ChoiceDialog } from "../ChoiceDialog";
import { DialogResult } from "../../../monitoring/telemetry/DialogResult";
import { Telemetry } from "../../../monitoring/telemetry/Telemetry";
import { ItemOverviewConnector } from "../../../data/itemOverview/ItemOverviewConnector";
import { ItemOverviewConnectorSimple } from "../../../domain/itemOverview/ItemOverviewConnectorSimple";

export class SingleGroupDialogHelper {
  private adaptiveCardsHelper: AdaptiveCards;
  private userInput: InputRepository;
  private documents: DeliveryRepository;
  private localization: LocalizedMessages;
  private itemOverviewConnector: ItemOverviewConnectorSimple

  constructor() {
    this.adaptiveCardsHelper = new AdaptiveCards();
    this.localization = new LocalizedMessages(SingleGroupDialogHelper.name);
    this.userInput = InputRepository.getInstance();
    this.documents = DeliveryRepository.getInstance();
    this.itemOverviewConnector = BotServices.getInstance().get(ServiceTypes.ItemOverviewConnector);
  }

  public displayResult = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const documentType = await this.userInput.getType(step.context);
    const documents = await this.documents.getDocumentGroupAtIndex(
      step.context,
      await this.documents.getDocumentGroupIndex(step.context),
      documentType
    );
    const input = await this.userInput.get(step.context);
    const resultSize = documents.length;

    await this.adaptiveCardsHelper.sendOverviewTable(step, documents, input.reference, input.type);
    try {
      const url = await this.itemOverviewConnector.getItemOverviewLink(step.context, documents);
      await step.context.sendActivity(AdaptiveCards.generateDownloadOverviewCard(url))
    } catch (e) {
      // do nothing
    }
    Telemetry.trackConversationFulfillment(step.context.activity, DialogResult.completed);
    return await step.replaceDialog(ItemSearchDialog.name);

  }

  public saveSalesOrderAndContinueWithItemSearchDialog = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const selectedSalesOrder = step.context.activity.text;
    const documentsGroup = await this.documents.getDocumentGroup(step.context, await this.userInput.getType(step.context));
    await this.documents.saveDocumentGroupIndex(step.context, documentsGroup.getGrouptIndexBySalesOrder(step.context, selectedSalesOrder));
    return step.replaceDialog(ItemSearchDialog.name);

  }
  public replaceWithFeedbackDialog = async (step: WaterfallStepContext) => {
    return await step.replaceDialog(FeedbackDialog.name);
  }

}
