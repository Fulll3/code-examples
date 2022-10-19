import { ServiceFactory } from "../../ServiceFactory";
import { WatsonAssistant as WatsonAssistantData } from "../../../data/watson/WatsonAssistant";
import { WatsonAssistant } from "../../../domain/watson/WatsonAssistant";

export class WatsonAssistantDomainFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<void> {/**/}

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<WatsonAssistant> {
    const connector: WatsonAssistantData = constructedServices.get("WatsonAssistant");
    const configuration = constructedServices.get("Configuration");
    return new WatsonAssistant(connector, configuration.confidenceThreshold);
  }
}
