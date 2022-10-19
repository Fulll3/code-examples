import { Logger } from "botanica";
import { TelemetryClient, Contracts } from "applicationinsights";
import { EventNames } from "./EventNames";
import { Runtime } from "../../Runtime";
import { Activity } from "botbuilder";
import { IUserEnteredDocument } from "../../conversation/interfaces/IUserEnteredDocument";
import { DeliveryAggregate } from "../../domain/values/DeliveryAggregate";
import { FeedbackType } from "./FeedbackType";
import { DialogResult } from "./DialogResult";

export class Telemetry {
  private static client: TelemetryClient;
  private static logger: Logger = new Logger(Telemetry.name);

  public static trackHanaResults(activity: Activity, document: IUserEnteredDocument, results: DeliveryAggregate): void {
    try {
      Telemetry.getTelemetryClient().trackEvent({
        name: EventNames.HanaResults,
        properties: {
          user: activity.from.id,
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          referenceNumber: document.reference,
          referenceType: document.type,
          resultSize: results.size() + "",
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackHanaResult: `, exception);
    }
  }
  public static trackFeedback(activity: Activity, feebackType: FeedbackType,userFeedbackComment: string): void {
    try {
      Telemetry.getTelemetryClient().trackEvent({
        name: EventNames.UserFeedback,
        properties: {
          user: activity.from.id,
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          userFeedback: feebackType,
          userFeedbackComment
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackFeedback: `, exception);
    }
  }

  public static trackConversationFulfillment(activity: Activity, dialogResult: DialogResult): void {
    try {
      Telemetry.getTelemetryClient().trackEvent({
        name: EventNames.ConversationFullfillment,
        properties: {
          user: activity.from.id,
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          dialogResult: dialogResult
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackFeedback: `, exception);
    }
  }

  public static trackUserMessage(activity: Activity, uuid: string): void {
    try {
      Telemetry.getTelemetryClient().trackEvent({
        name: EventNames.UserMessage,
        properties: {
          user: activity.from.id,
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          userMessage: activity.text,
          uuid,
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackUserMessage: `, exception);
    }
  }

  public static trackBotMessage(activity: Partial<Activity>, uuid: string): void {
    try {
      Telemetry.getTelemetryClient().trackEvent({
        name: EventNames.BotMessage,
        properties: {
          channel: activity.channelId,
          conversationId: activity.conversation.id,
          botMessage: activity.text,
          uuid,
        },
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackBotMessage: `, exception);
    }
  }

  public static trackException(activity: Activity, error: Error): void {
    error.message += JSON.stringify({
      channedId: activity.channelId,
      conversation: activity.conversation.id,
      message: activity.text,
    });
    try {
      Telemetry.getTelemetryClient().trackException({
        exception: error,
      });
    } catch (exception) {
      Telemetry.logger.error(`Error trying to trackBotMessage: `, exception);
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
            Telemetry.logger.debug(JSON.stringify(telemetry));
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
