import { Logger } from "botanica";
import { IIntentDialogOptions, IIntentRecognizerResult, Session } from "botbuilder";
import { config } from "../config";
import { QnAMakerFacade } from "./bot/QnAMakerFacade";
import { Dialogs } from "./Dialogs";
import { ConversationDataManager } from "./helpers/ConversationDataManager";
import { SessionHelper } from "./helpers/SessionHelper";
import { PaytonParentDialog } from "./PaytonParentDialog";

export class NoIntentDialog extends PaytonParentDialog {
  private qnaMaker: QnAMakerFacade;
  private qnaSimilarityTreshold: number;
  private logger = new Logger(NoIntentDialog.name);

  //#region Initialization 
  constructor(dialogOptions: IIntentDialogOptions, qnaMaker: QnAMakerFacade) {
    super(dialogOptions, onNoIntentFunction);
    this.qnaMaker = qnaMaker;
    this.onBegin(this.onNoneIntent)
      .matches(Dialogs.InvoiceStatus, this.onInvoiceStatus)
      .matches("none", this.onNoneIntent)
      .matches('faq', this.onNoneIntent)
      .onDefault(this.onNoneIntent);
    this.qnaSimilarityTreshold = config.get("QnA_SimilarityTresholdInPercent");
  }
  //#endregion

  //#region Private Methods
  private onNoneIntent = (session: Session, recognizerResult: IIntentRecognizerResult) => {
    try {
      if (this.qnaMaker) {
        this.qnaMaker.getAnswers(
          session.message.text,
          session.message.address.conversation.id,
          ConversationDataManager.isInternal(session),
          session.preferredLocale()
        ).then((result) => {
          this.logger.debug(`QnA maker result: ${JSON.stringify(result)}`);
          if (result.length == 0 || result[0].score === 0) {
            onNoIntentFunction(session);
          } else if (result.length > 1 && result[0].score != 1 && result[0].score - this.qnaSimilarityTreshold < result[1].score) {
            SessionHelper.createChoicePrompt(
              session,
              "qna_chooseValidQuestion",
              [result[0].questions[0], result[1].questions[0]],
              0
            );
            session.endDialog();
          } else {
            session.dialogData.noIntentCounter = 0;
            let answer = result[0].answer;
            const splitAnswers = answer.split("|");
            if (splitAnswers.length > 1) {
              const position = this.getRandomInt(0, splitAnswers.length);
              answer = splitAnswers[position];
            }
            SessionHelper.sendMessage(session, answer);
          }
        });
      } else {
        onNoIntentFunction(session);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
  private onInvoiceStatus(session: Session, recognizerResult: IIntentRecognizerResult) {
    session.clearDialogStack();
    session.replaceDialog(Dialogs.Root);
  }
  //#endregion
}

function onNoIntentFunction(session: Session) {
  session.dialogData.noIntentCounter = session.dialogData.noIntentCounter ? session.dialogData.noIntentCounter + 1 : 1;
  if (session.dialogData.noIntentCounter && session.dialogData.noIntentCounter > 1) {
    SessionHelper.sendMessage(session, "rephraseNoIntent_finalNoData");
    SessionHelper.sendMessage(session, "rephraseNoIntent_IOLSelfService");
    SessionHelper.createChoicePrompt(
      session,
      "userFeedback_otherQuestions",
      ["yes", "no"],
      0
    );
    session.endDialog();
  } else {
    SessionHelper.sendMessage(session, "rephraseNoIntent");
  }
}
