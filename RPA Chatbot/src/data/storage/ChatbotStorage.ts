import { Storage, MemoryStorage } from "botbuilder-core";
import { BlobStorage } from "botbuilder-azure";
import { Runtime } from "../../Runtime";
import { Env } from "botanica";

/**
 * Resolves the correct storage strategy
 * based on the runtime environment
 */
export class ChatBotStorage {

  public static getInstance(): Storage {
    if (!ChatBotStorage.instance) {
      if (Runtime.isProd() || Runtime.isDev()) {
        ChatBotStorage.instance = ChatBotStorage.getProductionStorage();
      } else {
        ChatBotStorage.instance = ChatBotStorage.getDevelopmentStorage();
      }
    }
    return ChatBotStorage.instance;
  }
  private static instance: Storage;

  private constructor() { }

  private static getProductionStorage(): Storage {
    const containerName: string = Env.get("AZURE_CONTEXT_SERVICE_CONTAINER_NAME");
    const storageAccountOrConnectionString: string = Env.get("AZURE_CONTEXT_SERVICE_STORAGE_ACCOUNT");
    const storageAccessKey: string = Env.get("AZURE_CONTEXT_SERVICE_ACCESS_KEY");
    return new BlobStorage({
      containerName,
      storageAccountOrConnectionString,
      storageAccessKey,
    });
  }

  private static getDevelopmentStorage(): Storage {
    return new MemoryStorage();
  }
}
