import { Middleware, TurnContext } from "botbuilder";
import { LocalizedMessages } from "../LocalizedMessages";
import { HealthManager } from "../../monitoring/health/HealthManager";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";

export class MaintenanceMiddleware implements Middleware {
  private localizationReponses: LocalizedMessages;

  constructor() {
    this.localizationReponses = new LocalizedMessages(MaintenanceMiddleware.name);
  }

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    if (context === null) {
      throw new Error(`[${MaintenanceMiddleware.name}] null context not allowed`);
    }

    if (this.chatBotIsUnhealthy() || this.chatBotIsOff()) {
      await this.localizationReponses.sendMessage(context, "hanaErrorMessage");
      await next();
    } else {
      await next();
    }
  }

  private chatBotIsUnhealthy(): boolean {
    return !HealthManager.getInstance().isChatbotHealthy();
  }

  private chatBotIsOff(): boolean {
    return !BotServices.getInstance().get(ServiceTypes.Configuration).Alive;
  }
}
