import { Logger } from "botanica";
import { Session } from "botbuilder";
import * as path from "path";
import { IEntitlement } from "../../business/conversation/IEntiltement";
import { ITicketCustomField } from "../../business/data/Zendesk/ITicketCustomField";
import { ITicketData } from "../../business/data/Zendesk/ITicketData";
import { IZENDeskDataManager } from "../../business/IZENDeskDataManager";
import { IZENDeskMapping } from "../../business/IZENDeskMapping";
import { loadCsv } from "../../core/utils/CsvLoader";
import { ERPSystemMappingManager } from "../../data/ERPSystemMappingManager";
import { ConversationDataManager } from "./ConversationDataManager";

export class ZENDeskDataManager implements IZENDeskDataManager {
  private mapping: IZENDeskMapping[];
  private entitlement: IEntitlement[];
  private filePath: string;
  private logger: Logger = new Logger("ZENDeskDataManager");
  private environment: string;

  //#region Initialization
  public constructor(environment: string) {
    this.filePath = path.join(__dirname, "../../../configuration/zenDeskConfiguration.csv");
    this.environment = environment;
  }
  //#endregion

  //#region Public Methods
  public async getTicketData(session: Session): Promise<ITicketData> {
    this.entitlement = ConversationDataManager.getEntiltementData(session);
    console.log("********** Entitlement \n\o", this.entitlement);
    var CSVData: IZENDeskMapping[] = await this.loadConfigFile();
    this.logger.debug("(getTicketData) Loaded CSV Data:", CSVData);

    this.mapping = CSVData.filter(item => item.environment === this.environment);

    return {
      systemFields: {
        userName: this.getUserFullName(session),
        userEmail: this.getUserEmail(session)
          ? this.getUserEmail(session)
          : undefined,
        type: this.mapping.findIndex(element => element.fieldName === "Type") > 0
          // tslint:disable-next-line:max-line-length
          ? this.getPlaceHolderData(this.mapping[this.mapping.findIndex(element => element.fieldName === "Type")].fieldData, session)
          : "inquiry", // ticket type defaults to "normal"
        ccCollaboratorIds: this.mapping.findIndex(element => element.fieldName === "CcCollaboratorIds") > 0
          ? this.mapping[this.mapping.findIndex(element => element.fieldName === "CcCollaboratorIds")].fieldData
          : "", // default to null
        subject: this.mapping.findIndex(element => element.fieldName === "Subject") > 0
          ? this.mapping[this.mapping.findIndex(element => element.fieldName === "Subject")].fieldData
          : "<Payton invoice query>", // default subject text
        priority: this.mapping.findIndex(element => element.fieldName === "Priority") > 0
          ? this.mapping[this.mapping.findIndex(element => element.fieldName === "Priority")].fieldData
          : "normal", // default ticket priority
        tags: this.mapping.findIndex(element => element.fieldName === "Tags") > 0
          ? this.mapping[this.mapping.findIndex(element => element.fieldName === "Tags")].fieldData
          : undefined,
        description: this.getDescriptionText(session),
      },
      customFields: this.getCustomFields(this.mapping, session),
      conversationHistory: ConversationDataManager.getConversationHistory(session)
    };
  }
  //#endregion

  //#region Private Methods
  private loadConfigFile = async () => {
    let ZENconfig: Promise<any> = await loadCsv(this.filePath);
    return ZENconfig;
  }

  private getCustomFields(mapping: any, session: Session): ITicketCustomField[] {
    let result: ITicketCustomField[] = [];
    mapping.forEach(value => {
      if (value.fieldType !== "SYSTEM") {
        result.push({
          id: value.fieldType,
          value: value.fieldData.indexOf("|") > 0
            ? this.getPlaceHolderData(value.fieldData.split("|"), session)
            : (this.getPlaceHolderData(value.fieldData, session) ? this.getPlaceHolderData(value.fieldData, session) : "")
        });
      }
    });
    this.logger.debug("(getCustomField) Parsed Custom fields; ", result.toString());
    return (result);
  }

