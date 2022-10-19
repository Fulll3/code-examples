import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { config } from "../src/config";

use(chaiAsPromised);
use(sinonChai);

describe("Configuration module", function () {
  it('should return an nconf provider', function () {
    expect(config).to.not.be.undefined;
    expect(config.get).to.not.be.undefined;
    expect(typeof config.get()).to.equal('object');
  });
});