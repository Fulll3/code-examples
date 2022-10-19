import { IRuleChecker } from "./interfaces/IRuleChecker";

export class PatternRuleChecker implements IRuleChecker {
  pattern: RegExp;

  constructor(pattern: string) {
    this.pattern = new RegExp(pattern, "i");
  }

  public evaluateRule(value: any): boolean {
    return this.pattern.test(value);
  }
}