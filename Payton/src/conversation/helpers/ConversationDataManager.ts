import { Env, Logger } from "botanica";
import { EntityRecognizer, Message, Session } from "botbuilder";
import { crlf, CRLF } from 'crlf-normalize';
import { IEntitlement } from "../../business/conversation/IEntiltement";
import { IWatsonAssistantRecognizer } from "../../business/conversation/bot/IWatsonAssistantRecognizer";
import { IJwtPayload } from "../../business/core/IJwtPayload";
import { IWatsonEntity } from "../../business/core/IWatsonEntity";
import { config } from "../../config";
import { getLocale } from "../bot/LocalizationManager";
import { addLeadingZeros } from "../../core/utils/PaytonUtilities";
import { InvoiceQueryInformation } from "./AdaptiveCardsTemplates";
import { ConversationHistoryManager } from "./ConversationHistoryManager";
import { SessionHelper } from "./SessionHelper";

const logger: Logger = new Logger("ConversationDataManager");

export interface ISelectedInvoice {
  invoiceNumber: string;
  vendorId: string;
  companyCode: string;
}

export class ConversationDataManager {
  public static getConversationHistory(session: Session): string {
    return crlf(ConversationHistoryManager.get(session).join("\r\n"), CRLF);
  }

  public static getUserId(session: Session): string {
    return session.userData.userId;
  }

  public static getUserEmail(session: Session): string {
    return session.userData.email;
  }

  public static getUserFirstName(session: Session): string {
    if (!session.userData.fullName) { return "" };
    
    const parts = session.userData.fullName.trim().split(' ');
    return parts[0];
  }

  public static getUserLastName(session: Session): string {
    if (!session.userData.fullName) { return "" };
    
    const parts = session.userData.fullName.trim().split(' ');
    return parts[parts.length - 1];
  }

  public static isInternal(session: Session): boolean {
    return session.userData.internalUser === "1";
  }

  public static saveAuthorization(session: Session, payload: IJwtPayload): void {
    session.userData.entiltements = payload.Entitlements;
    session.userData.fullName = payload.FullName;
    session.userData.allAccess = payload.AllAccess;
    session.userData.internalUser = payload.Internal;
    session.userData.culture = payload.Culture;
    session.userData.locale = getLocale(session.userData.culture);

    if (Env.get("BotEnv", "dev") === "dev") {
      session.userData.email = config.get("DeveloperEmail");
    } else {
      session.userData.email = payload.EmailAddress;
    }
    session.save();
  }

  public static deleteAuthorization(session: Session): void {
    session.userData.entiltements = undefined;
    session.userData.fullName = undefined;
    session.userData.allAccess = undefined;
    session.userData.email = undefined;
    session.save();
  }

  public static isAdminUser(session: Session): boolean {
    if (Env.get("BotEnv", "dev") === "dev"){
      return true;
    } else {
      return session.userData.allAccess === "1";
    }
    
  }

  public static saveCurrentInvoiceSelection(session: Session, invoiceNumber: string, vendorId: string, companyCode: string) {
    var selectedInvoice = {
      invoiceNumber: invoiceNumber,
      vendorId: vendorId,
      companyCode: companyCode
    };

    session.conversationData.selectedInvoice = selectedInvoice;
  }

  public static deleteCurrentInvoiceSelection(session: Session) {
    session.conversationData.selectedInvoice = undefined;
  }

  public static getCurrentInvoiceSelection(session: Session): (undefined | ISelectedInvoice) {
    return session.conversationData.selectedInvoice ? session.conversationData.selectedInvoice : undefined;
  }

  public static getEntiltementData(session: Session): IEntitlement[] {
    return session.userData.entiltements
      ? session.userData.entiltements.split("|").map((item) => {
        const data = item.split("~");
        return {
          soc: data[0],
          companyCode: data[1],
          vendorId: data[2]
        };
      })
      : [];
  }

  //#region Public Methods for Query/Form Data
  public static saveConversationData(session: Session, entities: IWatsonEntity[]): Boolean {
    var parameters = EntityRecognizer.findAllEntities(entities, "parameter");
    var date = EntityRecognizer.findEntity(entities, "sys-date");
    var currency: any = EntityRecognizer.findEntity(entities, "sys-currency");
    var entityFound = (Boolean)(parameters.length > 0 || date || currency);

    if (entityFound) {
      var messageText = session.message.text;
      var invoiceNumberEntity = parameters.find(parameter => parameter.entity === "invoiceNumber");
      var amountEntity = parameters.find(parameter => parameter.entity === "amount");
      var poNumberEntity = parameters.find(parameter => parameter.entity === "poNumber");

      var invoiceNumberValue = this.parseValueFromPatternGroup(messageText, invoiceNumberEntity, 1);
      var amountValue = this.parseValueFromPatternGroup(messageText, amountEntity, 1);
      var poNumberValue = this.parseValueFromPatternGroup(messageText, poNumberEntity, 1);

      if (
        (!invoiceNumberValue || invoiceNumberValue.length != 4) &&  // prevents invoice number conflict
        (!amountValue || amountValue.length != 4) && // prevents amount conflict
        (currency && date && currency.entity.substr(0, 4) != date.entity.substr(0, 4)) // prevents currency conflict
      ) {  // conflict in recognition
        var dateValue = date ? date.entity : undefined;
      }

      ConversationDataManager.saveInvoiceNumber(session, invoiceNumberValue);
      ConversationDataManager.saveDate(session, dateValue);
      ConversationDataManager.saveAmount(session, amountValue, null);
      ConversationDataManager.savePoNumber(session, poNumberValue);

      entityFound = invoiceNumberValue || dateValue || amountValue || poNumberValue;

      if (currency && currency.metadata) {
        ConversationDataManager.saveAmount(session, currency.metadata.numeric_value, null);
        ConversationDataManager.saveCurrency(session, currency.metadata.unit);
        entityFound = true;
      }
    }

    return entityFound;
  }

