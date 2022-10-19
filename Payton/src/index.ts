import { Env, Logger, SecretManager } from "botanica";
import { IntentRecognizer } from "botbuilder";
import { QnAMakerEndpoint } from "botbuilder-ai";
import { config } from "./config";
import { Chatbot } from "./conversation/bot/Chatbot";
import ChatbotInitializer from "./conversation/bot/ChatbotInitializer";
import { QnAMakerFacade } from "./conversation/bot/QnAMakerFacade";
import { WatsonAssistantRecognizer, WatsonAssistantRecognizerConfig } from "./conversation/bot/WatsonAssistantRecognizer";
import { WatsonDialogOptions } from "./conversation/bot/WatsonDialogOptions";
import { ZENDeskDataManager } from "./conversation/helpers/ZENDeskDataManager";
import { JwtManager } from "./core/JwtManager";
import { ERPSystemMappingManager } from "./data/ERPSystemMappingManager";
import { EzSuiteConnector } from "./data/EzSuiteConnector";
import ZENDeskClient from "./data/ZenDeskClient";
import { CheckNumberConnector } from "./data/CheckNumberConnector";
import { ServiceNow } from "js-servicenow-connector";
import { ServiceNowClient } from "./data/ServiceNowClient";
import { JWTGenerator } from "./data/finnavigate/JWTGenerator";
import { FinnavigateConnector } from "./data/finnavigate/FinnavigateConnector";
import { SnowflakeConnector } from "./data/SnowflakeConnector";

Env.init();

const secretManager = new SecretManager();
const logger = new Logger("index");
(async () => {
  logger.debug(`current env is: ${Env.get("NODE_ENV")}`);
  await ERPSystemMappingManager.Initialize();
  const recognizer = await createRecognizer();
  const environment = await secretManager.getSecret("EnvironmentCode");
  const watsonDialogOptions = createWatsonDialogOptions(recognizer);
  const zenDeskClient = await setupZENDeskClient();
  const serviceNowClient = await setupServiceNowClient();
  const zenDeskDataManager = new ZENDeskDataManager(environment);
  const jwtManager = await createJwtManager();
  const chatbot = await new Chatbot().setup();
  const bot = chatbot.getBot();
  const qnaMaker = await setupQnAMaker();
  const ezSuiteconnector = await createEzSuiteConnector();
  const checkNumberConnector = await createCheckNumberConnector();

  const jwtGenerator = new JWTGenerator(
    await secretManager.getSecret("JWT_ACCOUNT"),
    await secretManager.getSecret("JWT_USERNAME"),
    await secretManager.getSecret("JWT_PRIVATE_KEY"),
    await secretManager.getSecret("JWT_PASSHPRASE")
  );
  FinnavigateConnector.getInstance(await secretManager.getSecret("FINNAVIGATE_URL"), jwtGenerator)
  const jwtGeneratorSnowflake = JWTGenerator.getInstance(
    await secretManager.getSecret("JWT_ACCOUNT_SNOWFLAKE"),
    await secretManager.getSecret("JWT_USERNAME_SNOWFLAKE"),
    await secretManager.getSecret("JWT_PRIVATE_KEY_SNOWFLAKE"),
    await secretManager.getSecret("JWT_PASSHPRASE_SNOWFLAKE")
  );
  const snowflakeConnector = SnowflakeConnector.getInstance(
    await secretManager.getSecret("SNOWFLAKE_URL"),
    jwtGeneratorSnowflake
  )





  ChatbotInitializer.setup(
    bot,
    recognizer,
    watsonDialogOptions,
    zenDeskClient,
    serviceNowClient,
    jwtManager,
    secretManager,
    zenDeskDataManager,
    qnaMaker,
    environment,
    ezSuiteconnector,
    checkNumberConnector,
  );
})();

async function createRecognizer(): Promise<WatsonAssistantRecognizer> {
  return new WatsonAssistantRecognizer({
    username: await secretManager.getSecret("WATSON_ASSISTANT_USERNAME"),
    password: await secretManager.getSecret("WATSON_ASSISTANT_PASSWORD"),
    workspace_id_EN: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID"),
    workspace_id_FR: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID_FR"),
    url: await secretManager.getSecret("WATSON_ASSISTANT_URL")
  } as WatsonAssistantRecognizerConfig);
}

async function setupServiceNowClient(): Promise<ServiceNowClient> {
  return new ServiceNowClient({
    url: await secretManager.getSecret("SERVICENOW_URL"),
    interfaceID: await secretManager.getSecret("SERVICENOW_INTERFACE"),
    category: await secretManager.getSecret("SERVICENOW_CATEGORY"),
    passphrase: await secretManager.getSecret("SERVICENOW_PASSPHRASE")
  })
}
async function setupZENDeskClient(): Promise<ZENDeskClient> {
  return new ZENDeskClient({
    username: await secretManager.getSecret("ZENDESK_API_USER"),
    password: await secretManager.getSecret("ZENDESK_API_TOKEN"),
    url: await secretManager.getSecret("ZENDESK_API_URL")
  });
}

async function setupQnAMaker(): Promise<QnAMakerFacade> {
  return new QnAMakerFacade(
    {
      knowledgeBaseId: await secretManager.getSecret("QnA_KnowledgeBase_EN"),
      endpointKey: await secretManager.getSecret("QnA_EndpointKey_EN"),
      host: await secretManager.getSecret("QnA_Host_EN")
    } as QnAMakerEndpoint,
    {
      knowledgeBaseId: await secretManager.getSecret("QnA_KnowledgeBase_FR"),
      endpointKey: await secretManager.getSecret("QnA_EndpointKey_FR"),
      host: await secretManager.getSecret("QnA_Host_FR")
    } as QnAMakerEndpoint,
    config.get("QnA_Treshold") as number,
    config.get("QnA_Top") as number
  );
}

async function createEzSuiteConnector(): Promise<EzSuiteConnector> {
  return new EzSuiteConnector(
    await secretManager.getSecret("EZSUITE_URL"),
    await secretManager.getSecret("EZSUITE_USER"),
    await secretManager.getSecret("EZSUITE_PASSWORD")
  );
}

async function createCheckNumberConnector(): Promise<CheckNumberConnector> {
  return CheckNumberConnector.getInstance(
    await secretManager.getSecret("DATASTORE_URL"),
    await secretManager.getSecret("DATASTORE_USER"),
    await secretManager.getSecret("DATASTORE_PASSWORD"),
  );
}

async function createJwtManager(): Promise<JwtManager> {
  return new JwtManager(
    await secretManager.getSecret("IOL_SECRET")
  );
}

function createWatsonDialogOptions(recognizer: IntentRecognizer) {
  return new WatsonDialogOptions(recognizer);
}