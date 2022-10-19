import {
  ChoiceFactory,
  ComponentDialog,
  DialogTurnResult,
  DialogTurnStatus,
  WaterfallDialog,
  WaterfallStepContext,
} from "botbuilder-dialogs";
import { UserRepository } from "../../../data/storage/UserRepository";
import { RetirementStatus, SchedulesComposer } from "../../../domain/schedules/SchedulesComposer";
import { Schedule } from "../../../domain/schedules/values/Schedule";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom, AdaptiveCardsFolder } from "../../AdaptiveCard";
import { ScheduleCommands } from "../../commands/ScheduleCommands";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { GatherInputHelper, SelectorSearchConfig } from "../GatherInputHelper";
import { GatherInputsDialog } from "../GatherInputsDialog";
import { InitialOptionsDialog } from "../InitialOptionsDialog";


export type ScheduleInfoDialogOptions = {
  command: ScheduleCommands
}

export type RetiredResults = {
  running: schedule[],
  retired: schedule[],
  futureStart: schedule[],
  expired: schedule[],
  totalNumberOfSchedules: number
}
type schedule = {
  name: string,
  date?: string
}
export class ScheduleInfoDialog extends ComponentDialog {
  constructor(
    name: string,
    private storage: UserRepository) {
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.gatherInputs.bind(this),
      this.showResults.bind(this)
    ]))
  }

  private gatherInputs = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = <ScheduleInfoDialogOptions>step.options;
    if (!options.command) {
      throw new Error(`${ScheduleInfoDialog.name}: statusFilter must be provided in dialog options`)
    }
    const gatherInputOptions = GatherInputHelper.getOptions(SelectorSearchConfig.usecaseOnly);
    return await step.beginDialog(GatherInputsDialog.name, gatherInputOptions);
  }

  private showResults = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const options = <ScheduleInfoDialogOptions>step.options;
    const usecaseNumber = await this.storage.getUseCaseNumber(step.context);
    const isUserFromSiemensEnergy = await this.storage.getIsUserFromSiemensEnergy(step.context);
    const schedules = await SchedulesComposer.getSchedules({ ipaNumber: usecaseNumber }, isUserFromSiemensEnergy)
    if (schedules.length === 0) {
      await step.context.sendActivity(`I didn't find any schedules for ${usecaseNumber}`);
      await this.storage.clear(step.context);
      return await step.replaceDialog(InitialOptionsDialog.name);
    }
    const groupedSchedules = SchedulesComposer.groupScheduleByRetirementStatus(schedules)
    let data;
    switch (options.command) {
      case ScheduleCommands.allSchedules:
        await this.handleAllSchedules(schedules, step);
        break;
      case ScheduleCommands.onlyRetiredSchedules:
        await this.handleRetiredSchedules(groupedSchedules, step, usecaseNumber);
        break;
      case ScheduleCommands.nextPlannedRun:
        await this.handleNextRun(step, schedules);
        break;
      case ScheduleCommands.retirementStatus:
        await this.handleRetirementStatus(groupedSchedules, usecaseNumber, step);
    }
    await this.storage.clear(step.context);
    return await step.replaceDialog(InitialOptionsDialog.name);
  }
  public static createDialogOptions = (command: ScheduleCommands): ScheduleInfoDialogOptions => {
    return {
      command
    }
  }

  private async handleRetirementStatus(groupedSchedules: Map<RetirementStatus, Schedule[]>, usecaseNumber: string, step: WaterfallStepContext<{}>) {
    const numberOfRunningSchedules = groupedSchedules.get(RetirementStatus.running).length;
    const numberOfExpiredSchedules = groupedSchedules.get(RetirementStatus.expired).length;
    const numberOfRetiredSchedules = groupedSchedules.get(RetirementStatus.retired).length;
    const numberOfFutureSchedules = groupedSchedules.get(RetirementStatus.futureStart).length;
    const totalAmountOfSchedules = numberOfRunningSchedules + numberOfExpiredSchedules + numberOfRetiredSchedules + numberOfFutureSchedules;

    let summaryText = "";
    if (numberOfRunningSchedules > 0) {
      summaryText += `\r\n* ${numberOfRunningSchedules} are currently running`;
    }
    if (numberOfRetiredSchedules > 0) {
      summaryText += `\r\n* ${numberOfRetiredSchedules} are permanently/temporarily retired`;
    }
    if (numberOfFutureSchedules > 0) {
      groupedSchedules.get(RetirementStatus.futureStart).forEach((schedule) => {
        summaryText += `\r\n* 1 is set to start on ${schedule.getStartDate()}`;
      });
    }
    if (numberOfExpiredSchedules > 0) {
      groupedSchedules.get(RetirementStatus.expired).forEach((schedule) => {
        summaryText += `\r\n* 1 was expired on  ${schedule.getExpiredDate()}`;
      });
    }
    const retiredMessage = `${usecaseNumber} has ${totalAmountOfSchedules} schedules: ${summaryText}`;
    await step.context.sendActivity(retiredMessage);
  }

  private async handleNextRun(step: WaterfallStepContext<{}>, schedules: Schedule[]) {
    const calendar = SchedulesComposer.createCalendar(schedules);
    const nextRunDetails = calendar.findNextRun();
    const formatedDate = Utils.formatDateToLocaleString(new Date(nextRunDetails.date), true)
    await step.context.sendActivity(
      `Next run will start ${formatedDate} at ${nextRunDetails.schedule.getStartTime()}`
    );
    const data = AdaptiveCardCustom.generateScheduleCardData([nextRunDetails.schedule]);
    await AdaptiveCardCustom.sendCard(
      step.context,
      CardName.ipaSchedule,
      AdaptiveCardTitle.nextRun,
      data
    );
    return data;
  }

  private async handleAllSchedules(schedules: Schedule[], step: WaterfallStepContext<{}>) {
    const data = AdaptiveCardCustom.generateScheduleCardData(schedules);
    await AdaptiveCardCustom.sendCard(
      step.context,
      CardName.ipaSchedule,
      AdaptiveCardTitle.allSchedulesIPA,
      data
    );
  }

  private async handleRetiredSchedules(groupedSchedules: Map<RetirementStatus, Schedule[]>, step: WaterfallStepContext<{}>, usecaseNumber: string) {
    const retiredSchedules = groupedSchedules.get(RetirementStatus.retired);
    if (retiredSchedules.length === 0) {
      await step.context.sendActivity(`There are no retired schedules for ${usecaseNumber}`);
    } else {
      const data = AdaptiveCardCustom.generateScheduleCardData(retiredSchedules);
      await AdaptiveCardCustom.sendCard(
        step.context,
        CardName.ipaSchedule,
        AdaptiveCardTitle.ipaScheduleRetired,
        data
      );
    }
  }
}