import { ActionTypes, CardFactory, MessageFactory, TurnContext } from "botbuilder-core";
import { ChoiceFactory, ListStyle, PromptOptions, WaterfallStep, WaterfallStepContext } from "botbuilder-dialogs";
import { ActivityTypes, CardAction } from "botbuilder-schema";
import { Activity, Channels } from "botbuilder";
import { setPriority } from "os";
export class HeroCardHelper {
  public static getPromptOptions = (context: TurnContext, choices: (string[] | CardAction[]), text: string, retryPrompt?: string | Partial<Activity>): PromptOptions => {
    if (!retryPrompt) {
      retryPrompt = text;
    }
    let promptOptions: PromptOptions
    if (context.activity.channelId === Channels.Msteams) {
      var card = HeroCardHelper.getHeroCard(choices, text);
      promptOptions = {
        prompt: MessageFactory.attachment(card),
        choices: ChoiceFactory.toChoices(choices),
        style: ListStyle.none,
        retryPrompt: retryPrompt
      }
      return promptOptions;
    } else {
      return promptOptions = {
        prompt: text,
        choices: ChoiceFactory.toChoices(choices),
        style: ListStyle.suggestedAction,
        retryPrompt: retryPrompt
      }
    }
  }

  public static getSuggestedAction = (context: TurnContext, choices: string[], text: string): Partial<Activity> => {
    let reply: Partial<Activity>;
    const channel = context.activity.channelId;
    if (channel === Channels.Msteams) {
      var card = HeroCardHelper.getHeroCard(choices, text);
      reply = { type: ActivityTypes.Message };
      reply.attachments = [card];
      return reply;
    } else {
      reply = ChoiceFactory.suggestedAction(choices, text)
      return reply;
    }
  }

  private static getHeroCard(choices: (string[] | CardAction[]), text: string) {
    let buttons = [];
    if ((typeof choices[0]) === "string") {
      choices.forEach((elem) => {
        buttons.push({ type: ActionTypes.ImBack, title: elem, value: elem });
      });
    } else {
      buttons = choices;
    }

    var card = CardFactory.heroCard("", undefined, buttons, { text });
    return card;
  }

  public static createCardAction = (text: string, displayText: string): CardAction => {
    const cardAction: CardAction = {
      type: ActionTypes.MessageBack,
      title: text,
      value: "",
      displayText,
      text: displayText
    }
    return cardAction
  }
}