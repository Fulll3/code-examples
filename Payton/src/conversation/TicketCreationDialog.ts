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
import { IServiceNowClient } from "../business/data/ServiceNow/IServiceNowClient";

export class TicketCreationDialog extends builder.WaterfallDialog {
  private static logger: Logger = new Logger("TicketCreationDialog");

  //#region Initialization
  constructor(ZENDeskClient: IZENDeskClient, serviceNowClient: IServiceNowClient, zenDeskDataManager: IZENDeskDataManager, healthCheckManager: HealthManager) {
    super(TicketCreationDialog.onStart(ZENDeskClient, serviceNowClient, zenDeskDataManager, healthCheckManager));

    this.beginDialogAction(
      "TicketCreationDialogHelp",
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
  private static onStart(ZENTicket: IZENDeskClient, serviceNowClient: IServiceNowClient, zenDeskDataManager: IZENDeskDataManager, healthCheckManager: HealthManager): builder.IDialogWaterfallStep[] {
    return [
      (session: Session, dialogArgs) => {
        if (healthCheckManager.isServiceHealthy(HealthMonitors.SERVICENOW)) {
          if (!(dialogArgs && dialogArgs.skipFirstMessage)) {
            SessionHelper.sendMessage(session, "userFeedback_negative_1");
          }
          SessionHelper.sendMessage(session, "userFeedback_IOLSelfService");

          SessionHelper.createChoicePromptAdvanced(
            session,
            "userFeedback_createTicketQuestion",
            ["yes", "no"],
            {
              listStyle: builder.ListStyle.button,
              promptAfterAction: true
            }
          );
        } else {
          SessionHelper.sendMessage(session, "zendeskUnavaiable");
          TicketCreationDialog.otherQuestionAndRestart(session);
        }
      },
      async (session: Session, results: IDialogResult<any>) => {
        await TicketCreationHelper.createTicketIfNeeded(results, zenDeskDataManager, session, ZENTicket, serviceNowClient, "userFeedback_ticketCreation");

        TicketCreationDialog.otherQuestionAndRestart(session);
      }
    ];
  }

  private static otherQuestionAndRestart(session: builder.Session) {
    SessionHelper.createChoicePrompt(session, "userFeedback_otherQuestions", ["yes", "no"], 0);
    ConversationDataManager.resetData(session);
    session.endConversation();
  }
  //#endregion
}