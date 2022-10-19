export interface IHealthCheckable {
  isHealthy(): Promise<boolean>;
}