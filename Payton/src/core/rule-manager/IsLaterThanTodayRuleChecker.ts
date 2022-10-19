import { IRuleChecker } from "./interfaces/IRuleChecker";
import moment = require("moment");

export class IsLaterThanTodayRuleChecker implements IRuleChecker {
  private format: string;

  constructor(format: string) {
    this.format = format;
  }

  public evaluateRule(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    var parsedDate = moment(value, this.format).toDate();
    if (parsedDate > new Date()) {
      return true;
    }

    return false;
  }
}