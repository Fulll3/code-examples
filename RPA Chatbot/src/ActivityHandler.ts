import { ActivityHandler as BotFrameworkActivityHandler } from "botbuilder";
import { TurnContext, EndOfConversationCodes } from "botbuilder";
import { DialogSet, DialogContext } from "botbuilder-dialogs";
import { LocalizedMessages } from "./conversation/LocalizedMessages";
import { Conversation } from "./Conversation";
import { Telemetry } from "./monitoring/telemetry/Telemetry";
import { Services } from "./service/Services";
import { Logger } from "botanica";

/**
 * This is our custom activity handler that is reponsible for initiating
 * the conversation context storage, starting the dialog stack and
 * handling exceptional erros that should be logged for future improvement.
 */
export class ActivityHandler extends BotFrameworkActivityHandler {
  private readonly handlerMessages: LocalizedMessages;
  private readonly dialogs: DialogSet;
  private logger = new Logger(ActivityHandler.name)

  constructor() {
    super();
    this.dialogs = new DialogSet(
      Services.instance()
        .get("ConversationState")
        .createProperty("voicebot-dialog-stack"),
    );
    this.dialogs.add(new Conversation());
    this.handlerMessages = new LocalizedMessages(
      "Handlers",
      Services.instance().get("UserRepository"),
    );
    this.onTurn(this.turn.bind(this));
  }

  public async turn(turnContext: TurnContext, next: () => Promise<void>): Promise<any> {
    let dc: DialogContext;

    try {
      if (turnContext.activity.code === EndOfConversationCodes.BotTimedOut) {
        Telemetry.trackTimeout(turnContext.activity);
      } else { // handle user message
        dc = await this.dialogs.createContext(turnContext);
        if (dc.activeDialog !== undefined) {
          await dc.continueDialog();
        } else {
          await dc.beginDialog(Conversation.name);
        }
      }
    } catch (error) {
      error = new Error(
        `Exception not caught: ${JSON.stringify(error)}, ` +
        `Current dialog stack: ${JSON.stringify(dc.stack)}`,
      );
      await this.handlerMessages.sendMessage(turnContext, "uncaught");
      this.logger.error(JSON.stringify(error));
      Telemetry.trackException(turnContext.activity, error);
      if (!!dc) {
        await dc.cancelAllDialogs();
      }
    } finally {
      await next();
    }
  }
}