import { ServiceFactory } from "../ServiceFactory";
import { UserRepository } from "../../data/storage/UserRepository";

export class UserRepositoryFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<void> {
    /* */
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<UserRepository> {
    return new UserRepository(constructedServices.get("ConversationState"));
  }
}
