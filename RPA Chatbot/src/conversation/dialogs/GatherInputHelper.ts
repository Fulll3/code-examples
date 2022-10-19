import { Selectors } from "../../data/storage/IPromptOptions";
import { GatherInputDialogOptions } from "./GatherInputsDialog";

export enum SelectorSearchConfig {
  usecaseOnly = "usecaseOnly",
  usecaseMandatoryRobotOptional = "usecaseMandatoryRobotOptional",
  robotMandatoryUseCaseOptional = "robotMandatoryUseCaseOptional",
  useCaseAndRobotMandatory = "",
  robotOnly = "robotOnly"
}
export class GatherInputHelper {
  public static getOptions = (searchConfig: SelectorSearchConfig, ignoreIntialNumbersInSearch = false): GatherInputDialogOptions => {
    let selectorSettings: GatherInputDialogOptions;
    switch (searchConfig) {
      case SelectorSearchConfig.robotMandatoryUseCaseOptional:
        selectorSettings = {
          selectorsSequence: [Selectors.robot],
          matchAllSelectorsAtOnce: true,
          optionalSelectors: [Selectors.usecase],
        };
        break;
      case SelectorSearchConfig.usecaseMandatoryRobotOptional:
        selectorSettings = {
          selectorsSequence: [Selectors.usecase],
          matchAllSelectorsAtOnce: true,
          optionalSelectors: [Selectors.robot],
        };
        break;
      case SelectorSearchConfig.usecaseOnly:
        selectorSettings = {
          selectorsSequence: [Selectors.usecase],
          matchAllSelectorsAtOnce: true,
          optionalSelectors: [],
        };
        break;
      case SelectorSearchConfig.useCaseAndRobotMandatory:
        selectorSettings = {
          selectorsSequence: [Selectors.usecase, Selectors.robot],
          matchAllSelectorsAtOnce: true,
          optionalSelectors: [],
        };
        break;
      case SelectorSearchConfig.robotOnly:
        selectorSettings = {
          selectorsSequence: [Selectors.robot],
          matchAllSelectorsAtOnce: true,
          optionalSelectors: [],
        };
        break;
    }
    selectorSettings.selectorSearchConfig = searchConfig;
    selectorSettings.ignoreIntialNumbersInSearch = ignoreIntialNumbersInSearch;
    return selectorSettings;
  };
}
