import { startsWith } from "lodash";
import moment = require("moment");
import { Utils } from "../../../Utils";
import { CalendarScheduleDetails } from "./Schedule";

export type FreeslotDetails = {
  date: string,
  from: string,
  until: string,
  nextDay?: string,
  isFreeToday?: boolean,
  isFreeNow?: boolean
}

export class ScheduleCalendar {

  constructor(
    private calendar: Map<string, CalendarScheduleDetails[]>
  ) {

  }

  public findNextRun = () => {
    let nextRun: CalendarScheduleDetails;
    const today = new Date()
    for (const [key, scheduleDetails] of this.calendar.entries()) {
      if (Utils.isSameDate(today, new Date(key))) {
        nextRun = this.findFutureScheduleToday(scheduleDetails);
      } else {
        nextRun = scheduleDetails.length > 0 ? scheduleDetails[0] : undefined;
      }
      if (nextRun) {
        return nextRun;
      }
    }
  }

  private getFreeSlots = () => {
    const minutesInDay = this.getMinutesInDay();
    let resetStopAfterTimeForNextDay = true;
    let previousStopAfterTime;
    const freeTimeCalendar: Map<string, Array<string[]>> = new Map()
    for (const [day, schedules] of this.calendar) {
      let currentScheduleIndex = 1;
      previousStopAfterTime = resetStopAfterTimeForNextDay ? "00:00" : previousStopAfterTime;
      const freeSlots = [];
      if (this.noSchedules(schedules)) {
        freeSlots.push(minutesInDay.slice(previousStopAfterTime, minutesInDay.length));
        resetStopAfterTimeForNextDay = true;
      } else {
        for (const scheduleDetail of schedules) {
          const startTime = scheduleDetail.schedule.getStartTime(false);
          const previousStopAfterTimeIndex = minutesInDay.indexOf(previousStopAfterTime);
          const startTimeIndex = minutesInDay.indexOf(startTime);
          if (previousStopAfterTimeIndex < startTimeIndex) {
            freeSlots.push(minutesInDay.slice(previousStopAfterTimeIndex, startTimeIndex));
          }
          if(this.scheduleRunsUntilEndOfDay(scheduleDetail)) {
            resetStopAfterTimeForNextDay = true;
            break;
          }
          if (this.isLastScheduleInDay(currentScheduleIndex, schedules)) {
            const stopAfterTime = scheduleDetail.schedule.isScheduleRunningOneDay() ? scheduleDetail.schedule.getStopAfterTime(false) : "23:59";
            const stopAfterTimeIndex = minutesInDay.indexOf(stopAfterTime);
            freeSlots.push(minutesInDay.slice(stopAfterTimeIndex, minutesInDay.length));
          }
          previousStopAfterTime = scheduleDetail.schedule.getStopAfterTime(false);
          resetStopAfterTimeForNextDay = scheduleDetail.schedule.isScheduleRunningOneDay() ? true : false;
          currentScheduleIndex += 1;

        }
      }
      const freeSlotsLongerThen60Minutes = freeSlots.filter(slot => slot.length >= 60);
      freeTimeCalendar.set(day, freeSlotsLongerThen60Minutes);
    }
    return freeTimeCalendar;
  }

