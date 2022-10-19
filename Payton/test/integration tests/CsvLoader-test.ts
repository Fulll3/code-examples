import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as path from "path";
import * as sinonChai from "sinon-chai";
import { loadCsv } from "../../src/core/utils/CsvLoader";

use(chaiAsPromised);
use(sinonChai);

describe("Csv Loader test", () => {
  it("should return \"2\"", async () => {
    const csv = loadCsv(path.join(__dirname, "../../mockups/mockup.csv"));

    return expect(
      csv.then(
        (result) => {
          return result[0].second;
        }
      )
    ).to.eventually.be.a("string").and.equal("2");
  });
});