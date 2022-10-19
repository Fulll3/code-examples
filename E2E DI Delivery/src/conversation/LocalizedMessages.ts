import * as i18n from "i18n";
import { TurnContext } from "botbuilder";
import { LANGUAGE } from "./middlewares/LanguageMiddleware";

export class LocalizedMessages {

  constructor(
    private prefix: string = "",
  ) {
    if (!!prefix) {
      this.prefix = this.prefix + ".";
    }
  }

  public async sendMessage(turnContext: TurnContext, localizationCode: string, data: any[] = []) {
    await turnContext.sendActivity(await this.getTranslation(turnContext, localizationCode, data));
  }

  public getTranslation(turnContext: TurnContext,id: string, data: any[] = []): string {
    const locale = this.getLocale(turnContext);
    const translationOptions: i18n.TranslateOptions = {
      phrase: this.prefix + id,
      locale,
    };
    return i18n.__(translationOptions, ...data);
  }
  private getLocale(turnContext: TurnContext) {
    const selectedLang = turnContext.turnState.get(LANGUAGE);
    const locale = selectedLang ? selectedLang : AvailableLanguages.EN;
    return locale;
  }

  public getTranslationChoices(turnContext: TurnContext,id: string, data: any[] = []): string[] {
    const locale = this.getLocale(turnContext);
    const translationOptions: i18n.TranslateOptions = {
      phrase: this.prefix + id,
      locale,
    };
    const translatedText = i18n.__(translationOptions, ...data);
    const choices = translatedText.split(";");
    return choices;
  }
  public mapKeyToLanguage(language: AvailableLanguages): string {
    switch (language) {
      case AvailableLanguages.EN:
        return "English";
      default:
        throw new Error(`[${LocalizedMessages.name}]: Cannot set the locale to a language not supported`);
    }
  }
}

export enum AvailableLanguages {
  EN = "en",
  ES = "es",
  IT = "it",
  NL = "nl",
  Flemisch = "nl-rBE",
  FR = "fr",
  DE = "de"
}

export const MAIN_LANG: AvailableLanguages = AvailableLanguages.EN;
