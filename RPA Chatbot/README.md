
# Coe-Template

  

Template for quickstart chatbot project following best developemnt practices.

  

## Prerequesits

  

You need to have the following software installed for local development

  

-  [Node JS @ 8.11.1](https://nodejs.org/download/release/v8.11.1/)

-  [Bot Framework Emulator @ 4.5.2](https://github.com/Microsoft/BotFramework-Emulator)

## Contacts
- Product owner - Gameiro, Mariana (GBS O DS CC) <mariana.gameiro@siemens.com>
- SPLUNK  - Simoes, Valter (GBS O DS CC) <valter.simoes@siemens.com>, Ommerle, Martin (IT IPS OP2 LPS) <martin.ommerle@siemens.com>
- Schedules webservice - Pinto, Philipi (GBS O DS IM) <philipi.pinto@siemens.com>, Pinto, Philipi (GBS O DS IM) <philipi.pinto@siemens.com>
## Bot Configuration

  

You can configure your bot by changing the content of the `configuration.yaml`.

More information about what exactly can be configured is documented in [the Botanica Wiki](https://code.siemens.com/botanica/botanica/wikis/bot-configuration)

  

It is also possible to modify the files "config/prod.dev.json" to change behavior execution and provide parametrisation to the chatbot.

  

## Secret Management

  

See the [secret management section](https://code.siemens.com/botanica/botanica/wikis/botanica-library#secret-management) of ours wiki for information about how secret management works with Botanica.

  

Minimum required secrets:

  

|Secret in Gitlab Variables|Description|

|--------------------------|----------------------------|

|RUNTIME_ENV| should be set to "local", "dev or "prod" accordingly |

|WATSON_ASSISTANT_VERSION| watson api version |

|WATSON_ASSISTANT_API_KEY| watson api secret key |

|WATSON_ASSISTANT_URL| watson assistant url endpoint |

|WATSON_ASSISTANT_ID| watson assigned id |

  

Use the `.vault-secrets.yaml.example` file as a template for local development secrets values.

Use the `.env.example` file as a template for local development enviroment variables.

  

## Webchat

  

Webchat for testing the bot can be found in:

  

-  [Dev]()

-  [Prod]()

  

## Logging

  

Logs of your bot can be found in the App Insights Component on Azure.

  

-  [Prod]()

-  [Dev]()

  

Make sure to login to azure with your `GID@siemens.cloud` email address

  

You can configure access to the logging components, by following [this guide](https://code.siemens.com/botanica/botanica/wikis/bot-configuration#logging-configuration)

  

## Architecture

  

Layers are separated accordingly:

  

-  **./src :** App initialization (initialize memory, storage, services and dialogs)

-  **./src/conversation :** Conversation Layer (A.K.A. Presentation or View);

-  **./src/domain :** Business rules specific to application;

-  **./src/data :** Data Layer (Raw connectors, access to API's, logging, networking, low level...);

-  **./src/middleware :** Bot middleware's definitions;

-  **./src/monitoring :** Bot KPI's definitions and configurations;

-  **./src/service :** Loading Layer (Abstracts complex class initialization and access);

  
  

## Testing

  

The chatbot automated test scripts are divided into two cathegories:

  

#### Local

  

Local tests are those dependent on connection dependencies that cannot be executed on the Botanica's pipeline.

Therefore, to be ignored they should be created in the third directory level after the application root, e.g:

  

`./test/conversation/local`

`./test/data/local`

  

#### Pipeline

  

Pipeline tests are going to be executed on the deploy pipeline and should not have external services dependencies or any secrets management requirement. They shall be create at maximum on the second directory level after the application root, e.g:

  

`./test/conversation/`

`./test/data/`

  

Test coverage should be focused on classes defined in the `conversation`, `domain` and `data` layers:

  

File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |

----------------------------------|----------|----------|----------|----------|-------------------|

All files | 80.58 | 59.43 | 74.36 | 80.46 | |

src | 68.42 | 50 | 72.73 | 68.57 | |

Configuration.ts | 70.59 | 66.67 | 50 | 75 | 33,45,46,51 |

Runtime.ts | 66.67 | 40 | 77.78 | 63.16 |... 31,32,34,35,36 |

src/conversation | 88 | 52.94 | 87.5 | 88 | |

DialogStack.ts | 100 | 50 | 100 | 100 | 11,17,28 |

LocalizedMessages.ts | 81.25 | 54.55 | 80 | 81.25 | 30,32,34 |

src/conversation/dialogs | 95.38 | 62.5 | 100 | 95.38 | |

EchoDialog.ts | 95 | 50 | 100 | 95 | 19 |

RestartDialog.ts | 96.55 | 75 | 100 | 96.55 | 27 |

WelcomeDialog.ts | 93.75 | 50 | 100 | 93.75 | 20 |

src/conversation/prompts | 100 | 100 | 100 | 100 | |

IntentPrompt.ts | 100 | 100 | 100 | 100 | |

SimplePrompt.ts | 100 | 100 | 100 | 100 | |

src/conversation/values | 100 | 100 | 100 | 100 | |

PromptNames.ts | 100 | 100 | 100 | 100 | |

StorageKeys.ts | 100 | 100 | 100 | 100 | |

src/data/storage | 47.06 | 50 | 33.33 | 47.06 | |

ChatbotStorage.ts | 66.67 | 83.33 | 50 | 66.67 | 15,27,28,29,30 |

UserRepository.ts | 31.58 | 16.67 | 25 | 31.58 |... 53,54,58,59,60 |

src/data/watson | 80 | 64.71 | 90.91 | 80 | |

Intents.ts | 100 | 100 | 100 | 100 | |

WatsonAssistant.ts | 77.78 | 64.71 | 90.91 | 77.78 |... 65,66,75,76,98 |

src/domain/watson | 65.22 | 62.5 | 50 | 65.22 | |

WatsonAssistant.ts | 65.22 | 62.5 | 50 | 65.22 |... 28,38,48,50,51 |

src/middlewares/watson | 80 | 50 | 100 | 78.57 | |

WatsonAssistantMiddleware.ts | 80 | 50 | 100 | 78.57 | 8,11,22 |

src/service | 100 | 100 | 100 | 100 | |

ServiceFactory.ts | 100 | 100 | 100 | 100 | |

src/service/state | 100 | 100 | 75 | 100 | |

ConversationStateFactory.ts | 100 | 100 | 100 | 100 | |

UserRepositoryFactory.ts | 100 | 100 | 50 | 100 | |

src/service/watson/data | 100 | 100 | 100 | 100 | |

WatsonAssistantFactory.ts | 100 | 100 | 100 | 100 | |

src/service/watson/domain | 85.71 | 100 | 33.33 | 85.71 | |

WatsonAssistantDomainFactory.ts | 85.71 | 100 | 33.33 | 85.71 | 6 |