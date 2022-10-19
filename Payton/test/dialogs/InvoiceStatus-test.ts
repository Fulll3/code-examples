import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import { expect } from "chai";
import "mocha";
import { WatsonDialogOptions } from "../../src/conversation/bot/WatsonDialogOptions";
import { Dialogs } from "../../src/conversation/Dialogs";
import { ConversationDataManager } from "../../src/conversation/helpers/ConversationDataManager";
import { InvoiceStatusDialog } from "../../src/conversation/InvoiceStatusDialog";
import { getMockupAdaptiveCardWithInvoiceNumber, InvoiceWatsonMockupRecognizer } from "./mockups/InvoiceRecognizer";
import { WatsonMockupRecognizer } from "./mockups/PaytonParentRecognizer";

var bot: UniversalBot;

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
});

describe('BotTester - Dialog - Invoice Status', () => {

  it('starting parameter query dialog', () => {
    const regonizer = new InvoiceWatsonMockupRecognizer(false);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot('invoice status', 'parameter query dialog started')
      .runTest();
  });

  it('saving invoice number', () => {
    const regonizer = new InvoiceWatsonMockupRecognizer(true);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("invoice status 123456", [getMockupAdaptiveCardWithInvoiceNumber(), "search confirmation dialog started"])
      .checkSession((session) => {
        expect(ConversationDataManager.getInvoiceNumber(session)).to.be.equal("123456");
      })
      .runTest();
  });

  it('deleting invoice number', () => {
    const regonizer = new WatsonMockupRecognizer("deleteParameter", [
      {
        "entity": "deleteParameter",
        "location": [
          7,
          21
        ],
        "value": "invoice_number",
        "confidence": 0.9992520213127136
      }]);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("delete invoice number", ["I have deleted invoice_number.", "parameter query dialog started"])
      .runTest();
  });

  it('deleting invoice amount', () => {
    const regonizer = new WatsonMockupRecognizer("deleteParameter", [
      {
        "entity": "deleteParameter",
        "location": [
          7,
          21
        ],
        "value": "amount",
        "confidence": 0.9992520213127136
      }]);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("delete amount", ["I have deleted amount.", "parameter query dialog started"])
      .runTest();
  });

  it('deleting po number', () => {
    const regonizer = new WatsonMockupRecognizer("deleteParameter", [
      {
        "entity": "deleteParameter",
        "location": [
          7,
          21
        ],
        "value": "po_number",
        "confidence": 0.9992520213127136
      }]);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("delete po number", ["I have deleted po_number.", "parameter query dialog started"])
      .runTest();
  });

  it('deleting invoice date', () => {
    const regonizer = new WatsonMockupRecognizer("deleteParameter", [
      {
        "entity": "deleteParameter",
        "location": [
          7,
          21
        ],
        "value": "date",
        "confidence": 0.9992520213127136
      }]);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("delete invoice date", ["I have deleted date.", "parameter query dialog started"])
      .runTest();
  });

  it('add more values test', () => {
    const regonizer = new WatsonMockupRecognizer("decisionReplies", [
      {
        "entity": "decisionReplies",
        "location": [
          0,
          3
        ],
        "value": "positive",
        "confidence": 0.9992520213127136
      }]);
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("yes", "parameter query dialog started")
      .runTest();
  });

  it('help initialization test', () => {
    const regonizer = new WatsonMockupRecognizer("help");
    bot.recognizer(regonizer);
    bot.dialog('/', new InvoiceStatusDialog(new WatsonDialogOptions(regonizer)));
    bot.dialog(Dialogs.SearchConfirmation, (session) => {
      session.send("search confirmation dialog started");
    });
    bot.dialog(Dialogs.ParameterQuery, (session) => {
      session.send("parameter query dialog started");
    });
    bot.dialog(Dialogs.Results, (session) => {
      session.send("results dialog started");
    });
    bot.dialog(Dialogs.NoIntent, (session) => {
      session.send("no intent dialog started");
    });
    bot.dialog(Dialogs.ContextHelp, (session) => {
      session.send("help dialog started");
    });

    return new BotTester(bot)
      .sendMessageToBot("help", "help dialog started")
      .runTest();
  });
});