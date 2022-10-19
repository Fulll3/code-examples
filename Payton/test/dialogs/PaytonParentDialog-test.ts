import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import "mocha";
import { Dialogs } from "../../src/conversation/Dialogs";
import { InvoiceStatusDialog } from "../../src/conversation/InvoiceStatusDialog";
import { RootDialog } from "../../src/conversation/RootDialog";
import { WatsonDialogOptions } from "../../src/conversation/bot/WatsonDialogOptions";
import { WatsonMockupRecognizer } from "./mockups/PaytonParentRecognizer";

var bot: UniversalBot;

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
  bot.localePath("./"); // deactivate localizations

  bot.dialog(Dialogs.Reset, (session) => {
    session.send("reset dialog started");
  });
  bot.dialog(Dialogs.Feedback, (session) => {
    session.send("Feedback dialog started");
  });
  bot.dialog(Dialogs.Welcome, (session) => {
    session.send("Welcome dialog started");
  });
  bot.dialog(Dialogs.Help, (session) => {
    session.send("Help dialog started");
  });
});

describe('BotTester - Dialog - Payton Parent', () => {
  // pending test
  it('test intent restart', () => {
    const regonizer = new WatsonMockupRecognizer("restart");
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));

    return new BotTester(bot)
      .sendMessageToBot("restart", "reset dialog started")
      .runTest();
  });

  it('test intent return feedback', () => {
    const regonizer = new WatsonMockupRecognizer("goodbye");
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));

    return new BotTester(bot)
      .sendMessageToBot("Bye", "goodbye")
      .runTest();
  });

  it('test intent greetings', () => {
    const regonizer = new WatsonMockupRecognizer("greetings");
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));

    return new BotTester(bot)
      .sendMessageToBot("Hi", "Welcome dialog started")
      .runTest();
  });

  it('test intent help', () => {
    const regonizer = new WatsonMockupRecognizer("help");
    bot.recognizer(regonizer);
    bot.dialog('/', new RootDialog(regonizer));

    return new BotTester(bot)
      .sendMessageToBot("help", "Help dialog started")
      .runTest();
  });
});