import { Env, Logger, SecretManager } from "botanica";
import { IEvent, IIntentDialogOptions, IIntentRecognizer, Message, Prompts, PromptType, Session, UniversalBot } from "botbuilder";
import { IJwtPayload } from "../../business/core/IJwtPayload";
import { config } from "../../config";
import { EzSuiteConnector } from "../../data/EzSuiteConnector";
import { HanaXsjsClient } from "../../data/HanaXsjsClient";
import ZENDeskClient from "../../data/ZenDeskClient";
import { ContextHelpDialog } from "../ContextHelpDialog";
import { Dialogs } from "../Dialogs";
import { FeedbackDialog } from "../FeedbackDialog";
import { GatherParametersDialog } from "../GatherParametersDialog";
import { HelpDialog } from "../HelpDialog";
import { ConversationCounter } from "../helpers/ConversationCounter";
import { ConversationDataManager } from "../helpers/ConversationDataManager";
import { EzSuiteResultsHelper } from "../helpers/Results/EzSuiteResultsHelper";
import { HanaResultsHelper as HanaResultsHelper } from "../helpers/Results/HanaResultsHelper";
import { ResultHelperFactory } from "../helpers/Results/ResultsHelperFactory";
import { ValidatedPromptText } from "../helpers/ValidatedPromptText";
import { ZENDeskDataManager } from "../helpers/ZENDeskDataManager";
import { InvoiceStatusDialog } from "../InvoiceStatusDialog";
import { MetricsManager } from "../metrics/MetricManager";
import { NoIntentDialog } from "../NoIntentDialog";
import { OptionTwoSearchConfirmation } from "../OptionTwoSearchConfirmation";
import { ResultsDialog } from "../ResultsDialog";
import { RootDialog } from "../RootDialog";
import { SearchConfirmationDialog } from "../SearchConfirmationDialog";
import { TicketCreationAfterStatus } from "../TicketCreationAfterStatus";
import { TicketCreationDialog } from "../TicketCreationDialog";
import { getLocale } from "./LocalizationManager";
import * as chatbotLogger from "./MiddlewareFunctions";
import { WatsonAssistantRecognizer } from "./WatsonAssistantRecognizer";
import { JwtManager } from "../../core/JwtManager";
import { QnAMakerFacade } from "./QnAMakerFacade";
import { HealthManager } from "../../core/healthManager/HealthManager";
import { HealthMonitors } from "../../core/healthManager/HealthMonitors";
import { WelcomeDialog } from "../WelcomeDialog";
import { CheckNumberConnector } from "../../data/CheckNumberConnector";
import { HanaSchemaVersion } from "../../core/QueryCreator";
import { ServiceNowClient } from "../../data/ServiceNowClient";
import { SnowflakeConnector } from "../../data/SnowflakeConnector";

export default class ChatbotInitializer {
  private static logger: Logger = new Logger("ChatbotInitializer");

  public static async setup(
    bot: UniversalBot,
    recognizer: WatsonAssistantRecognizer,
    intentDialogOptions: IIntentDialogOptions,
    ZENDeskClient: ZENDeskClient,
    serviceNowClient: ServiceNowClient,
    jwtManager: JwtManager,
    secretManager: SecretManager,
    zenDeskDataManager: ZENDeskDataManager,
    qnaMaker: QnAMakerFacade,
    environment: string,
    ezSuiteConnector: EzSuiteConnector,
    checkNumberConnector: CheckNumberConnector,
  ) {
    var healthCheckManager = new HealthManager([
      HealthManager.createMonitor(HealthMonitors.HANADATALAKE, new HanaXsjsClient(secretManager, HanaSchemaVersion.Botanica), true),
      HealthManager.createMonitor(HealthMonitors.WATSON, recognizer, true),
      HealthManager.createMonitor(HealthMonitors.EZSUITE, ezSuiteConnector),
      HealthManager.createMonitor(HealthMonitors.CHECKNUMBER, checkNumberConnector),
      HealthManager.createMonitor(HealthMonitors.SERVICENOW, serviceNowClient)
    ], config.get("HealthChecks_Timeout") as number);

    this.addMiddleware(bot, healthCheckManager, recognizer);
    this.addDialogs(
      bot,
      recognizer,
      intentDialogOptions,
      ZENDeskClient,
      serviceNowClient,
      secretManager,
      zenDeskDataManager,
      qnaMaker,
      healthCheckManager,
      environment,
      ezSuiteConnector
    );
    this.addEvents(bot, jwtManager, healthCheckManager, secretManager);
  }

  public static addMiddleware(bot: UniversalBot, healthCheckManager: HealthManager, recognizer: WatsonAssistantRecognizer) {
    bot.use({
      botbuilder: async (session: Session, next: Function) => {
        await chatbotLogger.onMessageReceived(session, next, healthCheckManager, recognizer);
      },
      send: (event: IEvent, next: Function) => {
        chatbotLogger.onMessageSent(event, next, bot);
      }
    });
  }

