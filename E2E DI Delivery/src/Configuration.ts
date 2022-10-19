import { Logger } from "botanica";

export interface IFileSystemDependency {
  readFileSync: (file: string) => Buffer;
}

export interface IPathDependency {
  sep: string;
  join: (...paths: string[]) => string;
}

/**
 * Provices interface to access configuration files
 */
export class Configuration {
    //#region PublicStatic
    public static get(
      fileModule: IFileSystemDependency,
      pathModule: IPathDependency,
      environment: string,
    ): any {

        try {
          if (!Configuration.configuration) {
            const slash = pathModule.sep;
            let file: string;

            if (environment === "prod") {
                file = pathModule.join(__dirname, `..${slash}configuration${slash}config.prod.json`);
            } else {
                file = pathModule.join(__dirname, `..${slash}configuration${slash}config.dev.json`);
            }

            const fileContents = JSON.parse(fileModule.readFileSync(file).toString());
            if (!fileContents) { return undefined; }
            Configuration.configuration = fileContents;
          }

          return Configuration.configuration;
        } catch (error) {
          Configuration.logger.error("Unable to read configuration file: ", error);
          return undefined;
        }
    }

    public static reset(): void {
      Configuration.configuration = undefined;
    }
    //#endregion

    //#region PrivateStatic
    private static configuration: any;
    private static logger: Logger = new Logger("Configuration");
    //#endregion

    //#region Private
    //
    //#endregion

    //#region Public
    //
    //#endregion
}
