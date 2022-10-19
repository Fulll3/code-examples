import { Logger } from "botanica";
import { IHealthCheckable } from "./IHealthCheckable";
import { IHealthMonitor } from "./IHealthMonitor";

export class HealthManager {
  private readonly timeoutForHealthChecks: number;
  private readonly timeoutBetweenFails: number;
  private readonly handle: NodeJS.Timer;
  private monitors: IHealthMonitor[] = [];
  private logger: Logger = new Logger("HeathManager");

  //#region Initialization 
  constructor(monitors: IHealthMonitor[], timeoutForHealthChecks: number, timeoutBetweenFails?: number) {
    this.timeoutForHealthChecks = timeoutForHealthChecks;
    this.timeoutBetweenFails = timeoutBetweenFails ? timeoutBetweenFails : 5000;
    if (monitors) {
      monitors.forEach(item => {
        this.addMonitor(item);
      });

      this.handle = setInterval(this.checkHealth, this.timeoutForHealthChecks);
    }
  }
  //#endregion

  //#region Public Methods
  public stop() {
    clearInterval(this.handle);
  }

  public async checkHealthManual() {
    return this.checkHealth();
  }

  public static createMonitor(serviceName: string, healthCheckable: IHealthCheckable, isCritical?: boolean): IHealthMonitor {
    return {
      service: healthCheckable,
      serviceName: serviceName,
      isWorking: true,
      isCritical: isCritical
    } as IHealthMonitor;
  }

  public isChatbotHealthy(): boolean {
    return this.monitors.filter(
      monitor => monitor.isCritical
    ).map(
      monitor => monitor.isWorking
    ).every(
      isWorking => isWorking
    );
  }

  public isServiceHealthy(serviceName: string): boolean {
    var monitors = this.monitors.filter(item => item.serviceName == serviceName);

    return monitors.length > 0 && monitors[0].isWorking;
  }
  //#endregion

  //#region Private Methods 
  private addMonitor(monitor: IHealthMonitor) {
    monitor.isWorking = true;
    this.monitors.push(monitor);
  }

  private checkHealth = () => {
    this.monitors.forEach(async (serviceMonitor) => {
      this.logger.debug("%s healthcheck started", serviceMonitor.serviceName);
      var isWorking = await serviceMonitor.service.isHealthy();

      isWorking = await this.checkAgainIfFailed(isWorking, serviceMonitor);
      isWorking = await this.checkAgainIfFailed(isWorking, serviceMonitor); //2

      serviceMonitor.isWorking = isWorking;      //4
      this.logger.debug("%s healthcheck finished. Status: %s", serviceMonitor.serviceName, serviceMonitor.isWorking);//4

      if (!isWorking) {
        this.logger.error("Healtcheck for %s has failed.", serviceMonitor.serviceName);
      }
    });
  }

  private async checkAgainIfFailed(isWorking: boolean, serviceMonitor: IHealthMonitor) {
    if (!isWorking) {
      await this.sleep(this.timeoutBetweenFails);
      isWorking = await serviceMonitor.service.isHealthy();
    }

    return isWorking;
  }

  private sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }
  //#endregion
}