import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { addLeadingZeros } from "../../src/core/utils/PaytonUtilities";

use(chaiAsPromised);
use(sinonChai);

describe("Payton Utilities test", () => {
  it("function addLeadingZeros test", async () => {
    expect(addLeadingZeros("100", 2)).to.be.equals("100");
    expect(addLeadingZeros("100", 4)).to.be.equals("0100");
  });
});