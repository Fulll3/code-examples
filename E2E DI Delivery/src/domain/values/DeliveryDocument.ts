
import { TurnContext } from "botbuilder-core";
import { DialogUtil } from "../../conversation/dialogs/helpers/DialogUtil";
import { LocalizedMessages } from "../../conversation/LocalizedMessages";
import { IHanaResult } from "../../data/hana/IHanaResult";
import { IMilestone } from "../../data/hana/IMilestone";
import { InputRepository } from "../../data/storage/InputRepository";
import { DeliveryDocumentType } from "./DeliveryDocumentType";

export enum DeliveryStatus {
  openOrder = "Open Order",
  orderComplete = "Order Complete",
  rejected = "Rejected",
  uknownStatus = ""
}

export class DeliveryDocument {
  private static readonly milestoneToMessage = require("../../../resources/milestones.json");
  private static localizedMessages = new LocalizedMessages(DeliveryDocument.name);

  public static getReferenceDescription(turnContext: TurnContext, reference: DeliveryDocumentType) {
    const documentTypesLocalized = DialogUtil.getInstance().getDocumentTypesLocalized(turnContext);
    switch (reference) {
      case DeliveryDocumentType.salesOrderNumber: return documentTypesLocalized.salesOrder;
      case DeliveryDocumentType.purchaseOrderNumber: return documentTypesLocalized.purchaseOrder;
      case DeliveryDocumentType.deliveryNoteNumber: return documentTypesLocalized.deliveryNumber;
      case DeliveryDocumentType.customerPo: return documentTypesLocalized.customerPO;
      case DeliveryDocumentType.uknown: return "";
      default: throw new Error(`[${DeliveryDocument.name}]: referenceDescription(${reference}) invalid argument "reference"`);
    }
  }


  private constructor(
    private country: string,
    private purchaseOrderNo: string,
    private deliveryNoteNo: string,
    private R1_CHA_UCR: string,
    private salesOrderNo: string,
    private POI: string,
    private SOI: string,
    private DNI: string,
    private CHA_CGL: string,
    private CHA_GLO: string,
    private CHA_CUC: string,
    private ADRC_UC_CITY1: string,
    private CHA_LGS: string,
    private POM_LDD: string,
    private POM_TRA: string,
    private POM_GID: string,
    private milestones: IMilestone[],
    private KNA1_BY_NAME1: string,
    private R2_CHA_UCR: string,
    private R1_FCET_AWB_NO: string,
    private R2_FCET_AWB_NO: string,
    private R1_20_FCES_FWCDNM: string,
    private R2_20_FCES_FWCDNM: string,
    private R1_20_FCES_VPS_NO: string,
    private R2_20_FCES_VPS_NO: string,
    private CHA_ISSO: string,
    private POM_FDD: string,
    private POM_CRD: string,
    private R2_CHA_GLO: string,
    private documentType: string,
    private CHA_MLFB: string,
    private KFG_RQA: string,
    private CHA_CPN: string,
    private ADRC_UC_COUNTRY: string,
    private CHA_REG: string,
    private R2_CHA_REG: string,
    private CHA_CPI: string,
    private R1_CHA_SOI: string,
    private R1_CHA_SON: string,
    private R2_CHA_SOI: string,
    private R2_CHA_SON: string,
    private CHA_BY: string,
    private R2_POM_FDD: string,
    private R2_POM_LDD: string,
    private R1_KNA1_BY_ORT01: string,
    private R2_KNA1_BY_ORT01: string
  ) {
  }

  public getCountry(): string {
    return this.country;
  }

  public getPurchaseOrderNo(): string {
    return this.purchaseOrderNo;
  }

