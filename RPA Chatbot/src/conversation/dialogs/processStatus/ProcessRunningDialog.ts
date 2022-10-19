import { ComponentDialog, DialogTurnResult, TextPrompt, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { Selectors } from "../../../data/storage/IPromptOptions";
import { UserRepository } from "../../../data/storage/UserRepository";
import { SplunkSimple } from "../../../domain/splunk/SplunkSimple";
import { ProcessStatus } from "../../../domain/splunk/values/ProcessRun";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom } from "../../AdaptiveCard";
import { LocalizedMessages } from "../../LocalizedMessages";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { GatherInputDialogOptions, GatherInputsDialog } from "../GatherInputsDialog";
import { InitialOptionsDialog } from "../InitialOptionsDialog";

export class ProcessRunningDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(name: string, private storage: UserRepository){
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.gatherInput.bind(this),
      this.showResults.bind(this)
    ]))
    .addDialog(new GatherInputsDialog(GatherInputsDialog.name, this.storage));
    this.translator= new LocalizedMessages(ProcessRunningDialog.name, storage);
  }

  private gatherInput = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = step.options;
    return await step.beginDialog(GatherInputsDialog.name, options);
  }

  private showResults = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const usecaseNumber = await this.storage.getUseCaseNumber(step.context);
    const isUserFromSiemensEnergy = await this.storage.getIsUserFromSiemensEnergy(step.context);
    const processes = await SplunkSimple.getProcessRuns({
      usecaseNumber
    }, isUserFromSiemensEnergy)
    let messageToUser;
    if(processes.length === 0) {
      messageToUser = `There are no runs for ${usecaseNumber} since ${Utils.formatDateToLocaleString(SplunkSimple.getLatestSearchingDate())}`
    } else {
      
      if(processes[0].isRunning()) {
        messageToUser= `Usecase ${usecaseNumber} is running since ${processes[0].getStarted()}`;
      } else {
        const latestProcess  = processes[0];
        messageToUser = `Usecase ${usecaseNumber} is currently not running. Last run started on ${latestProcess.getStarted(true)} at ${latestProcess.getStarted(false, true)} and it was ${latestProcess.getStatus()} at ${latestProcess.getFinishedAt(false, true)}.`
      }
    }
    await step.context.sendActivity(messageToUser);
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