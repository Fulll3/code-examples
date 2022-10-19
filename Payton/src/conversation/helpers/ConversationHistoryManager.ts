import { Session } from "botbuilder";

export class ConversationHistoryManager {
  public static save(session: Session, text: string) {
    ConversationHistoryManager.get(session).push(`[${new Date().toISOString()}] ${text}`);
  }

  public static get(session: Session): Array<string> {
    if (!session.conversationData.history) {
      session.conversationData.history = new Array<string>();
    }

    return session.conversationData.history;
  }

  public static delete(session: Session): void {
    session.conversationData.history = new Array<string>();
    session.save();
  }
}