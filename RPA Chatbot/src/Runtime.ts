import { Env, Logger } from "botanica"
import { SecretManager } from "botanica"
import { HealthManager } from "./monitoring/health/HealthManager";
import { HealthMonitors } from "./monitoring/health/HealthMonitors";
import { Services } from "./service/Services";

/**
 * This class provices runtime auxiliary functions
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
    this.logger.debug(`Runtime prod:${Runtime.isProd()}, dev: ${Runtime.isDev()}, local: ${Runtime.isLocal()}`);
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
    return Env.get("NODE_ENV", "BotEnv") === "prod" && Runtime.environment === "dev";
  }

  public static isProd(): boolean { // botanica's master branch
    return Env.get("NODE_ENV", "BotEnv") === "prod" && Runtime.environment === "prod";
  }

  public static isLocal(): boolean { // local dev setup
    return Env.get("NODE_ENV", "BotEnv") === "dev" && Runtime.environment === "local";
  }

  public static delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), milliseconds));
  }
}
