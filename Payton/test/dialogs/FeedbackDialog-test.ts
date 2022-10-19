import { BotTester, TestConnector } from "bot-tester";
import { UniversalBot } from "botbuilder";
import "mocha";
import { Dialogs } from "../../src/conversation/Dialogs";
import { FeedbackDialog } from "../../src/conversation/FeedbackDialog";
import { TicketCreationDialog } from "../../src/conversation/TicketCreationDialog";
import { HealthCheckMockup } from "./mockups/HealthCheckMockup";
import { ServiceNowMockup } from "./mockups/ServiceNow";
import { ZendeskDataMockup, ZendeskMockup } from "./mockups/Zendesk";

var bot: UniversalBot;

beforeEach(() => {
  bot = new UniversalBot(new TestConnector());
  bot.localePath("./"); // deactivate localizations
  bot.dialog('/', new FeedbackDialog());
  bot.dialog(
    Dialogs.TicketCreationDialog,
    new TicketCreationDialog(
      new ZendeskMockup(),
      new ServiceNowMockup(),
      new ZendeskDataMockup(),
      new HealthCheckMockup()
    )
  );
});

describe('BotTester - Dialog - Feedback', () => {
  it('user satisfied no ticket created', () => {
    return new BotTester(bot)
      .sendMessageToBot("Hi", "userFeedback_question")
      .sendMessageToBot("Yes", ["userFeedback_survey", "userFeedback_positive"])
      .runTest();
  });

  it('user is not satisfied no ticket created', () => {
    return new BotTester(bot)
      .sendMessageToBot("Hi", "userFeedback_question")
      .sendMessageToBot("No", ["userFeedback_negative_1", "userFeedback_IOLSelfService", "userFeedback_createTicketQuestion"])
      .sendMessageToBot("No", "userFeedback_otherQuestions")
      .runTest();
  });

  /*  it('user is not satisfied and ticket is created', () => {
     return new BotTester(bot)
       .sendMessageToBot("Hi", "userFeedback_question")
       .sendMessageToBot("No", ["userFeedback_negative_1", "userFeedback_IOLSelfService", "userFeedback_createTicketQuestion"])
       .sendMessageToBot("Yes", "userFeedback_ticketCreation")
       .runTest();
   }); */
});