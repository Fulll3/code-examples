import { Env, Logger, ServerManager } from "botanica";
import { ChatConnector, MemoryBotStorage, UniversalBot } from "botbuilder";
import { AzureBotStorage, AzureTableClient } from "botbuilder-azure";
import * as path from "path";
import { Server } from "restify";
import { AuthenticationConfiguration } from 'botframework-connector';
import { AllowedCallersClaimsValidator } from './AllowedCallersClaimsValidator';

export class Chatbot {
  public readonly DIALOG_NAME: string = Env.get("NODE_ENV") === "prod" ? "/" : "dialog";
  private bot: UniversalBot;
  private server: Server;
  private logger: Logger = new Logger("Chatbot");
  private claimsValidator: AllowedCallersClaimsValidator = new AllowedCallersClaimsValidator();

  //#region Public Methods 
  public async setup(): Promise<Chatbot> {
    // Create chat connector for communicating with the Bot Framework Service
    const connector: ChatConnector = this.createConnector();
    this.server = await ServerManager.getServer();
    // Listen for messages from users 
    this.server.post('/api/messages', connector.listen());
    this.bot = this.createBot(connector, this.DIALOG_NAME);
    this.bot.set('storage', this.createStorage());
    this.bot.set("localizerSettings", {
      botLocalePath: path.join(__dirname, "../../../locale"),
      defaultLocale: "en"
    });

    return this;
  }

  public getBot(): UniversalBot {
    return this.bot;
  }
  //#endregion

  //#region Private Helpers
  private createConnector() {
    const connector = new ChatConnector({
      appId: Env.get("MicrosoftAppId"),
      appPassword: Env.get("MicrosoftAppPassword"),
      openIdMetadata: Env.get("BotOpenIdMetadata"),
      // @ts-ignore
      enableSkills: true,
      allowedCallers: ["*"]
    });

    return connector;
  }

  private createBot(connector: ChatConnector, dialogName: string): UniversalBot {
    let bot;

    if (Env.get("NODE_ENV") === "prod") {
      bot = new UniversalBot(connector);
    } else {
      bot = new UniversalBot(connector);
    }

    return bot;
  }

  private createStorage() {
    let storage;

    /*----------------------------------------------------------------------------------------
    * Bot Storage: This is a great spot to register the private state storage for your bot. 
    * We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
    * For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
    * ---------------------------------------------------------------------------------------- */

    if (Env.get("NODE_ENV") === "prod") {
      const tableName: string = Env.get("AZURE_TABLE_NAME");
      const azureTableClient: AzureTableClient = new AzureTableClient(tableName, Env.get("AzureWebJobsStorage"));
      storage = new AzureBotStorage({ gzipData: false }, azureTableClient);
    } else {
      storage = new MemoryBotStorage();
    }

    return storage;
  }
  //#endregion
}