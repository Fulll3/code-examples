import { IRuleChecker } from "./interfaces/IRuleChecker";

/*
 * Usage of this checker enforces failing defined rule. (e.g. when there is default rule(for all systems) and there is only one SAP system where the rule doesnt apply.)
 */
export class SkipRuleChecker implements IRuleChecker {
  constructor() {
  }

  public evaluateRule(value: any): boolean {
    return false;
  }
}