  public getDeliveryNoteNo(): string {
    return this.deliveryNoteNo;
  }
  public getCustomerRequestedDate(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noDate");
    return this.POM_CRD && DeliveryDocument.isValidDate(this.POM_CRD) ?
      DeliveryDocument.formatDate(DeliveryDocument.buildDateFromHanaResultDate(this.POM_CRD)).toString() : notAvailable;
  }
  public getFCDD(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noFCDD");
    if (!this.POM_FDD && !DeliveryDocument.isValidDate(this.POM_FDD)) {
      return notAvailable;
    }
    let FCDD: string;
    const dateThreeYearsInFuture = DeliveryDocument.getDateYearsInFuture(3);
    const FDDDate = DeliveryDocument.buildDateFromHanaResultDate(this.POM_FDD);
    if (this.CHA_REG === "NL" && this.CHA_LGS === "PTO3" && FDDDate > dateThreeYearsInFuture) {
      FCDD = this.R2_POM_FDD;
    } else {
      FCDD = this.POM_FDD;
    }
    return DeliveryDocument.formatDate(DeliveryDocument.buildDateFromHanaResultDate(FCDD)).toString();
  }

  public getLCDD(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noLCDD");

    if (!this.POM_LDD && !DeliveryDocument.isValidDate(this.POM_LDD)) {
      return notAvailable;
    }
    let LCDD: string;
    const dateThreeYearsInFuture = DeliveryDocument.getDateYearsInFuture(3);
    const FDDDate = DeliveryDocument.buildDateFromHanaResultDate(this.POM_LDD);
    if (this.CHA_REG === "NL" && this.CHA_LGS === "PTO3" && FDDDate > dateThreeYearsInFuture) {
      LCDD = this.R2_POM_LDD;
    } else {
      LCDD = this.POM_LDD;
    }
    return DeliveryDocument.formatDate(DeliveryDocument.buildDateFromHanaResultDate(LCDD)).toString();
  }
  public getShippingLocation(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noShippingLocation");
    if (this.CHA_LGS === "PTO3") {
      return this.R2_KNA1_BY_ORT01 ? this.R2_KNA1_BY_ORT01 : notAvailable;
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_KNA1_BY_ORT01 ? this.R2_KNA1_BY_ORT01 + this.R1_KNA1_BY_ORT01 : notAvailable;
    } else {
      return this.R1_KNA1_BY_ORT01 ? this.R1_KNA1_BY_ORT01 : notAvailable
    }
  }
  public getBuyer(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noBuyer");
    return this.KNA1_BY_NAME1 ? this.KNA1_BY_NAME1 : notAvailable;
  }
  public getUCR(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noUCR");
    if (this.CHA_LGS === "PTO3") {
      return this.R2_CHA_UCR ? this.R2_CHA_UCR : notAvailable;
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_CHA_UCR ? `${this.R2_CHA_UCR}${this.R1_CHA_UCR}` : notAvailable;
    } else {
      return this.R1_CHA_UCR ? this.R1_CHA_UCR : notAvailable;
    }
  }
  public getSalesOrderNo(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noUCR");
    return this.salesOrderNo ? this.R1_CHA_SON : notAvailable;
  }


  public getAWB(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noAWB");
    if (this.CHA_LGS === "PTO3") {
      return this.R2_FCET_AWB_NO ? `${this.R2_FCET_AWB_NO}` : notAvailable;
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_FCET_AWB_NO ? `${this.R2_FCET_AWB_NO}${this.R1_FCET_AWB_NO}` : notAvailable;
    } else {
      return this.R1_FCET_AWB_NO ? `${this.R1_FCET_AWB_NO}` : notAvailable;
    }

  }

  public getCarrierTracking(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noCarrierTracking");
    if (this.CHA_LGS === "PTO3") {
      return this.R2_20_FCES_VPS_NO ? `${this.R2_20_FCES_VPS_NO}` : notAvailable
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_20_FCES_VPS_NO ? `${this.R2_20_FCES_VPS_NO}${this.R1_20_FCES_VPS_NO}` : notAvailable;
    } else {
      return this.R1_20_FCES_VPS_NO ? `${this.R1_20_FCES_VPS_NO}` : notAvailable;
    }
  }
  public getCarrier(turnContext: TurnContext): string {
    const notAvailable = DeliveryDocument.localizedMessages.getTranslation(turnContext, "noCarrier");
    if (this.CHA_LGS === "PTO3") {
      return this.R2_20_FCES_FWCDNM ? `${this.R2_20_FCES_FWCDNM}` : notAvailable;
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_20_FCES_FWCDNM ? `${this.R2_20_FCES_FWCDNM}${this.R1_20_FCES_FWCDNM}` : notAvailable;
    } else {
      return this.R1_20_FCES_FWCDNM ? `${this.R1_20_FCES_FWCDNM}` : notAvailable;
    }
  }

