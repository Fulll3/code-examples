import { TurnContext } from "botbuilder";
import { ActivityPrompt, DialogContext, DialogEvent, Prompt, PromptOptions, PromptRecognizerResult, PromptValidator, TextPrompt } from "botbuilder-dialogs";
import {InputHints} from "botframework-schema";
import { Selectors } from "../../data/storage/IPromptOptions";
import { MatchedSelector, WatsonAssistant } from "../../domain/watson/WatsonAssistant";
import { Services } from "../../service/Services";
import { GatherInputDialogOptions } from "../dialogs/GatherInputsDialog";

export interface IPromptReturnValue {
  matchedValues: MatchedSelector[]
}


export class FieldPrompt extends Prompt<IPromptReturnValue>{
  private watson: WatsonAssistant;
  /**
   * Creates a new FieldPrompt instance.
   * @param dialogId  unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
   * @param validator  validator that will be called each time the user responds to the prompt.
   */
  constructor(dialogId: string, validator?: PromptValidator<IPromptReturnValue>) {
      super(dialogId, validator);
      this.watson = Services.instance().get("WatsonAssistantDomain");
  }

  protected async onPrompt(context: TurnContext, state: any, options: PromptOptions, isRetry: boolean): Promise<void> {
    if (isRetry && options.retryPrompt) {
        await context.sendActivity(options.retryPrompt, undefined, InputHints.ExpectingInput);
    } else if (options.prompt) {
        await context.sendActivity(options.prompt, undefined, InputHints.ExpectingInput);
    }
}

protected async onRecognize(context: TurnContext, state: any, options: PromptOptions): Promise<PromptRecognizerResult<IPromptReturnValue>> {
      const validations = <GatherInputDialogOptions>options.validations;

      if (!validations.selectorsSequence) {
        throw new Error(`${FieldPrompt.name}: Missing selectors  in options.validations`)
      }
      if (validations.matchAllSelectorsAtOnce == undefined) {
        throw new Error(`${FieldPrompt.name}: Missing matchAll  in options.validations`)
      }

      const selectorsFoundInWatson = this.watson.getSelectorEntities(this.watson.getMiddlewareMessageOutput(context));
      const mandatorySelectors = this.watson.matchSelectors(context, validations.selectorsSequence, selectorsFoundInWatson);
      if(mandatorySelectors.length > 0){
        const optionalSelectors = this.watson.matchSelectors(context, validations.optionalSelectors, selectorsFoundInWatson);
        const allSelectors = mandatorySelectors.concat(optionalSelectors);
        return {
          succeeded: true,
          value: {
            matchedValues: allSelectors
          }
        }
      } else {
        const matchedNumbers = this.watson.getNumberEntities(this.watson.getMiddlewareMessageOutput(context));
        if(matchedNumbers.length > 0) {
          const value = matchedNumbers[0].value;
          const uknownSelector: MatchedSelector = {
            selector: Selectors.uknown,
            value: value,
            number: value
          } 
          return {
            succeeded: true,
            value: {
              matchedValues: [uknownSelector]
            }
          }
        } else {
          return {
            succeeded: false
          }
        }
      }
    }

protected async onPreBubbleEvent(dc: DialogContext, event: DialogEvent): Promise<boolean> {
    return false;
}
}

