import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import "mocha";
import { Dialogs } from "../../src/conversation/Dialogs";
import { SearchConfirmationDialog } from "../../src/conversation/SearchConfirmationDialog";

var bot: UniversalBot;

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
  bot.localePath("./"); //deactivate localizations
  bot.dialog('/', new SearchConfirmationDialog());
  bot.dialog(
    Dialogs.InvoiceStatus, (session) => {
      session.send("invoice status dialog started");
    }
  );
});

describe('BotTester - Dialog - Search Confirmation', () => {  //dialog just redirect the answers to invoice status (which handles positive and negative answers)
  it('positive answer', () => {
    return new BotTester(bot)
      .sendMessageToBot("hi", "prompt_addMoreInformation")
      .sendMessageToBot("prompt_yes", "invoice status dialog started")
      .runTest();
  });
  it('negative answer', () => {
    return new BotTester(bot)
      .sendMessageToBot("hi", "prompt_addMoreInformation")
      .sendMessageToBot("prompt_no", "invoice status dialog started")
      .runTest();
  });
});