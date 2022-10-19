import { Logger } from 'botanica';
import * as builder from 'botbuilder';
import { IDialogResult, IIntentRecognizer, Session } from 'botbuilder';
import { IWatsonAssistantRecognizer } from '../business/conversation/bot/IWatsonAssistantRecognizer';
import * as LocalizationManager from './bot/LocalizationManager';
import { Dialogs } from './Dialogs';
import { ConversationDataManager } from './helpers/ConversationDataManager';
import { SessionHelper } from './helpers/SessionHelper';

//#region Functions 
export function requestParameter(session: Session, results: IDialogResult<any>, promptParams: IPromptParams) {
  const parameterText = LocalizationManager.getText(session, promptParams.parameterText);
  if (results.response && results.response.entity == parameterText && results.response.score > promptParams.treshold) {
    session.dialogData.queryType = parameterText;
    SessionHelper.saveCustomMessageToHistory2(session, session.gettext(promptParams.provideParameterText));

    builder.Prompts.text(
      session,
      LocalizationManager.getText(session, promptParams.provideParameterText),
      {
        maxLength: 20,
        message: LocalizationManager.getText(session, promptParams.validationMessageCode)
      } as any
    );

    return true;
  }

  return false;
}

export function requestParameterAmount(session: Session, results: IDialogResult<any>, promptParams: IPromptParams) {
  const parameterText = LocalizationManager.getText(session, promptParams.parameterText);
  if (results.response && results.response.entity == parameterText && results.response.score > promptParams.treshold) {
    session.dialogData.queryType = parameterText;
    SessionHelper.saveCustomMessageToHistory2(session, session.gettext(promptParams.provideParameterText));

    builder.Prompts.text(
      session,
      LocalizationManager.getText(session, promptParams.provideParameterText),
      {
        maxLength: 20,
        message: LocalizationManager.getText(session, promptParams.validationMessageCode),
        retryPrompt: LocalizationManager.getText(session, "prompt_amountRetryMessage"),
        validMessageRegex: "^[+-]?(.\\d+(,\\d{3})*(\\.\\d+)?|\\d+(,\\d{3})*(\\.\\d+)?\\s?\\w{3}|\\d)$"
      } as any
    );

    return true;
  }

  return false;
}

export function requestTimeParameter(session: Session, results: IDialogResult<any>, parameterText: string, provideParameterText: string) {
  parameterText = LocalizationManager.getText(session, parameterText);
  if (results.response && results.response.entity == parameterText) {
    session.dialogData.queryType = parameterText;

    SessionHelper.saveCustomMessageToHistory2(session, session.gettext(provideParameterText));

    builder.Prompts.time(
      session,
      LocalizationManager.getText(session, provideParameterText),
      {
        retryPrompt: LocalizationManager.getText(session, "prompt_dateRetryMessage")
      }
    );

    return true;
  }

  return false;
}

export function requestNumberParameter(session: Session, results: IDialogResult<any>, parameterText: string, provideParameterText: string): boolean {
  parameterText = LocalizationManager.getText(session, parameterText);
  if (results.response && results.response.entity == parameterText) {
    session.dialogData.queryType = session, parameterText;

    SessionHelper.saveCustomMessageToHistory2(session, session.gettext(provideParameterText));
    builder.Prompts.number(
      session,
      LocalizationManager.getText(session, provideParameterText)
    );

    return true;
  }

  return false;
}
//#endregion

export interface IPromptParams {
  parameterText: string;
  provideParameterText: string;
  validationMessageCode?: string;
  minLength?: number;
  maxLength?: number;
  treshold?: number;
}

export class GatherParametersDialog extends builder.WaterfallDialog {
  private recognizer: IWatsonAssistantRecognizer;
  private readonly invoicePromptParams: IPromptParams = {
    parameterText: "promptChoiceTitle_invoiceNumber",
    provideParameterText: "promptText_provideInvoice",
    validationMessageCode: "promptValidation_invoiceNumber",
    maxLength: 22,
    treshold: 0.65
  };

  private readonly amountPromptParams: IPromptParams = {
    parameterText: "promptChoiceTitle_amount",
    provideParameterText: "promptText_provideAmount",
    validationMessageCode: "promptValidation_amount",
    maxLength: 20,
    treshold: 0.65
  }

  private readonly poNumberParams: IPromptParams = {
    parameterText: "promptChoiceTitle_poNumber",
    provideParameterText: "promptText_providePoNumber",
    validationMessageCode: "promptValidation_poNumber",
    maxLength: 10,
    minLength: 5,
    treshold: 0.65
  }

  //#region Initialization 
  constructor(recognizer: IIntentRecognizer) {
    super([
      (session: Session) => {
        SessionHelper.createChoicePrompt(
          session,
          "promptTitle_gatherData",
          ["promptChoiceTitle_invoiceNumber", "promptChoiceTitle_amount", "promptChoiceTitle_date", "promptChoiceTitle_poNumber"],
          0
        );
      },
      (session: Session, results: IDialogResult<any>) => {
        if (new RegExp("\\d").test(session.message.text)) {
          session.replaceDialog(Dialogs.InvoiceStatus);
        } else {
          var answered = requestParameter(session, results, this.invoicePromptParams);
          answered = answered || requestParameterAmount(session, results, this.amountPromptParams);
          answered = answered || requestTimeParameter(session, results, "promptChoiceTitle_date", "promptText_provideDate");
          answered = answered || requestParameter(session, results, this.poNumberParams);

          if (!answered) {
            session.clearDialogStack();
            session.replaceDialog(Dialogs.InvoiceStatus);
          }
        }
      },
      async (session: Session, results: IDialogResult<any>) => {
        const logger = new Logger(GatherParametersDialog.name);
        try {
          if (session.dialogData.queryType == LocalizationManager.getText(session, "promptChoiceTitle_invoiceNumber")) {
            ConversationDataManager.saveInvoiceNumber(session, results.response);
          } else if (session.dialogData.queryType == LocalizationManager.getText(session, "promptChoiceTitle_date")) {
            ConversationDataManager.saveDate(session, builder.EntityRecognizer.resolveTime([results.response]));
          } else if (session.dialogData.queryType == LocalizationManager.getText(session, "promptChoiceTitle_amount")) {
            await ConversationDataManager.saveAmount(session, results.response, this.recognizer);
          } else if (session.dialogData.queryType == LocalizationManager.getText(session, "promptChoiceTitle_poNumber")) {
            ConversationDataManager.savePoNumber(session, results.response);
          }

          SessionHelper.sendMessage(session, "thanksForNewParameter", session.dialogData.queryType, results.response.entity ? results.response.entity : results.response);
          logger.debug(`Sending query information. Session data: ${session}`);
          ConversationDataManager.sendQueryInformation(session);

          session.replaceDialog(Dialogs.SearchConfirmation);
        } catch (e) {
          logger.error(e);
        }
      }
    ]);
    this.recognizer = recognizer as IWatsonAssistantRecognizer;

    this.beginDialogAction(
      "GatherParametersHelp",
      Dialogs.ContextHelp,
      {
        matches: "help",
        dialogArgs: {
          fakeMessage: "invoiceStatus",
          helpMessageCode: "invoiceStatusDialogHelp"
        }
      }
    );
  }
  //#endregion
}