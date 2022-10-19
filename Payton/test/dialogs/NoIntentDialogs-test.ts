import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import "mocha";
import { WatsonAssistantRecognizer } from "../../src/conversation/bot/WatsonAssistantRecognizer";
import { WatsonDialogOptions } from "../../src/conversation/bot/WatsonDialogOptions";
import { NoIntentDialog } from "../../src/conversation/NoIntentDialog";
import { NoIntent } from "./mockups/NoIntentRecognizer";

var bot: UniversalBot;
var regonizer: WatsonAssistantRecognizer;

describe('BotTester - Dialog - No Intent', () => {
  it('check of first and second message for no intent', () => {
    regonizer = new NoIntent();
    bot = new UniversalBot(new TestConnector());
    bot.localePath("./"); // deactivate localizations
    bot.dialog('/', new NoIntentDialog(new WatsonDialogOptions(regonizer), undefined));

    return new BotTester(bot)
      .sendMessageToBot("message without intent", "rephraseNoIntent")
      .sendMessageToBot("message without intent #2", ["rephraseNoIntent_finalNoData", "rephraseNoIntent_IOLSelfService"])
      .runTest();
  });
});