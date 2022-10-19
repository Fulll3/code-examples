import { IsEmptyRuleChecker } from "./IsEmptyRuleChecker";
import { IsFilledRuleChecker } from "./IsFilledRuleChecker";
import { IsLaterThanTodayRuleChecker } from "./IsLaterThanTodayRuleChecker";
import { PatternRuleChecker } from "./PatternRuleChecker";
import { PatternWithoutSpaceRuleChecker } from "./PatternWithoutSpaceRuleChecker";
import { SkipRuleChecker } from "./SkipRuleChecker";

export enum RuleCheckerType {
  Pattern = "pattern",
  PatternWithoutSpace = "patternWithoutSpace",
  IsEmpty = "isEmpty",
  IsFilled = "isFilled",
  IsLaterThanToday = "isLaterThanToday",
  Skip = "skip"
}

export class RuleCheckerFactory {
  public static GetChecker(code: string, initData: any) {
    switch (code) {
      case RuleCheckerType.Pattern:
        return new PatternRuleChecker(initData.value);
      case RuleCheckerType.PatternWithoutSpace:
        return new PatternWithoutSpaceRuleChecker(initData.value);
      case RuleCheckerType.IsEmpty:
        return new IsEmptyRuleChecker();
      case RuleCheckerType.IsFilled:
        return new IsFilledRuleChecker();
      case RuleCheckerType.IsLaterThanToday:
        return new IsLaterThanTodayRuleChecker(initData.format);
      case RuleCheckerType.Skip:
        return new SkipRuleChecker();
      default:
        throw new TypeError("Unknown Rule Checker Type.");
    }
  }
}