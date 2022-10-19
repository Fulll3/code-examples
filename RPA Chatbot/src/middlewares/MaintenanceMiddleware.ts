import { Middleware, TurnContext } from "botbuilder";
import { LocalizedMessages } from "../conversation/LocalizedMessages";
import { HealthManager } from "../monitoring/health/HealthManager";

export class MaintenanceMiddleware implements Middleware {
  constructor(
    private localizationReponses: LocalizedMessages,
    private botConfig: any,
  ) {
    if (!this.localizationReponses) {
      throw new Error(`[${MaintenanceMiddleware.name}]: constructor localized messages is required`);
    }
  }

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    if (context === null) {
      throw new Error(`[${MaintenanceMiddleware.name}] null context not allowed`);
    }

    if (this.chatBotIsUnhealthy() || this.chatBotIsOff()) {
      await this.localizationReponses.sendMessage(context, "maintenance");
    } else {
      await next();
    }
  }

  private chatBotIsUnhealthy(): boolean {
    return !HealthManager.getInstance().isChatbotHealthy();
  }

  private chatBotIsOff(): boolean {
    return !this.botConfig.alive;
  }
}
