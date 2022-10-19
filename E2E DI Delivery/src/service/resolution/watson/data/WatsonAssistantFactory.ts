import { AbstractServiceFactory } from "../../AbstractServiceFactory";
import { SecretManager } from "botanica";
import { WatsonAssistant } from "../../../../data/nlu/watson/WatsonAssistant";

export class WatsonAssistantFactory extends AbstractServiceFactory {
  private secretManager: SecretManager;

  constructor() {
    super();
    this.secretManager = new SecretManager();
  }

  protected async resolveServiceRequirements(config: any): Promise<{
    version: string,
    apiKey: string,
    url: string,
    assistantId: string,
  }> {
    return {
      version: await this.secretManager.getSecret(config.version),
      apiKey: await this.secretManager.getSecret(config.apiKey),
      url: await this.secretManager.getSecret(config.url),
      assistantId: await this.secretManager.getSecret(config.assistantId),
    };
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<WatsonAssistant> {
    const requirements = await this.resolveServiceRequirements(config);
    return new WatsonAssistant(
      requirements.version,
      requirements.apiKey,
      requirements.url,
      requirements.assistantId,
      constructedServices.get("Configuration").confidenceThreshold
    );
  }
}
