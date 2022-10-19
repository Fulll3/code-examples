import { Logger } from "botanica";
import { IHealthCheckable } from "./IHealthCheckable";
import { IHealthMonitor } from "./IHealthMonitor";
import { Runtime } from "../../Runtime";

export class HealthManager {
  private readonly handle: NodeJS.Timer;
  private monitors: IHealthMonitor[] = [];
  private logger: Logger = new Logger("HeathManager");
  private static instance: HealthManager;

  public static getInstance(monitors: IHealthMonitor[] = null, timeoutForHealthChecks: number = 300000): HealthManager {
    if (!HealthManager.instance) {
      HealthManager.instance = new HealthManager(monitors, timeoutForHealthChecks);
    }

    return HealthManager.instance;
  }

  //#region Initialization
  private constructor(monitors: IHealthMonitor[] = null, timeoutForHealthChecks: number = 300000) { // 5 minutes
    if (!!timeoutForHealthChecks && timeoutForHealthChecks < 60000) {
      throw new Error(`[${HealthManager.name}]: timeout too short`);
    }
    if (Runtime.isLocal()) {
      timeoutForHealthChecks = 60000; // one minute
    }
    if (monitors) {
      monitors.forEach(item => { this.addMonitor(item); });
    }
    this.handle = setInterval(() => {
      this.checkHealth();
    }, timeoutForHealthChecks);
  }
  //#endregion

  //#region Public Methods
  public stop() {
    clearInterval(this.handle);
  }

  public async checkHealthManual() {
    this.checkHealth();
  }

  public static createMonitor(serviceName: string, healthCheckable: IHealthCheckable, isCritical?: boolean): IHealthMonitor {
    return {
      service: healthCheckable,
      isWorking: true,
      serviceName,
      isCritical,
    } as IHealthMonitor;
  }

  public isChatbotHealthy(): boolean {
    return this.monitors
      .filter(monitor => monitor.isCritical)
      .map(monitor => monitor.isWorking)
      .every(isWorking => isWorking);
  }

  public isServiceHealthy(serviceName: string): boolean {
    return this.monitors
      .filter(monitor => monitor.serviceName === serviceName)
      .map(monitor => monitor.isWorking)
      .every(isWorking => isWorking);
  }

  public addMonitor(monitor: IHealthMonitor): void {
    monitor.isWorking = true;
    this.monitors.push(monitor);
  }
  //#endregion

  //#region Private Methods
  private checkHealth(): void {
    this.monitors.forEach(async (serviceMonitor) => {
      try {
        this.logger.debug(`${serviceMonitor.serviceName} healthcheck started`);
        serviceMonitor.isWorking = await serviceMonitor.service.isHealthy();
        if (serviceMonitor.isWorking) {
          this.logger.debug(`Healtcheck for ${serviceMonitor.serviceName} has succeeded`);
        } else {
          if (serviceMonitor.isCritical) {
            this.logger.error(`Healtcheck for ${serviceMonitor.serviceName} has failed`);
          } else {
            this.logger.debug(`Healtcheck for ${serviceMonitor.serviceName} has failed`);
          }
        }
      } catch (error) {
        this.logger.error(`Healtcheck for ${serviceMonitor.serviceName} has failed`);
        serviceMonitor.isWorking = false;
      }
    });
  }
  //#endregion
}