  public getPurchaseOrderItem(): string {
    return this.POI;
  }
  public getR1SalesOrderNumber(): string {
    return this.R1_CHA_SON;
  }
  public getR1SalesOrderItem(): string {
    return this.R1_CHA_SOI;
  }
  public getR2SalesOrderItem(): string {
    return this.R2_CHA_SOI;
  }
  public getR2SalesOrderNumber(): string {
    return this.R2_CHA_SON;
  }


  public getSalesOrderItem(): string {
    return this.SOI;
  }

  public getDeliveryNoteItem(): string {
    return this.DNI;
  }
  public getItemNumber( ): string {
    switch (this.documentType) {
      case DeliveryDocumentType.deliveryNoteNumber:
        return this.DNI;
      case DeliveryDocumentType.purchaseOrderNumber:
        return this.POI;
      case DeliveryDocumentType.salesOrderNumber:
        return  this.SOI;
      case DeliveryDocumentType.ucrNumber:
        return this.DNI;
      case DeliveryDocumentType.customerPo:
        return this.SOI;
      default:
        return this.DNI;
    }
  }

  public getCustomerId = () => {
    return this.CHA_BY;
  }

  public getReferenceNumber(turnContext: TurnContext): string {
    switch (this.documentType) {
      case DeliveryDocumentType.deliveryNoteNumber:
        return this.getDeliveryNoteNo();
      case DeliveryDocumentType.purchaseOrderNumber:
        return this.getPurchaseOrderNo();
      case DeliveryDocumentType.salesOrderNumber:
        return this.getSalesOrderNo(turnContext);
      case DeliveryDocumentType.ucrNumber:
        return this.getUCR(turnContext)
      case DeliveryDocumentType.customerPo:
        return this.getCustomerPurchaseNumber()
      default:
        return this.getSalesOrderNo(turnContext);
    }
  }
  public getDeliveryNoteDate(): Date {
    return this.milestones.find((milestone) => milestone.note === "MST_L290")?.date;
  }

  public getMilestones(): IMilestone[] {
    return this.milestones;
  }
  public getOrderProcessingCountry(): string {
    if (this.CHA_LGS === "PTO3") {
      return this.R2_CHA_REG ? this.R2_CHA_REG : "";
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_CHA_REG ? this.R2_CHA_REG : ""
    } else {
      return this.CHA_REG ? this.CHA_REG : "";
    }
  }
  public getOrderProcessingCity(): string {
    if (this.CHA_LGS === "PTO3") {
      return this.R2_CHA_GLO ? this.R2_CHA_GLO : "";
    } else if (this.CHA_LGS === "PTO") {
      return this.R2_CHA_GLO ? this.R2_CHA_GLO : ""
    } else {
      return this.CHA_GLO ? this.CHA_GLO : "";
    }
  }
  public getUltimateConsigneeCountry(): string {
    return this.ADRC_UC_COUNTRY ? this.ADRC_UC_COUNTRY : "";
  }
  public getUltimateConsigneeCity(): string {
    return this.ADRC_UC_CITY1 ? this.ADRC_UC_CITY1 : "";
  }
  public getLastConfirmedDeliveryDate(): Date {
    return this.POM_TRA ? DeliveryDocument.buildDateFromHanaResultDate(this.POM_TRA) : null;
  }
  public formatDate(
    date: Date,
    twoDigits?: boolean,
    shouldReturnEmpty?: boolean
  ) {
    if (!date) {
      return shouldReturnEmpty ? "" : "N/A";
    }
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    if (twoDigits) {
      day = day.length === 1 ? day.toString().padStart(2, "0") : day;
      month = month.length === 1 ? month.toString().padStart(2, "0") : month;
    }

    const year = date.getFullYear();
    const dateFormatted = `${day}.${month}.${year}`;
    return dateFormatted;
  }
  public getLogisticScenario(): string {
    return this.CHA_LGS;
  }
  public getGoodsIssuedAtDate(): string {
    return this.POM_GID;
  }
  public getOrderFulfilledAtDate(): Date {
    return this.POM_TRA ? DeliveryDocument.buildDateFromHanaResultDate(this.POM_TRA) : null;
  }
  public getLatestMileston(): string {
    return this.milestones.length !== 0 ? this.milestones[this.milestones.length - 1].message : "No milestone is available";
  }

