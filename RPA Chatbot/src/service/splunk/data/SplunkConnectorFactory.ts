import { SecretManager } from "botanica";
import { SplunkConnector } from "../../../data/splunk/SplunkConnector";
import { ServiceFactory } from "../../ServiceFactory";

export class SplunkConnectorFactory extends ServiceFactory {
  private secretManager: SecretManager;
 
  constructor() {
    super();
    this.secretManager = new SecretManager();
  }

  protected async resolveServiceRequirements(config: any): Promise<{
    host: string,
    token:string
  }> {
    return {
      host: await this.secretManager.getSecret(config.host),
      token: await this.secretManager.getSecret(config.token),
    };
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<SplunkConnector> {
    const requirements = await this.resolveServiceRequirements(config);
    return new SplunkConnector(
      requirements.token,
      requirements.host
    );
  }
}