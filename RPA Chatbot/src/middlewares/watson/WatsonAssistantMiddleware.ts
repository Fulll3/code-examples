import { Middleware, TurnContext, ActivityTypes } from "botbuilder";
import { WatsonAssistant } from "../../domain/watson/WatsonAssistant";
import { UserRepository } from "../../data/storage/UserRepository";

export class WatsonAssistantMiddleware implements Middleware {
  constructor(private conversationState: UserRepository, private watson: WatsonAssistant) {
    if (!conversationState) {
      throw new Error(`[${WatsonAssistantMiddleware.name}]: constructor conversationState is required`);
    }
    if (!watson) {
      throw new Error(`[${WatsonAssistantMiddleware.name}]: constructor watson is required`);
    }
  }

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    try {
      if (context.activity.type === ActivityTypes.Message) {
        const language = (await this.conversationState.get(context)).preferredLang;
        context.turnState.set(RECOGNITION, await this.watson.getAssistantOutput(context.activity.text, language));
      }
    } catch (error) {
      context.turnState.set(RECOGNITION, null);
    }
    await next();
  }
}

export const RECOGNITION = "meaning";
export const SELECTOR = "Selector";
