import { Activity } from "botbuilder";
import { Event } from "./Event";

export class UserFeedback extends Event {
  constructor(activity: Activity, answerWasHelpful: boolean) {
    super("User_Feedback", activity);
    this.setFeedBackProperties(answerWasHelpful);
  }

  public setFeedBackProperties(answerWasHelpful: boolean): void {
    this.properties.userFeedback = answerWasHelpful ? "positive" : "negative";
  }
}