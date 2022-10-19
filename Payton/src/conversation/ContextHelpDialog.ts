import { Session, SimpleDialog } from "botbuilder";
import { SessionHelper } from "./helpers/SessionHelper";

export interface IContextHelpParams {
  fakeMessage?: string;
  sourceDialog?: string;
  helpMessageCode: string;
  replaceParentDialog?: string;
}

export class ContextHelpDialog extends SimpleDialog {
  //#region Initialization
  constructor() {
    super((session: Session, args: IContextHelpParams) => {
      SessionHelper.sendMessages(session, args.helpMessageCode);

      if (args.fakeMessage) {
        session.message.text = session.gettext(args.fakeMessage); //to recall original user intent
      }

      session.endDialog();
    });

  }
  //#end region
}