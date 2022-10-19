import { ServiceFactory } from "../../ServiceFactory";
import { WatsonAssistant as WatsonAssistantData } from "../../../data/watson/WatsonAssistant";
import { WatsonAssistant } from "../../../domain/watson/WatsonAssistant";
import { WatsonAssistantQna } from "../../../domain/watson/WatsonAssistantQna";

export class WatsonAssistantQnaDomainFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<void> {/**/}

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<WatsonAssistantQna> {
    const connector: WatsonAssistantData = constructedServices.get("WatsonAssistantQna");
    const configuration = constructedServices.get("Configuration");
    return new WatsonAssistantQna(connector, configuration.confidenceThreshold);
  }
}
