// tslint:disable: space-before-function-paren
import { TestAdapter, TurnContext, ConversationState, AutoSaveStateMiddleware } from "botbuilder";
import { ConversationStateFactory } from "../../../src/service/state/ConversationStateFactory";
import { UserRepositoryFactory } from "../../../src/service/state/UserRepositoryFactory";
import { LocalizedMessages } from "../../../src/conversation/LocalizedMessages";
import { UserRepository } from "../../../src/data/storage/UserRepository";
import { WelcomeDialog } from "../../../src/conversation/dialogs/WelcomeDialog";
import { Configuration } from "../../../src/Configuration";
import { EchoDialog } from "../../../src/conversation/dialogs/EchoDialog";
import { DialogSet } from "botbuilder-dialogs";
import { Runtime } from "../../../src/Runtime";
import { expect } from "chai";
import { Env } from "botanica";

import * as i18n from "i18n";
import * as fs from "fs";
import * as path from "path";

describe("Welcome Dialog", () => {
  let adapter: TestAdapter;
  let conversationState: ConversationState;
  let userRepository: UserRepository;
  let dialog: WelcomeDialog;
  let echoDialog: EchoDialog;

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
    conversationState = await (new ConversationStateFactory()).createAndReturnServiceInstance(config, null);
    userRepository = await (new UserRepositoryFactory()).createAndReturnServiceInstance(config, new Map<string, any>([["ConversationState", conversationState]]));
    /**
     * Construct dialogs under test
     */
    echoDialog = new EchoDialog(new LocalizedMessages(EchoDialog.name, userRepository));
    dialog = new WelcomeDialog(new LocalizedMessages(WelcomeDialog.name, userRepository), echoDialog);
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
        await dc.beginDialog(WelcomeDialog.name);
      }
    });
    adapter.use(new AutoSaveStateMiddleware(conversationState));
  });

  after(async function () {
    this.timeout(TIMEOUT);
    Runtime.delay(1000);
  });

  it("should initiate conversation", function (done) {
    this.timeout(TIMEOUT);
    adapter
      .send("start")
      .assertReply((reply) => {
        expect(reply.text).to.equal("Hello, I am the Coe-Template chatbot. Plase, check the gitlab's README file before starting your development.");
      })
      .then(async () => {
        await Runtime.delay(1000);
        done();
      });
  });

  it("should continue conversation", function (done) {
    this.timeout(TIMEOUT);
    adapter
      .send("start")
      .assertReply(`Hello, I am the Coe-Template chatbot. Plase, check the gitlab's README file before starting your development.`)
      .assertReply(`Please, say anything so that I can echo back`)
      .send("Hi")
      .assertReply(`Echo: "Hi"`)
      .then(async () => {
        await Runtime.delay(1000);
        done();
      });
  });
});
