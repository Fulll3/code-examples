import { Middleware, TurnContext, ActivityTypes, StatePropertyAccessor } from "botbuilder";
import { LanguageRepository } from "../../data/storage/LanguageRepository";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { AvailableLanguages } from "../LocalizedMessages";


export class LanguageMiddleware implements Middleware {
  private langRepository: LanguageRepository;

  constructor() {
    this.langRepository = LanguageRepository.getInstance()
  };

  public onTurn = async (context: TurnContext, next: () => Promise<void>): Promise<void> => {
    const selectedLanguage = await this.langRepository.getLang(context);
    const lang = selectedLanguage ? selectedLanguage : AvailableLanguages.EN;
    context.turnState.set(LANGUAGE, lang);
    await next();
  }
}

export const LANGUAGE = "selectedLanguage"