import { IRuleChecker } from "./interfaces/IRuleChecker";

export class PatternWithoutSpaceRuleChecker implements IRuleChecker {
  pattern: RegExp;

  constructor(pattern: string) {
    this.pattern = new RegExp(pattern.replace(" ", ""), "i");
  }

  public evaluateRule(value: any): boolean {
    return this.pattern.test(value ? value.replace(" ", "") : value);
  }
}