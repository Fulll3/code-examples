import { SecretManager } from "botanica";
import { AbstractServiceFactory } from "../AbstractServiceFactory";
import { IExternalService } from "../IExternalService";
import { HanaConnector } from "../../../data/hana/HanaConnector";

export class HanaConnectorFactory extends AbstractServiceFactory {

  //#region Private
  private secretManager = new SecretManager();
  //#endregion

  //#region Public
  protected async resolveServiceRequirements(service: any): Promise<IExternalService> {
    const hanaUsername = await this.secretManager.getSecret(service.user);
    const hanaPassword = await this.secretManager.getSecret(service.password);
    const hanaEndpoint = await this.secretManager.getSecret(service.url);

    return {
      type: service.type,
      name: service.name,
      user: hanaUsername,
      password: hanaPassword,
      endpoint: hanaEndpoint,
    } as IExternalService;
  }

  public async createAndReturnServiceInstance(service: any): Promise<HanaConnector> {
    const credentials: any = await this.resolveServiceRequirements(service);

    return new HanaConnector(
      credentials.user,
      credentials.password,
      credentials.endpoint,
    );
  }
  //#endregion
}
