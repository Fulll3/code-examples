// tslint:disable: variable-name
import { Logger } from "botanica";
import { ServiceFactory } from "./ServiceFactory";

/**
 * Provices access and construction of classes that should be complex to create,
 * makes it easy to create once and recover where needed.
 *
 * It loads config.dev/prod.json to get information about classes construction
 */
export class Services {
  private static primedInstance: Services;
  private logger = new Logger(Services.name)
  private serviceInstances: Map<string, any> = new Map<string, any>();

  public static async init(configuration: any): Promise<Services> {
    if (!Services.primedInstance) {
      Services.primedInstance = new Services();
      if (configuration) {
        await Services.primedInstance.init(configuration);
      } else {
        throw new Error(`[${Services.name}]: You must provide configuration for chatbot services.`);
      }
    }

    return Services.instance();
  }

  public static instance(): Services {
    if (!Services.primedInstance) {
      throw new Error(`[${Services.name}]: BotServices were not properly initialized`);
    }
    return Services.primedInstance;
  }

  private constructor() { }

  public get(service: string): any {
    return this.serviceInstances.get(service);
  }

  public reset(): void {
    Services.primedInstance = undefined;
  }

  private async init(config: any) {
    this.serviceInstances.set("Configuration", config);
    this.logger.debug(`configuration: ${JSON.stringify(config)}`)
    for (const service of config.services) {
      this.logger.debug(`initializing service: ${service.name}`);
      const factory = this.getConfiguredFactory(service.factory);
      this.serviceInstances.set(service.name, await factory.createAndReturnServiceInstance(service, this.serviceInstances));
    }
  }

  private getConfiguredFactory(factoryPath: string): ServiceFactory {
    const factoryPathParts = factoryPath.split("/");
    const factoryName = factoryPathParts[factoryPathParts.length - 1];
    const factoryModule = require("./" + factoryPath);
    return new factoryModule[factoryName]();
  }
}