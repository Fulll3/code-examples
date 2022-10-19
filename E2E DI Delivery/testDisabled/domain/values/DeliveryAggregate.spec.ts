import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { DeliveryAggregate } from "../../../src/domain/values/DeliveryAggregate";
import { DeliveryPreprocessor } from "../../../src/domain/DeliveryPreprocessor";
import { DeliveryDocumentType } from "../../../src/domain/values/DeliveryDocumentType";
import { DeliveryComposer } from "../../../src/domain/DeliveryComposer";

describe("Delivery Aggregate", () => {
  let dummyData: any;

  before(async () => {
    const slash = path.sep;
    const file = path.join(__dirname, `..${slash}..${slash}..${slash}test${slash}DummyData.json`);
    dummyData = JSON.parse(fs.readFileSync(file, "utf8")).hanaResults;
  });

  describe("Ensure data integrity and abstracts Delivery Documents recovery", () => {
    it("should provide accesor to lenght of the grouping", function() {
      const aggregate: DeliveryAggregate = DeliveryComposer.group(
        DeliveryPreprocessor.sanitize(dummyData["0001413495"], "0001413495", DeliveryDocumentType.salesOrderNumber),
      );
      expect(aggregate.size()).to.equal(4);
    });

    it("should provide accesor to the countries of the grouping", function() {
      const aggregate: DeliveryAggregate = DeliveryComposer.group(
        DeliveryPreprocessor.sanitize(dummyData["8857816105"], "8857816105", DeliveryDocumentType.deliveryNoteNumber),
      );
      ["FR"].forEach((country, index) => {
        expect(country).to.equal(aggregate.getGroupCountries()[index]);
      });
    });

    it("should provide accesor specific groups", function() {
      const aggregate: DeliveryAggregate = DeliveryComposer.group(
        DeliveryPreprocessor.sanitize(dummyData["0001413495"], "0001413495", DeliveryDocumentType.salesOrderNumber),
      );
      const usIndex = aggregate.getGrouptIndexByCountry("US");
      const group = aggregate.getGrouptAtIndex(usIndex);

      group.forEach(document => {
        expect(document.getCountry()).to.equal("US");
      });
    });

    it("should find specific document inside grouping", function() {
      const aggregate: DeliveryAggregate = DeliveryComposer.group(
        DeliveryPreprocessor.sanitize(dummyData["0310386020"], "0310386020", DeliveryDocumentType.salesOrderNumber),
      );
      const document = aggregate.findDocument(0, DeliveryDocumentType.salesOrderNumber, "005000");

      expect(document.getSalesOrderItem()).to.equal("005000");
      expect(document.getCountry()).to.equal("FR");
      expect(document.getSalesOrderNo()).to.equal("0310386020");
    });
  });
});
