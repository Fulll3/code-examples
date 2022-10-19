import { ServiceFactory } from "../ServiceFactory";
import { ChatBotStorage } from "../../data/storage/ChatbotStorage";
import { Storage, UserState } from "botbuilder-core";

export class UserStateFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<Storage> {
    return ChatBotStorage.getInstance();
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<UserState> {
    const storage = await this.resolveServiceRequirements(config);
    return new UserState(storage);
  }
}
