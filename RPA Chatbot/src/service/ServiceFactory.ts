export abstract class ServiceFactory {
  public abstract  createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<any>;
  protected abstract resolveServiceRequirements(config: any): Promise<any>;
}