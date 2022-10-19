import { IPromptTextFeatures, PromptText } from "botbuilder";

export class ValidatedPromptText extends PromptText {

  constructor(features?: IPromptTextFeatures) {
    super(features);
    this.features.disableRecognizer = true;

    this.onRecognize(
      (context, cb) => {
        var text = context.message.text;
        if (text) {
          var options = context.dialogData.options;

          if ((options.minLength && text.length < Number(options.minLength)) ||
            (options.maxLength && text.length > Number(options.maxLength))) {
            cb(null, 0.0);
          } else if (options.validMessageRegex && !new RegExp(options.validMessageRegex).test(text)) {
            cb(null, 0.0);
          } else {
            cb(null, this.features.recognizeScore, text);
          }
        } else {
          cb(null, 0.0);
        }
      }
    );
  }
}