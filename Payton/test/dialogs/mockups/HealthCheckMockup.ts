import { HealthManager } from "../../../src/core/healthManager/HealthManager";

export class HealthCheckMockup extends HealthManager {
  constructor() {
    super(undefined, undefined);
  }

  public isServiceHealthy(serviceName: string): boolean {
    return true;
  }
}