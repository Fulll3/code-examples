import { Activity } from "botbuilder";
import { IRecognition } from "../../../domain/watson/IRecognition";
import { Event } from "./Event";

export class UserMessage extends Event {
  constructor(activity: Activity, intent: IRecognition) {
    super("User_Message", activity);
    this.setUserMessageProperties(activity, intent);
  }

  public setUserMessageProperties(activity: Activity, intent: IRecognition): void {
    if (!!intent.confidence) {
      this.properties.confidence = intent.confidence.toString();
    }
    if (!!intent.intent) {
      this.properties.intent = intent.intent;
    }
    this.properties.userMessage = activity.text;
    this.properties.conversationId = activity.conversation.id;
    this.properties.user = activity.from.id;
  }
}