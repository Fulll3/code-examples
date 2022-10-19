import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { MAIN_LANG, AvailableLanguages } from "../../conversation/LocalizedMessages";
import { ScheduleCommands } from "../../conversation/commands/ScheduleCommands";
import { StorageKeys } from "../../conversation/values/StorageKeys";
import { Selectors } from "./IPromptOptions";

export interface IUserEntity {
  preferredLang: AvailableLanguages;
  name: string;
  scheduleCommand: ScheduleCommands;
  selectorIndex: number;
  gatheredValues:GatheredValues;
  isUserFromSiemensEnergy: boolean;
}
type GatheredValues = {
  [key in Selectors]: string

}

const DEFAULT_VALUES: IUserEntity = {
  preferredLang: MAIN_LANG,
  name: null,
  scheduleCommand:null,
  selectorIndex: 0,
  gatheredValues: {robot:"", usecase:"", uknownSelector: ""},
  isUserFromSiemensEnergy: null
}

export class UserRepository {
  private properties: StatePropertyAccessor<IUserEntity>;

  constructor(conversationState: ConversationState) {
    if (!conversationState) {
      throw new Error(`[${UserRepository.name}]: conversation state is mandatory`);
    }
    this.properties = conversationState.createProperty<IUserEntity>(StorageKeys.userInfo);
  }


  public async clear(context: TurnContext, resetIsFromEnergy = false): Promise<void> {
    if(resetIsFromEnergy) {
      return this.properties.set(context, DEFAULT_VALUES);
    } else {
      const defaultValues = DEFAULT_VALUES;
      const currentValues = await this.get(context);
      const isUserFromSiemensEnergy = currentValues.isUserFromSiemensEnergy;
      defaultValues.isUserFromSiemensEnergy = isUserFromSiemensEnergy;
      return this.properties.set(context, defaultValues);
    }
  }

  public get(context: TurnContext): Promise<IUserEntity> {
    return this.properties.get(context,DEFAULT_VALUES );
  }

  public async getName(context: TurnContext): Promise<string> {
    const currentFilters = await this.get(context);
    return currentFilters.name;
  }

  public async getPreferredLang(context: TurnContext): Promise<AvailableLanguages> {
    const currentFilters = await this.get(context);
    return currentFilters.preferredLang;
  }

  public async saveName(context: TurnContext, name: string = null): Promise<void> {
    const currentFilters = await this.get(context);
    currentFilters.name = name;
    return this.properties.set(context, currentFilters);
  }

  public async savePreferredLang(context: TurnContext, language: AvailableLanguages = null): Promise<void> {
    const currentFilters = await this.get(context);
    currentFilters.preferredLang = language;
    return this.properties.set(context, currentFilters);
  }

  public async saveScheduleTopic(context: TurnContext, topic: ScheduleCommands){
    const currentFilters = await this.get(context);
    currentFilters.scheduleCommand = topic;
    return this.properties.set(context, currentFilters);
  }

  public async getScheduleTopic(context: TurnContext): Promise<ScheduleCommands> {
    const currentFilters = await this.get(context);
    return currentFilters.scheduleCommand;
  }

  public async saveSelectorIndex(context: TurnContext, indexNumber: number){
    const currentFilters = await this.get(context);
    currentFilters.selectorIndex = indexNumber;
    return this.properties.set(context, currentFilters);
  }

  public async getSelectorIndex(context: TurnContext): Promise<number> {
    const currentFilters = await this.get(context);
    return currentFilters.selectorIndex;
  }

  public async saveGartheredValue(context: TurnContext, selectorName: Selectors, value: string){
    const currentFilters = await this.get(context);
    currentFilters.gatheredValues[selectorName] = value;
    return this.properties.set(context, currentFilters);
  }

  public async getGartheredValue(context: TurnContext, selectorName: Selectors): Promise<string> {
    const currentFilters = await this.get(context);
    return currentFilters.gatheredValues[selectorName];
  }
  
  public async getRobotNumber(context: TurnContext): Promise<string> {
    const currentFilters = await this.get(context);
    return currentFilters.gatheredValues[Selectors.robot];
  }
  

  public async getUseCaseNumber(context: TurnContext ): Promise<string> {
    const currentFilters = await this.get(context);
    const values =  currentFilters.gatheredValues;
    return values.usecase
  }

  public async saveIsUserFromSiemensEnergy(context: TurnContext, isUserFromSiemensEnergy: boolean){
    const currentFilters = await this.get(context);
    currentFilters.isUserFromSiemensEnergy = isUserFromSiemensEnergy;
    return this.properties.set(context, currentFilters);
  }

  public async getIsUserFromSiemensEnergy(context: TurnContext ): Promise<boolean> {
    const currentFilters = await this.get(context);
    return currentFilters.isUserFromSiemensEnergy;
  }

}
