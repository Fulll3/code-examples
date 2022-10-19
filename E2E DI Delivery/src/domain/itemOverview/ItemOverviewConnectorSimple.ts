import { TurnContext } from "botbuilder-core";
import { LocalizedMessages } from "../../conversation/LocalizedMessages";
import { ItemOverviewConnector } from "../../data/itemOverview/ItemOverviewConnector";
import { DeliveryDocument } from "../values/DeliveryDocument";

export class ItemOverviewConnectorSimple {
  private localization = new LocalizedMessages("AdaptiveCards");

  constructor(
    private itemOverviewConnector: ItemOverviewConnector,
  ) {

  }

  public getItemOverviewLink = async (turnContext:TurnContext, documents: DeliveryDocument[]): Promise<string> => {
    const data = this.prepareOverviewData(turnContext,documents);
    const fileUrl = await this.itemOverviewConnector.generateOverview(data);
    return fileUrl;
  }

  private prepareOverviewData = (turnContext: TurnContext,documents: DeliveryDocument[]) => {
    const headings = this.getHeadings(turnContext)
    const items = this.generateItemsData(turnContext,documents);
    return {
      headings,
      items
    }
  }



  private generateItemsData(turnContext:TurnContext, documents: DeliveryDocument[]) {
    const data = [];
    documents.forEach((document: DeliveryDocument) => {
      const documentData = [
        document.getSalesOrderNo(turnContext),
        document.getItemNumber(),
        document.getQuantity(),
        document.getCustomerPurchaseNumber(),
        document.getStatus(),
        document.getLatestMileston(),
        document.getLCDD(turnContext),
        document.formatDate(document.getLastConfirmedDeliveryDate(), true),
        document.getCustomerRequestedDate(turnContext),
        document.getFCDD(turnContext),
        document.getMLFB(),
        document.getShippingLocation(turnContext),
        document.getAWB(turnContext),
        document.getCarrier(turnContext),
        document.getCarrierTracking(turnContext),
        document.getBuyer(turnContext),
        document.getUCR(turnContext)
      ];
      data.push(documentData);
    });
    return data;
  }

  private   getHeadings(turnContext: TurnContext) {
    return [
      this.localization.getTranslation(turnContext,"salesOrderNumber"),
      this.localization.getTranslation(turnContext,"itemNo"),
      this.localization.getTranslation(turnContext,"quantity"),
      this.localization.getTranslation(turnContext,"customerPurchaseNumber"),
      this.localization.getTranslation(turnContext,"orderStatus"),
      this.localization.getTranslation(turnContext,"lastMilestone"),
      this.localization.getTranslation(turnContext,"lastConfirmedDeliveryDate"),
      this.localization.getTranslation(turnContext,"delivered"),
      this.localization.getTranslation(turnContext,"customerRequestedDate"),
      this.localization.getTranslation(turnContext,"firstConfirmedDeliveryDate"),
      this.localization.getTranslation(turnContext,"MLFB"),
      this.localization.getTranslation(turnContext,"shippingLocation"),
      this.localization.getTranslation(turnContext,"AWB"),
      this.localization.getTranslation(turnContext,"carrier"),
      this.localization.getTranslation(turnContext,"carrierTracking"),
      this.localization.getTranslation(turnContext,"buyer"),
      this.localization.getTranslation(turnContext,"ucr")
    ];
  }
}