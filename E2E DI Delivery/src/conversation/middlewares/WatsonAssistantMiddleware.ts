import { Middleware, TurnContext, ActivityTypes } from "botbuilder";
import { WatsonAssistant } from "../../data/nlu/watson/WatsonAssistant";


export class WatsonAssistantMiddleware implements Middleware {
  constructor( private watson: WatsonAssistant) {
    if (!watson) {
      throw new Error(`[${WatsonAssistantMiddleware.name}]: constructor watson is required`);
    }
  }

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    try {
      console.log(`activity type: ${context.activity.type}`)
      if (context.activity.type === ActivityTypes.Message) {
        console.log(`calling recognize`)
        context.turnState.set(RECOGNITION, await this.watson.recognize(context));
      }
    } catch (error) {
      console.log(JSON.stringify(`Telemetry Middleware error: ${JSON.stringify(error)}`))
      context.turnState.set(RECOGNITION, null);
    }
    await next();
  }
}
export const RECOGNITION = "meaning";
