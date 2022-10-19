import { AbstractServiceFactory } from "../AbstractServiceFactory";
import { ChatBotStorage } from "../../../conversation/ChatbotStorage";
import { IExternalService } from "../IExternalService";
import { Storage, UserState } from "botbuilder-core";

export class UserStateFactory extends AbstractServiceFactory {
  //#region Public
  protected async resolveServiceRequirements(service: IExternalService): Promise<Storage> {
    return ChatBotStorage.getInstance();
  }

  public async createAndReturnServiceInstance(service: any): Promise<UserState> {
    const storage = await this.resolveServiceRequirements(service);
    return new UserState(storage);
  }
  //#endregion
}
