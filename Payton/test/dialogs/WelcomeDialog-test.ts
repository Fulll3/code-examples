import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import "mocha";
import { WelcomeDialog } from "../../src/conversation/WelcomeDialog";
import { WatsonDialogOptions } from "../../src/conversation/bot/WatsonDialogOptions";
import { WatsonMockupRecognizer } from "./mockups/PaytonParentRecognizer";

var bot: UniversalBot;
const regonizer = new WatsonMockupRecognizer("greetings");

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
  bot.localePath("./"); // deactivate localizations
  bot.dialog('/', new WelcomeDialog(
    new WatsonDialogOptions(regonizer))
  );
});

describe('BotTester - Dialog - Welcome', () => {
  // pending test
  it('can greet person', () => {
    return new BotTester(bot)
      // .sendMessageToBot("Hi", "greeting")
      .sendMessageToBot("Hi", "greetingSecondMessage")
      .runTest();
  });
});