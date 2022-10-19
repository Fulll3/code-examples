import { BotTester, TestConnector } from "bot-tester";
import { SecretManager } from "botanica";
import { AttachmentLayout, Message, UniversalBot } from "botbuilder";
import "mocha";
import { IJwtPayload } from "../../src/business/core/IJwtPayload";
import { IEzSuiteInvoiceData } from "../../src/business/data/EzSuite/IEzSuiteInvoiceData";
import { IHanaRowData } from "../../src/business/data/HanaDataLake/IHanaRowData";
import { WatsonDialogOptions } from "../../src/conversation/bot/WatsonDialogOptions";
import { Dialogs } from "../../src/conversation/Dialogs";
import { InvoiceQueryInformation } from "../../src/conversation/helpers/AdaptiveCardsTemplates";
import { ConversationDataManager } from "../../src/conversation/helpers/ConversationDataManager";
import { AbstractResultsHelper, InvoiceDataSource } from "../../src/conversation/helpers/Results/AbstractResultsHelper";
import { ResultHelperFactory } from "../../src/conversation/helpers/Results/ResultsHelperFactory";
import { ResultsDialog } from "../../src/conversation/ResultsDialog";
import { ERPSystemMappingManager } from "../../src/data/ERPSystemMappingManager";
import { dataAdditionalFields, dataRowMockup } from "./mockups/HanaMockup";
import { HealthCheckMockup } from "./mockups/HealthCheckMockup";
import { WatsonMockupRecognizer } from "./mockups/ResultsRecognizer";

var bot: UniversalBot;

class ResultHelperFactoryMockup extends ResultHelperFactory {
  private count: number;

  constructor(count: number) {
    super(undefined, undefined);
  }

  public getResultHelper(type: InvoiceDataSource): AbstractResultsHelper<IHanaRowData | IEzSuiteInvoiceData> {
    return new MockupResultHelper(this.count);
  }
}


class MockupResultHelper extends AbstractResultsHelper<any>{
  private count: number;

  constructor(resultsCount: number) {
    super();
    this.count = resultsCount;
  }

  showResultDetail(identifiedResult: any, session: import("botbuilder").Session): void {
    session.send("Show Result Detail");
  }
  onShowDetails(session: import("botbuilder").Session, invoiceNumber: string, companyCode: string, sapSystem: string, previousAmount: string, previousDate: string, previousVendorNumber: string): void {
    session.send("Show Result Detail");
  }
  protected getTypeInternal(): import("../../src/conversation/helpers/Results/AbstractResultsHelper").InvoiceDataSource {
    return InvoiceDataSource.HANA;
  }
  mapDatatoFrontend(data: any[]): import("../../src/business/conversation/IInvoiceData").IInvoiceData[] {
    return;
  }
  getData(entiltementData: import("../../src/business/conversation/IEntiltement").IEntitlement[], filterData: import("../../src/business/conversation/ISearchParameters").ISearchParameters, isAdminUser: boolean): Promise<{ count: number; results: any[]; }> {
    return new Promise(
      (resolve, reject) => resolve({ count: this.count, results: undefined })
    );
  }
}

class ResultHelperFactoryMockupError extends ResultHelperFactory {
  private count: number;

  constructor(count: number) {
    super(undefined, undefined);
  }

  public getResultHelper(type: InvoiceDataSource): AbstractResultsHelper<IHanaRowData | IEzSuiteInvoiceData> {
    return new MockupResultHelperError();
  }
}

class MockupResultHelperError extends AbstractResultsHelper<any>{
  constructor() {
    super();
  }

  showResultDetail(identifiedResult: any, session: import("botbuilder").Session): void {
    throw new Error("Method not implemented.");
  }
  onShowDetails(session: import("botbuilder").Session, invoiceNumber: string, companyCode: string, sapSystem: string, previousAmount: string, previousDate: string, previousVendorNumber: string): void {
    throw new Error("Method not implemented.");
  }
  protected getTypeInternal(): InvoiceDataSource {
    throw new Error("Method not implemented.");
  }
  mapDatatoFrontend(data: any[]): import("../../src/business/conversation/IInvoiceData").IInvoiceData[] {
    throw new Error("Method not implemented.");
  }
  getData(entiltementData: import("../../src/business/conversation/IEntiltement").IEntitlement[], filterData: import("../../src/business/conversation/ISearchParameters").ISearchParameters, isAdminUser: boolean): Promise<{ count: number; results: any[]; }> {
    throw new Error("Method not implemented.");
  }
}



