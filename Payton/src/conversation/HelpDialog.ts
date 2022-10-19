import * as builder from "botbuilder";
import { IDialogResult, Session } from "botbuilder";
import { config } from "../config";
import { Dialogs } from "./Dialogs";
import { SessionHelper } from "./helpers/SessionHelper";

export class HelpDialog extends builder.WaterfallDialog {

  //#region Initialization
  constructor() {
    super([
      (session: Session) => {
        SessionHelper.createChoicePrompt(
          session,
          "helpGeneralText",
          [
            "helpQuestion1",
            "helpQuestion2",
            "helpQuestion3",
            "helpQuestion4"
          ]
        );
      },
      (session: Session, results: IDialogResult<any>) => {
        if (results.response) {
          console.log("HelpDialog - Choice prompt index result:", results.response.index);
          switch (results.response.index) {
            case 0: {
              SessionHelper.sendMessage(session, "helpAnswer1");
              break;
            }
            case 1: {
              SessionHelper.sendMessage(session, "helpAnswer2");
              break;
            }
            case 2: {
              SessionHelper.sendMessage(session, "helpAnswer3");
              break;
            }
            case 3: {
              SessionHelper.sendMessage(session, "helpAnswer4");
              break;
            }
          }

          SessionHelper.createChoicePrompt(
            session,
            "helpMoreQuestion",
            [
              "helpMoreQuestions_Yes",
              "helpMoreQuestions_No"
            ],
            0
          );
        }
      },
      async (session: Session, results: IDialogResult<any>) => {
        var treshold = config.get("NLP_Treshold") as number;
        if (results.response && results.response.index === 0 && results.response.score > treshold) {
          session.replaceDialog(Dialogs.Help);
        } else if (results.response && results.response.index === 1 && results.response.score > treshold) {
          SessionHelper.sendMessage(session, "helpReturnPreviousConversation");
          SessionHelper.sendMessage(session, "howMayIHelpYou");
           
          session.endDialog();
        } else {
          session.clearDialogStack();
          session.endDialog();
          session.beginDialog(Dialogs.InvoiceStatus);
        }
      }
    ]);
  }
  //#end region
}