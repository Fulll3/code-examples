import moment = require("moment");
import { SplunkSimple } from "./domain/splunk/SplunkSimple";

export class Utils {

  public static wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static formatDateToLocaleString(date: Date, getOnlyDate = false, getOnlyTime = false, includeTimezoneName = true): string {
    if (!date) {
      return "";
    }
    if (typeof date === 'string') {
      date = new Date(date)
    }
    let options: Intl.DateTimeFormatOptions;
    if (getOnlyDate) {
      options = { year: 'numeric', month: 'long', day: 'numeric' };

    } else if (getOnlyTime) {
      options = { hour: "numeric", minute: "numeric" };
    } else {
      options = { year: 'numeric', month: 'short', day: 'numeric', hour: "numeric", minute: "numeric" };
    }

    if (includeTimezoneName && !getOnlyDate) {
      options.timeZone = 'Europe/Amsterdam';
      options.timeZoneName = "short";
    }
    return date.toLocaleString('en-GB', options)
  }

  public static getDateBeforeDays(days: number) {
    const date = moment().subtract(days,"days");
    return date;
  }
  public static getDateBeforeMonths(months: number): Date {
    const date = moment().subtract(months,"months").toDate()
    return date;
  }
  public static isDateToday = (date: Date): boolean => {
    if (!date) {
      return false;
    }
    if (typeof date === 'string') {
      date = new Date(date)
    }
    const today = new Date()
    return date.getDate() == today.getDate() &&
      date.getMonth() == today.getMonth() &&
      date.getFullYear() == today.getFullYear()
  }
  public static groupBy = (data: any[], key): any => { // `data` is an array of objects, `key` is the key (or property accessor) to group by
    // reduce runs this anonymous function on each element of `data` (the `item` parameter,
    // returning the `storage` parameter at the end
    return data.reduce(function (storage, item) {
      // get the first instance of the key by which we're grouping
      var group = item[key];

      // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
      storage[group] = storage[group] || [];

      // add this item to its group within `storage`
      storage[group].push(item);

      // return the updated storage to the reduce function, which will then loop through the next 
      return storage;
    }, {}); // {} is the initial value of the storage
  };

  public static isStringTime = (value: string) => {
    const matchTime = value.match(/^\d{2}:\d{2}:\d{2}$/)
    return !!matchTime;
  }
  public static addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public static getHoursFromTimeString = (timeString: string): number => {
    return Number(timeString.split(":")[0])
  }

  public static getMinutesFromTimeString = (timeString: string): number => {
    return Number(timeString.split(":")[1])
  }

  public static isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  public static getCurrentHoursAndMinutesString = () => {
    const now = new Date();
    return  `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }
  public static convertTimeStringToNumber = (timeString: string) => {
    const hoursAndMinutes = timeString.split(':')
    if(hoursAndMinutes.length > 2) {
      hoursAndMinutes.pop()
    }
    return Number(hoursAndMinutes.join('.'));
  }
public static convertDateToIsoFormat = (date: Date) => {
  return date.toISOString().split('T')[0];
}

}