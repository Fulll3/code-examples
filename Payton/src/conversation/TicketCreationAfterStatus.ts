import { Logger } from "botanica";
import * as builder from "botbuilder";
import { IDialogResult, Session } from "botbuilder";
import { IZENDeskClient } from "../business/data/Zendesk/IZendeskClient";
import { IZENDeskDataManager } from "../business/IZENDeskDataManager";
import { HealthMonitors } from "../core/healthManager/HealthMonitors";
import { HealthManager } from "../core/healthManager/HealthManager";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { SessionHelper } from "./helpers/SessionHelper";
import { TicketCreationHelper } from "./helpers/TicketCreationHelper";
import { ServiceNowClient } from "../data/ServiceNowClient";

export class TicketCreationAfterStatus extends builder.WaterfallDialog {
  private static logger: Logger = new Logger("TicketCreationAfterStatus");

  //#region Initialization
  constructor(ZENDeskClient: IZENDeskClient, serviceNowClient: ServiceNowClient, zenDeskDataManager: IZENDeskDataManager, healthCheckManager: HealthManager) {
    super(TicketCreationAfterStatus.onStart(ZENDeskClient, serviceNowClient, zenDeskDataManager, healthCheckManager));

    this.beginDialogAction(
      "TicketCreationAfterStatusHelp",
      Dialogs.ContextHelp,
      {
        matches: "help",
        dialogArgs: {
          fakeMessage: undefined,
          helpMessageCode: "ticketCreationDialogHelp"
        }
      }
    );
  }
  //#endregion

  //#region Private Methods
  private static onStart(ZENTicket: IZENDeskClient, serviceNowClient: ServiceNowClient, zenDeskDataManager: IZENDeskDataManager, healthCheckManager: HealthManager): builder.IDialogWaterfallStep[] {
    return [
      (session: Session) => {
        if (healthCheckManager.isServiceHealthy(HealthMonitors.SERVICENOW)) {
          SessionHelper.createChoicePrompt(
            session,
            "cancelledOrStaleResult_ticketCreation",
            ["yes", "no"]
          );
        } else {
          SessionHelper.sendMessage(session, "zendeskUnavaiable");
          TicketCreationAfterStatus.otherQuestionsRestartConversation(session);
        }
      },
      async (session: Session, results: IDialogResult<any>) => {
        await TicketCreationHelper.createTicketIfNeeded(
          results,
          zenDeskDataManager,
          session,
          ZENTicket,
          serviceNowClient,
          session.conversationData.answerAfterStatus
            ? session.conversationData.answerAfterStatus
            : "userFeedback_ticketCreation"
        );

        SessionHelper.sendMessage(session, "rephraseNoIntent_IOLSelfService");
        TicketCreationAfterStatus.otherQuestionsRestartConversation(session);
      }
    ];
  }

  private static otherQuestionsRestartConversation(session: builder.Session) {
    SessionHelper.createChoicePrompt(
      session,
      "userFeedback_otherQuestions",
      ["yes", "no"],
      0
    );
    ConversationDataManager.resetData(session);
    session.endConversation();
  }
  //#endregion
}