import { IDialogResult, Session, WaterfallDialog } from "botbuilder";
import { Dialogs } from "./Dialogs";
import { SessionHelper } from "./helpers/SessionHelper";

export class OptionTwoSearchConfirmation extends WaterfallDialog {
  //#region Initialization 
  constructor() {
    super([
      (session: Session) => {
        SessionHelper.createChoicePrompt(session, " ", ["invoiceCorrect_yes", "invoiceCorrect_no"], 0)
      },
      (session: Session, results: IDialogResult<any>) => {
        session.replaceDialog(Dialogs.Welcome);
      }
    ]);
  }
  //#endregion
}