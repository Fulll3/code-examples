import { ChoiceFactory } from "botbuilder-dialogs";
import { Activity, Channels } from "botframework-schema";
import { LocalizedMessages } from "../../LocalizedMessages";
import { HeroCardHelper } from "./HeroCardHelper";


export class CustomChoices {

  private choiceRowCounter: number = 0;
  private finalChoicesList: string[][];
  private readonly amountOfChoiceInRow = 4;
  private amountOfRows: number;
  constructor(
  ) {
  }

  public getSuggestedChoicesAsActivity = (
    choices: string[],
    channel: string,
    text: string,
    nextPageString?: string,
    previousPage?: string,
    isMovingToPreviousPage?: boolean,
    isMovingToNextPage?: boolean
  ): Partial<Activity> => {
    const choicesToSend = this.getChoicesToSend(choices, nextPageString, previousPage, isMovingToPreviousPage, isMovingToNextPage);
    if (channel === Channels.Msteams) {
      // send via HeroCard
      return HeroCardHelper.getSuggestedAction(channel, choicesToSend, text);
    } else {
      //send via sugested actions
      return ChoiceFactory.suggestedAction(choicesToSend, text)
    }
  }


  private getChoicesToSend = (choices: string[], nextPage: string, previousPage: string, isMovingToPreviousPage: boolean, isMovingToNextPage: boolean) => {

    this.finalChoicesList = this.getFinalChoices(choices)
    this.amountOfRows = this.finalChoicesList.length;
    if (isMovingToPreviousPage) {
      this.choiceRowCounter--;
    } else if (isMovingToNextPage) {
      this.choiceRowCounter++;
    }
    let choiceListToSend: string[];
    choiceListToSend = this.finalChoicesList[this.choiceRowCounter];


    if (this.choiceRowCounter <= this.amountOfRows) {
      if (this.choiceRowCounter < this.amountOfRows - 1) {
        //there is next row
        choiceListToSend.push(nextPage);
      }
      if (this.choiceRowCounter > 0) {
        choiceListToSend.unshift(previousPage)
      }
      return choiceListToSend;
    }
  }

  private getFinalChoices = (choices: string[]): Array<Array<string>> => {
    let counter = 0;
    let finalChoices: Array<Array<string>> = [];
    let tempArray: string[] = [];
    for (let index = 0; index < choices.length; index++) {
      if (counter > 4) {
        finalChoices.push(tempArray);

        tempArray = []
        tempArray.push(choices[index]);
        counter = 1;
      } else if (index === choices.length - 1) {
        tempArray.push(choices[index]);
        finalChoices.push(tempArray);
      } else {
        tempArray.push(choices[index]);
        counter++;
      }
    }
    return finalChoices;
  }

}