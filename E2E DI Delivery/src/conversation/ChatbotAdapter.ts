import { BotFrameworkAdapter, AutoSaveStateMiddleware, ShowTypingMiddleware } from "botbuilder";
import { Env } from "botanica";
import { BotServices } from "../service/resolution/BotServices";
import { ServiceTypes } from "../service/resolution/ServiceTypes";
import { TelemetryMiddleware } from "./middlewares/TelemetryMiddleware";
import { MaintenanceMiddleware } from "./middlewares/MaintenanceMiddleware";
import { WatsonAssistantMiddleware } from "./middlewares/WatsonAssistantMiddleware";
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware";
import { LanguageMiddleware } from "./middlewares/LanguageMiddleware";

export class ChatBotAdapter {

  public static getInstance(): BotFrameworkAdapter {
    if (!ChatBotAdapter.instance) {
      ChatBotAdapter.instance = new BotFrameworkAdapter({
        appId: Env.get("MicrosoftAppId", process.env.microsoftAppID),
        appPassword: Env.get("MicrosoftAppPassword", process.env.microsoftAppPassword),
      });

      const botServices = BotServices.getInstance();
      const userState = botServices.get(ServiceTypes.UserState);
      const conversationState = botServices.get(ServiceTypes.ConversationState);
      ChatBotAdapter.instance.use(new ShowTypingMiddleware());
      ChatBotAdapter.instance.use(new AutoSaveStateMiddleware(conversationState));
      ChatBotAdapter.instance.use(new LanguageMiddleware());
      ChatBotAdapter.instance.use(new WatsonAssistantMiddleware(
        BotServices.getInstance().get(ServiceTypes.IBMWatson)
      ));
      ChatBotAdapter.instance.use(new MaintenanceMiddleware());
      ChatBotAdapter.instance.use(new TelemetryMiddleware());
    }
    return ChatBotAdapter.instance;
  }
  private static instance: BotFrameworkAdapter;

  private constructor() { }
}
