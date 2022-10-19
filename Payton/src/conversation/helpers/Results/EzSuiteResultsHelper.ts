import { Logger } from "botanica";
import { Session } from "botbuilder";
import { IEntitlement } from "../../../business/conversation/IEntiltement";
import { IInvoiceData } from "../../../business/conversation/IInvoiceData";
import { ISearchParameters } from "../../../business/conversation/ISearchParameters";
import { IEzSuiteInvoiceData } from "../../../business/data/EzSuite/IEzSuiteInvoiceData";
import { EzSuiteFacade } from "../../../core/EzSuiteFacade";
import { IndexToAnswerManager } from "../../../core/IndexToAnswerManager";
import { InvoiceStatusRulesManager } from "../../../core/rule-manager/InvoiceStatusRulesManager";
import { ERPSystemMappingManager } from "../../../data/ERPSystemMappingManager";
import { EzSuiteConnector } from "../../../data/EzSuiteConnector";
import { Dialogs } from "../../Dialogs";
import { ConversationDataManager } from "../ConversationDataManager";
import { InvoicesAggregator } from "../InvoicesAggregator";
import { SessionHelper } from "../SessionHelper";
import { AbstractResultsHelper, InvoiceDataSource } from "./AbstractResultsHelper";
import moment = require("moment");
import { HanaSchemaVersion } from "../../../core/QueryCreator";

export class EzSuiteResultsHelper extends AbstractResultsHelper<IEzSuiteInvoiceData> {
  private static logger: Logger = new Logger("EzSuiteResultsHelper");
  private ezSuiteFacade: EzSuiteFacade;

  constructor(connector: EzSuiteConnector) {
    super();
    this.ezSuiteFacade = new EzSuiteFacade(connector);
  }

  public async getData(entiltementData: IEntitlement[], filterData: ISearchParameters, isAdminUser: boolean, hanaSchemaVersion: HanaSchemaVersion): Promise<{ count: number; results: IEzSuiteInvoiceData[] }> {
    var { count, results } = await this.ezSuiteFacade.getData(entiltementData, filterData, isAdminUser);

    results = InvoicesAggregator.aggregateResultsEzSuite(
      results
    );
    count = results.length;

    return {
      count,
      results
    };
  }

  public async showResultDetail(identifiedResult: IEzSuiteInvoiceData, session: Session): Promise<void> {
    ConversationDataManager.saveCurrentInvoiceSelection(
      session,
      identifiedResult.invoice_number,
      identifiedResult.invoice_vendor_nbr,
      identifiedResult.invoice_company_code
    );
    var conversationIndex = InvoiceStatusRulesManager.getInstanceEzSuite().getConversationIndex(identifiedResult);
    var predefinedAnswers = IndexToAnswerManager.getInstance().getAnswers(conversationIndex);

    if (predefinedAnswers) {
      await this.sendStatusMessage(predefinedAnswers.answer1, predefinedAnswers.params1, identifiedResult, session);
      await this.sendStatusMessage(predefinedAnswers.answer2, predefinedAnswers.params2, identifiedResult, session);

      if (predefinedAnswers.answerAfterTicket) {
        session.conversationData.answerAfterStatus = predefinedAnswers.answerAfterTicket;
        session.replaceDialog(Dialogs.TicketCreationAfterStatus);
      } else {
        session.replaceDialog(Dialogs.Feedback);
      }
    } else {
      SessionHelper.sendMessage(session, "invoiceStatusAnswer_Unknown");
      session.replaceDialog(Dialogs.TicketCreationDialog, { skipFirstMessage: true });
    }
  }

  public async onShowDetails(session: Session, invoiceNumber: string, companyCode: string, sapSystem: string, previousAmount: string, previousDate: string, previousVendorNumber: string, hanaSchemaVersion: HanaSchemaVersion): Promise<void> {
    try {
      ConversationDataManager.saveInvoiceNumber(session, invoiceNumber);

      var searchParams: ISearchParameters = {
        invoiceNumber: ConversationDataManager.getInvoiceNumber(session),
        invoiceDate: ConversationDataManager.getDate(session),
        invoiceAmount: ConversationDataManager.getAmount(session),
        invoiceCurrency: ConversationDataManager.getCurrency(session),
        poNumber: ConversationDataManager.getPoNumber(session)
      };

      var isAdminUser = ConversationDataManager.isAdminUser(session);
      var { count, results } = await this.ezSuiteFacade.getData(ConversationDataManager.getEntiltementData(session), searchParams, isAdminUser);

      var identifiedResult = results.filter(
        row =>
          row.invoice_company_code == companyCode
          && row.invoice_vendor_nbr == previousVendorNumber
      )[0];

      if (identifiedResult.invoice_amount != previousAmount || identifiedResult.invoice_date != previousDate) {
        SessionHelper.sendMessage(session, "newerInvoiceFound");
      }

      this.showResultDetail(identifiedResult, session);
    } catch (error) {
      EzSuiteResultsHelper.logger.error(error);
    }
  }

  public mapDatatoFrontend(data: IEzSuiteInvoiceData[]): IInvoiceData[] {
    return data.map(
      value => {
        var additionalInfo = ERPSystemMappingManager.GetInstance().LoadAdditionalInfo(value.invoice_mail_code);

        return {
          invoiceNumber: value.invoice_number,
          documentAmount: value.invoice_amount,
          documentAmountAndCurrency: value.invoice_amount + " " + value.invoice_currency,
          documentDate: value.invoice_date,
          formattedDocumentDate: moment(value.invoice_date, "MM-DD-YYYY").format("MM/DD/YYYY"),
          vendorNumber: value.invoice_vendor_nbr,
          vendorName: value.invoice_vendor_name,
          ezSuiteCode: value.invoice_soc,
          mailCode: value.invoice_mail_code,
          companyName: additionalInfo ? additionalInfo.companyName : undefined,
          companyCode: value.invoice_company_code,
          system: ""
        } as IInvoiceData
      }
    );
  }

  protected getTypeInternal(): InvoiceDataSource {
    return InvoiceDataSource.EZSUITE;
  }
}