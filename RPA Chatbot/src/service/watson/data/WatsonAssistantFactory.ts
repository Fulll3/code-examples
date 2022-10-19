import { ServiceFactory } from "../../ServiceFactory";
import { SecretManager } from "botanica";
import { WatsonAssistant } from "../../../data/watson/WatsonAssistant";

export class WatsonAssistantFactory extends ServiceFactory {
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
    );
  }
}
