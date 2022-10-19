import { Activity } from "botbuilder";

export class Event {
  public properties: { [key: string]: string; };

  constructor(public name: string, activity: Activity | Partial<Activity>) {
    if (!name) {
      throw new Error(`[${Event.name}]: Missing parameter, event names are mandatory`);
    }
    this.properties = this.getDefaultProperties(activity);
  }

  public getDefaultProperties(activity: Activity | Partial<Activity>): { [key: string]: string; } {
    return {
      channel: activity.channelId,
      conversationId: activity.conversation.id,
    };
  }
}