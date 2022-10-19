import * as i18n from "i18n";
import { TurnContext } from "botbuilder";
import { UserRepository } from "../data/storage/UserRepository";

export class LocalizedMessages {

  constructor(
    private prefix: string = "",
    private storage: UserRepository,
  ) {
    if (!!prefix) {
      this.prefix = this.prefix + ".";
    }
  }

  public async sendMessage(turnContext: TurnContext, localizationCode: string, data: any[] = []) {
    await turnContext.sendActivity(await this.getTranslation(turnContext, localizationCode, data));
  }

  public async getTranslation(turnContext: TurnContext, id: string, data: any[] = [], locale?: AvailableLanguages): Promise<string> {
    locale = locale ? locale : (await this.storage.get(turnContext)).preferredLang;
    const translationOptions: i18n.TranslateOptions = {
      phrase: this.prefix + id,
      locale,
    };
    
    return i18n.__(translationOptions, ...data);
  }

  public async getTranslationSuggestions(turnContext: TurnContext, id: string, data: any[] = [], locale?: AvailableLanguages, separator:string= ";"): Promise<string[]> {
    locale = locale ? locale : (await this.storage.get(turnContext)).preferredLang;
    const translationOptions: i18n.TranslateOptions = {
      phrase: this.prefix + id,
      locale,
    };
    
    const translation = await i18n.__(translationOptions, ...data);
    return translation.split(separator);
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
}

export const MAIN_LANG: AvailableLanguages = AvailableLanguages.EN;
