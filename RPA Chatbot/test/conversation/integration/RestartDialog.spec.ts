// tslint:disable: space-before-function-paren
import { TestAdapter, TurnContext, ConversationState, AutoSaveStateMiddleware } from "botbuilder";
import { WatsonAssistant as WatsonAssistantConnector } from "../../../src/data/watson/WatsonAssistant";
import { WatsonAssistantDomainFactory } from "../../../src/service/watson/domain/WatsonAssistantDomainFactory";
import { WatsonAssistantMiddleware } from "../../../src/middlewares/watson/WatsonAssistantMiddleware";
import { ConversationStateFactory } from "../../../src/service/state/ConversationStateFactory";
import { WatsonAssistantFactory } from "../../../src/service/watson/data/WatsonAssistantFactory";
import { UserRepositoryFactory } from "../../../src/service/state/UserRepositoryFactory";
import { LocalizedMessages } from "../../../src/conversation/LocalizedMessages";
import { WatsonAssistant } from "../../../src/domain/watson/WatsonAssistant";
import { UserRepository } from "../../../src/data/storage/UserRepository";
import { WelcomeDialog } from "../../../src/conversation/dialogs/WelcomeDialog";
import { Configuration } from "../../../src/Configuration";
import { RestartDialog } from "../../../src/conversation/dialogs/RestartDialog";
import { EchoDialog } from "../../../src/conversation/dialogs/EchoDialog";
import { DialogSet } from "botbuilder-dialogs";
import { Runtime } from "../../../src/Runtime";
import { Env } from "botanica";

import * as i18n from "i18n";
import * as fs from "fs";
import * as path from "path";

describe("Restart Dialog", () => {
  let adapter: TestAdapter;
  let conversationState: ConversationState;
  let userRepository: UserRepository;
  let dialog: RestartDialog;
  let watsonConnector: WatsonAssistantConnector;
  let watson: WatsonAssistant;

  const TIMEOUT = 7500;

  before(async function () {
    this.timeout(TIMEOUT);
    /**
     * Load environment similar to real app
     */
    Env.init();
    i18n.configure({
      locales: ["en", "de"],
      directory: path.join(process.cwd(), "locale"),
      objectNotation: true,
      defaultLocale: "de",
    });
    await Runtime.init();
    await Runtime.delay(1000);
    const config = Configuration.get(fs, path, Env.get("NODE_ENV"));
    conversationState = await (new ConversationStateFactory())
      .createAndReturnServiceInstance(config, null);
    userRepository = await (new UserRepositoryFactory())
      .createAndReturnServiceInstance(config, new Map<string, any>([["ConversationState", conversationState]]));
    watsonConnector = await (new WatsonAssistantFactory())
      .createAndReturnServiceInstance(config.services.find(s => s.name === "WatsonAssistant"), null);
    watson = await (new WatsonAssistantDomainFactory())
      .createAndReturnServiceInstance(
        config.services.find(s => s.name === "WatsonAssistantDomain"),
        new Map<string, any>([["WatsonAssistant", watsonConnector], ["Configuration", config]]),
      );
    /**
     * Construct dialogs under test
     */
    dialog = new RestartDialog(
      new LocalizedMessages(RestartDialog.name, userRepository),
      watson,
      new WelcomeDialog(
        new LocalizedMessages(WelcomeDialog.name, userRepository),
        new EchoDialog(
          new LocalizedMessages(WelcomeDialog.name, userRepository),
        ),
      ),
    );
  });

  beforeEach(() => {
    /**
     * Create dialog adapter
     */
    const dialogs = new DialogSet(conversationState.createProperty(Math.random().toString(36).substring(7))).add(dialog);
    adapter = new TestAdapter(async (turnContext: TurnContext): Promise<void> => {
      const dc = await dialogs.createContext(turnContext);
      if (dc.activeDialog !== undefined) {
        await dc.continueDialog();
      } else {
        await dc.beginDialog(RestartDialog.name);
      }
    });
    adapter.use(new WatsonAssistantMiddleware(userRepository, watson));
    adapter.use(new AutoSaveStateMiddleware(conversationState));
  });

  after(async function () {
    this.timeout(TIMEOUT);
    Runtime.delay(1000);
  });

  it("should continue conversation", function (done) {
    this.timeout(TIMEOUT);
    adapter
      .send("start")
      .assertReply(`Do you want to restart the conversation flow?`)
      .send("No")
      .assertReply(`So, let's continue`)
      .then(async () => {
        await Runtime.delay(1000);
        done();
      });
  });

  it("should restart conversation", function (done) {
    this.timeout(TIMEOUT);
    adapter
      .send("start")
      .assertReply(`Do you want to restart the conversation flow?`)
      .send("Yes")
      .assertReply(`Alright, let's get started again, but I cannot do a lot for now, am the simple Coe-Template for chatbots. Plase, read about me before starting your development.`)
      .then(async () => {
        await Runtime.delay(1000);
        done();
      });
  });

  it("should validate suer confirmation", function (done) {
    this.timeout(TIMEOUT);
    adapter
      .send("start")
      .assertReply(`Do you want to restart the conversation flow?`)
      .send("faksfaklfjaskfjkls")
      .assertReply(`Please, say YES if you want to restart the conversation, otherwise say NO`)
      .send("sf sdfsd")
      .assertReply(`Please, say YES if you want to restart the conversation, otherwise say NO`)
      .send(`no`)
      .assertReply(`So, let's continue`)
      .then(async () => {
        await Runtime.delay(1000);
        done();
      });
  });
});
