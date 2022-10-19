import { Logger } from "botanica";
import { IHealthCheckable } from "./IHealthCheckable";
import { IHealthMonitor } from "./IHealthMonitor";
import { Runtime } from "../../Runtime";

export class HealthManager {
  private readonly handle: NodeJS.Timer;
  private monitors: IHealthMonitor[] = [];
  private logger: Logger = new Logger(HealthManager.name);
  private static instance: HealthManager;

  public static getInstance(monitors: IHealthMonitor[] = null, timeoutForHealthChecks: number = 300000): HealthManager {
    if (!HealthManager.instance) {
      HealthManager.instance = new HealthManager(monitors, timeoutForHealthChecks);
    }

    return HealthManager.instance;
  }

  private constructor(monitors: IHealthMonitor[] = null, timeoutForHealthChecks: number = 900000) { // 15 minutes
    if (!!timeoutForHealthChecks && timeoutForHealthChecks < 60000) {
      throw new Error(`[${HealthManager.name}]: timeout too short`);
    }
    if (Runtime.isLocal()) {
      timeoutForHealthChecks = 600000; // 5 minutes
    }
    if (monitors) {
      monitors.forEach(item => { this.addMonitor(item); });
    }
    this.handle = setInterval(() => {
      this.checkHealth();
    }, timeoutForHealthChecks);
  }

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
    if (!this.monitors || this.monitors.length === 0) {
      return true;
    }
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

  private checkHealth(): void {
    this.monitors.forEach(async (serviceMonitor) => {
      try {
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
}