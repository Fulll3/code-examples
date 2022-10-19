import * as _ from "lodash";
import * as path from "path";
import { IInvoiceStatusRules } from "./interfaces/IInvoiceStatus";
import { IGroupInvoiceStatusConfiguration } from "./interfaces/IInvoiceStatusConfiguration";
import { IRule } from "./interfaces/IRule";
import { IRuleChecker } from "./interfaces/IRuleChecker";
import { RuleCheckerFactory } from "./RuleCheckerFactory";

export enum RulesManagerType {
  HANA,
  EZSUITE
}

export class InvoiceStatusRulesManager {
  private configuration: IGroupInvoiceStatusConfiguration[];
  private static instance;
  private static instance_ezSuite;

  //#region Initialization 
  private constructor(configuration?: any) {
    if (!configuration) {
      var filePath = path.join(__dirname, '../../../configuration/ruleManagerConfiguration_Prod.json');
      configuration = require(filePath);
    }

    var groupedConfiguration = _.groupBy<IInvoiceStatusRules>(
      configuration.configuration,
      invoiceStatusRule => invoiceStatusRule.invoiceStatus
    );

    this.configuration = _.map(
      groupedConfiguration,
      function (items, key) {
        return {
          status: key,
          configurationList: items
        };
      }
    );
  }

  public static getInstanceEzSuite(): InvoiceStatusRulesManager {
    if (!InvoiceStatusRulesManager.instance_ezSuite) {
      var filePath = path.join(__dirname, '../../../configuration/ruleManagerConfiguration_EzSuite_Prod.json');
      var configuration = require(filePath);

      InvoiceStatusRulesManager.instance_ezSuite = new InvoiceStatusRulesManager(configuration);
    }

    return InvoiceStatusRulesManager.instance_ezSuite;
  }

  public static getInstance(): InvoiceStatusRulesManager {
    if (!InvoiceStatusRulesManager.instance) {
      InvoiceStatusRulesManager.instance = new InvoiceStatusRulesManager();
    }

    return InvoiceStatusRulesManager.instance;
  }

  public static getInstanceForTests(configuration: any): InvoiceStatusRulesManager {
    if (!InvoiceStatusRulesManager.instance) {
      InvoiceStatusRulesManager.instance = new InvoiceStatusRulesManager(configuration);
    }

    return InvoiceStatusRulesManager.instance;
  }
  //#endregion

  //#region Public Methods 
  public getInvoiceStatus(invoiceData: any, system?: string): string {
    var rule = this.getRule(invoiceData, system);
    if (rule) {
      return rule.invoiceStatus;
    }

    return "UNKNOWN";
  }

  public getConversationIndex(invoiceData: any, system?: string): string {
    var rule = this.getRule(invoiceData, system);
    if (rule) {
      return rule.conversationIndex;
    }

    return "UNKNOWN";
  }
  //#endregion

  //#region Private Methods 
  private getRule(invoiceData: any, system?: string): IInvoiceStatusRules {
    for (const invoiceStatusConfiguration of this.configuration) {
      var rule = this.getRuleAccordingToSystem(invoiceStatusConfiguration.configurationList, system);
      if (this.isAccordingToRules(invoiceData, rule)) {
        return rule;
      }
    }

    return undefined;
  }

  private getRuleAccordingToSystem(ruleList: IInvoiceStatusRules[], system?: string): IInvoiceStatusRules {
    var rule = ruleList.filter(invoiceStatusRules => invoiceStatusRules.system === system);

    if (rule.length == 0) {
      rule = ruleList.filter(invoiceStatusRules => invoiceStatusRules.system === undefined);
    }

    return rule.length == 0
      ? undefined
      : rule[0];
  }

  private isAccordingToRules(invoiceData: any, invoiceStatusConfiguration: IInvoiceStatusRules): boolean {
    if (!invoiceStatusConfiguration) {
      return false;
    }

    for (const rule of invoiceStatusConfiguration.rules) {
      const checker = RuleCheckerFactory.GetChecker(rule.type, rule);
      const match = this.isMatchingRule(checker, invoiceData, rule);
      if (!match) {
        return false;
      }
    }

    return true;
  }

  private isMatchingRule(ruleChecker: IRuleChecker, invoiceData: any, rule: IRule) {
    for (const entityPath of rule.pathToEntity.split("|")) {
      if (ruleChecker.evaluateRule(_.get(invoiceData, entityPath))) {
        return true;
      }
    }
    return false;
  }
  //#endregion
}