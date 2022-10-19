import { SecretManager } from "botanica";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { IEzSuiteConnectorParams } from "../../../src/business/data/EzSuite/IEzSuiteConnectorParams";
import { EzSuiteConnector } from "../../../src/data/EzSuiteConnector";

use(chaiAsPromised);
use(sinonChai);
var connector: EzSuiteConnector;

describe("Ez Suite Connector", () => {
  before((done) => {
    (async () => {
      var secretManager = new SecretManager();
      connector = await new EzSuiteConnector(
        await secretManager.getSecret("EZSUITE_URL"),
        await secretManager.getSecret("EZSUITE_USER"),
        await secretManager.getSecret("EZSUITE_PASSWORD")
      );
      done();
    })();
  });

  it("Healthcheck should return true", (done) => {
    (async () => {
      var test = await connector.isHealthy();
      expect(test).to.be.equal(true);
      done();
    })();
  }).timeout(20000);

  it("Getdata should return some data", (done) => {

    (async () => {
      var data = await connector.getData({
        socVendor: "SBT-SAP|544564,DX|833119,SEA_CORP",
        invoiceNumber: "123"
      } as IEzSuiteConnectorParams);

      expect(data.length).to.be.greaterThan(0);
      done();
    })();
  }).timeout(20000);
});