import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { InvoiceStatusRulesManager } from "../../src/core/rule-manager/InvoiceStatusRulesManager";
import { IsEmptyRuleChecker } from "../../src/core/rule-manager/IsEmptyRuleChecker";
import { IsFilledRuleChecker } from "../../src/core/rule-manager/IsFilledRuleChecker";
import { PatternRuleChecker } from "../../src/core/rule-manager/PatternRuleChecker";
import { RuleCheckerFactory } from "../../src/core/rule-manager/RuleCheckerFactory";
import { SkipRuleChecker } from "../../src/core/rule-manager/SkipRuleChecker";
import moment = require("moment");

use(chaiAsPromised);
use(sinonChai);

describe("Invoice Status Rules Manager test", () => {
  describe("function: RuleCheckerFactory.GetChecker", () => {
    it("should throw Unknown Rule Checker Type", async () => {
      expect(() => RuleCheckerFactory.GetChecker("notExistingCode", "")).to.throw("Unknown Rule Checker Type.");
    });
    it("should return object type IsFilledRuleChecker", async () => {
      expect(RuleCheckerFactory.GetChecker("isFilled", "")).to.be.an.instanceof(IsFilledRuleChecker);
    });
    it("should return object type IsEmptyRuleChecker", async () => {
      expect(RuleCheckerFactory.GetChecker("isEmpty", "")).to.be.an.instanceof(IsEmptyRuleChecker);
    });
    it("should return object type PatternRuleChecker", async () => {
      expect(RuleCheckerFactory.GetChecker("pattern", "")).to.be.an.instanceof(PatternRuleChecker);
    });
    it("should return object type SkipRuleChecker", async () => {
      expect(RuleCheckerFactory.GetChecker("skip", "")).to.be.an.instanceof(SkipRuleChecker);
    });
  });

  let invoices: any = require("../../mockups/ruleManagerConfiguration.json");
  var manager = InvoiceStatusRulesManager.getInstanceForTests(invoices);

  describe("function: manager.getInvoiceStatus(invoiceData)", () => {
    it("should return Cancelled", async () => {
      var invoiceData = {
        AUGBL: "1700000000"
      };
``
      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("Cancelled");
    });

    it("should return Cancelled for E1P system", async () => {
      var invoiceData = {
        AUGBL: "1000000000"
      };

      expect(manager.getInvoiceStatus(invoiceData, "E1P")).to.be.equal("Cancelled");
    });

    it("#1 should return EmptyValueTest", async () => {
      var invoiceData = {
        AUGBL: "  "
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("EmptyValueTest");
    });

    it("#2 should return EmptyValueTest", async () => {
      var invoiceData = {
        AUGBL: undefined
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("EmptyValueTest");
    });

    it("#3 should return EmptyValueTest", async () => {
      var invoiceData = {
        AUGBL: null
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("EmptyValueTest");
    });

    it("#1 should return FilledValueTest", async () => {
      var invoiceData = {
        AUGBL: "1X00000"
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("FilledValueTest");
    });

    it("#2 should return ORTest_MultiplePaths", async () => {
      var invoiceData = {
        AUGBL2: undefined,
        AUGBL3: "1X00000"
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("ORTest_MultiplePaths");
    });

    it("#3 should return ORTest_MultiplePaths", async () => {
      var invoiceData = {
        AUGBL2: "1X00000",
        AUGBL3: "1X00000"
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("ORTest_MultiplePaths");
    });

    it("#4 should return EmptyValueTest", async () => {
      var invoiceData = {
        AUGBL2: undefined,
        AUGBL3: undefined
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("EmptyValueTest");
    });

    it("#5 should return IsLaterThanToday", async () => {
      var invoiceData = {
        DATE: moment(new Date()).add(1, "days").format("YYYYMMDD"),
        AUGBL3: undefined
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("IsLaterThanToday");
    });

    it("#6 should not return EmptyValueTest", async () => {
      var invoiceData = {
        DATE: moment(new Date()).format("YYYYMMDD"),
        AUGBL3: undefined
      };

      expect(manager.getInvoiceStatus(invoiceData)).to.be.equal("EmptyValueTest");

    });

    it("#7 check getConversationIndex", async () => {
      var invoiceData = {
        DATE: moment(new Date()).format("YYYYMMDD"),
        AUGBL3: undefined
      };

      expect(manager.getConversationIndex(invoiceData)).to.be.equal("1.1.1.1.2.1");
    });
  });
});