import { Logger } from "botanica";
import { Runtime } from "../../Runtime";
import { Activity } from "botbuilder";
import { BotMessage } from "./events/BotMessage";
import { UserMessage } from "./events/UserMessage";
import { IRecognition } from "../../domain/watson/IRecognition";
import { UserFeedback } from "./events/UserFeedback";
import { TelemetryClient, Contracts } from "applicationinsights";

export class Telemetry {
  private static client: TelemetryClient;
  private static logger: Logger = new Logger(Telemetry.name);

  public static trackFeedback(activity: Activity, answerWasHelpful: boolean): void {
    try {
      Telemetry
        .getTelemetryClient()
        .trackEvent(new UserFeedback(activity, answerWasHelpful));
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackFeedback: `, exception);
    }
  }

  public static trackUserMessage(activity: Activity, intent: IRecognition): void {
    try {
      Telemetry
        .getTelemetryClient()
        .trackEvent(new UserMessage(activity, intent));
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackUserMessage: `, exception);
    }
  }

  public static trackBotMessage(activity: Partial<Activity>): void {
    try {
      Telemetry
        .getTelemetryClient()
        .trackEvent(new BotMessage(activity));
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackBotMessage: `, exception);
    }
  }

  public static trackException(activity: Activity, error: Error): void {
    try {
      Telemetry.getTelemetryClient().trackException({
        exception: error,
        properties: {
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          message: activity.text,
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackException: `, exception);
    }
  }

  public static trackTimeout(activity: Activity): void {
    try {
      Telemetry.getTelemetryClient().trackTrace({
        message: `Timeout in channel ${activity.channelId}: Bot took too long to respond`,
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackTimeout: `, exception);
    }
  }

  private static getTelemetryClient(): TelemetryClient {
    if (Runtime.isLocal()) {
      if (!Telemetry.client) {
        /* For easier local dev debugging: */
        /* Telemetry.logger.debug(JSON.stringify(telemetry, null, 4)); */
        // tslint:disable-next-line: max-classes-per-file
        Telemetry.client = new (class LocalTelemetryClient {
          public trackEvent(telemetry: Contracts.EventTelemetry): void {
            Telemetry.logger.debug(JSON.stringify(telemetry));
          }
          public trackException(telemetry: Contracts.ExceptionTelemetry): void {
            Telemetry.logger.error(JSON.stringify(telemetry));
          }
          public trackTrace(telemetry: Contracts.TraceTelemetry): void {
            Telemetry.logger.debug(JSON.stringify(telemetry));
          }
        })() as TelemetryClient;
      }
    } else {
      if (!Telemetry.client) {
        Telemetry.client = new TelemetryClient();
      }
    }
    return Telemetry.client;
  }
}
