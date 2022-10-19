import { IRuleChecker } from "./interfaces/IRuleChecker";

export class IsEmptyRuleChecker implements IRuleChecker {
  constructor() {
  }

  public evaluateRule(value: any): boolean {
    if (value === undefined || value === null) {
      return true;
    } else if ((value as string).trim && (value as string).trim() === "") {
      return true;
    } else if ((value as string).trim && (value as string).trim() === "?") {
      return true;
    }

    return false;
  }
}