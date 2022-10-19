import { IScheduleData } from "../../../data/schedule/ScheduleDataConnector";
import { Utils } from "../../../Utils";
import * as moment from 'moment'

export type CalendarScheduleDetails = {
  schedule: Schedule;
  date: string;
}

export class Schedule {
  private unitTypeMapping: any;
  private isRunningMonthly: boolean;
  private isRunningWeekly: boolean;
  private monthlyStartDate: Date;
  private weeklyStartDates: Date[] = [];
  // 0 is Sunday 1 monday 2 tuesday and so on
  private runningInDays = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    0: false
  }
  // day = 0 is Sunday 1 monday 2 tuesday and so on
  private workingWeekMappingTable = [
    { value: 64, day: 6 },
    { value: 32, day: 5 },
    { value: 16, day: 4 },
    { value: 8, day: 3 },
    { value: 4, day: 2 },
    { value: 2, day: 1 },
    { value: 1, day: 0 }
  ]

  constructor(
    private scheduleName: string,
    private ipaNumber: string,
    private resourceName: string,
    private startDate: string,
    private stopAfterTime: string,
    private unitType: string,
    private workingWeek: string,
    private isRetired: string,
    private calendarName: string,
    private nonWorkingweek: string,
    private endDate: string,
    private daySet: string,
    private nthOfMonth: string,
    private calendarId: string,
    private scheduledInRobots: string[]
  ) {
    this.isRunningMonthly = this.isMonthlySchedule();
    this.isRunningWeekly = this.isWeeklySchedule();
    this.unitTypeMapping = {
      "0": "one time",
      "1": "hourly",
      "2": "daily",
      "3": "weekly",
      "4": "monthly",
      "5": "yearly",
      "6": "minutely"
    }
    if (this.isRunningMonthly) {
      this.calculateScheduledDayForMonthlySchedule();
    } else if (this.isRunningWeekly) {
      const weekDay = this.getWeekdayFromDaySet();
      const today = moment();
      for (let i = 0; i < 5; i++) {
        const nextStartDate = today.set("weekday", weekDay).add(i, "weeks").toDate();
        this.weeklyStartDates.push(nextStartDate)
      }
    } else {
      this.calculateRunningInDays();
    }
  }

  private getFirstWorkingDayInMonth = (nextMonth: boolean) => {
    const sunday = 0;
    const saturday = 6;
    const additionalMonths = nextMonth ? 1 : 0;
    const firstWorkingDayInMonth = moment().add(additionalMonths, "month").startOf("month");
    while (firstWorkingDayInMonth.day() === sunday || firstWorkingDayInMonth.day() === saturday) {
      firstWorkingDayInMonth.add(1, "d");
    }
    this.addStartTimeToTargetDate(firstWorkingDayInMonth);
    return firstWorkingDayInMonth;
  }
  private getLastWorkingDayInMonth = (nextMonth: boolean) => {
    const sunday = 0;
    const saturday = 6;
    const additionalMonths = nextMonth ? 1 : 0;
    const lastWorkingDayInMonth = moment().add(additionalMonths, "month").endOf("month");
    while (lastWorkingDayInMonth.day() === sunday || lastWorkingDayInMonth.day() === saturday) {
      lastWorkingDayInMonth.subtract(1, "d");
    }
    this.addStartTimeToTargetDate(lastWorkingDayInMonth);
    return lastWorkingDayInMonth
  }
  private addStartTimeToTargetDate = (scheduledRunDate: moment.Moment) => {
    const startHour = moment(this.startDate).get("h")
    const startMinute = moment(this.startDate).get("m");
    return scheduledRunDate.set("h", startHour).set("m", startMinute);
  }

  private lookForScheduleDateFromMonthStart = () => {
    return Number(this.nthOfMonth) > 0
  }

  private getScheduledDateEndOfTheMonth = (nextMonth: boolean, weekDay: number) => {
    const additionalMonths = nextMonth ? 1 : 0;
    let scheduledRunDate = moment().add(additionalMonths, "month").endOf('month').day(weekDay);
    if (scheduledRunDate.get("date") < 7) {
      scheduledRunDate = scheduledRunDate.subtract(7 * Math.abs(Number(this.nthOfMonth)), "d");
    } else {
      scheduledRunDate = scheduledRunDate.subtract(7 * Math.abs(Number(this.nthOfMonth)) - 7, "d");
    }
    this.addStartTimeToTargetDate(scheduledRunDate);
    return scheduledRunDate;
  }

  private getScheduledDateStartOfTheMonth = (nextMonth: boolean, weekDay: number) => {

    const additionalMonths = nextMonth ? 1 : 0;
    let scheduledRunDate = moment().add(additionalMonths, "month").startOf('month').day(weekDay);
    if (scheduledRunDate.get("date") > 7) {
      scheduledRunDate = scheduledRunDate.add(7 * Number(this.nthOfMonth), "d");
    } else {
      scheduledRunDate = scheduledRunDate.add(7 * Number(this.nthOfMonth) - 7, "d");
    }
    this.addStartTimeToTargetDate(scheduledRunDate);
    return scheduledRunDate;
  }

  private calculateRunningInDays = () => {

    let workingWeekRemaining = Number(this.workingWeek);
    for (const day of this.workingWeekMappingTable) {
      if ((workingWeekRemaining - day.value) >= 0) {
        this.runningInDays[day.day] = true;
        workingWeekRemaining = workingWeekRemaining - day.value;
      }
      if (workingWeekRemaining === 0) {
        break;
      }
    }
  }
  public isMonthlySchedule = () => {
    return this.unitType === "4";
  }

  public static buildScheduleFromMiddlewareResponse = (scheduleData: IScheduleData) => {
    return new Schedule(
      scheduleData.Schedulename,
      scheduleData.IPA_Number,
      scheduleData.resourcename,
      scheduleData.startdate,
      scheduleData.StopAfterTime,
      scheduleData.unittype,
      scheduleData.workingweek,
      scheduleData.retired,
      scheduleData.calendarname,
      scheduleData.nonworkingday,
      scheduleData.enddate,
      scheduleData.dayset,
      scheduleData.nthofmonth,
      scheduleData.calendarid,
      scheduleData.scheduledInRobots
    )
  }
  public getIpaNumber = () => {
    return this.ipaNumber;
  }
  public getScheduleDetailsForGivenDate = (date: Date): CalendarScheduleDetails => {
    const day = date.getDay();
    const dateIsoFormat = Utils.convertDateToIsoFormat(date);

    if (this.isRunningMonthly) {
      const scheduleDetails = Utils.isSameDate(this.monthlyStartDate, date) ? this.getScheduleDetails(dateIsoFormat) : undefined;
      return scheduleDetails;
    } else if (this.isRunningWeekly) {
      const scheduleIsRunningInGivenDate = !!this.weeklyStartDates.find((weeklyStartDate) => Utils.isSameDate(weeklyStartDate, date) )
      const scheduleDetails =  scheduleIsRunningInGivenDate ? this.getScheduleDetails(dateIsoFormat) : undefined;
      return scheduleDetails;
    } else if (this.runningInDays[day] && this.nonWorkingweek.search(dateIsoFormat) === -1 && this.scheduleStartsBeforeDate(date)) {
      return this.getScheduleDetails(dateIsoFormat)
    } else {
      return undefined;
    }
  }

  private scheduleStartsBeforeDate = (date: Date) => {
    return moment(this.startDate).isSameOrBefore(date);
  }
  public isScheduleRetired = () => {
    if (this.isRetired === "true") {
      return true;
    } else {
      return false;
    }
  }
  public getMonthlyStartDateAsString = () => {
    return this.monthlyStartDate ? Utils.formatDateToLocaleString(this.monthlyStartDate, true) : "Unknown start date. Please contact CRM for more info."
  }


  public isScheduleExpired = () => {
    if (!!this.endDate) {
      if (new Date(this.endDate) < new Date()) {
        return true;
      } else {
        return false
      }
    } else {
      return false;
    }
  }
  public isFutureSchedule = () => {
    if (!!this.startDate) {
      if (new Date(this.startDate) > new Date()) {
        return true;
      } else {
        return false
      }
    } else {
      return false;
    }
  }

  public isScheduleRunnig = () => {
    if (this.isScheduleExpired() || this.isScheduleRetired() || this.isFutureSchedule()) {
      return false;
    } else {
      return true;
    }
  }

  public getScheduleRetiredText = () => {
    if (this.isRetired === "true") {
      return "yes";
    } else {
      return "no";
    }
  }

  public getRobot = () => {
    return this.scheduledInRobots.join(",")
  }

  public getScheduleName = () => {
    return this.scheduleName;
  }

  public getStartDate = () => {
    return Utils.formatDateToLocaleString(
      new Date(this.startDate),
      true);
  }
  public getExpiredDate = () => {
    return Utils.formatDateToLocaleString(
      new Date(this.endDate),
      true);
  }
  public getStartTime = (includeTimezoneName = true) => {
    return Utils.formatDateToLocaleString(
      new Date(this.startDate),
      false,
      true,
      includeTimezoneName);
  }

  public isScheduleRunningOneDay = () => {
    if (Utils.isStringTime(this.stopAfterTime)) {
      // if stop after time is later than start time then schedule runs only one day
      const stopAfterTimeHours = Number(Utils.getHoursFromTimeString(this.stopAfterTime));
      const startAfterTimeHours = Number(Utils.getHoursFromTimeString(this.getStartTime(false)));
      return moment().set("hours", stopAfterTimeHours).isSameOrAfter(moment().set("hours", startAfterTimeHours));
    } else {
      return true;
    }
  }

  public getStopAfterTime = (includeTimezoneName = true) => {
    if (Utils.isStringTime(this.stopAfterTime)) {
      return Utils.formatDateToLocaleString(
        new Date(`2019-11-14 ${this.stopAfterTime}`),
        false,
        true,
        includeTimezoneName)
    } else {
      // if stopAfterTime is not available set endTime 30 minutes after start
      const startDate = new Date(this.startDate);
      const additionalMinutes = 30;
      return Utils.formatDateToLocaleString(
        new Date(startDate.getTime() + additionalMinutes * 60000),
        false,
        true,
        includeTimezoneName)
    }

  }
  public getFrequency = () => {
    return this.unitTypeMapping[this.unitType];
  }

  public getCalendarName = () => {
    return this.calendarName;
  }

  public isSiemensEnergySchedule = () => {
    return this.scheduleName.includes("_SE_");
  }

  private getScheduleDetails(dateIsoFormat: string): CalendarScheduleDetails {
    return {
      schedule: this,
      date: dateIsoFormat
    };
  }

  private isWeeklySchedule(): boolean {
    return this.unitType === "3";
  }

  private calculateScheduledDayForMonthlySchedule() {
    const today = moment();
    if (moment(this.startDate).isAfter(today)) {
      this.monthlyStartDate = new Date(this.startDate);
    } else if (this.scheduleHasDaysSet()) {
      const today = moment();
      const weekDay = this.getWeekdayFromDaySet();
      let scheduledRunDate = this.lookForScheduleDateFromMonthStart() ? this.getScheduledDateStartOfTheMonth(false, weekDay) : this.getScheduledDateEndOfTheMonth(false, weekDay);
      if (today.isAfter(scheduledRunDate)) {
        scheduledRunDate = this.lookForScheduleDateFromMonthStart() ? this.getScheduledDateStartOfTheMonth(true, weekDay) : this.getScheduledDateEndOfTheMonth(true, weekDay);
      }
      this.monthlyStartDate = scheduledRunDate.toDate();
    } else if (this.daySet === "0" && this.nthOfMonth !== "0") {
      const workingWeekCalendarIds = ["1", "9", "65"];
      if (workingWeekCalendarIds.find((calendarId) => this.calendarId === calendarId)) {
        const today = moment();
        let scheduleRunDate = this.lookForScheduleDateFromMonthStart() ? this.getFirstWorkingDayInMonth(false) : this.getLastWorkingDayInMonth(false);
        if (today.isAfter(scheduleRunDate)) {
          scheduleRunDate = this.lookForScheduleDateFromMonthStart() ? this.getFirstWorkingDayInMonth(true) : this.getLastWorkingDayInMonth(true);
        }
        this.monthlyStartDate = scheduleRunDate.toDate();
      } else {
        this.monthlyStartDate = undefined;
      }
    } else if (this.daySet === "0" && this.nthOfMonth === "0") {
      const runningNthDay = moment(this.startDate).get("date");
      let startDate = moment().set("date", runningNthDay);
      if (today.isAfter(startDate)) {
        startDate = startDate.add(1, "m");
      }
      this.monthlyStartDate = startDate.toDate();
    }
  }

  private getWeekdayFromDaySet() {
    return Number(this.workingWeekMappingTable.find((day) => day.value === Number(this.daySet)).day);
  }

  private scheduleHasDaysSet() {
    return this.daySet !== "0";
  }
}