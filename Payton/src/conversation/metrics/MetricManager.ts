import * as appInsights from "applicationinsights";
import { TelemetryClient } from "applicationinsights";
import { Env, Logger } from "botanica";
import { Session } from "botbuilder";
import { ConversationDataManager } from "../helpers/ConversationDataManager";

export enum Metrics {
  New_Conversation = "New_Conversation",
  User_Message = "User_Message",
  Bot_Message = "Bot_Message",
  User_Feedback = "User_Feedback",
  Ticket_Creation = "Ticket_Creation",
  Invoice_Search = "Invoice_Search"
}

export enum SearchResult_Type {
  NoResult = "No result",
  MoreThan10 = "More than 10",
  Between1and9 = "Between 1 and 9"
}

export class MetricsManager {
  private static TelemetryClient: TelemetryClient;
  private static Logger = new Logger("MetricsManager");

  //#region Public Methods 
  public static trackNewConversation = (session: Session, properties?) => {
    try {
      var data = {
        conversationId: session.message.address.conversation.id,
        channel: session.message.address.channelId, // TODO Check
        iolUser: session.message.address.user.id,
        socCodes: ConversationDataManager.getEntiltementData(session).map(entiltement => entiltement.soc).join('|')
      } as { [key: string]: string };

      data = MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.New_Conversation, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }

  public static trackUserMessage = (session: Session, intent: string, confidence: string, properties?) => {
    try {
      var data = {
        conversationId: session.message.address.conversation.id,
        userMessage: session.message.text,
        intent: intent,
        confidence: confidence
      } as { [key: string]: string };

      data = MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.User_Message, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }

  public static trackInvoiceSearch = (session: Session, searchType: SearchResult_Type, parameterUsed?: string, properties?) => {
    try {
      var data = {
        conversationId: session.message.address.conversation.id,
        searchType: searchType,
        parameterUsed: parameterUsed
      } as { [key: string]: string };

      data = MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.Invoice_Search, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }

  public static trackBotMessage = (conversationId: string, botMessage: string, properties?) => {
    try {
      var data = {
        conversationId: conversationId,
        botMessage: botMessage
      } as { [key: string]: string };

      MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.Bot_Message, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }

  public static trackUserFeedback = (session: Session, feedback: string, properties?) => {
    try {
      var data = {
        conversationId: session.message.address.conversation.id,
        userFeedback: feedback
      } as { [key: string]: string };

      MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.User_Feedback, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }

  public static trackTicketCreated = (session: Session, ticketId: string, properties?) => {
    try {
      var data = {
        conversationId: session.message.address.conversation.id,
        ticketId: ticketId
      } as { [key: string]: string };

      MetricsManager.addProperties(properties, data);

      MetricsManager.trackEvent(Metrics.Ticket_Creation, data);
    } catch (exception) {
      MetricsManager.Logger.error(exception);
    }
  }
  //#endregion

  //#region Private Methods
  private static trackEvent(eventName: string, data: { [key: string]: string; }) {
    if (Env.get("NODE_ENV", "dev") == 'prod') {
      try {
        const client = MetricsManager.getTelemetryClient()
        if (client) {
          client.trackEvent({
            name: eventName,
            properties: data
          });
        }
      } catch (exception) {
        this.Logger.error(exception);
      }
    }
  }

  private static getTelemetryClient() {
    if (!MetricsManager.TelemetryClient) {
      if (Env.get("NODE_ENV") === "dev") {
        appInsights.setup(Env.get("APPINSIGHTS_INSTRUMENTATIONKEY"))
          .setAutoDependencyCorrelation(false)
          .setAutoCollectRequests(false)
          .setAutoCollectPerformance(false)
          .setAutoCollectExceptions(false)
          .setAutoCollectDependencies(false)
          .setAutoCollectConsole(false)
          .setUseDiskRetryCaching(false);

        MetricsManager.TelemetryClient = new TelemetryClient(Env.get("APPINSIGHTS_INSTRUMENTATIONKEY"));
      } else if (Env.get("NODE_ENV") === "prod") {
        MetricsManager.TelemetryClient = new TelemetryClient();
      }
    }

    return MetricsManager.TelemetryClient;
  }

  private static addProperties(properties: any, data: { [key: string]: string }) {
    if (properties) {
      for (var property in properties) {
        data[property] = properties[property];
      }
    }

    return data;
  }
  //#endregion
}
