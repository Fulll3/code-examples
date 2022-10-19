import { IExternalService } from "./IExternalService";

export abstract class AbstractServiceFactory {
  public abstract createAndReturnServiceInstance(service: any, availableServiceInstances: Map<string, any>): Promise<any>;
  protected abstract resolveServiceRequirements(service: any): Promise<any>;
}