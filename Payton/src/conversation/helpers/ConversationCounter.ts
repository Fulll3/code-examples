import { Session } from "botbuilder";

export class ConversationCounter {

  //#region Public Methods 
  public static addToCounter(session: Session, messageCode: string) {
    var messageCounter = ConversationCounter.getMessageCounter(session)[messageCode];

    if (!messageCounter) {
      ConversationCounter.getMessageCounter(session)[messageCode] = 1;
    } else {
      ConversationCounter.getMessageCounter(session)[messageCode]++;
    }
  }

  public static deleteCounter(session) {
    session.conversationData.counter = {};
  }

  public static getMessageCount(session: Session, messageCode: string): number {
    var messageCounter = ConversationCounter.getMessageCounter(session)[messageCode];

    return !messageCounter
      ? 0
      : messageCounter;
  }
  //#endregion

  //#region Private Methods 
  private static getMessageCounter(session: Session): any {
    if (!session.conversationData.counter) {
      session.conversationData.counter = {};
    }

    return session.conversationData.counter;
  }
  //#endregion
}