import { Env, Logger, SecretManager } from "botanica";
import { IIntentDialogOptions, IIntentRecognizerResult, Session } from "botbuilder";
import { ISearchParameters } from "../business/conversation/ISearchParameters";
import { HealthMonitors } from "../core/healthManager/HealthMonitors";
import { HealthManager } from "../core/healthManager/HealthManager";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { AbstractResultsHelper, InvoiceDataSource } from "./helpers/Results/AbstractResultsHelper";
import { ResultHelperFactory } from "./helpers/Results/ResultsHelperFactory";
import { SessionHelper } from "./helpers/SessionHelper";
import { MetricsManager, SearchResult_Type } from "./metrics/MetricManager";
import { PaytonParentDialog } from "./PaytonParentDialog";
import { HanaSchemaVersion } from "../core/QueryCreator";
import { IHanaRowData } from "../business/data/HanaDataLake/IHanaRowData";
import { IEzSuiteInvoiceData } from "../business/data/EzSuite/IEzSuiteInvoiceData";

export class ResultsDialog extends PaytonParentDialog {
  private logger: Logger = new Logger("ResultsDialog");
  private resultFactory: ResultHelperFactory;
  private healthCheckManager: HealthManager;

  //#region Initialization
  constructor(
    dialogOptions: IIntentDialogOptions,
    resultFactory: ResultHelperFactory,
    healthCheckManager: HealthManager,
    private secretManager: SecretManager
  ) {
    super(dialogOptions, (session, recognizerResult) => {
      if (session.message && session.message.value) {
        SessionHelper.saveCustomUserAction(session, `Click on show details for invoice ${session.message.value.invoiceNumber} and amount ${session.message.value.previousAmount}`);
        resultFactory.getResultHelper(session.message.value.dataSource).onShowDetails(
          session,
          session.message.value.invoiceNumber,
          session.message.value.companyCode,
          session.message.value.sapSystem,
          session.message.value.previousAmount,
          session.message.value.previousDate,
          session.message.value.previousVendorNumber,
          HanaSchemaVersion.Botanica
        );

        session.message.value = "";
        return; // without this, the dialog kept repeating even after the endDialog
      } else {
        this.onNoIntent(session, recognizerResult);
      }
    });

    this.healthCheckManager = healthCheckManager;
    this.resultFactory = resultFactory;
    this.onBegin(this.startQueryHana);
  }
  //#endregion

  //#region Private Methods 
  protected onHelp(session: Session) {
    session.beginDialog(Dialogs.ContextHelp, {
      fakeMessage: "invoiceStatus",
      helpMessageCode: "invoiceSearchDialogHelp"
    });
    session.replaceDialog(Dialogs.Results);
  }

  private async startQueryHana(session: Session, recognizerResult: IIntentRecognizerResult) {
    this.startQueryUniversal(session, recognizerResult, InvoiceDataSource.HANA);
  }

  private handleMoreThan10Results(session: Session) {
    MetricsManager.trackInvoiceSearch(session, SearchResult_Type.MoreThan10, ConversationDataManager.getUsedSearchParameters(session));
    SessionHelper.sendMessage(session, "moreThan10Results");
    session.endDialog();
    ConversationDataManager.sendQueryInformation(session);
    session.message.text = session.gettext("no"); // hack for intent recognized in InvoiceStatus dialog
    session.beginDialog(Dialogs.InvoiceStatus);
  }

  private async startQueryUniversal(session: Session, recognizerResult: IIntentRecognizerResult, source: InvoiceDataSource = InvoiceDataSource.HANA) {
    try {
      var entiltementData = ConversationDataManager.getEntiltementData(session);
      var isAdminUser = await this.getUserRights(isAdminUser, session);
      if (entiltementData.length > 0 || isAdminUser) {
        var searchParams: ISearchParameters = AbstractResultsHelper.getSearchParameters(session);
        var resultHelper = this.resultFactory.getResultHelper(source);
        const { count, results } = await this.getResults(resultHelper, entiltementData, searchParams, isAdminUser);
        var frontEndResults = resultHelper.mapDatatoFrontend(results);

        if (count > 11) {                                           // more then 10 results
          this.handleMoreThan10Results(session);
        } else if (count === 1) {
          resultHelper.showListOfInvoices(session, frontEndResults);
          resultHelper.showResultDetail(results[0], session);
        } else if (count <= 11 && count > 0) {                      // 1 - 10 results
          resultHelper.showListOfInvoices(session, frontEndResults);
          SessionHelper.sendMessage(session, "between1and10Results_footer");
        } else if (
          source === InvoiceDataSource.HANA
          && this.healthCheckManager
          && this.healthCheckManager.isServiceHealthy(HealthMonitors.EZSUITE)
        ) {                                                         // redirect to Ez-Suite
          this.startQueryUniversal(session, recognizerResult, InvoiceDataSource.EZSUITE);
        } else {                                                    // no results
          MetricsManager.trackInvoiceSearch(session, SearchResult_Type.NoResult, ConversationDataManager.getUsedSearchParameters(session));
          SessionHelper.sendMessages(session, "noResults_message1", "noResults_message2");
          SessionHelper.createChoicePrompt(session, "userFeedback_otherQuestions", ["yes", "no"], 0);

          ConversationDataManager.resetData(session);
          session.endConversation();
        }
      } else {
        SessionHelper.sendMessages(session, "noAuthorization");
      }
    } catch (err) {
      this.logger.error(err);
      SessionHelper.sendMessages(session, "databaseUnavaiable");
      session.replaceDialog(Dialogs.Feedback);
    }
  }

  private getResults = async (resultHelper: AbstractResultsHelper<IHanaRowData | IEzSuiteInvoiceData>, entiltementData, searchParams, isAdminUser) => {
    const [botanicaResults, energyResults] = await Promise.all([
      resultHelper.getData(entiltementData, searchParams, isAdminUser, HanaSchemaVersion.Botanica),
      resultHelper.getData(entiltementData, searchParams, isAdminUser, HanaSchemaVersion.Energy)
    ]);
    if (botanicaResults.count > 0) {
      return botanicaResults;
    } else {
      return energyResults;

    }
  }

  private async getUserRights(isAdminUser: any, session: Session) {
    const isDev = await this.isDevEnv();
    this.logger.debug(`Is dev enviroment: ${isDev}`);
    if (isDev) {
      isAdminUser = true;
    } else {
      isAdminUser = ConversationDataManager.isAdminUser(session);
    }
    return isAdminUser;
  }
  private async isDevEnv() {
    return Env.get("BotEnv", "dev") === "dev"
  }
  //#endregion
}

export enum BotanicaEnviroment {
  prod = "prd",
  dev = "dev"
}