import { IScheduleData, ScheduleDataConnector, ScheduleSearchInputs } from "../../data/schedule/ScheduleDataConnector";
import { Services } from "../../service/Services";
import { Utils } from "../../Utils";
import { SchedulePreprocessor } from "./SchedulePreprocessor";
import { CalendarScheduleDetails, Schedule } from "./values/Schedule";
import { ScheduleCalendar } from "./values/ScheduleCalendar";
import * as moment from "moment"
import { Runtime } from "../../Runtime";


export enum RetirementStatus {
  running = "running",
  retired = "retired",
  expired = "expired",
  futureStart = "futureStart"
}

export class SchedulesComposer {

  public static getSchedules = async (input: ScheduleSearchInputs, isUserFromSiemensEnergy: boolean) => {
    if (!input.ipaNumber && !input.robotNumber) {
      throw new Error(`${SchedulesComposer.name}: either IPA number or robotNumber have to be provided `)
    }
    const scheduleConnector: ScheduleDataConnector = Services.instance().get("ScheduleDataConnector");
    input = SchedulesComposer.formatInput(input);
    const rawResults = await scheduleConnector.getSchedules(input);
    const uniqueResults = await SchedulePreprocessor.sanatize(rawResults);
    const schedules: Schedule[] = [];
    uniqueResults.forEach((scheduleData) => schedules.push(Schedule.buildScheduleFromMiddlewareResponse(scheduleData)));
    if(Runtime.isProd()) {
      const schedulesFilteredByAccess = SchedulesComposer.filterSchedulesBasedOnUserAccess(schedules, isUserFromSiemensEnergy)
      return schedulesFilteredByAccess;
    } else {
      return schedules;
    }

  }
private static filterSchedulesBasedOnUserAccess = (schedules: Schedule[], userIsFromSiemensEnergy: boolean) => {
  if(userIsFromSiemensEnergy){
    return schedules.filter((schedule) => schedule.isSiemensEnergySchedule());
  } else {
    return schedules.filter((schedule) => !schedule.isSiemensEnergySchedule());
  }
}

  public static createCalendar = (schedules: Schedule[]): ScheduleCalendar => {
    schedules  = SchedulesComposer.getOnlyRunningAndFutureStartSchedules(schedules);
    let calendar: Map<string, CalendarScheduleDetails[]> = new Map();
    const today = new Date();
    const daysInCalendar = 30;
    for (let i = 0; i < daysInCalendar; i++) {
      let schedulesInGivenDay: CalendarScheduleDetails[] = [];
      const targetDate = moment().add(i, "days").toDate();
      schedules.forEach((schedule) => {
        const scheduleDetails = schedule.getScheduleDetailsForGivenDate(targetDate);
        if (scheduleDetails) {
          schedulesInGivenDay.push(scheduleDetails);
        }
      })
      schedulesInGivenDay = SchedulesComposer.sortSchedulesInAscendingOrder(schedulesInGivenDay);
      calendar.set(Utils.convertDateToIsoFormat(targetDate), schedulesInGivenDay);
    }
    return new ScheduleCalendar(calendar);
  }

  public static groupScheduleByRetirementStatus = (schedules: Schedule[]): Map<RetirementStatus, Schedule[]> => {
    const groupedSchedules: Map<RetirementStatus, Schedule[]> = new Map();
    groupedSchedules.set(RetirementStatus.running, schedules.filter((schedule) => schedule.isScheduleRunnig() === true));
    groupedSchedules.set(RetirementStatus.retired, schedules.filter((schedule) => schedule.isScheduleRetired() === true));
    groupedSchedules.set(RetirementStatus.expired, schedules.filter((schedule) => schedule.isScheduleExpired() === true));
    groupedSchedules.set(RetirementStatus.futureStart, schedules.filter((schedule) => schedule.isFutureSchedule() === true));
    return groupedSchedules;
  }

  private static formatInput = (input: ScheduleSearchInputs): ScheduleSearchInputs => {
    const ipaNumber = input.ipaNumber ? input.ipaNumber.match(/\d+/)[0] : input.ipaNumber;
    const robotNumber = input.robotNumber ? input.robotNumber.match(/\d+/)[0] : input.robotNumber;
    return {
      ipaNumber,
      robotNumber
    }
  }

  private static getOnlyRunningAndFutureStartSchedules = (schedules: Schedule[]) =>{
    const groupedSchedulesByStartDate = SchedulesComposer.groupScheduleByRetirementStatus(schedules);
    const runningSchedules = groupedSchedulesByStartDate.get(RetirementStatus.running);
    const futureStartSchedules = groupedSchedulesByStartDate.get(RetirementStatus.futureStart);
    return runningSchedules.concat(futureStartSchedules)
  }


  private static sortSchedulesInAscendingOrder(schedulesInGivenDay: CalendarScheduleDetails[]) {
    return schedulesInGivenDay.sort((a, b) => {
      const startHourA = Utils.getHoursFromTimeString(a.schedule.getStartTime(false));
      const startHourB = Utils.getHoursFromTimeString(b.schedule.getStartTime(false));
      if (startHourA - startHourB === 0) {
        const startMinutesA = Utils.getMinutesFromTimeString(a.schedule.getStartTime(false));
        const startMinutesB = Utils.getMinutesFromTimeString(b.schedule.getStartTime(false));
        return startMinutesA - startMinutesB;
      } else {
        return startHourA - startHourB;
      }
    });
  }
}