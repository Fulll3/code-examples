import { IIntentDialogOptions, IIntentRecognizer } from 'botbuilder';

export class WatsonDialogOptions implements IIntentDialogOptions {
  intentThreshold?: number;
  recognizers?: IIntentRecognizer[];

  constructor(recognizer: IIntentRecognizer) {
    this.recognizers = [recognizer];
  }
}