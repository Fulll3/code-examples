import { ServiceFactory } from "../ServiceFactory";
import { ChatBotStorage } from "../../data/storage/ChatbotStorage";
import { Storage, ConversationState } from "botbuilder-core";

export class ConversationStateFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<Storage> {
    return ChatBotStorage.getInstance();
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<ConversationState> {
    const storage = await this.resolveServiceRequirements(config);
    return new ConversationState(storage);
  }
}
