import {
  WaterfallStepContext,
  ComponentDialog,
  WaterfallDialog,
  DialogTurnResult,
  ChoicePrompt,
  PromptOptions,
} from "botbuilder-dialogs";
import { LocalizedMessages } from "../LocalizedMessages";
import { Logger } from "botanica";
import { UserRepository } from "../../data/storage/UserRepository";
import { DialogStack } from "../DialogStack";

import { Selectors } from "../../data/storage/IPromptOptions";
import { matches } from "lodash";
import { IPromptReturnValue } from "../prompts/FieldPrompt";
import { defaultClient } from "applicationinsights";
import { MatchedSelector, WatsonAssistant } from "../../domain/watson/WatsonAssistant";
import { Services } from "../../service/Services";
import { RECOGNITION, SELECTOR } from "../../middlewares/watson/WatsonAssistantMiddleware";
import { RuntimeEntity } from "ibm-watson/assistant/v2";
import { TurnContext } from "botbuilder";
import { HeroCardHelper } from "../HeroCardHelper";
import { SelectorSearchConfig } from "./GatherInputHelper";

export type GatherInputDialogOptions = {
  selectorsSequence: Selectors[];
  matchAllSelectorsAtOnce: boolean;
  optionalSelectors: Selectors[];
  selectorSearchConfig?: SelectorSearchConfig;
  ignoreIntialNumbersInSearch?: boolean
};

/**
 * This dialog tries to help the user providing general information
 * about the bot.
 */
export class GatherInputsDialog extends ComponentDialog {
  private readonly logger = new Logger(GatherInputsDialog.name);
  private watson: WatsonAssistant;
  private readonly ID_PROMPT = "IdPrompt";
  private readonly CHOICE_PROMPT = "GatherInputChoicePrompt";
  private localization: LocalizedMessages = new LocalizedMessages(GatherInputsDialog.name, this.storage);
  constructor(name: string, private storage: UserRepository) {
    super(name);
    this.addDialog(
      new WaterfallDialog(WaterfallDialog.name, [
        this.promptForSearchInput.bind(this),
        this.evaluateReponse.bind(this),
        this.confirmInput.bind(this)
      ])
    ).addDialog(new ChoicePrompt(this.CHOICE_PROMPT));
    DialogStack.registerValidatorPrompt(this, this.ID_PROMPT);
    this.watson = Services.instance().get("WatsonAssistantDomain");
    this.logger.debug(`constructor initialized`);
  }

  private async promptForSearchInput(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const options = <GatherInputDialogOptions>step.options;
    this.validateOptions(options);
    const selectorsFoundInWatson = this.watson.getSelectorEntities(
      this.watson.getMiddlewareMessageOutput(step.context)
    );
    const matchedNumberEntities = this.watson.getNumberEntities(this.watson.getMiddlewareMessageOutput(step.context));
    if (selectorsFoundInWatson && selectorsFoundInWatson.length > 0) {
      return await this.handleWatsonRecognition(step, options, selectorsFoundInWatson);
    } else if (matchedNumberEntities.length > 0 && !options.ignoreIntialNumbersInSearch) {
      const value = matchedNumberEntities[0].value;
      const uknownSelector: MatchedSelector = {
        selector: Selectors.uknown,
        value: value,
        number: value
      }
      const result = {
        matchedValues: [uknownSelector]
      }
      return await step.next(result)
    } else {
      return await this.sendSelectorPrompt(options, step);
    }
  }

  private async evaluateReponse(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const options = <GatherInputDialogOptions>step.options;
    const result = <IPromptReturnValue>step.result;
    const matchedEntity = result.matchedValues[0];

    if (matchedEntity.selector === Selectors.uknown) {
      if (options.selectorSearchConfig === SelectorSearchConfig.robotOnly) {
        matchedEntity.selector = Selectors.robot;
        result.matchedValues = [matchedEntity];
      } else if (this.isUsecase(matchedEntity.number, options)) {
        matchedEntity.selector = Selectors.usecase;
        result.matchedValues = [matchedEntity];
      } else {
        const choices = [this.formatSelectorValue(Selectors.usecase, matchedEntity.number), this.formatSelectorValue(Selectors.robot, matchedEntity.number), "return back to main menu"];
        const promptOptions: PromptOptions = HeroCardHelper.getPromptOptions(step.context, choices, "Please confirm your search.", "Please click on buttons below to continue.");
        return await step.prompt(this.CHOICE_PROMPT, promptOptions);
      }
    }
    await this.saveSelectors(step.context, result.matchedValues);
    await this.sendFinalMessage(result.matchedValues, step);
    return await step.endDialog();
  }

  private async confirmInput(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const selectors = this.watson.matchSelectors(step.context, [Selectors.usecase, Selectors.robot], this.watson.getSelectorEntities(undefined, step.context));
    await this.saveSelectors(step.context, selectors);
    await this.sendFinalMessage(selectors, step);
    return await step.endDialog();
  }


