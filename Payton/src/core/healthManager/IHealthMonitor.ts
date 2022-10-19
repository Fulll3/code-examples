import { IHealthCheckable } from "./IHealthCheckable";

export interface IHealthMonitor {
  service: IHealthCheckable;
  serviceName: string;
  isWorking: boolean;
  isCritical?: boolean;
}