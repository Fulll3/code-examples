import { WaterfallStep, WaterfallStepContext } from "botbuilder-dialogs";
import { CustomChoices } from "./CustomChoises";

export class CustomChoicesFactory {
  private factory: CustomChoicesFactory;
  private lookUpList = {};

  private static instance: CustomChoicesFactory;

  public static getInstance(): CustomChoicesFactory {
    if (!CustomChoicesFactory.instance) {
      CustomChoicesFactory.instance = new CustomChoicesFactory();
    }

    return CustomChoicesFactory.instance;
  }

  private addRecordToLookUpList = (conversationId: string, object: CustomChoices) => {
    const lookUpList = CustomChoicesFactory.getInstance().lookUpList;
    lookUpList[conversationId] = object
    CustomChoicesFactory.getInstance().lookUpList = lookUpList;

  }

  public static setCustomChoices = (step: WaterfallStepContext) => {
    CustomChoicesFactory.getInstance().addRecordToLookUpList(
      step.context.activity.conversation.id,
      new CustomChoices()
    )
  }

  public static getCustomChoices = (step: WaterfallStepContext): CustomChoices => {
    const customChoices = CustomChoicesFactory.getInstance().lookUpList[step.context.activity.conversation.id];
    if(customChoices == undefined) {
      CustomChoicesFactory.setCustomChoices(step);
    }
    return  CustomChoicesFactory.getInstance().lookUpList[step.context.activity.conversation.id];
  }


}