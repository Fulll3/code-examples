import { Logger } from "botanica";
import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder-core";
import { AvailableLanguages } from "../../conversation/LocalizedMessages";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { UserDataRepository } from "./UserDataRepository";

type LanguageRepositoryType = {
  lang: AvailableLanguages;
};


export class LanguageRepository {
  private static instance: LanguageRepository;
  private userRepositoryAccessor: StatePropertyAccessor<LanguageRepositoryType>;
  private logger: Logger;
  private userState: ConversationState;
  public static getInstance(): LanguageRepository {
    if (!LanguageRepository.instance) {
      LanguageRepository.instance = new LanguageRepository();
    }
    return LanguageRepository.instance;
  }

  private constructor() {
    this.userState = BotServices.getInstance().get(
      ServiceTypes.ConversationState
    );
    this.userRepositoryAccessor = this.userState.createProperty(
      StatePropertyAccessorNames.languageData
    );
    this.logger = new Logger(UserDataRepository.name);
  }

  public async save(
    context: TurnContext,
    data: LanguageRepositoryType
  ): Promise<void> {
     await this.userRepositoryAccessor.set(context, data);
     return this.userState.saveChanges(context, false);
  }

  public async get(context: TurnContext): Promise<LanguageRepositoryType> {
    const data = await this.userRepositoryAccessor.get(context, {
      lang: null,
    });
    return data;

  }

  public saveLang = async (
    context: TurnContext,
    lang: AvailableLanguages
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.lang = lang;
    return await this.save(context, savedData);
  };

  public getLang = async (
    context: TurnContext
  ): Promise<AvailableLanguages> => {
    const savedData = await this.get(context);
    return savedData.lang;
  };


}