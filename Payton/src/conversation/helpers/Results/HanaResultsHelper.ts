import { Logger } from "botanica";
import { Session } from "botbuilder";
import { IEntitlement } from "../../../business/conversation/IEntiltement";
import { IInvoiceData } from "../../../business/conversation/IInvoiceData";
import { ISearchParameters } from "../../../business/conversation/ISearchParameters";
import { IHanaRowData } from "../../../business/data/HanaDataLake/IHanaRowData";
import { HanaSchemaVersion, QueryCreator } from "../../../core/QueryCreator";
import { InvoiceStatusRulesManager } from "../../../core/rule-manager/InvoiceStatusRulesManager";
import { ERPSystemMappingManager } from "../../../data/ERPSystemMappingManager";
import { HanaXsjsClient, IHanaXsjsClient } from "../../../data/HanaXsjsClient";
import { ConversationDataManager } from "../ConversationDataManager";
import { InvoicesAggregator } from "../InvoicesAggregator";
import { SessionHelper } from "../SessionHelper";
import { AbstractResultsHelper, InvoiceDataSource } from "./AbstractResultsHelper";
import moment = require("moment");
import { CheckNumberResultHelper } from "./CheckNumberResultHelper";
import { FinnavigateConnector } from "../../../data/finnavigate/FinnavigateConnector";
import { FinnavigateHelper } from "./FinnavigateHelper";
import { SnowflakeConnector } from "../../../data/SnowflakeConnector";

export class HanaResultsHelper extends AbstractResultsHelper<IHanaRowData>{
  private static logger: Logger = new Logger("HanaResultsHelper");

  constructor(
    private hanaClientBotanica: HanaXsjsClient,
    private snowflakeClientEnergy: SnowflakeConnector

  ) {
    super();

  }

  public async showResultDetail(identifiedResult: IHanaRowData, session: Session): Promise<void> {
    ConversationDataManager.saveCurrentInvoiceSelection(
      session,
      identifiedResult.InvoiceNumber,
      identifiedResult.VendorNumber,
      identifiedResult.CompanyCode
    );
    let conversationIndex = InvoiceStatusRulesManager.getInstance().getConversationIndex(identifiedResult, identifiedResult.System);
    const checknumber = await FinnavigateHelper.getCheckNumber(identifiedResult);
    if (checknumber) {
      conversationIndex = "1.1.1.1.2.2"
    }
    if (this.isCheckPayment(conversationIndex)) {
      if (!!checknumber) {
        identifiedResult.CheckNumber = checknumber;
        conversationIndex = this.getCheckNumberConversationIndex(identifiedResult);
      }
    }
    await this.showPredefinedAnswers(conversationIndex, identifiedResult, session);
  }
  private getHanaClient = (hanaSchemaVersion: HanaSchemaVersion): IHanaXsjsClient => {
    switch (hanaSchemaVersion) {
      case HanaSchemaVersion.Botanica:
        return this.hanaClientBotanica
      case HanaSchemaVersion.Energy:
        return this.snowflakeClientEnergy;
    }
  }
  public onShowDetails(session: Session, invoiceNumber: string, companyCode: string, sapSystem: string, previousAmount: string, previousDate: string, previousVendorNumber: string, hanaSchemaVersion: HanaSchemaVersion): void {
    ConversationDataManager.deleteAmount(session);
    ConversationDataManager.deleteDate(session);
    ConversationDataManager.saveInvoiceNumber(session, invoiceNumber);
    var entiltementData = ConversationDataManager.getEntiltementData(session);
    var isAdminUser = ConversationDataManager.isAdminUser(session);
    var searchParams: ISearchParameters = AbstractResultsHelper.getSearchParameters(session);
    Promise.all([
      this.getData(entiltementData, searchParams, isAdminUser, HanaSchemaVersion.Botanica),
      this.getData(entiltementData, searchParams, isAdminUser, HanaSchemaVersion.Energy)
    ]).then(response => {
      const results = response[0].count > 0 ? response[0].results : response[1].results;
      var identifiedResult = results.filter(
        row =>
          row.CompanyCode == companyCode
          && row.System == sapSystem
          && row.VendorNumber == previousVendorNumber
      )[0];

      if (identifiedResult.DocumentAmount != previousAmount || identifiedResult.DocumentDate != previousDate) {
        SessionHelper.sendMessage(session, "newerInvoiceFound");
      }
      this.showResultDetail(identifiedResult, session);
    }).catch(error => {
      HanaResultsHelper.logger.error(error);
    });
  }

  protected getTypeInternal(): InvoiceDataSource {
    return InvoiceDataSource.HANA;
  }

  public mapDatatoFrontend(data: IHanaRowData[]): IInvoiceData[] {
    return data.map(
      value => {
        var additionalInfo = ERPSystemMappingManager.GetInstance().LoadAdditionalCompanyCodeInfo(value.CompanyCode, value.System);
        return {
          invoiceNumber: value.InvoiceNumber,
          documentAmount: value.DocumentAmount,
          documentAmountAndCurrency: value.DocumentAmount + " " + value.DocumentCurrency,
          documentDate: value.DocumentDate,
          formattedDocumentDate: moment(value.DocumentDate, "YYYYMMDD").format("MM/DD/YYYY"),
          vendorNumber: value.VendorNumber,
          vendorName: value.Name1,
          ezSuiteCode: additionalInfo.ezSuiteCode,
          mailCode: additionalInfo.mailCode,
          companyName: additionalInfo.companyName,
          companyCode: value.CompanyCode,
          system: value.System
        } as IInvoiceData
      }
    )
  }


  public async getData(entiltementData: IEntitlement[], filterData: ISearchParameters, isAdminUser: boolean, hanaSchemaVersion: HanaSchemaVersion) {
    var preparedQuery = await QueryCreator.CreateQuery(entiltementData, filterData, isAdminUser, hanaSchemaVersion);
    var results = await this.getHanaClient(hanaSchemaVersion).getData(preparedQuery.query, preparedQuery.params);
    results = InvoicesAggregator.aggregateResultsHana(results);
    var count = results.length;

    return { count, results };
  }

  private getCheckNumberConversationIndex(identifiedResult: IHanaRowData): string {
    if (identifiedResult.ClearingDocument === identifiedResult.CheckNumber) {
      return "1.1.1.1.2.5";
    }
    return "1.1.1.1.2.4";
  }

  private isCheckPayment(index: string): boolean {
    return index === "1.1.1.1.2.2";
  }
}