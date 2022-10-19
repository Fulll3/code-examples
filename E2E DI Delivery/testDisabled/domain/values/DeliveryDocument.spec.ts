import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { DeliveryDocument } from "../../../src/domain/values/DeliveryDocument";

describe("Delivery Document Value", () => {
  let dummyData: any;

  before(async () => {
    const slash = path.sep;
    const file = path.join(__dirname, `..${slash}..${slash}..${slash}test${slash}DummyData.json`);
    dummyData = JSON.parse(fs.readFileSync(file, "utf8"));
  });

  describe("Item leading zeros rules", () => {
    it("Match item ignoring leading zeros for 0000105830", async () => {
      const storedOnHana = "0000105830";
      const userMayType = [
        "0000105830", "00105830", "105830",
      ];

      userMayType.forEach(item => {
        expect(DeliveryDocument.equalItemIgnoringLeadingZeros(item, storedOnHana)).to.be.true;
      });
    });

    it("Match item ignoring leading zeros for 000010", async () => {
      const storedOnHana = "000010";
      const userMayType = [
        "000010", "0010", "10",
      ];

      userMayType.forEach(item => {
        expect(DeliveryDocument.equalItemIgnoringLeadingZeros(item, storedOnHana)).to.be.true;
      });
    });

    it("Do not match item for trailling zeros", async () => {
      const storedOnHana = "000010";
      const userMayType = [
        "0100", "100", "1000",
      ];

      userMayType.forEach(item => {
        expect(DeliveryDocument.equalItemIgnoringLeadingZeros(item, storedOnHana)).to.be.false;
      });
    });

    it("Do not match item for unrelated", async () => {
      const storedOnHana = "43255";
      const userMayType = [
        "23423", "55521", "12345",
      ];

      userMayType.forEach(item => {
        expect(DeliveryDocument.equalItemIgnoringLeadingZeros(item, storedOnHana)).to.be.false;
      });
    });
  });

  describe("Model and abstracts a Delivery Document for tracking milestones", () => {
    it("should provide a factory method to build itself from Hana Results", async () => {
      const hanaResult = dummyData.hanaResults["8857816105"][0];
      const deliveryDocument = DeliveryDocument.buildDeliveryDocumentFromHanaResult(hanaResult);

      expect(deliveryDocument.getCountry()).to.equal("FR");
      expect(deliveryDocument.getPurchaseOrderNo()).to.equal("4515958712");
      expect(deliveryDocument.getDeliveryNoteNo()).to.equal("8857816105");
      expect(deliveryDocument.getUcrNumber()).to.equal("SIRL12023776465");
      expect(deliveryDocument.getSalesOrderNo()).to.equal("0310386020");
      expect(deliveryDocument.getMilestones()[0].date.getFullYear()).to.equal(2019);
    });

    it("should provide a factory method to build itself from Stored Documents", async () => {
      const deliveryDocument = DeliveryDocument.buildDeliveryDocumentFromStorageResult({ // mimic stored doc retrieval
        country: "PT",
        purchaseOrderNo: "4515958712",
        deliveryNoteNo: "8857816105",
        ucrNumber: "SIRL12023776465",
        salesOrderNo: "0310386020",
        milestones: [{
          date: new Date().toString(),
          note: "MST_LSTAR",
          message: "Customer Order Entry",
        }],
      });

      expect(deliveryDocument.getCountry()).to.equal("PT");
      expect(deliveryDocument.getPurchaseOrderNo()).to.equal("4515958712");
      expect(deliveryDocument.getDeliveryNoteNo()).to.equal("8857816105");
      expect(deliveryDocument.getUcrNumber()).to.equal("SIRL12023776465");
      expect(deliveryDocument.getSalesOrderNo()).to.equal("0310386020");
      expect(deliveryDocument.getMilestones()[0].date.getFullYear()).to.equal(new Date().getFullYear());
      expect(deliveryDocument.getMilestones()[0].note).to.equal("MST_LSTAR");
      expect(deliveryDocument.getMilestones()[0].message).to.equal("Customer Order Entry");
    });
  });
});
