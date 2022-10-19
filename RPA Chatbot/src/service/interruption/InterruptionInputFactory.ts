import { ServiceFactory } from "../ServiceFactory";
import { InterruptionInput } from "../../conversation/InterruptionInput";

export class InterruptionInputFactory extends ServiceFactory {
  protected async resolveServiceRequirements(config: any): Promise<void> {
    /* */
  }

  public async createAndReturnServiceInstance(config: any, constructedServices: Map<string, any>): Promise<InterruptionInput> {
    const appConfig = constructedServices.get("Configuration");
    return new InterruptionInput(
      appConfig.confidenceThreshold,
    );
  }
}
