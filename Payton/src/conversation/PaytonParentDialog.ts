import { IDialogWaterfallStep, IIntentDialogOptions, IIntentRecognizerResult, IntentDialog, Session } from "botbuilder";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { SessionHelper } from "./helpers/SessionHelper";

export class PaytonParentDialog extends IntentDialog {
  //#region Initialization
  constructor(dialogOptions: IIntentDialogOptions, onDefault?: string | IDialogWaterfallStep[] | IDialogWaterfallStep) {
    super(dialogOptions);
    this.matches("restart", Dialogs.Reset);
    this.matches('help', this.onHelp);
    this.matches("goodbye", this.onGoodBye);
    this.matches('greetings', this.onWelcome);
    this.onDefault(onDefault
      ? onDefault
      : this.onNoIntent
    );
  }
  //#endregion

  //#region Private Methods
  private onGoodBye = (session: Session, recognizerResult: IIntentDialogOptions) => {
    if (ConversationDataManager.anyDataFilled(session)) {
      session.beginDialog(Dialogs.Feedback);
      session.endDialog();
    } else {
      SessionHelper.sendMessage(session, "goodbye");
      session.endDialog();
    }
  }

  protected onNoIntent = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    var entityFound = ConversationDataManager.saveConversationData(session, recognizerResult.entities);

    if (entityFound) {
      ConversationDataManager.sendQueryInformation(session);
      session.replaceDialog(Dialogs.SearchConfirmation);
    } else {
      session.replaceDialog(Dialogs.NoIntent);
    }
  }

  protected onHelp(session: Session) {
    session.beginDialog(Dialogs.Help);
  }

  private onWelcome = (session: Session) => {
    session.replaceDialog(Dialogs.Welcome);
  }
  //#endregion
}