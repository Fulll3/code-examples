import { IIntentDialogOptions, IntentDialog, Session } from 'botbuilder';
import { Dialogs } from './Dialogs';
import { ConversationDataManager } from './helpers/ConversationDataManager';
import { SessionHelper } from './helpers/SessionHelper';

export class WelcomeDialog extends IntentDialog {
  //#region Initialization 
  constructor(dialogOptions: IIntentDialogOptions) {
    super(dialogOptions);
    this.matches(Dialogs.Welcome, this.onWelcome);
    this.matches('help', this.onHelp)
    this.onDefault(this.onWelcome);
  }
  //#endregion

  //#region Private Methods 
  private onWelcome = (session: Session) => {
    SessionHelper.sendMessage(session, "greetingSecondMessage");
    session.endDialog();
  }

  private onHelp(session: Session) {
    session.replaceDialog(Dialogs.Root);
  }

  private onlyGreeting(session: Session) {
    SessionHelper.sendMessage(session, "greeting");
    session.endDialog();
  }

  private greetingWithData(session: Session) {
    ConversationDataManager.sendQueryInformationWithGreeting(session);
    session.replaceDialog(Dialogs.OptionTwoSearchConfirmation);
  }
  //#endregion
}