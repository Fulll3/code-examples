import { ChoicePrompt, ComponentDialog, ConfirmPrompt, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { DialogNames } from "../values/DialogNames";
import { PromptNames } from "../values/PromptNames";
import { LocalizedMessages } from "../LocalizedMessages";
import { WelcomeDialog } from "./WelcomeDialog";
import { Runtime } from "../../Runtime";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { DialogUtil } from "./helpers/DialogUtil";
import { SelectLanguageDialog } from "./SelectLanguageDialog";

export interface IRestartDialogOptions {
  forceRestart?: boolean;
}


export class RestartDialog extends ComponentDialog {
  private localizationReponses: LocalizedMessages;

  constructor() {
    super(RestartDialog.name);
    this.localizationReponses = new LocalizedMessages(RestartDialog.name);

    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.askUserForConfirmation.bind(this),
      this.finalStep.bind(this),
    ]))
    .addDialog(new ChoicePrompt(PromptNames.choicePrompt))
  }

  private askUserForConfirmation = async (step: WaterfallStepContext) => {
    const options: IRestartDialogOptions =  step.options;
    if(options?.forceRestart) {
      return await step.next(options);
    } else {
      return await HeroCardHelper.sendConfirmPrompt(step, this.localizationReponses.getTranslation(step.context,"askForConfirmation"));
    }
  }

  private finalStep = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options: IRestartDialogOptions =  step.options;
    if(options?.forceRestart) {
      await step.parent.cancelAllDialogs();
      return await step.replaceDialog(SelectLanguageDialog.name, options);
    }
    const yesTranslated = await DialogUtil.getInstance().getYesNoOptions(step.context)[0];
    if (step.context.activity.text === yesTranslated) {
      await step.parent.cancelAllDialogs();
      //DIRTY solution copied code TODO refactor
      const choices = DialogUtil.getInstance().getInitialOptionsLocalized(step.context);
      const channel = step.context.activity.channelId;
      const activity = HeroCardHelper.getSuggestedAction(channel, choices, await this.localizationReponses.getTranslation(step.context,"promptUserForDocumentType"))
      await step.context.sendActivity(activity);
      return {
        status: DialogTurnStatus.complete
      }
    } else {
      await this.localizationReponses.sendMessage(step.context, "userRejected");
      return await step.endDialog();
    }
  }
}