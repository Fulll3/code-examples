import { Middleware, TurnContext, Activity, ActivityTypes } from "botbuilder";
import { Telemetry } from "../../monitoring/telemetry/Telemetry";
import { QuestionIdRepository } from "../../data/storage/QuestionIdRepository";

export class TelemetryMiddleware implements Middleware {

  public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
    if (context === null) {
      throw new Error(`[${TelemetryMiddleware.name}] null context not allowed`);
    }
    const uuid = await QuestionIdRepository.getInstance().get(context);
    if (context.activity !== null) {
      const activity = context.activity;
      this.onReceiveActivity(activity, uuid);
    }
    context.onSendActivities(async (ctx, activities, nextSend) => {
      const responses = await nextSend();
      activities.forEach(async (act) => {
        this.onSendActivity(act, uuid);
      });
      return responses;
    });
    if (next !== null) {
      await next();
    }
  }

  private onReceiveActivity(activity: Activity, uuid: string): void {
    if (activity.type === ActivityTypes.Message) {
      Telemetry.trackUserMessage(activity, uuid);
    }
  }

  private onSendActivity(activity: Partial<Activity>, uuid: string): void {
    if (activity.type === ActivityTypes.Message) {
      Telemetry.trackBotMessage(activity, uuid);
    }
  }
}
