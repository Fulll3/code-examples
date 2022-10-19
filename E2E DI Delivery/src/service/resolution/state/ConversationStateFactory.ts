import { AbstractServiceFactory } from "../AbstractServiceFactory";
import { ChatBotStorage } from "../../../conversation/ChatbotStorage";
import { IExternalService } from "../IExternalService";
import { Storage, ConversationState } from "botbuilder-core";

export class ConversationStateFactory extends AbstractServiceFactory {
  //#region Public
  protected async resolveServiceRequirements(service: IExternalService): Promise<Storage> {
    return ChatBotStorage.getInstance();
  }

  public async createAndReturnServiceInstance(service: any): Promise<ConversationState> {
    const storage = await this.resolveServiceRequirements(service);
    return new ConversationState(storage);
  }
  //#endregion
}
