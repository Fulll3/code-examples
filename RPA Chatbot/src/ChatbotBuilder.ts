// tslint:disable: max-classes-per-file
import { Env } from "botanica";
import { Runtime } from "./Runtime";
import { Services } from "./service/Services";
import { HealthManager } from "./monitoring/health/HealthManager";
import { ServerManager } from "botanica";
import { HealthMonitors } from "./monitoring/health/HealthMonitors";
import { ActivityHandler } from "./ActivityHandler";
import { LocalizedMessages } from "./conversation/LocalizedMessages";
import { TelemetryMiddleware } from "./middlewares/monitoring/TelemetryMiddleware";
import { MaintenanceMiddleware } from "./middlewares/MaintenanceMiddleware";
import { WatsonAssistantMiddleware } from "./middlewares/watson/WatsonAssistantMiddleware";
import { BotFrameworkAdapter, AutoSaveStateMiddleware } from "botbuilder";
import { SetUserDataMiddleware } from "./middlewares/CaptureUserDetailsMiddleware";

/**
 * 1. Creates Bot activity handler for managing incoming activities;
 * 2. Creates Bot framework adapter that can connect a bot to a service endpoint;
 * 3. Exposes chatbot through Botanica's server;
 * 4. Starts chatbot monitoring;
 */
export class ChatbotBuilder {
  public static async init() {
    const activityHandler = new ActivityHandler();
    const adapter = ChatbotBuilder.getBotAdapter();
    const server = await ServerManager.getServer();
    server.post("/api/messages", (req, res) => {
      adapter.processActivity(req, res, async (context) => {
        await activityHandler.run(context);
      });
    });
    if (Runtime.isProd() ) {
      await ChatbotBuilder.startHealthMonitoring();
    }
  }

  private static getBotAdapter(): BotFrameworkAdapter {
    const adapter = new BotFrameworkAdapter({
      appId: Env.get("MicrosoftAppId", process.env.microsoftAppID),
      appPassword: Env.get("MicrosoftAppPassword", process.env.microsoftAppPassword),
    });

    adapter.use(new MaintenanceMiddleware(
      new LocalizedMessages(MaintenanceMiddleware.name, Services.instance().get("UserRepository")),
      Services.instance().get("Configuration"),
    ));
    adapter.use(new SetUserDataMiddleware(Services.instance().get("UserRepository")));
    adapter.use(new WatsonAssistantMiddleware(
      Services.instance().get("UserRepository"),
      Services.instance().get("WatsonAssistantDomain"),
    ));
    adapter.use(new TelemetryMiddleware(
      Services.instance().get("WatsonAssistantDomain"),
    ));
    adapter.use(new AutoSaveStateMiddleware(
      Services.instance().get("UserState"),
      Services.instance().get("ConversationState"),
    ));

    return adapter;
  }

  private static async startHealthMonitoring(): Promise<void> {
    if(!Runtime.isProd()){
      // run healthchecks only in prod
      return
    }
    const healthChecker = HealthManager.getInstance();
    /**
     * Critical services:
     */
    healthChecker.addMonitor(HealthManager.createMonitor(
      HealthMonitors.SPLUNK,
      Services.instance().get("SplunkConnector"),
      false,
    ));
    healthChecker.addMonitor(HealthManager.createMonitor(
      HealthMonitors.ScheduleWebservice,
      Services.instance().get("ScheduleDataConnector"),
      false,
    ));
  }
}