import { Middleware, TurnContext, Activity, ActivityTypes } from "botbuilder";
import { WatsonAssistant } from "../../domain/watson/WatsonAssistant";
import { IRecognition } from "../../domain/watson/IRecognition";
import { Markup } from "../../monitoring/telemetry/Markup";
import { Telemetry } from "../../monitoring/telemetry/Telemetry";

import { RECOGNITION } from "../watson/WatsonAssistantMiddleware";
import { ActivityExtensions } from "botbuilder-solutions";

export class TelemetryMiddleware implements Middleware {

  constructor(private watson: WatsonAssistant) {
    if (!watson) {
      throw new Error(`[${TelemetryMiddleware.name}]: constructor watson is required`);
    }
  }

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    if (context === null) {
      throw new Error(`[${TelemetryMiddleware.name}] null context not allowed`);
    }

    if (!!context.activity && context.activity.type === ActivityTypes.Message) {
      const recognition = this.watson.getFirstIntentAndEntities(context.turnState.get(RECOGNITION));
      this.onReceiveActivity(
        context.activity,
        recognition,
      );
      context.onSendActivities(async (ctx, activities, nextSend) => {
        activities.forEach(async (activity) => {
          this.onSendActivity(activity);
        });
        return await nextSend();
      });
    }


    if (!!context.activity && ActivityExtensions.isStartActivity(context.activity)) {
      context.onSendActivities(async (ctx, activities, nextSend) => {
        activities.forEach(async (activity) => {
          this.onSendActivity(activity);
        });
        return await nextSend();
      });
    }

    if (next !== null) {
      await next();
    }
  }

  private onReceiveActivity(activity: Activity, intent: IRecognition): void {
    if (activity.type === ActivityTypes.Message) {
      Telemetry.trackUserMessage(activity, intent);
    }
  }

  private onSendActivity(activity: Partial<Activity>): void {
    if (activity.type === ActivityTypes.Message) {
      Telemetry.trackBotMessage(activity);
    }
  }
}