describe('BotTester - Dialog - Results', () => {
  before(() => {
    ERPSystemMappingManager.Initialize();
    bot = new UniversalBot(new TestConnector());
    bot.dialog('/',
      new ResultsDialog(
        new WatsonDialogOptions(new WatsonMockupRecognizer("hi")),
        new ResultHelperFactoryMockup(1),
        new HealthCheckMockup(),
        new SecretManager()
      )
    );
    bot.localePath("./"); // deactivate localizations
    bot.dialog(Dialogs.Feedback, (session) => {
      session.send("Feedback dialog started");
    });
  });

  // pending test
  /*  it('no authorization returned', () => {
     return new BotTester(bot)
       .sendMessageToBot("Hi", "noAuthorization")
       .runTest();
   }); */

  it('can handle a single response', () => {
    var iolPayload: IJwtPayload = {
      FullName: "x",
      EmailAddress: "x",
      Internal: true,
      AllAccess: false,
      Entitlements: "x",
      Culture: "en"
    };
    var expectedMessage = new Message();
    expectedMessage.attachmentLayout(AttachmentLayout.carousel);

    bot = new UniversalBot(new TestConnector());
    bot.localePath("./"); // deactivate localizations
    bot.dialog('/', (session) => {

      expectedMessage.addAttachment(
        InvoiceQueryInformation.generateResultsAdaptiveCard(dataRowMockup(), 1, dataAdditionalFields(), session)
      );
      ConversationDataManager.saveAuthorization(session, iolPayload);
      session.send("user authorized");
      session.beginDialog('result');
    });
    bot.dialog('result', new ResultsDialog(new WatsonDialogOptions(new WatsonMockupRecognizer("hi")), new ResultHelperFactoryMockup(1), new HealthCheckMockup(), new SecretManager()));

    bot.dialog(Dialogs.Feedback, (session) => {
      session.send("Feedback dialog started");
    });

    bot.dialog(Dialogs.TicketCreationDialog, (session) => {
      session.send("TicketCreationDialog dialog started");
    });

    return new BotTester(bot)
      .addMessageFilter((message) => message.type == "message")
      .sendMessageToBot("Hi", ["user authorized", expectedMessage.toMessage()])
      .runTest();
  });
});


describe('BotTester - Dialog - Results fail', () => {
  before(() => {
    ERPSystemMappingManager.Initialize();
    bot = new UniversalBot(new TestConnector());
    bot.dialog('/',
      new ResultsDialog(
        new WatsonDialogOptions(new WatsonMockupRecognizer("hi")),
        new ResultHelperFactoryMockup(1),
        new HealthCheckMockup(),
        new SecretManager()
      )
    );
    bot.localePath("./"); // deactivate localizations
    bot.dialog(Dialogs.Feedback, (session) => {
      session.send("Feedback dialog started");
    });
  });

  it('throw exception error', () => {
    var iolPayload: IJwtPayload = {
      FullName: "x",
      EmailAddress: "x",
      Internal: true,
      AllAccess: false,
      Entitlements: "x",
      Culture: "en"
    };

    bot = new UniversalBot(new TestConnector());
    bot.localePath("./"); // deactivate localizations
    bot.dialog('/', (session) => {
      ConversationDataManager.saveAuthorization(session, iolPayload);
      session.send("user authorized");
      session.beginDialog('result');
    });
    bot.dialog('result', new ResultsDialog(new WatsonDialogOptions(new WatsonMockupRecognizer("hi")), new ResultHelperFactoryMockupError(1), new HealthCheckMockup(), new SecretManager()));

    bot.dialog(Dialogs.Feedback, (session) => {
      session.send("Feedback dialog started");
    });

    bot.dialog(Dialogs.TicketCreationDialog, (session) => {
      session.send("TicketCreationDialog dialog started");
    });

    return new BotTester(bot)
      .addMessageFilter((message) => message.type == "message")
      .sendMessageToBot("Hi", ["user authorized", "databaseUnavaiable"])
      .runTest();
  });
});