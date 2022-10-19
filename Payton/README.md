
  

# Payton

  

  

[![pipeline status](https://code.siemens.com/botanica-bots/payton/badges/master/pipeline.svg)](https://code.siemens.com/botanica-bots/payton/pipelines)

  

  

This template is a working bot example, that connects an IBM Watson Assistant instance.

  

  

The example template in this repository uses the [Botanica library](https://code.siemens.com/botanica-libraries/botanica)

  

  

-  [How does the deployment work?](https://code.siemens.com/botanica/botanica/wikis/bot-deployment)

  

## Contacts

 - PO - Hiltz, Camille (GBS P2P US PS);
   
 - PM - Vreeland, Cody (GBS P2P US DO);
   
 - HANA API - Chaudhari, Yuvraj (GBS O DS AA IN)
   <chaudhari.yuvraj@siemens.com>
   
 - Ezsuite API - Sylvia, Stephen (IT ECP ERP-AM ARC1)
   <Steve.Sylvia@siemens.com>
   
 - Datastore API - Sylvia, Stephen (IT ECP ERP-AM ARC1)
   <Steve.Sylvia@siemens.com>

  

## Prerequesits

  

  

You need to have the following software installed for local development

  

  

-  [Node.js 8.11.1](https://nodejs.org/download/release/v8.11.1/)

  

- Typescript 3.x.x `npm install -g typescript`

  

-  [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator)

  

  

## Bot Configuration

  

  

You can configure your bot by changing the content of the `configuration.yaml`.

  

More information about what exactly can be configured is documented in [the Botanica Wiki](https://code.siemens.com/botanica/botanica/wikis/bot-configuration)

  

  

## Secret Management

  

  

See the [secret management section](https://code.siemens.com/botanica/botanica/wikis/botanica-library#secret-management) of ours wiki for information about how secret management works with Botanica.

  

  

This bot needs to have the watson assistant credentials configured.

  

Set the following credentials in the Gitlab Variables.

  

`Settings > CI / CD > Variables`

  

  

|Secret in Gitlab Variables|Watson Assistant Credentials|Description|

  

|--------------------------|----------------------------|-----------|

  

|PROD_WATSON_ASSISTANT_USERNAME|username|username of your production Watson Assistant Workspace|

  

|DEV_WATSON_ASSISTANT_USERNAME|username|username of your dev Watson Assistant Workspace|

  

|PROD_WATSON_ASSISTANT_PASSWORD|password|password of your production Watson Assistant Workspace|

  

|DEV_WATSON_ASSISTANT_PASSWORD|password|password of your dev Watson Assistant Workspace|

  

|PROD_WATSON_ASSISTANT_WORKSPACE_ID|workspace id|workspace id of your production Watson Assistant Workspace|

  

|DEV_WATSON_ASSISTANT_WORKSPACE_ID|workspace id|workspace id of your dev Watson Assistant Workspace|

  

  

## Logging

  

  

Logs of your bot can be found in the App Insights Component on Azure.

  

  

-  [Prod](https://portal.azure.com/#@SiemensCloud.onmicrosoft.com/resource/subscriptions/548ec26c-747c-4a53-a5da-ec01abe02c64/resourceGroups/robotics_cluster_1/providers/microsoft.insights/components/bot-e17d1021-37c5-4bba-93a7-f767882f13e2/overview)

  

-  [Dev](https://portal.azure.com/#@SiemensCloud.onmicrosoft.com/resource/subscriptions/548ec26c-747c-4a53-a5da-ec01abe02c64/resourceGroups/robotics_cluster_1/providers/microsoft.insights/components/bot-e17d1021-37c5-4bba-93a7-f767882f13e2-dev/overview)

  

  

Make sure to login to azure with your `GID@siemens.cloud` email address

  

  

## Webchat

  

  

You can include the webchat, that is provided by the Azure Bot Services. See our [channel documentation](https://code.siemens.com/botanica/botanica/wikis/channels) for how to integrate it into your site.