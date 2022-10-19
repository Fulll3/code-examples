import { Storage, MemoryStorage } from "botbuilder-core";
import { BlobStorage } from "botbuilder-azure";
import { Runtime } from "../Runtime";
import { Env, Logger } from "botanica";
import { BlobsStorage } from "botbuilder-azure-blobs";

export class ChatBotStorage {

  public static getInstance(): Storage {
    if (!ChatBotStorage.instance) {
      if (Runtime.isLocal()) {
        ChatBotStorage.instance = ChatBotStorage.getDevelopmentStorage();
      } else {
        ChatBotStorage.instance = ChatBotStorage.getProductionStorage();
      }

    }
    return ChatBotStorage.instance;
  }
  private static instance: Storage;

  private constructor() { }

  private static getProductionStorage(): Storage {
    const logger = new Logger(ChatBotStorage.name)
    const containerName: string = Env.get("AZURE_CONTEXT_SERVICE_CONTAINER_NAME");
    const storageAccount: string = Env.get("AZURE_CONTEXT_SERVICE_STORAGE_ACCOUNT");
    const storageAccessKey: string = Env.get("AZURE_CONTEXT_SERVICE_ACCESS_KEY");
    const storage = new BlobsStorage(
      `DefaultEndpointsProtocol=https;AccountName=${storageAccount};AccountKey=${storageAccessKey};EndpointSuffix=core.windows.net`,
      containerName
    );

    return storage
  }

  private static getDevelopmentStorage(): Storage {
    return new MemoryStorage();
  }
}
