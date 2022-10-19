import { IIntentDialogOptions, IIntentRecognizerResult, Session } from "botbuilder";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { SessionHelper } from "./helpers/SessionHelper";
import { PaytonParentDialog } from "./PaytonParentDialog";

export class InvoiceStatusDialog extends PaytonParentDialog {
  //#region Initialization
  constructor(dialogOptions: IIntentDialogOptions) {
    super(dialogOptions);
    this.matches("invoiceStatus", this.onInvoiceStatus);
    this.matches("decisionReplies", this.onAddMoreValues);
    this.matches("deleteParameter", this.onDeleteParameter);
  }
  //#endregion

  //#region Private Methods
  protected onHelp(session: Session) {
    session.beginDialog(Dialogs.ContextHelp, {
      fakeMessage: "invoiceStatus",
      helpMessageCode: "invoiceStatusDialogHelp"
    });
    session.replaceDialog(Dialogs.SearchConfirmation);
  }

  private onDeleteParameter = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    var parameters = recognizerResult.entities.filter(entity => (
      entity.type == "deleteParameter" &&
      (entity.entity == "invoice_number" ||
        entity.entity === "po_number" ||
        entity.entity == "date" ||
        entity.entity == "amount")
    ));

    if (parameters.length == 0) {
      session.replaceDialog(Dialogs.NoIntent);
    } else {
      if (parameters[0].entity == "invoice_number") {
        ConversationDataManager.deleteInvoiceNumber(session);
      } else if (parameters[0].entity == "po_number") {
        ConversationDataManager.deletePoNumber(session);
      } else if (parameters[0].entity == "date") {
        ConversationDataManager.deleteDate(session);
      } else if (parameters[0].entity == "amount") {
        ConversationDataManager.deleteAmount(session);
      }

      SessionHelper.sendMessage(session, "deleteParameter", parameters[0].entity);
      if (ConversationDataManager.anyDataFilled(session)) {
        ConversationDataManager.sendQueryInformation(session);
        session.replaceDialog(Dialogs.SearchConfirmation);
      } else {
        session.replaceDialog(Dialogs.ParameterQuery);
      }
    }
  }

  private onAddMoreValues = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    if (recognizerResult.entities[0].entity == "positive" && ConversationDataManager.anyDataFilled(session)) {
      session.replaceDialog(Dialogs.Results);
    } else {
      session.replaceDialog(Dialogs.ParameterQuery);
    }
  }

  private onInvoiceStatus = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    var entityFound = ConversationDataManager.saveConversationData(session, recognizerResult.entities);

    if (entityFound) {
      ConversationDataManager.sendQueryInformation(session);
      session.replaceDialog(Dialogs.SearchConfirmation);
    } else {
      session.replaceDialog(Dialogs.ParameterQuery);
    }
  }
  //#endregion
}