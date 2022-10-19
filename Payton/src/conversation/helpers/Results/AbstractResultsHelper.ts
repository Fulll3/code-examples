import { AttachmentLayout, Message, Session } from "botbuilder";
import { IEntitlement } from "../../../business/conversation/IEntiltement";
import { IInvoiceData } from "../../../business/conversation/IInvoiceData";
import { ISearchParameters } from "../../../business/conversation/ISearchParameters";
import { AnswerParameter, IndexToAnswerManager } from "../../../core/IndexToAnswerManager";
import { HanaSchemaVersion } from "../../../core/QueryCreator";
import { Dialogs } from "../../Dialogs";
import { MetricsManager, SearchResult_Type } from "../../metrics/MetricManager";
import { InvoiceQueryInformation } from "../AdaptiveCardsTemplates";
import { ConversationDataManager } from "../ConversationDataManager";
import { SessionHelper } from "../SessionHelper";
import { TableColumnGenerator } from "../TableGenerator";

export enum InvoiceDataSource {
  HANA = "HANA",
  EZSUITE = "EZSUITE"
}

export abstract class AbstractResultsHelper<T> {
  abstract showResultDetail(identifiedResult: T, session: Session): void;
  abstract onShowDetails(session: Session, invoiceNumber: string, companyCode: string, sapSystem: string, previousAmount: string, previousDate: string, previousVendorNumber: string, hanaSchemaVersion: HanaSchemaVersion): void;
  protected abstract getTypeInternal(): InvoiceDataSource;
  abstract mapDatatoFrontend(data: T[]): IInvoiceData[];
  abstract getData(entiltementData: IEntitlement[], filterData: ISearchParameters, isAdminUser: boolean, hanaSchemaVersion: HanaSchemaVersion): Promise<{ count: number; results: T[] }>;

  public showListOfInvoices(session: Session, results: IInvoiceData[]) {
    var msg = new Message(session);

    var generatedTable = new TableColumnGenerator([  // conversation history
      "Invoice Number:",
      "Amount:",
      "Date:",
      "Vendor Id:",
      "Vendor Name:",
      "EZ-Suite SOC Code:",
      "IOL Mail Code:",
      "Siemens Bill to Name:",
      ""
    ]);

    msg.attachmentLayout(AttachmentLayout.carousel);

    if (results.length > 1) {
      msg.text("between1and10Results_header");
    }

    results.forEach((value) => {
      generatedTable.addColumn2(
        value.invoiceNumber,
        value.documentAmountAndCurrency,
        value.documentDate,
        value.vendorNumber,
        value.vendorName,
        value.ezSuiteCode,
        value.mailCode,
        value.companyName,
        "[show details]"
      );

      msg.addAttachment(
        InvoiceQueryInformation.generateResultsAdaptiveCardV2(value, results.length, session, this.getTypeInternal())
      );
    });

    SessionHelper.saveCustomMessageToHistory(session, generatedTable.getTableAsString());

    MetricsManager.trackInvoiceSearch(
      session,
      SearchResult_Type.Between1and9,
      ConversationDataManager.getUsedSearchParameters(session),
      {
        count: results.length
      }
    );
    session.send(msg);
  }

  protected async showPredefinedAnswers(conversationIndex: string, identifiedResult: T, session: Session) {
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

  public async sendStatusMessage(statusAnswer: string, params: AnswerParameter[], identifiedResult: any, session: Session) {
    if (statusAnswer) {
      SessionHelper.sendMessage(
        session,
        statusAnswer,
        ...(await IndexToAnswerManager.prepareParameters(params, identifiedResult, session.preferredLocale()))
      );
    }
  }

  public static getSearchParameters(session: Session): ISearchParameters {
    const searchParams = {
      invoiceNumber: ConversationDataManager.getInvoiceNumber(session),
      invoiceDate: ConversationDataManager.getDate(session),
      invoiceAmount: ConversationDataManager.getAmount(session),
      invoiceCurrency: ConversationDataManager.getCurrency(session),
      poNumber: ConversationDataManager.getPoNumber(session)
    } as ISearchParameters;
    return searchParams;
  }
}