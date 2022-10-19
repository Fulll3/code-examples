import { start } from "applicationinsights";
import { ComponentDialog, DialogTurnResult, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { Selectors } from "../../../data/storage/IPromptOptions";
import { UserRepository } from "../../../data/storage/UserRepository";
import { SplunkSimple } from "../../../domain/splunk/SplunkSimple";
import { ProcessRun } from "../../../domain/splunk/values/ProcessRun";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom, AdaptiveCardsFolder } from "../../AdaptiveCard";
import { LocalizedMessages } from "../../LocalizedMessages";
import { TableBuilder } from "../../TableBuilder";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { GatherInputHelper, SelectorSearchConfig } from "../GatherInputHelper";
import { GatherInputDialogOptions, GatherInputsDialog } from "../GatherInputsDialog";
import { InitialOptionsDialog } from "../InitialOptionsDialog";
import { ExecutionsDialog } from "./ExecutionsDialog";

export type SpecificDateRange = {
  startDate: Date,
  endDate?: Date

}

export enum ProcessStatus {
  terminated = "terminated",
  completed = "completed"
}
export type UseCaseRunHistoryDialogOptions = {
  selectorSettings: GatherInputDialogOptions;
  onlyLastRun: boolean;
  dateFilter?: SpecificDateRange;
  processStatusFilter?: ProcessStatus;
  numberOfResults?: number;

}

export class UseCaseRunHistoryDialog extends ComponentDialog {
  private translator: LocalizedMessages;
  constructor(name: string, private storage: UserRepository) {
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.gatherInputs.bind(this),
      this.sendLastRunDetails.bind(this)
    ]))
      .addDialog(new GatherInputsDialog(GatherInputsDialog.name, this.storage));
    this.translator = new LocalizedMessages(ExecutionsDialog.name, storage);
  }

  private gatherInputs = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = <UseCaseRunHistoryDialogOptions>step.options;
    if (!options.selectorSettings) {
      throw new Error("selector settings must be provided in beginDialog options!");
    }

    return await step.beginDialog(GatherInputsDialog.name, options.selectorSettings);
  }
  private sendLastRunDetails = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const usecaseNumber = await this.storage.getUseCaseNumber(step.context);
    const robotNumber = await this.storage.getRobotNumber(step.context);
    const options = <UseCaseRunHistoryDialogOptions>step.options;
    const isUserFromSiemensEnergy = await this.storage.getIsUserFromSiemensEnergy(step.context);
    let results = await SplunkSimple.getProcessRuns({
      usecaseNumber,
      robotNumber,
      specificDateRange: options.dateFilter,
      onlyLastRun: options.onlyLastRun,
      status: options.processStatusFilter
    }, isUserFromSiemensEnergy)
    const messageToUser = this.generateMessageToUser(options, results, usecaseNumber, robotNumber);
    if (results.length > 0) {
      const MAX_BULK_LENGTH = 30;
      results = results.slice(0,MAX_BULK_LENGTH);
      await AdaptiveCardCustom.sendUsecaseHistoryCard(step.context, results);
    } else {
      await step.context.sendActivity(messageToUser);
    }
    await this.storage.clear(step.context);
    return await step.replaceDialog(InitialOptionsDialog.name);
  }

  private generateMessageToUser(options: UseCaseRunHistoryDialogOptions, data: ProcessRun[], usecase: string, robotNumber: string) {
    const noResultsFound = data.length === 0;
    let messageToUser;
    if (options.processStatusFilter === ProcessStatus.terminated) {
      messageToUser = this.getTerminationText(data, messageToUser, options, usecase);
    } else if (options.onlyLastRun) {
      if (noResultsFound) {
        messageToUser = `There are no runs for ${usecase ? usecase : robotNumber} since ${Utils.formatDateToLocaleString(SplunkSimple.getLatestSearchingDate(), false, true)}`;
      }
    } else if (options.dateFilter) {
      messageToUser = this.getDateRangeText(options, messageToUser, noResultsFound, usecase);
    }
    return messageToUser;
  }
  public static createDialogOptions = (
    searchConfig: SelectorSearchConfig,
    onlyLastRun: boolean,
    dateFilter?: SpecificDateRange,
    processStatusFilter?: ProcessStatus,
    numberOfResults?: number,
    ignoreIntialNumbersInSearch = false
  ): UseCaseRunHistoryDialogOptions => {
    let selectorSettings = GatherInputHelper.getOptions(searchConfig, ignoreIntialNumbersInSearch);
    return {
      selectorSettings,
      onlyLastRun,
      dateFilter,
      processStatusFilter,
      numberOfResults
    }
  }

  private getDateRangeText(options: UseCaseRunHistoryDialogOptions, messageToUser: any, noResultsFound: boolean, usecase: string) {
    const startDate = options.dateFilter.startDate;
    const endDate = options.dateFilter.endDate;
    if (!endDate) {
      const today = Utils.isDateToday(startDate) ? "today" : "";
      messageToUser = noResultsFound ? `${usecase} has not ran ${today} ${today} ${Utils.formatDateToLocaleString(startDate, true)}` : `Please find below all runs from ${today} ${Utils.formatDateToLocaleString(startDate, true)}`;
    } else {
      messageToUser = noResultsFound ? `${usecase} has not ran between ${Utils.formatDateToLocaleString(startDate, false, true)} and ${Utils.formatDateToLocaleString(endDate, false, true)}` : `Please find below all runs starting from ${Utils.formatDateToLocaleString(startDate, false)} until ${Utils.formatDateToLocaleString(endDate, false)} `;
    }
    // TODO ROBOT handling
    return messageToUser;
  }

  private getTerminationText(data: ProcessRun[], messageToUser: any, options: UseCaseRunHistoryDialogOptions, usecase: string) {
    const numberOfResults = data.length;
    if (numberOfResults === 0) {
      messageToUser = `There are no terminations since ${Utils.formatDateToLocaleString(options.dateFilter.startDate)}`;
    } else if (numberOfResults < options.numberOfResults) {
      messageToUser = `${usecase} had only ${numberOfResults} terminations since ${Utils.formatDateToLocaleString(options.dateFilter.startDate)}`;
    } else {
      messageToUser = `You can find ${data.length} terminations details below`;
    }
    return messageToUser;
  }
}