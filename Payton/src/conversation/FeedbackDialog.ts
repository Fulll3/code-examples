import * as builder from "botbuilder";
import * as querystring from "querystring"
import { IDialogResult, Session } from "botbuilder";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { SessionHelper } from "./helpers/SessionHelper";
import { MetricsManager } from "./metrics/MetricManager";

export class FeedbackDialog extends builder.WaterfallDialog {

  //#region Initialization
  constructor() {
    super(FeedbackDialog.onStart());
  }
  //#endregion

  //#region Private Methods
  private static onStart(): builder.IDialogWaterfallStep[] {
    return [
      (session: Session) => {
        SessionHelper.createChoicePrompt(session, "userFeedback_question", ["yes", "no"]);
      },
      (session: Session, results: IDialogResult<any>) => {
        if (results.response.index === 0) {
          MetricsManager.trackUserFeedback(session, "positive");
          FeedbackDialog.sendSurvey(session);
          SessionHelper.sendMessage(session, "userFeedback_positive");
          ConversationDataManager.resetData(session);
          session.endConversation();
        } else {
          MetricsManager.trackUserFeedback(session, "negative");
          session.replaceDialog(Dialogs.TicketCreationDialog);
        }
      }
    ];
  }

  private static sendSurvey(session: Session): void {
    const userInfo = {
      Email: ConversationDataManager.getUserEmail(session),
      FirstName: ConversationDataManager.getUserFirstName(session),
      LastName: ConversationDataManager.getUserLastName(session),
    }
    const formattedUserInfo = querystring.stringify(userInfo);

    if (session.preferredLocale().toLowerCase().includes("en")) {
      SessionHelper.sendMessage(
        session, 
        "userFeedback_survey", 
        formattedUserInfo
      );
    }
  }
  //#endregion
}