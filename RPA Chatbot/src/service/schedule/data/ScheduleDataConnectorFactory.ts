import { SecretManager } from "botanica";
import { ScheduleDataConnector } from "../../../data/schedule/ScheduleDataConnector";
import { ServiceFactory } from "../../ServiceFactory";

export class ScheduleDataConnectorFactory extends ServiceFactory {
  private secretManager: SecretManager;

  constructor() {
    super();
    this.secretManager = new SecretManager();
  }

  protected async resolveServiceRequirements(config: any): Promise<{
    host: string;
    azureKey: string;
    cert: string;
    key: string;
    passphrase: string;
  }> {
    return {
      host: await this.secretManager.getSecret(config.host),
      azureKey: await this.secretManager.getSecret(config.azureKey),
      cert: await this.secretManager.getSecret(config.cert),
      key: await this.secretManager.getSecret(config.key),
      passphrase: await this.secretManager.getSecret(config.passphrase),
    };
  }

  public async createAndReturnServiceInstance(
    config: any,
    constructedServices: Map<string, any>
  ): Promise<ScheduleDataConnector> {
    const requirements = await this.resolveServiceRequirements(config);
    return new ScheduleDataConnector(
      requirements.host,
      requirements.azureKey,
      requirements.cert,
      requirements.key,
      requirements.passphrase
    );
  }
}