  public getNextFreeSlot = () => {
    const freeTimeSlotsCalendar = this.getFreeSlots()
    const today = new Date();
    let nextFreeSlot: FreeslotDetails;
    for (const [date, freeSlots] of freeTimeSlotsCalendar) {
      if (Utils.isSameDate(today, new Date(date))) {
        const freeSlotsAfterCurrentTime = freeSlots.filter((freeSlotWindow) => {
          const latestTimeInFreeSlotWindow = freeSlotWindow[freeSlotWindow.length - 1];
          const hours = this.getHoursFromTimestring(latestTimeInFreeSlotWindow);
          const minutes = this.getMinutesFromTimestring(latestTimeInFreeSlotWindow);
          const timeSlot = moment().set("hour", hours).set("minutes", minutes).subtract(90, "minutes");
          return moment().isSameOrBefore(timeSlot);
        })
        if (freeSlotsAfterCurrentTime.length > 0) {
          nextFreeSlot = this.createFreeSlotsDetails(freeSlotsAfterCurrentTime, date);
          break;
        }
      } else {
        if(freeSlots.length > 0) {
          nextFreeSlot = this.createFreeSlotsDetails(freeSlots, date);
          break;
        }
      }
    }
    if (nextFreeSlot && nextFreeSlot.until === "23:59") {
      const nextDay = moment(nextFreeSlot.date).add(1, "days").format("YYYY-MM-DD")
      const nextDayFreeSlots = freeTimeSlotsCalendar.get(nextDay);
      if (nextDayFreeSlots) {
        const firstFreeSlotNextDay = this.createFreeSlotsDetails(nextDayFreeSlots, nextDay);
        if (firstFreeSlotNextDay.from === "00:00") {
          nextFreeSlot.until = firstFreeSlotNextDay.until
          nextFreeSlot.nextDay = nextDay;
        }
      }
    }
    return nextFreeSlot;
  }
  private getHoursFromTimestring = (timeString: string) => {
    return Number(timeString.split(":")[0])
  }

  private getMinutesFromTimestring = (timeString: string) => {
    return Number(timeString.split(":")[1])
  }

  private getMinutesInDay = () => {
    const minutesInDay = [];
    let hours = 0;

    while (hours < 24) {
      let minutes = 0;
      while (minutes < 60) {
        minutesInDay.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
        minutes += 1;
      }
      hours += 1;
    }
    return minutesInDay
  }

  private scheduleRunsUntilEndOfDay(scheduleDetail: CalendarScheduleDetails) {
    return scheduleDetail.schedule.getStopAfterTime(false) === "23:59";
  }

  private noSchedules(schedules: CalendarScheduleDetails[]) {
    return schedules.length === 0;
  }

  private isLastScheduleInDay(currentScheduleIndex: number, schedules: CalendarScheduleDetails[]) {
    return currentScheduleIndex === schedules.length;
  }

  private createFreeSlotsDetails(freeSlotsAfterCurrentTime: string[][], date: string) {
    const freeSlotInNearestFuture = freeSlotsAfterCurrentTime[0];
    const freeSlotAvailableFrom = freeSlotInNearestFuture[0]
    let isFreeToday = Utils.isSameDate(new Date(), new Date(date));
    let isFreeNow = isFreeToday ? this.isCurrentlyFree(freeSlotAvailableFrom) : false;
    const nextFreeSlot: FreeslotDetails = {
      date: date,
      from: freeSlotAvailableFrom,
      until: freeSlotInNearestFuture[freeSlotInNearestFuture.length - 1],
      isFreeToday,
      isFreeNow
    };
    return nextFreeSlot;
  }

  private isCurrentlyFree(freeSlotAvailableFrom: string) {
    const startHours = this.getHoursFromTimestring(freeSlotAvailableFrom);
    const endMinutes = this.getMinutesFromTimestring(freeSlotAvailableFrom);
    const freeSlotStartsAt = moment().set("hours", startHours).set("minutes", endMinutes);
    return freeSlotStartsAt.isSameOrBefore(moment());
  }

  private findFutureScheduleToday(scheduleDetails: CalendarScheduleDetails[]) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const futureScheduleRun = scheduleDetails.find((scheduleDetail) => {
      const scheduleStartHours = Utils.getHoursFromTimeString(scheduleDetail.schedule.getStartTime(false));
      const scheduleStartMinutes = Utils.getMinutesFromTimeString(scheduleDetail.schedule.getStartTime(false));
      if (currentHours < scheduleStartHours) {
        return true;
      } else if (currentHours === scheduleStartHours && currentMinutes < scheduleStartMinutes) {
        return true;
      } else {
        return false;
      }
    });
    return futureScheduleRun;
  }
}