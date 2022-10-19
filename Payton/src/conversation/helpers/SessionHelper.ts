import { IPromptChoiceOptions, ListStyle, Prompts, Session } from "botbuilder";
import { MetricsManager } from "../metrics/MetricManager";
import { ConversationHistoryManager } from "./ConversationHistoryManager";
import { TableColumnGenerator } from "./TableGenerator";

export class SessionHelper {
  public static sendMessage(session: Session, messageCode: string, ...args: any) {
    var text = session.gettext(messageCode, ...args);
    ConversationHistoryManager.save(session, `bot input: ${text}`);
    MetricsManager.trackBotMessage(session.message.address.conversation.id, text);

    session.send(messageCode, ...args);
  }

  public static sendMessages(session: Session, ...messageCodes: string[]) {
    for (let index = 0; index < messageCodes.length; index++) {
      var text = session.gettext(messageCodes[index]);
      MetricsManager.trackBotMessage(session.message.address.conversation.id, text);
      ConversationHistoryManager.save(session, `bot input: ${text}`);
    }

    for (let index = 0; index < messageCodes.length; index++) {
      session.send(messageCodes[index]);
    }
  }

  public static saveCustomMessageToHistory(session: Session, message: string) {
    MetricsManager.trackBotMessage(session.message.address.conversation.id, message);
    ConversationHistoryManager.save(session, `bot input:\n${message}`);
  }

  public static saveCustomMessageToHistory2(session: Session, message: string) {
    MetricsManager.trackBotMessage(session.message.address.conversation.id, message);
    ConversationHistoryManager.save(session, `bot input: ${message}`);
  }

  public static saveCustomUserAction(session: Session, message: string) {
    ConversationHistoryManager.save(session, `user action: ${message}`);
  }

  public static createChoicePrompt(session: Session, titleCode: string, choicesCodes: string[], maxRetries?: number) {
    this.createChoicePromptAdvanced(
      session,
      titleCode,
      choicesCodes,
      {
        listStyle: ListStyle.button,
        maxRetries: maxRetries
      }
    );
  }

  public static createChoicePromptAdvanced(session: Session, titleCode: string, choicesCodes: string[], options?: IPromptChoiceOptions) {
    var title = session.gettext(titleCode);
    var choices = choicesCodes.map((choice) => session.gettext(choice));
    var tableGenData: Array<string> = [];
    tableGenData.push(title, ...choices.map(choice => `[${choice}]`));
    var customMessage = new TableColumnGenerator(tableGenData).getTableAsString();

    SessionHelper.saveCustomMessageToHistory(session, customMessage);

    Prompts.choice(
      session,
      title,
      choices,
      options
    );
  }
}