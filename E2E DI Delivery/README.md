
# E2E DI Delivery Bot

  

[![pipeline status](https://code.siemens.com/botanica-bots/e2e-di-delivery-bot/badges/master/pipeline.svg)](https://code.siemens.com/botanica-bots/e2e-di-delivery-bot/pipelines)

  

E2E Deliver Monitor bot.

  

This bot uses the [Botanica library](https://code.siemens.com/botanica-libraries/botanica)

  

-  [How does the deployment work?](https://code.siemens.com/botanica/botanica/wikis/bot-deployment)

## Contacts

 - Product Owner - Eckert, Thorsten (DI LOG E2E) <thorsten.eckert@siemens.com>
 - Other contacts from business - Koenig-Mock, Katja (DI LOG E2E) <katja.mock@siemens.com>, Moschke, Ilja (DI LOG E2E BI) <Ilja.Moschke@siemens.com>
 - HANA webservice - Eckert, Thorsten (DI LOG E2E) <thorsten.eckert@siemens.com>, Panwar, Shivani (ext) (IT APD) <shivani.panwar.ext@siemens.com>
## Prerequesits

  

You need to have the following software installed for local development

  

-  [Node JS @ 8.11.1](https://nodejs.org/download/release/v8.11.1/)

-  [Bot Framework Emulator @ 4.5.2](https://github.com/Microsoft/BotFramework-Emulator)

  

## Bot Configuration

  

You can configure your bot by changing the content of the `configuration.yaml`.

More information about what exactly can be configured is documented in [the Botanica Wiki](https://code.siemens.com/botanica/botanica/wikis/bot-configuration)

  

## Secret Management

  

See the [secret management section](https://code.siemens.com/botanica/botanica/wikis/botanica-library#secret-management) of wiki for information about how secret management works with Botanica.

  

Set the following credentials in the Gitlab Variables.

`Settings > CI / CD > Variables`

  

|Secret in Gitlab Variables|Description|

|--------------------------|----------------------------|

|HANA_CONNECTOR_USERNAME|user name for Hana Webservice|

|HANA_CONNECTOR_PASSWORD|password for Hana Webservice|

|HANA_CONNECTOR_URL|connection endpoint for Hana Webservice|

|BOT_ID_DEV|Id associated with azure dev app insights|

|BOT_ID_PROD|Id associated with azure prod app insights|

|DIRECT_LINE_KEY_DEV|Key for web chat dev association|

|DIRECT_LINE_KEY_PROD|Key for web chat prod association|

  

## Logging

  

Logs of your bot can be found in the App Insights Component on Azure:

  

-  [Dev](https://portal.azure.com/#@SiemensCloud.onmicrosoft.com/resource/subscriptions/548ec26c-747c-4a53-a5da-ec01abe02c64/resourceGroups/robotics_cluster_1/providers/Microsoft.Insights/components/bot-b8d16713-8153-4bfc-ad2e-3dc3c494567e-dev/overview)

-  [Prod](https://portal.azure.com/#@SiemensCloud.onmicrosoft.com/resource/subscriptions/548ec26c-747c-4a53-a5da-ec01abe02c64/resourceGroups/robotics_cluster_1/providers/Microsoft.Insights/components/bot-b8d16713-8153-4bfc-ad2e-3dc3c494567e/overview)

  

Make sure to login to azure with your `GID@siemens.cloud` email address

  

You can configure access to the logging components, by following [this guide](https://code.siemens.com/botanica/botanica/wikis/bot-configuration#logging-configuration)

  

## Webchat

  

Webchat for testing the bot can be found in:

  

-  [Dev](https://botanica.siemens.cloud/channels/webchat/?botId=f5dc9780-c352-11e9-8b26-6d9e1d19b28d&botEnv=dev)

-  [Prod](https://botanica.siemens.cloud/channels/webchat/?botId=f5dc9780-c352-11e9-8b26-6d9e1d19b28d&botEnv=prod)

  

## Architecture

Layers are separated accordingly:

-  **./src/conversation :** Conversation Layer (A.K.A. Presentation or View);

-  **./src/data :** Data Layer (Raw connectors, access to API's, logging, networking, low level...);

-  **./src/middleware :** Bot middleware's definitions and configurations;

-  **./src/monitoring :** Bot logging and KPI's definitions and configurations;

-  **./src/service :** Loading Layer (Abstracts complex class initialization and access);

  

## Update Procedure

  

- Update CHANGELOG/README;

- Run "npm version (major|minor|patch)";

- Run dev pipeline;

- After tests approved, run the master pipeline.