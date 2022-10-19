import moment = require("moment");
import { IScheduleData } from "../../data/schedule/ScheduleDataConnector";
import { Utils } from "../../Utils"
import { SplunkSimple } from "../splunk/SplunkSimple";

export class SchedulePreprocessor {
  
  public static sanatize = async (schedules: IScheduleData[]) => {
    const schedulesWithoutAdhoc = SchedulePreprocessor.removeAdhocSchedules(schedules);
    const group: Map<string, IScheduleData[]> = new Map(Object.entries(
      Utils.groupBy(
        schedulesWithoutAdhoc,
        "Schedulename")))
    const uniqueSchedules = await SchedulePreprocessor.removeDuplicates(group);
    return uniqueSchedules;
  }


  private static removeAdhocSchedules = (schedules: IScheduleData[]) => {
    return schedules.filter((schedule) => {
      if (SchedulePreprocessor.isMonthlySchedule(schedule)) {
        return true;
      } else if (SchedulePreprocessor.isWeeklySchedule(schedule)) {
        return schedule.dayset !== "";
      } else {
        return schedule.workingweek !== "";
      }
    });
  }

  private static removeDuplicates = async (groupedSchedules: Map<string, IScheduleData[]>) => {
    const uniqueSchedules: IScheduleData[] = [];
    
   await  groupedSchedules.forEach(async (schedules, key, map) => {
      let uniqueSchedule: IScheduleData;
      const scheduleWithEndAfterTime = schedules.filter((schedule) => {
        return Utils.isStringTime(schedule.StopAfterTime)
      })
      if (scheduleWithEndAfterTime.length === 0) {
        uniqueSchedule = schedules[0];
      } else {
        scheduleWithEndAfterTime.sort((schedule1, schedule2) => {
          return Utils.convertTimeStringToNumber(schedule1.StopAfterTime) - Utils.convertTimeStringToNumber(schedule2.StopAfterTime)
        })
        uniqueSchedule = scheduleWithEndAfterTime[scheduleWithEndAfterTime.length - 1];
      }
      const robotNumbers = await SchedulePreprocessor.getRobotNumbersFromSchedules(schedules);
      uniqueSchedule.scheduledInRobots = robotNumbers;
      uniqueSchedules.push(uniqueSchedule);
    })


    return uniqueSchedules;
  }

  private static getRobotNumbersFromSchedules = async (schedules: IScheduleData[]) => {

    let robotNumbers = [];
    for (const schedule of schedules) {
      if (schedule.resourcename.startsWith("DV")) {
        const robotNumber = await SplunkSimple.getRobotNumber(schedule.resourcename)
        robotNumbers.push(robotNumber)
      } else {
        robotNumbers.push(schedule.resourcename ? schedule.resourcename.match(/R\d+/)[0] : "")
      }
    }
    const uniqueRobotNumber = Array.from(new Set(robotNumbers));
    return uniqueRobotNumber;
  }

  private static isWeeklySchedule(schedule: IScheduleData) {
    return schedule.unittype === "3";
  }

  private static isMonthlySchedule(schedule: IScheduleData) {
    return schedule.unittype === "4";
  }
}