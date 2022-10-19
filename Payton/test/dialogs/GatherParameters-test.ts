import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import { expect } from "chai";
import "mocha";
import { Dialogs } from "../../src/conversation/Dialogs";
import { GatherParametersDialog } from "../../src/conversation/GatherParametersDialog";
import { ConversationDataManager } from "../../src/conversation/helpers/ConversationDataManager";
import { WatsonMockupRecognizer } from "./mockups/GatherParametersRecognizer";
import moment = require("moment");
import chaiAsPromised = require("chai-as-promised");
import sinonChai = require("sinon-chai");

var bot: UniversalBot;
const regonizer = new WatsonMockupRecognizer();

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
  bot.localePath("./"); // deactivate localizations
  bot.dialog('/', new GatherParametersDialog(regonizer));
  bot.dialog(Dialogs.SearchConfirmation, (session) => {
    session.send("new dialog started");
  });
});

describe('BotTester - Dialog - GatherParameters', () => {
  it('saving invoice number', () => {
    return new BotTester(bot)
      .sendMessageToBot('Hi', 'promptTitle_gatherData')
      .sendMessageToBot('promptChoiceTitle_invoiceNumber', 'promptText_provideInvoice')
      .sendMessageToBot('123456', 'thanksForNewParameter')
      .checkSession((session) => {
        expect(ConversationDataManager.getInvoiceNumber(session)).to.be.equal("123456");
      }).runTest();
  });
  it('saving amount', () => {
    return new BotTester(bot)
      .sendMessageToBot('Hi', 'promptTitle_gatherData')
      .sendMessageToBot('promptChoiceTitle_amount', 'promptText_provideAmount')
      .sendMessageToBot('6.55$', 'thanksForNewParameter')  // this line is dependent on response of WatsonRecognizerMockup
      .checkSession((session) => {
        expect(ConversationDataManager.getAmount(session)).to.be.equal(6.55);
        expect(ConversationDataManager.getCurrency(session)).to.be.equal("USD");
      }).runTest();
  });
  it('saving date', () => {
    return new BotTester(bot)
      .sendMessageToBot('Hi', 'promptTitle_gatherData')
      .sendMessageToBot('promptChoiceTitle_date', 'promptText_provideDate')
      .sendMessageToBot('12/04/2018', 'thanksForNewParameter')
      .checkSession((session) => {
        expect(
          moment(ConversationDataManager.getDate(session)).format("MM/DD/YYYY")
        ).to.be.equal("12/04/2018");
      }).runTest();
  });
  it('saving po number', () => {
    return new BotTester(bot)
      .sendMessageToBot('Hi', 'promptTitle_gatherData')
      .sendMessageToBot('promptChoiceTitle_poNumber', 'promptText_providePoNumber')
      .sendMessageToBot('654321', 'thanksForNewParameter')
      .checkSession((session) => {
        expect(ConversationDataManager.getPoNumber(session)).to.be.equal("0000654321");
      }).runTest();
  });
});