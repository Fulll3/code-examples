import { TurnContext } from "botbuilder-core";
import { Dialog } from "botbuilder-dialogs";
import { DeliveryDocumentType } from "../../../domain/values/DeliveryDocumentType";
import { LocalizedMessages } from "../../LocalizedMessages";
export type DocumentType = {
  salesOrder: string;
  purchaseOrder: string;
  deliveryNumber: string;
  customerPO: string;
  unknown: string;
}

export class DialogUtil {
  private static instance: DialogUtil;

  public static getInstance = (): DialogUtil => {
    if (!DialogUtil.instance) {
      DialogUtil.instance = new DialogUtil()
    }
    return DialogUtil.instance;
  }
  private localization: LocalizedMessages;
  constructor() {
    this.localization = new LocalizedMessages(DialogUtil.name);
  }

  public getInitialOptionsLocalized = (turnContext: TurnContext): string[] => {
    const documentTypes = this.getDocumentTypesLocalized(turnContext);
    const options = Object.keys(documentTypes).map((documentTypeIndex) => { return documentTypes[documentTypeIndex] })
    return options;
  }
  public getYesNoOptions = (turnContext: TurnContext): string[] => {
    return this.localization.getTranslationChoices(turnContext, "yesNo");
  }
  public getDocumentTypesLocalized = (turnContext: TurnContext): DocumentType => {
    return {
      salesOrder: this.localization.getTranslation(turnContext,"salesOrder"),
      purchaseOrder: this.localization.getTranslation(turnContext,"purchaseOrder"),
      deliveryNumber: this.localization.getTranslation(turnContext,"deliveryNote"),
      customerPO: this.localization.getTranslation(turnContext,"customerPo"),
      unknown: this.localization.getTranslation(turnContext,"unknown")

    }
  }

  public getlocalizedMessageByDocumentType = (turnContext: TurnContext,documentType: DeliveryDocumentType): string => {
    if (documentType === DeliveryDocumentType.customerPo) {
      return this.localization.getTranslation(turnContext,"customerPo")
    } else if (documentType === DeliveryDocumentType.salesOrderNumber) {
      return this.localization.getTranslation(turnContext,"salesOrder")
    } else if (documentType === DeliveryDocumentType.purchaseOrderNumber) {
      return this.localization.getTranslation(turnContext,"purchaseOrder")
    } else if (documentType === DeliveryDocumentType.deliveryNoteNumber) {
      return this.localization.getTranslation(turnContext,"deliveryNumber")
    } else if (documentType === DeliveryDocumentType.uknown) {
      return this.localization.getTranslation(turnContext,"unknown")
    }

  }
}