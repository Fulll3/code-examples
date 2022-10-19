import { IRuleChecker } from "./interfaces/IRuleChecker";

export class IsFilledRuleChecker implements IRuleChecker {
  constructor() {
  }

  public evaluateRule(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    } else if ((value as string).trim && (value as string).trim() === "") {
      return false;
    }

    return true;
  }
}