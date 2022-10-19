import { Activity } from "botbuilder";
import { Event } from "./Event";
import { Markup } from "../Markup";
import { TableColumnGenerator } from "../TableColumnGenerator";

export class BotMessage extends Event {
  constructor(activity: Partial<Activity>) {
    super("Bot_Message", activity);
    this.setBotMessageProperties(activity);
  }

  public setBotMessageProperties(activity: Partial<Activity>): void {
    let botMessage = activity.text;
    if (activity.suggestedActions) {
      botMessage = this.getSuggestedActionAsText(activity);
    } else if (this.isHeroCard(activity)) {
      botMessage = this.getHeroCardAsText(activity);
    }
    this.properties.botMessage = botMessage
  }
  private getSuggestedActionAsText = (activity) => {
    const column = activity.suggestedActions.actions.map((action) => `[${action.title}]`);
    column.unshift(activity.text);
    return new TableColumnGenerator(column).getTableAsString()
  }

  private getHeroCardAsText = (activity: Partial<Activity>): string => {
    const heroCardAttachment = this.getHeroCardFromActivity(activity);
    const column = heroCardAttachment.content.buttons.map((button) => `[${button.title}]`);
    column.unshift(heroCardAttachment.content.text);
    return new TableColumnGenerator(column).getTableAsString();
  }
  private isHeroCard = (activity: Partial<Activity>) => {
    if (activity.attachments && activity.attachments.length > 0) {
      return !!this.getHeroCardFromActivity(activity);
    }
    return false;
  }

  private getHeroCardFromActivity = (activity: Partial<Activity>) => {
    return activity.attachments.find((attachment) => {
      console.log(attachment.content.contentType)
      return attachment.contentType === 'application/vnd.microsoft.card.hero'
    });
  }
}