  private getPlaceHolderData(placeHolder: string, session: Session): string {
    this.logger.debug("(getPlaceHolderData) Initial CSV value:%s TypeOf:%s", placeHolder, typeof (placeHolder));
    switch (placeHolder) {
      case "%USERFULLNAME":
        this.logger.debug("(getPlaceHolderData) User Full Name => Replaces %s by :%s ", placeHolder, this.getUserFullName(session));
        return this.getUserFullName(session);
      case "%USERID%":
        this.logger.debug("(getPlaceHolderData) Replaced %s by :%s ", placeHolder, this.getUserId(session));
        return this.getUserId(session);
      case "%USEREMAIL%":
        this.logger.debug("(getPlaceHolderData) Replaced %s by :%s ", placeHolder, this.getUserEmail(session));
        return this.getUserEmail(session);
      case "%VENDORID%":
        this.logger.debug("(getPlaceHolderData) Replaced %s by :%s ", placeHolder, this.getVendorId(session));
        return this.getVendorId(session);
      case "%COMPANYCODE%":
        this.logger.debug("(getPlaceHolderData) Replaced %s by :%s ", placeHolder, this.getCompanyCode(session));
        return this.getCompanyCode(session);
      case "%SOC%":
        this.logger.debug("(getPlaceHolderData) Replaced %s by :%s ", placeHolder, this.getSOCs(session));
        return this.getSOCs(session);
      default:
        this.logger.debug("GetPlaceHolderData) No variable found. Returning original CSV file: %s", placeHolder);
        return placeHolder;
    }
  }

  private getUserFullName(session: Session): string {
    return session.userData.fullName
      ? session.userData.fullName
      : undefined;

  }

  private getUserId(session: Session): string {
    return ConversationDataManager.getUserId(session)
      ? ConversationDataManager.getUserId(session)
      : undefined;
  }

  private getUserEmail(session: Session): string {
    return ConversationDataManager.getUserEmail(session)
      ? ConversationDataManager.getUserEmail(session)
      : undefined;
  }

  private getInvoiceNumber(session: Session): string {
    return ConversationDataManager.getCurrentInvoiceSelection(session)
      ? ConversationDataManager.getCurrentInvoiceSelection(session).invoiceNumber
      : ConversationDataManager.getInvoiceNumber(session);
  }

  private getSOCs(session: Session): string {
    if (ConversationDataManager.getCurrentInvoiceSelection(session)) {
      var erpMappingManager: ERPSystemMappingManager = ERPSystemMappingManager.GetInstance();
      let test = erpMappingManager.LoadSocCode(ConversationDataManager.getCurrentInvoiceSelection(session).companyCode);
      var socs: string[] = erpMappingManager.LoadSocCode(ConversationDataManager.getCurrentInvoiceSelection(session).companyCode);
      return socs.length == 1 ? socs[0] : undefined;
    } else if (this.entitlement.find(item => item.soc !== undefined) && this.entitlement.length === 1) {
      return this.entitlement[0].soc;
    } else {
      return undefined;
    }
  }

  private getVendorId(session: Session): string {
    if (ConversationDataManager.getCurrentInvoiceSelection(session)) {
      return ConversationDataManager.getCurrentInvoiceSelection(session).vendorId;
    } else if (this.entitlement.find(item => item.vendorId !== undefined)) {
      return this.entitlement.map(item => item.vendorId).join("|");
    } else {
      return undefined;
    }
  }

  private getCompanyCode(session: Session): string {
    if (ConversationDataManager.getCurrentInvoiceSelection(session)) {
      return ConversationDataManager.getCurrentInvoiceSelection(session).companyCode;
    } else if (this.entitlement.length === 1 && this.entitlement[0].companyCode) {
      return this.entitlement[0].companyCode;
    } else {
      return undefined;
    }
  }

  private getDescriptionText(session: Session): string {
    return ConversationDataManager.getCurrentInvoiceSelection(session)
      ? session.gettext(
        "userFeedback_zENDeskTicketText_invoiceSelected",
        ConversationDataManager.getUserId(session),
        this.getInvoiceNumber(session),
        this.getSOCs(session),
        this.getUserEmail(session))
      : session.gettext(
        "userFeedback_zENDeskTicketText_queryParamOnly",
        ConversationDataManager.getUserId(session),
        this.getSOCs(session) ? this.getSOCs(session) : session.gettext("userFeedback_zENDeskTicketText_MultipleSOCs"),
        this.getInvoiceNumber(session),
        ConversationDataManager.getDate(session),
        ConversationDataManager.getPoNumber(session),
        ConversationDataManager.getAmount(session),
        this.getUserEmail(session));
  }
  //#endregion
}