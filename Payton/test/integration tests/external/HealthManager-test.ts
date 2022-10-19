import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { HealthMonitors } from "../../../src/core/healthManager/HealthMonitors";
import { HealthManager } from "../../../src/core/healthManager/HealthManager";
import { IHealthCheckable } from "../../../src/core/healthManager/IHealthCheckable";

use(chaiAsPromised);
use(sinonChai);
var healthCheckManager: HealthManager;

class HealthCheckMockup implements IHealthCheckable {
  private available: boolean;
  constructor(available: boolean = true) {
    this.available = available;
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(this.available);
  }
}

before(() => {
  healthCheckManager = new HealthManager([
    HealthManager.createMonitor(HealthMonitors.HANADATALAKE, new HealthCheckMockup(false), true),
    HealthManager.createMonitor(HealthMonitors.WATSON, new HealthCheckMockup(false), true),
    HealthManager.createMonitor(HealthMonitors.EZSUITE, new HealthCheckMockup(false)),
    HealthManager.createMonitor(HealthMonitors.ZENDESK, new HealthCheckMockup(true))
  ], 1000, 1000);
});

describe("Healthcheck tests", () => {
  delay(4000);
  it("healthy chatbot and service", () => {
    expect(healthCheckManager.isServiceHealthy(HealthMonitors.ZENDESK)).to.be.equal(true);
  });
  it("unhealthy chatbot and service", () => {
    expect(healthCheckManager.isChatbotHealthy()).to.be.equal(false);
    expect(healthCheckManager.isServiceHealthy(HealthMonitors.WATSON)).to.be.equal(false);
  });
}).timeout(20000);

after(() => {
  healthCheckManager.stop();
});

function delay(interval) {
  return it('should delay', done => {
    setTimeout(() => done(), interval)

  }).timeout(interval + 10000) // The extra 10000ms should guarantee the test will not fail due to exceeded timeout
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}