import { Lodash } from "../src/service/Lodash";
import { expect } from "chai";

describe("Lodash Abstraction Specification", () => {
  describe("Unique arrays filtering", () => {
    it("return unique string arrays", async () => {
      const unique = Lodash.uniq(["a", "b", "c", "a", "b", "c", "x"]);
      expect(unique.length).to.equal(4);
      expect(unique).to.be.an("Array").that.includes("a");
      expect(unique).to.be.an("Array").that.includes("b");
      expect(unique).to.be.an("Array").that.includes("c");
      expect(unique).to.be.an("Array").that.includes("x");
    });
  });
});