  private isUsecase = (value: string, options: GatherInputDialogOptions) => {
    if (Number(value) > 500 || options.selectorSearchConfig === SelectorSearchConfig.usecaseOnly) {
      //Numbers above 500 are assumed to be usecase.
      return true;
    } else {
      return false;
    }
  }

  private getSelectorText = (selectorName: string) => {
    if (selectorName === Selectors.robot) {
      return "Robot number";
    } else if (selectorName === Selectors.usecase) {
      return "RPA Use Case number (IPA/SDMND)";
    } else {
      return "";
    }
  };

  private async saveSelectors(context: TurnContext, matchedSelectors: MatchedSelector[]) {
    for (const match of matchedSelectors) {
      await this.storage.saveGartheredValue(context, match.selector, this.formatSelectorValue(match.selector, match.number));
    }
  }
  private formatSelectorValue = (selector: Selectors, selectorValue: string): string => {
    const lastestIPANumber = 1600;
    let formatedValue = selectorValue;
    if (selector === Selectors.usecase) {
      formatedValue = Number(selectorValue) > lastestIPANumber ? `SDMND${selectorValue.padStart(7, "0")}` : `IPA${selectorValue.padStart(4, "0")}`
    } else if (selector === Selectors.robot) {
      formatedValue = `R${selectorValue.padStart(3, "0")}`;
    }
    return formatedValue;
  }
  private async handleWatsonRecognition(
    step: WaterfallStepContext,
    options: GatherInputDialogOptions,
    selectorsFoundInWatson: RuntimeEntity[]
  ): Promise<DialogTurnResult> {
    const optionalSelectors = this.watson.matchSelectors(
      step.context,
      options.optionalSelectors,
      selectorsFoundInWatson
    );
    if (optionalSelectors) {
      await this.saveSelectors(step.context, optionalSelectors);
    }
    const mandatorySelectors = this.watson.matchSelectors(
      step.context,
      options.selectorsSequence,
      selectorsFoundInWatson
    );
    if (mandatorySelectors) {
      await this.saveSelectors(step.context, mandatorySelectors);
      const allSelectors = mandatorySelectors.concat(optionalSelectors);
      await this.sendFinalMessage(allSelectors, step);
      return await step.endDialog();
    } else {
      //mandatory selector is missing
      return await this.sendSelectorPrompt(options, step);
    }
  }
  private async sendSelectorPrompt(options: GatherInputDialogOptions, step: WaterfallStepContext<{}>) {
    let mainSelectorText = ""
    for (const selector of options.selectorsSequence) {
      mainSelectorText += ` ${this.getSelectorText(selector)} or`;
    }
    mainSelectorText = mainSelectorText.substring(0, mainSelectorText.length - 3);
    const optionalSelectorText = this.getSelectorText(options.optionalSelectors[0]);
    const optionalPromptText = optionalSelectorText
      ? ` and optionally ${optionalSelectorText} if want to narrow results`
      : "";
    const promptText = `Please send me your ${mainSelectorText}${optionalPromptText}.`;
    let retryPrompt = this.getRetryPromp(options);
    return await step.prompt(this.ID_PROMPT, {
      validations: options,
      prompt: promptText,
      retryPrompt: retryPrompt,
    });
  }

  private getRetryPromp(options: GatherInputDialogOptions) {
    let retryPrompt = "";
    if (this.isUseCaseMandatorySelector(options)) {
      retryPrompt =
        "I wasn't able to identify RPA use case. Please enter use case in following format: IPA1234(4 digits) or SMND1234567(7 digits).";
    } else if (this.isRobotMandatorySelector(options) && !this.isUseCaseMandatorySelector(options)) {
      retryPrompt =
        "I wasn't able to indentify robot number. Please enter robot number in following format: R1234(4 digits).";
    }
    return retryPrompt;
  }

  private validateOptions(options: GatherInputDialogOptions) {
    if (options.matchAllSelectorsAtOnce == undefined) {
      throw new Error("matchAllSelectorsAtOnce is not set in beginDialog options");
    }
    if (options.selectorsSequence == undefined) {
      throw new Error("selectorsSequence is not set in beginDialog options");
    }
    if (options.optionalSelectors == undefined) {
      throw new Error("optionalSelectors is not set in beginDialog options");
    }
  }

  private isUseCaseMandatorySelector(options: GatherInputDialogOptions) {
    return options.selectorsSequence.find((selector) => selector === Selectors.usecase);
  }
  private isRobotMandatorySelector(options: GatherInputDialogOptions) {
    return options.selectorsSequence.find((selector) => selector === Selectors.robot);
  }

  private async sendFinalMessage(matchedSelector: MatchedSelector[], step: WaterfallStepContext<{}>) {
    let inputConfirmationText = "Thank you. Please give me a moment while I am searching for data regarding";
    for (const match of matchedSelector) {
      inputConfirmationText += ` ${this.formatSelectorValue(match.selector, match.number)} and`;
    }
    inputConfirmationText = inputConfirmationText.slice(0, -3);
    await step.context.sendActivity(inputConfirmationText);
  }
}

export interface IValidationMatch {
  name: Selectors;
  value: string;
  isMandatoryField: boolean;
}
