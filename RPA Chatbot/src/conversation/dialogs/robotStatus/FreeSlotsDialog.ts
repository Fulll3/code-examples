import {
  ComponentDialog,
  DialogTurnResult,
  PromptValidator,
  TextPrompt,
  WaterfallDialog,
  WaterfallStepContext,
} from "botbuilder-dialogs";
import { UserRepository } from "../../../data/storage/UserRepository";
import { SchedulesComposer } from "../../../domain/schedules/SchedulesComposer";
import { FreeslotDetails } from "../../../domain/schedules/values/ScheduleCalendar";
import { Utils } from "../../../Utils";
import { AdaptiveCardCustom, AdaptiveCardsFolder } from "../../AdaptiveCard";
import { DialogStack } from "../../DialogStack";
import { LocalizedMessages } from "../../LocalizedMessages";
import { AdaptiveCardTitle } from "../../values/AdaptiveCardTitle";
import { CardName } from "../../values/CardName";
import { PromptNames } from "../../values/PromptNames";
import { InitialOptionsDialog } from ".././InitialOptionsDialog";
import { GatherInputHelper, SelectorSearchConfig } from "../GatherInputHelper";
import { GatherInputsDialog } from "../GatherInputsDialog";

export class FreeSlotsDialog extends ComponentDialog {
  private translator: LocalizedMessages;

  constructor(name: string, private storage: UserRepository) {
    super(name);

    this.addDialog(
      new WaterfallDialog(WaterfallDialog.name, [
        this.askForRobotNumber.bind(this),
        this.searchForFreeSchedules.bind(this)
      ])
    )
      .addDialog(new GatherInputsDialog(GatherInputsDialog.name, storage));
    this.translator = new LocalizedMessages(FreeSlotsDialog.name, storage);
  }

  private askForRobotNumber = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const gatherInputOptions = GatherInputHelper.getOptions(SelectorSearchConfig.robotOnly);
    return await step.beginDialog(GatherInputsDialog.name, gatherInputOptions);

  };

  private searchForFreeSchedules = async (
    step: WaterfallStepContext
  ): Promise<DialogTurnResult> => {
    const robotNumber = await this.storage.getRobotNumber(step.context);
    const isUserFromSiemensEnergy = await this.storage.getIsUserFromSiemensEnergy(step.context);
    const schedules = await SchedulesComposer.getSchedules({ robotNumber: robotNumber }, isUserFromSiemensEnergy);
    if (schedules.length === 0) {
      await step.context.sendActivity(`I wasn't able to find any schedules for ${robotNumber}.`)
    } else {
      const calendar = SchedulesComposer.createCalendar(schedules);
      const freeSlotDetails = calendar.getNextFreeSlot();
      let nextFreeSlotMessage;
      if (freeSlotDetails) {
        nextFreeSlotMessage = `${robotNumber} is free ${this.generateRobotIsFreeFromText(freeSlotDetails)} until ${this.generateRobotIsFreeUntilText(freeSlotDetails)}.`;
      } else {
        nextFreeSlotMessage = `There are no free slots in ${robotNumber} for the next 30 days.`
      }
      await step.context.sendActivity(nextFreeSlotMessage);
      return await step.replaceDialog(InitialOptionsDialog.name);
    }
  };


  private generateRobotIsFreeUntilText = (freeSlotDetails: FreeslotDetails) => {
    let robotIsFreeUntilText;
    if (freeSlotDetails.nextDay) {
      robotIsFreeUntilText = `${Utils.formatDateToLocaleString(new Date(freeSlotDetails.nextDay), true)} ${freeSlotDetails.until} CET`
    } else if (freeSlotDetails.isFreeToday) {
      robotIsFreeUntilText = `${freeSlotDetails.until} CET`;
    } else {
      robotIsFreeUntilText = `${Utils.formatDateToLocaleString(new Date(freeSlotDetails.date), true)} ${freeSlotDetails.until} CET`
    }
    return robotIsFreeUntilText;
  }

  private generateRobotIsFreeFromText = (freeSlotDetails: FreeslotDetails) => {
    let robotIsFreeFromText;
    if (freeSlotDetails.isFreeNow) {
      robotIsFreeFromText = "from now"
    } else if (freeSlotDetails.isFreeToday) {
      robotIsFreeFromText = `today from ${freeSlotDetails.from} CET`
    } else {
      robotIsFreeFromText = `from ${Utils.formatDateToLocaleString(new Date(freeSlotDetails.date), true)} ${freeSlotDetails.from} CET`
    }
    return robotIsFreeFromText;
  }
  public static createDialogOptions = () => {
    return;
  }
}