  public static getPoNumber(session: Session): string {
    return session.conversationData.poNumber;
  }

  public static getInvoiceNumber(session: Session): string {
    return session.conversationData.invoiceNumber;
  }

  public static getDate(session: Session): string {
    return session.conversationData.invoiceDate;
  }

  public static getAmount(session: Session): string {
    return session.conversationData.invoiceAmount;
  }

  public static getCurrency(session: Session): string {
    return session.conversationData.invoiceCurrency;
  }

  public static savePoNumber(session: Session, poNumberValue: string) {
    session.conversationData.poNumber = poNumberValue ? addLeadingZeros(poNumberValue.trim(), 10) : session.conversationData.poNumber;
  }

  public static saveInvoiceNumber(session: Session, invoiceNumberValue: string) {
    session.conversationData.invoiceNumber = invoiceNumberValue ? invoiceNumberValue.trim() : session.conversationData.invoiceNumber;
  }

  public static saveDate(session: Session, dateValue: any) {
    session.conversationData.invoiceDate = dateValue ? dateValue : session.conversationData.invoiceDate;
  }

  public static saveAmount(session: Session, amountValue: string, recognizer: IWatsonAssistantRecognizer) {
    let amountWithoutComma = amountValue ? amountValue.toString().trim().replace(",", "") : undefined;

    if (!isNaN(Number(amountWithoutComma))) {
      session.conversationData.invoiceAmount = amountValue ? amountWithoutComma : session.conversationData.invoiceAmount;
    }

    return ConversationDataManager.saveAmountCurrency(recognizer, amountValue, session);
  }

  private static async saveAmountCurrency(recognizer: IWatsonAssistantRecognizer, amountValue: string, session: Session) {
    try {
      if (recognizer) {
        const result = await recognizer.manualCachedRecognize(amountValue, session.preferredLocale());
        if (result.entities) {
          var currency: any = result.entities.find((item) => item.entity === "sys-currency");
          if (currency && currency.metadata) {
            session.conversationData.invoiceAmount = currency.metadata.numeric_value;
            this.saveCurrency(session, currency.metadata.unit);
          }
        }
      }
    } catch (err) {
      logger.error("%o", err);
    }
  }

  public static saveCurrency(session: Session, invoiceCurrency: string) {
    session.conversationData.invoiceCurrency = invoiceCurrency ? invoiceCurrency.trim() : session.conversationData.invoiceCurrency;
  }

  public static deletePoNumber(session: Session) {
    session.conversationData.poNumber = undefined;
  }

  public static deleteInvoiceNumber(session: Session) {
    session.conversationData.invoiceNumber = undefined;
  }

  public static deleteDate(session: Session) {
    session.conversationData.invoiceDate = undefined;
  }

  public static deleteAmount(session: Session) {
    session.conversationData.invoiceAmount = undefined;
    this.deleteCurrency(session);
  }

  public static deleteCurrency(session: Session) {
    session.conversationData.invoiceCurrency = undefined;
  }

  public static resetData(session: Session) {
    this.deleteAmount(session);
    this.deleteDate(session);
    this.deletePoNumber(session);
    this.deleteInvoiceNumber(session);
    this.deleteCurrentInvoiceSelection(session);
    ConversationHistoryManager.delete(session);
    session.conversationData.answerAfterStatus = undefined;
  }

  private static parseValueFromPatternGroup(text: string, entity: IWatsonEntity, groupNumber: number) {
    return entity
      ? text.substring(entity.groups[groupNumber].startIndex, entity.groups[groupNumber].endIndex)
      : undefined;
  }

  public static anyDataFilled(session: Session): boolean {
    return session.conversationData.poNumber
      || session.conversationData.invoiceNumber
      || session.conversationData.invoiceDate
      || session.conversationData.invoiceAmount;
  }

  public static getUsedSearchParameters(session: Session): string {
    var usedParams = [];
    if (session.conversationData.invoiceNumber) {
      usedParams.push("invoice number");
    }
    if (session.conversationData.invoiceDate) {
      usedParams.push("invoice date");
    }
    if (session.conversationData.invoiceAmount) {
      usedParams.push("invoice amount");
    }
    if (session.conversationData.poNumber) {
      usedParams.push("po number");
    }

    return usedParams.join("|");
  }

  public static sendQueryInformation = (session: Session) => {
    if (ConversationDataManager.anyDataFilled(session)) {
      var msg = new Message(session).addAttachment(
        InvoiceQueryInformation.generate(session, false)
      );
      session.send(msg);
    }
  }

  public static sendNoResultsQueryInformation = (session: Session) => {
    if (ConversationDataManager.anyDataFilled(session)) {
      SessionHelper.saveCustomMessageToHistory(session, session.gettext("noResults"));
      var msg = new Message(session).addAttachment(
        InvoiceQueryInformation.generate(session, false, true)
      );
      msg.text("noResults");
      session.send(msg);
    }
  }

  public static sendQueryInformationWithGreeting = (session: Session) => { // TODO message history when/if Option 1.2 will be implemented
    if (ConversationDataManager.anyDataFilled(session)) {
      var msg = new Message(session)
        .text("greetingWithData_header")
        .addAttachment(
          InvoiceQueryInformation.generate(session, true)
        );
      session.send(msg);
    }
  }
  //#endregion
}