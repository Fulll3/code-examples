export interface IRuleChecker {
  evaluateRule(value: any): boolean;
}