  public static addDialogs(
    bot: UniversalBot,
    recognizer: IIntentRecognizer,
    intentDialogOptions: IIntentDialogOptions,
    ZENDeskClient: ZENDeskClient,
    serviceNowClient: ServiceNowClient,
    secretManager: SecretManager,
    zenDeskDataManager: ZENDeskDataManager,
    qnaMaker: QnAMakerFacade,
    healthCheckManager: HealthManager,
    environment: string,
    ezSuiteConnector: EzSuiteConnector
  ) {
    Prompts.customize(PromptType.text, new ValidatedPromptText());
    var resultHelperFactory = new ResultHelperFactory(
      new HanaResultsHelper(new HanaXsjsClient(secretManager, HanaSchemaVersion.Botanica),
        SnowflakeConnector.getInstance()),
      new EzSuiteResultsHelper(ezSuiteConnector)
    );

    bot.recognizer(recognizer);
    bot.dialog(Dialogs.Root, new RootDialog(recognizer));
    bot.dialog(Dialogs.Welcome, new WelcomeDialog(intentDialogOptions));
    bot.dialog(Dialogs.InvoiceStatus, new InvoiceStatusDialog(intentDialogOptions));
    bot.dialog(Dialogs.SearchConfirmation, new SearchConfirmationDialog());
    bot.dialog(Dialogs.ParameterQuery, new GatherParametersDialog(recognizer));
    bot.dialog(Dialogs.NoIntent, new NoIntentDialog(intentDialogOptions, qnaMaker));
    bot.dialog(Dialogs.OptionTwoSearchConfirmation, new OptionTwoSearchConfirmation());
    bot.dialog(Dialogs.Results, new ResultsDialog(
      intentDialogOptions,
      resultHelperFactory,
      healthCheckManager,
      secretManager
    ));
    bot.dialog(Dialogs.Feedback, new FeedbackDialog());
    bot.dialog(Dialogs.TicketCreationDialog, new TicketCreationDialog(ZENDeskClient, serviceNowClient, zenDeskDataManager, healthCheckManager));
    bot.dialog(Dialogs.TicketCreationAfterStatus, new TicketCreationAfterStatus(ZENDeskClient, serviceNowClient, zenDeskDataManager, healthCheckManager));
    bot.dialog(Dialogs.Reset, function (session) {
      ConversationDataManager.resetData(session);
      session.endDialog("resetDone");
    }).triggerAction({ matches: "restart" });
    bot.dialog(Dialogs.Help, new HelpDialog());
    bot.dialog(Dialogs.ContextHelp, new ContextHelpDialog());
  }

  public static addEvents(bot: UniversalBot, jwtManager: JwtManager, healthManager: HealthManager, secretManager: SecretManager) {
    // for other than WebChat channels e.g. Bot Emulator
    bot.on("conversationUpdate", async (message) => {
      if (message.membersAdded.find(m => m.id === message.user.id)) {
        bot.loadSession(message.address, async (err, session) => {
          session.sendTyping();
          session.delay(500);
          this.logger.debug(`current enviroment is: ${Env.get("BotEnv", "dev")}`);
          if (Env.get("BotEnv", "dev") === "dev") { // for test purpose prefill entiltements
            var token = await secretManager.getSecret("IOLTOKEN_TEST");
            const decodedToken: IJwtPayload = await jwtManager.verify(token);
            ConversationDataManager.saveAuthorization(session, decodedToken);
            session.preferredLocale(
              session.userData.locale,
              (err) => {
                if (err) ChatbotInitializer.logger.error(err);

                if (healthManager.isChatbotHealthy() && config.get("Alive")) {
                  session.send("greeting");
                } else {
                  session.send("serviceIsDown");
                }
              }
            );
          }

          MetricsManager.trackNewConversation(session);
          console.log(`seesionUserData: ${JSON.stringify(session.userData)}`)
          ConversationCounter.addToCounter(session, "greeting");
        });
      }
    });

    bot.on("event", (event) => {
      if (event.name === "greeting") {
        bot.loadSession(event.address, async (err, session) => {
          if (err) {
            ChatbotInitializer.logger.error("Event greeting. Loading session error: %o", err);
          } else {
            ConversationDataManager.deleteAuthorization(session);
            ConversationCounter.addToCounter(session, "greeting");

            if (event.value) {
              var feedbackMsg: any = new Message(session);
              feedbackMsg.data.type = "event";
              feedbackMsg.data.name = "greetingFeedback";

              try {
                const decodedToken: IJwtPayload = await jwtManager.verify(event.value);
                ConversationDataManager.saveAuthorization(session, decodedToken);
                session.preferredLocale(
                  getLocale(session.userData.culture),
                  (err) => {
                    if (err) ChatbotInitializer.logger.error(err);

                    if (healthManager.isChatbotHealthy() && config.get("Alive")) {
                      session.send("greeting");
                    } else {
                      session.send("serviceIsDown");
                    }
                  }
                );
                MetricsManager.trackNewConversation(session);
                feedbackMsg.data.value = "success";
              } catch (err) {
                ChatbotInitializer.logger.error("Parsing json web token issue: %o", err);
                feedbackMsg.data.value = "error";
              }
            }
          }
          session.send(feedbackMsg);
        });
      }
    });
  }
}