  public getStatus(): DeliveryStatus {
    if (this.isOpenOrder()) {
      return DeliveryStatus.openOrder;
    } else if (this.isCompleteOrder()) {
      return DeliveryStatus.orderComplete;
    } else if (this.isRejected()) {
      return DeliveryStatus.rejected;
    } else {
      return DeliveryStatus.uknownStatus;
    }

  }
  public getQuantity(): string {
    return this.KFG_RQA;
  }

  public getCustomerPurchaseNumber(): string {
    return this.CHA_CPN;
  }

  public getMLFB(): string {
    return this.CHA_MLFB
  }
  private isRejected(): boolean {
    if (this.isTextIncluded(this.CHA_ISSO, "REJ")) {
      return true
    } else {
      return false;
    }
  }
  private isCompleteOrder(): boolean {
    if (this.isTextIncluded(this.CHA_ISSO, "DIC") && this.POM_TRA) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "DIN") && this.POM_TRA) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "GIC") && this.POM_TRA) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "GIN") && this.POM_TRA) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "OFC")) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "OFN")) {
      return true
    } else {
      return false;
    }
  }
  private isOpenOrder(): boolean {
    if (this.isTextIncluded(this.CHA_ISSO, "CON")) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "DIC") && this.POM_TRA === "") {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "DIN") && this.POM_TRA === "") {
      return true;
    } else if (this.isTextIncluded(this.CHA_ISSO, "DIP")) {
      return true;
    } else if (this.isTextIncluded(this.CHA_ISSO, "GIC") && this.POM_TRA === "") {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "GIN") && this.POM_TRA === "") {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "GIP")) {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "OEN") && this.POM_TRA === "") {
      return true
    } else if (this.isTextIncluded(this.CHA_ISSO, "OFP")) {
      return true
    } else {
      return false;
    }
  }
  private isTextIncluded(originalText: string, searchString: string): boolean {
    if (originalText) {
      return originalText.includes(searchString);
    } else {
      return false;
    }
  }

  public static buildDeliveryDocumentFromHanaResult(turnContext: TurnContext, data: IHanaResult, documentType: string): DeliveryDocument {
    return new DeliveryDocument(
      data.CHA_CGL,
      data.CHA_PON,
      data.CHA_DNN,
      data.CHA_UCR_R1,
      data.CHA_SON,
      data.CHA_POI,
      data.CHA_SOI,
      data.CHA_DNI,
      data.CHA_CGL,
      data.CHA_GLO,
      data.CHA_CUC,
      data.ADRC_UC_CITY1,
      data.CHA_LGS,
      data.POM_LDD,
      data.POM_TRA,
      data.POM_GID,
      DeliveryDocument.buildMilestonesFromHanaResult(turnContext, data),
      data.KNA1_BY_NAME1,
      data.CHA_UCR_R2,
      data.R1_FCET_AWB_NO,
      data.R2_FCET_AWB_NO,
      data.R1_20_FCES_FWCDNM,
      data.R2_20_FCES_FWCDNM,
      data.R1_20_FCES_VPS_NO,
      data.R2_20_FCES_VPS_NO,
      data.CHA_ISSO,
      data.POM_FDD,
      data.POM_CRD,
      data.R2_CHA_GLO,
      documentType,
      data.CHA_MLFB,
      data.KFG_RQA,
      data.CHA_CPN,
      data.ADRC_UC_COUNTRY,
      data.CHA_REG,
      data.R2_CHA_REG,
      data.CHA_CPI,
      data.R1_CHA_SOI,
      data.R1_CHA_SON,
      data.R2_CHA_SOI,
      data.R2_CHA_SON,
      data.CHA_BY,
      data.R2_POM_FDD,
      data.R2_POM_LDD,
      data.R1_KNA1_BY_ORT01,
      data.R2_KNA1_BY_ORT01
    );
  }

  public static buildDeliveryDocumentFromStorageResult(data: any, documentType): DeliveryDocument {
    if (!!data.milestones) {
      data.milestones = data.milestones.map(milestone => {
        return {
          date: new Date(milestone.date),
          note: milestone.note,
          message: milestone.message,
        };
      });
    }
    return new DeliveryDocument(
      data.country,
      data.purchaseOrderNo,
      data.deliveryNoteNo,
      data.R1_CHA_UCR,
      data.salesOrderNo,
      data.POI,
      data.SOI,
      data.DNI,
      data.CHA_CGL,
      data.CHA_GLO,
      data.CHA_CUC,
      data.ADRC_UC_CITY1,
      data.CHA_LGS,
      data.POM_LDD,
      data.POM_TRA,
      data.POM_GID,
      data.milestones,
      data.KNA1_BY_NAME1,
      data.R2_CHA_UCR,
      data.R1_FCET_AWB_NO,
      data.R2_FCET_AWB_NO,
      data.R1_20_FCES_FWCDNM,
      data.R2_20_FCES_FWCDNM,
      data.R1_20_FCES_VPS_NO,
      data.R2_20_FCES_VPS_NO,
      data.CHA_ISSO,
      data.POM_FDD,
      data.POM_CRD,
      data.R2_CHA_GLO,
      documentType,
      data.CHA_MLFB,
      data.KFG_RQA,
      data.CHA_CPN,
      data.ADRC_UC_COUNTRY,
      data.CHA_REG,
      data.R2_CHA_REG,
      data.CHA_CPI,
      data.R1_CHA_SOI,
      data.R1_CHA_SON,
      data.R2_CHA_SOI,
      data.R2_CHA_SON,
      data.CHA_BY,
      data.R2_POM_FDD,
      data.R2_POM_LDD,
      data.R1_KNA1_BY_ORT01,
      data.R2_KNA1_BY_ORT01
    );
  }

  public static recognizeType(reference: string): DeliveryDocumentType {
    reference = reference.trim().toUpperCase();
    if (reference.startsWith("SI")) {
      return DeliveryDocumentType.ucrNumber;
    }
    return null;
  }

  public static equalItemIgnoringLeadingZeros(itemA: string, itemB: string) {
    return (
      itemA.trim().replace(/^0+/, "")
      ===
      itemB.trim().replace(/^0+/, "")
    );
  }

  private static buildMilestonesFromHanaResult(turnContext: TurnContext, data: IHanaResult): IMilestone[] {
    const milestones = [];
    for (const key in DeliveryDocument.milestoneToMessage) {
      if (data[key]) {
        if (DeliveryDocument.isValidDate(data[key])) {
          milestones.push({
            date: DeliveryDocument.buildDateFromHanaResultDate(data[key]),
            note: key,
            message: this.localizedMessages.getTranslation(turnContext, key),
          });
        }
      }
    }
    return milestones;
  }

  private static isValidDate = (date: string) => {
    const dateNumber = Number.parseInt(
      date.substring(date.indexOf("(") + 1, date.indexOf(")")), 10,
    )
    if (DeliveryDocument.isNumberPositive(dateNumber)) {
      return true
    } else {
      return false
    }
  }
  private static isNumberPositive = (number: number) => {
    if (Math.sign(number) === 1) {
      return true;
    } else {
      return false;
    }
  }
  private static buildDateFromHanaResultDate(date: string): Date {
    return new Date(Number.parseInt(
      date.substring(date.indexOf("(") + 1, date.indexOf(")")), 10,
    ));
  }

  private static getDateYearsInFuture = (yearsInFuture) => {
    return new Date(new Date().setFullYear(new Date().getFullYear() + yearsInFuture));
  }

  private static formatDate(date: Date) {
    if (!date) {
      return "N/A";
    }
    let day = date.getDate().toString();
    day = day.length === 1 ? day.toString().padStart(2, "0") : day;
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? month.toString().padStart(2, "0") : month;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}