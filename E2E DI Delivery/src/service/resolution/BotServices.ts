import { AbstractServiceFactory } from "./AbstractServiceFactory";
import { ServiceTypes } from "./ServiceTypes";
import { UserStateFactory } from "./state/UserStateFactory";
import { ConversationStateFactory } from "./state/ConversationStateFactory";
import { HanaConnectorFactory } from "./hana/HanaConnectorFactory";
import { InterruptionRecognizerFactory } from "./interruption/InterruptionRecognizerFactory";
import { WatsonAssistantFactory } from "./watson/data/WatsonAssistantFactory";
import { ItemOverviewConnectorFactory } from "./itemOverview/ItemOverviewConnectorFactory";

/**
 * Provices instances to external services according to configuration file:
 * config.dev/prod.json
 */

export class BotServices {
  private static instance: BotServices;

  private serviceInstances: Map<string, any> = new Map<string, any>();
  private serviceFactories: Map<string, AbstractServiceFactory> = new Map<string, AbstractServiceFactory>([
    [ServiceTypes.HanaConnector, new HanaConnectorFactory()],
    [ServiceTypes.ConversationState, new ConversationStateFactory()],
    [ServiceTypes.UserState, new UserStateFactory()],
    [ServiceTypes.Interruption, new InterruptionRecognizerFactory()],
    [ServiceTypes.IBMWatson, new WatsonAssistantFactory()],
    [ServiceTypes.ItemOverviewConnector, new ItemOverviewConnectorFactory()]
  ]);

  //#region Initialization
  public static async initalize(configuration: any): Promise<BotServices> {
    if (!BotServices.instance) {
      BotServices.instance = new BotServices();
      if (configuration) {
        await BotServices.instance.init(configuration);
      } else {
        throw new Error("You must provide configuration for chatbot services.");
      }
    }

    return BotServices.getInstance();
  }

  public static getInstance(): BotServices {
    if (!BotServices.instance) {
      throw new Error("BotServices were not properly initialized");
    }

    return BotServices.instance;
  }

  private constructor() { }
  //#endregion

  //#region Public
  public get(service: string): any {
    return this.serviceInstances.get(service);
  }

  public reset(): void {
    BotServices.instance = undefined;
  }
  //#endregion

  //#region Private Methods
  private async init(config: any) {
    this.serviceInstances.set("Configuration", config);
    for (const service of config.services) {
      const factory = this.getFactoryFor(service.name);
      this.serviceInstances.set(service.name, await factory.createAndReturnServiceInstance(service, this.serviceInstances));
    }
    this.serviceInstances.set(ServiceTypes.Configuration, config);
  }

  private getFactoryFor(serviceName: string): AbstractServiceFactory {
    return this.serviceFactories.get(serviceName);
  }
  //#endregion
}