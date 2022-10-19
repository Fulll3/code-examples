import { BotMonitor, Env, Logger } from "botanica";
import { HanaConnector } from "./data/hana/HanaConnector";
import { ServiceTypes } from "./service/resolution/ServiceTypes";
import { BotServices } from "./service/resolution/BotServices";
import { HealthManager } from "./monitoring/health/HealthManager";
import { HealthMonitors } from "./monitoring/health/HealthMonitors";
import { SecretManager } from "botanica";

/**
 * Provices easy runtime checking
 */
export class Runtime {
  private static environment: string;
  private static track: {
    start: number;
    log: string;
  } = null;

  private static logger = new Logger(Runtime.name);
  private static secretManager = new SecretManager();

  public static async init(): Promise<void> {
    Runtime.environment = await Runtime.secretManager.getSecret("RUNTIME_ENV");
    this.logger.debug(`Initializing Runtime at ${Runtime.environment}`);
  }

  public static startTracking(message: string): void {
    Runtime.track = {
      start: Date.now(),
      log: message,
    };
  }

  public static endTracking(): void {
    if (!Runtime.track || !Runtime.track.start) {
      Runtime.track = null;
      throw new Error(`[${Runtime.name}]: Did not started tracking appropriately`);
    } else {
      const duration = (Date.now() - Runtime.track.start) / 1000;
      Runtime.logger.debug(`${Runtime.track.log}: ${duration} seconds`);
      Runtime.track = null;
    }
  }

  public static isDev(): boolean { // botanica's dev branch
    return Env.get("NODE_ENV", "botEnv") === "prod" && Runtime.environment === "dev";
  }

  public static isProd(): boolean { // botanica's master branch
    return Env.get("NODE_ENV","botEnv") === "prod" && Runtime.environment === "prod";
  }

  public static isLocal(): boolean { // local dev setup
    return Runtime.environment === "local";
  }

  public static delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), milliseconds));
  }

  public static async startHealthMonitoring(): Promise<void> {
    if(!Runtime.isProd()) {
      //run healthchecks only in prod enviroment
      return;
    }
    const botMonitor = BotMonitor.getInstance();
    const healthChecker = HealthManager.getInstance();

    const hana: HanaConnector = BotServices.getInstance().get(ServiceTypes.HanaConnector);
    const hanaMonitor = HealthManager.createMonitor(HealthMonitors.HanaWebService, hana, true);

    botMonitor.addHealthCheck("Hana Connector", async (message: string) => hana.isHealthy());
    healthChecker.addMonitor(hanaMonitor);
  }
}
