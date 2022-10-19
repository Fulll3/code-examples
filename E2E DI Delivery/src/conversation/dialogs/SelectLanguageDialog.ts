import { TurnContext } from "botbuilder-core";
import { ChoicePrompt, ComponentDialog, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { LanguageRepository } from "../../data/storage/LanguageRepository";
import { AvailableLanguages, LocalizedMessages } from "../LocalizedMessages";
import { LANGUAGE } from "../middlewares/LanguageMiddleware";
import { DialogNames } from "../values/DialogNames";
import { PromptNames } from "../values/PromptNames";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { IRestartDialogOptions } from "./RestartDialog";

export class SelectLanguageDialog extends ComponentDialog {
  private localizationReponses: LocalizedMessages;
  private langRepository: LanguageRepository;
  private readonly EN = "English";
  private readonly NL = "Dutch"
  private readonly FLEMISCH = "Flemisch"
  private readonly ES = "Spanisch"
  private readonly IT = "Italian"
  private readonly FR = "French"
  private readonly DE = "German"


  constructor() {
    super(SelectLanguageDialog.name);
    this.localizationReponses = new LocalizedMessages(SelectLanguageDialog.name);
    this.langRepository = LanguageRepository.getInstance();
    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.checkIfLanguageIsAreadySet.bind(this),
      this.promptForLang.bind(this),
      this.saveLang.bind(this)
    ]))
      .addDialog(new ChoicePrompt(PromptNames.choicePrompt))
  }
  private checkIfLanguageIsAreadySet = async (step: WaterfallStepContext) => {
    const options: IRestartDialogOptions =  step.options;
    if(options?.forceRestart) {
      return await step.next()
    }
    const userLang = await this.langRepository.getLang(step.context);
    if (userLang) {
      return step.endDialog();
    } else {
      return await step.next()
    }
  }
  private promptForLang = async (step: WaterfallStepContext) => {
    const choices = [this.EN, this.DE, this.NL, this.FLEMISCH, this.ES, this.IT, this.FR];

    const options = await HeroCardHelper.getPromptOptions(step, choices, "Please select in which language you want to proceed.");
    return await step.prompt(PromptNames.choicePrompt, options);
  }

  private saveLang = async (step: WaterfallStepContext) => {
    switch (step.context.activity.text) {
      case this.EN:
        this.setLanguageToTurnState(step.context, AvailableLanguages.EN)
        await this.langRepository.saveLang(step.context, AvailableLanguages.EN);
        break;
      case this.IT:
        this.setLanguageToTurnState(step.context, AvailableLanguages.IT)
        await this.langRepository.saveLang(step.context, AvailableLanguages.IT);
        break;
      case this.NL:
        this.setLanguageToTurnState(step.context, AvailableLanguages.NL)
        await this.langRepository.saveLang(step.context, AvailableLanguages.NL);
        break;
      case this.ES:
        this.setLanguageToTurnState(step.context, AvailableLanguages.ES)
        await this.langRepository.saveLang(step.context, AvailableLanguages.ES);
        break;
      case this.FLEMISCH:
        this.setLanguageToTurnState(step.context, AvailableLanguages.Flemisch)
        await this.langRepository.saveLang(step.context, AvailableLanguages.Flemisch);
        break;
      case this.FR:
        this.setLanguageToTurnState(step.context, AvailableLanguages.FR)
        await this.langRepository.saveLang(step.context, AvailableLanguages.FR);
        break;
      case this.DE:
        this.setLanguageToTurnState(step.context, AvailableLanguages.DE)
        await this.langRepository.saveLang(step.context, AvailableLanguages.DE);
        break;
    }
    return await step.endDialog()
  }

  private setLanguageToTurnState = (turnContext: TurnContext, lang: AvailableLanguages) => {
    turnContext.turnState.set(LANGUAGE, lang)
  }
}