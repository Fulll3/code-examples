import { ComponentDialog, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { use } from "chai";
import { Selectors } from "../../../data/storage/IPromptOptions";
import { UserRepository } from "../../../data/storage/UserRepository";
import { SplunkSimple } from "../../../domain/splunk/SplunkSimple";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom } from "../../AdaptiveCard";
import { LocalizedMessages } from "../../LocalizedMessages";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { GatherInputDialogOptions, GatherInputsDialog } from "../GatherInputsDialog";
import { InitialOptionsDialog } from "../InitialOptionsDialog";

export class ExecutionsDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(name: string, private storage: UserRepository){
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.gatherInput.bind(this),
      this.showResults.bind(this)
    ]))
    .addDialog(new GatherInputsDialog(GatherInputsDialog.name, this.storage));
    this.translator= new LocalizedMessages(ExecutionsDialog.name, storage);
  }

  private gatherInput = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = step.options;
    return await step.beginDialog(GatherInputsDialog.name, options);
  }

  private showResults = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const usecase = await this.storage.getUseCaseNumber(step.context);
    const startDate= Utils.getDateBeforeMonths(12);
    const processStatisticsGrouped = await SplunkSimple.getProcessStatistics(usecase, {startDate,  endDate: new Date()});
    
    if(processStatisticsGrouped.size > 0) {
      AdaptiveCardCustom.sendUsecaseStatisticsCard(step.context,processStatisticsGrouped)
    } else {
      await step.context.sendActivity(`There are no runs for ${usecase} since ${Utils.formatDateToLocaleString(startDate)}`)
    }
    await this.storage.clear(step.context);
    return await step.replaceDialog(InitialOptionsDialog.name);
  }
  public static createDialogOptions = () => {
    const options: GatherInputDialogOptions = {
      selectorsSequence: [Selectors.usecase],
      matchAllSelectorsAtOnce: true,
      optionalSelectors:[]
    }
    return options;
  }
}