import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { DeliveryPreprocessor } from "../../src/domain/DeliveryPreprocessor";
import { DeliveryDocumentType } from "../../src/domain/values/DeliveryDocumentType";

describe("Delivery Preprocessor Operation", () => {
  let dummyData: any;

  before(async () => {
    const slash = path.sep;
    const file = path.join(__dirname, `..${slash}..${slash}test${slash}DummyData.json`);
    dummyData = JSON.parse(fs.readFileSync(file, "utf8")).hanaResults;
  });

  describe("Sanitize data retrieved by Hana Web Service", () => {
    it("should remove duplicates from Hana Results", async () => {
      const result = DeliveryPreprocessor.sanitize(dummyData["0392489322"], "0392489322", DeliveryDocumentType.deliveryNoteNumber);
      expect(result.length).to.equal(1);
    });

    it("should filter by document type", async () => {
      expect( // do not match type of results
        DeliveryPreprocessor.sanitize(dummyData["8857816105"], "8857816105", DeliveryDocumentType.salesOrderNumber).length).to.equal(0);
      expect( // match type of results
        DeliveryPreprocessor.sanitize(dummyData["8857816105"], "8857816105", DeliveryDocumentType.deliveryNoteNumber).length).to.equal(1);
    });
  });
});
