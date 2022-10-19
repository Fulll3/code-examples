import { SecretManager } from "botanica";
import { AbstractServiceFactory } from "../AbstractServiceFactory";
import { IExternalService } from "../IExternalService";
import { HanaConnector } from "../../../data/hana/HanaConnector";
import { ItemOverviewConnectorSimple } from "../../../domain/itemOverview/ItemOverviewConnectorSimple";
import { ItemOverviewConnector } from "../../../data/itemOverview/ItemOverviewConnector";

export class ItemOverviewConnectorFactory extends AbstractServiceFactory {

  //#region Private
  private secretManager = new SecretManager();
  //#endregion

  //#region Public
  protected async resolveServiceRequirements(service: any): Promise<IExternalService> {
    const itemOverviewEndpoint = await this.secretManager.getSecret(service.itemOverviewEndpoint);
    const myIdEndpoint = await this.secretManager.getSecret(service.myIdEndpoint);
    const myidClientId = await this.secretManager.getSecret(service.myidClientId);
    const myidKey = await this.secretManager.getSecret(service.myidKey);
    const myidPassphrase = await this.secretManager.getSecret(service.myidPassphrase);
    const myidCert = await this.secretManager.getSecret(service.myidCert);
    return {
      type: service.type,
      name: service.name,
      itemOverviewEndpoint,
      myIdEndpoint,
      myidClientId,
      myidKey,
      myidPassphrase,
      myidCert
    } as IExternalService;
  }

  public async createAndReturnServiceInstance(service: any): Promise<ItemOverviewConnectorSimple> {
    const credentials: any = await this.resolveServiceRequirements(service);
    const itemOverviewConnector = new ItemOverviewConnector(
      credentials.itemOverviewEndpoint,
      credentials.myIdEndpoint,
      credentials.myidClientId,
      credentials.myidKey,
      credentials.myidPassphrase,
      credentials.myidCert
    )
    return new ItemOverviewConnectorSimple(
      itemOverviewConnector
    );
  }
  //#endregion
}
