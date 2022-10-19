import { ChoiceFactory, ComponentDialog, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { ChatbotCommands } from "../commands/ChatbotCommands";
import { UserRepository } from "../../data/storage/UserRepository";
import { DialogStack } from "../DialogStack";
import { LocalizedMessages } from "../LocalizedMessages";
import { HeroCardHelper } from "../HeroCardHelper";

type DialogOptions = {
  watsonDidNotUnderstand: boolean;
  isWelcomeMessage: boolean
}
export class InitialOptionsDialog extends ComponentDialog{
private translator: LocalizedMessages;
  constructor(name: string, private storage: UserRepository){
    super(name)

    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.sendSuggestedOptions.bind(this),
    ]));
    DialogStack.registerDialog(this, this, InitialOptionsDialog.name);
    this.translator =  new LocalizedMessages(InitialOptionsDialog.name,storage );
  }

  private sendSuggestedOptions = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    await this.storage.clear(step.context);
    const options = Object.values(ChatbotCommands);
    const watsonDidNotUnderstand: boolean = step.options ? (<DialogOptions>step.options).watsonDidNotUnderstand : undefined;
    const isWelcomeMessage: boolean = step.options ? (<DialogOptions>step.options).isWelcomeMessage : undefined;
    let message;
    if(watsonDidNotUnderstand){
      message = "I am sorry but I did not understand.\n If you want you can check topics below."
    } else if(isWelcomeMessage) {
      message = await this.translator.getTranslation(step.context, 'intialMesssage');
    }else {
      message = `Let me know if I can help you with anything else.`
    }

    const activity = HeroCardHelper.getSuggestedAction(step.context, options, message);
    await step.context.sendActivity(activity);
    return {
      status: DialogTurnStatus.complete
    }
  }
  public static createDialogOptions = (watsonDidNotUnderstand: boolean, isWelcomeMessage = false) :DialogOptions => {
    return {
      watsonDidNotUnderstand,
      isWelcomeMessage
    }
  }
}