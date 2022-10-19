import { IIntentRecognizer, IIntentRecognizerResult, RecognizeMode, Session } from 'botbuilder';
import { Dialogs } from "./Dialogs";
import { PaytonParentDialog } from "./PaytonParentDialog";
import { SessionHelper } from './helpers/SessionHelper';

export class RootDialog extends PaytonParentDialog {

  //#region Initialization
  constructor(recognizer: IIntentRecognizer) {
    super({ recognizers: [recognizer], recognizeMode: RecognizeMode.onBeginIfRoot });
    this.matches('invoiceStatus', this.onInvoiceStatus);
    this.matches("decisionReplies", this.yesNoAnswer);
  }
  //#endregion

  //#region Private Methods
  private onInvoiceStatus = (session: Session) => {
    session.replaceDialog(Dialogs.InvoiceStatus);
  }

  private yesNoAnswer = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    if (recognizerResult.entities[0].entity == "positive") {
      SessionHelper.sendMessage(session, "conversationEnding_HowCanIHelpYou");
    } else {
      SessionHelper.sendMessage(session, "conversationEnding_ThankYou");
    }
  }
  //#endregion
}