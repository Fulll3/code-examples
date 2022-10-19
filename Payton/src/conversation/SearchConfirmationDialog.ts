import { IDialogResult, Session, WaterfallDialog } from "botbuilder";
import { Dialogs } from "./Dialogs";
import { SessionHelper } from "./helpers/SessionHelper";

export class SearchConfirmationDialog extends WaterfallDialog {
  //#region Initialization 
  constructor() {
    super([
      (session: Session) => {
        SessionHelper.createChoicePrompt(
          session,
          "prompt_addMoreInformation",
          ["prompt_yesStartSearch", "prompt_noChangeData"],
          0
        );
      },
      (session: Session, results: IDialogResult<any>) => {
        session.replaceDialog(Dialogs.InvoiceStatus);
      }
    ]);
  }
  //#endregion
}