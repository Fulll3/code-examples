import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { DeliveryComposer } from "../../src/domain/DeliveryComposer";
import { DeliveryAggregate } from "../../src/domain/values/DeliveryAggregate";
import { DeliveryPreprocessor } from "../../src/domain/DeliveryPreprocessor";
import { DeliveryDocumentType } from "../../src/domain/values/DeliveryDocumentType";

describe("Delivery Composer Agent", () => {
  let dummyData: any;

  before(async () => {
    const slash = path.sep;
    const file = path.join(__dirname, `..${slash}..${slash}test${slash}DummyData.json`);
    dummyData = JSON.parse(fs.readFileSync(file, "utf8")).hanaResults;
  });

  describe("Group results to deliver a good user experience", () => {
    it("should return a single group for a single result", async () => {
      const result: DeliveryAggregate = DeliveryComposer.group(dummyData["1021413433"]);
      expect(result.size()).to.equal(1);
    });

    it("should group items of the same country together", async () => {
      const aggregate: DeliveryAggregate = DeliveryComposer.group(dummyData["0001413495"]);
      expect(aggregate.size()).to.equal(4);
      const countries = aggregate.getGroupCountries();

      for (const country of countries) {
        const index = aggregate.getGrouptIndexByCountry(country);
        const group = aggregate.getGrouptAtIndex(index);

        for (const document of group) {
          expect(document.getCountry()).to.equal(country);
        }
      }
    });

    describe("Do not create multiple grups with the same country", () => {
      it("works for SON 0310386020", async () => {
        const aggregate: DeliveryAggregate = DeliveryComposer.group(
          DeliveryPreprocessor.sanitize(dummyData["0310386020"], "0310386020", DeliveryDocumentType.salesOrderNumber),
        );
        const countries = aggregate.getGroupCountries();

        expect((new Set(countries)).size).to.equal(countries.length);
      });

      it("works for SON 0001413495", async () => {
        const aggregate: DeliveryAggregate = DeliveryComposer.group(
          DeliveryPreprocessor.sanitize(dummyData["0001413495"], "0001413495", DeliveryDocumentType.salesOrderNumber),
        );
        const countries = aggregate.getGroupCountries();

        expect((new Set(countries)).size).to.equal(countries.length);
      });
    });
  });
});
