// tslint:disable: only-arrow-functions
import { Env } from "botanica";
import { expect } from "chai";
import { Configuration } from "../../../src/Configuration";
import { WatsonAssistant } from "../../../src/data/watson/WatsonAssistant";
import { WatsonAssistantFactory } from "../../../src/service/watson/data/WatsonAssistantFactory";

import * as fs from "fs";
import * as path from "path";

import { GENERAL_AGENT_CAPABILITIES, BOT_CONTROL_START_OVER, HELP, BOT_CONTROL_APPROVE_RESPONSE, BOT_CONTROL_REJECT_RESPONSE } from "../../../src/data/watson/Intents";

describe("Watson Assistant Connector", () => {
  let watson: WatsonAssistant;
  const TIMEOUT = 3500;

  before(async function() {
    this.timeout(TIMEOUT);
    const config = Configuration.get(fs, path, Env.get("NODE_ENV"));
    watson = await (new WatsonAssistantFactory())
      .createAndReturnServiceInstance(config.services.find(s => s.name === "WatsonAssistant"), null);
  });

  describe("Health check", () => {
    it("should be susceptible to health monitoring", async function() {
      this.timeout(TIMEOUT);
      const health = await watson.isHealthy();
      expect(health).to.be.true;
    });
  });

  describe("Interruption Intents Recognition", () => {
    it("should recognize help request", async function() {
      this.timeout(TIMEOUT);
      expect((await Promise.all([
        watson.getIntents("I need help"),
        watson.getIntents("help me"),
        watson.getIntents("how can you help me?"),
      ])).map(
        intents => intents[0].intent,
      ).every(
        intent =>
          (intent === HELP) ||
          (intent === GENERAL_AGENT_CAPABILITIES),
      )).to.be.true;
    });

    it("should recognize restart conversation request", async function() {
      this.timeout(TIMEOUT);
      expect((await Promise.all([
        watson.getIntents("restart it"),
        watson.getIntents("can we start from beggining"),
      ])).map(
        intents => intents[0].intent,
      ).every(
        intent =>
          (intent === BOT_CONTROL_START_OVER),
      )).to.be.true;
    });

    it("should recognize confirmation answers", async function() {
      this.timeout(TIMEOUT);
      expect((await Promise.all([
        watson.getIntents("yes"),
        watson.getIntents("yes do it"),
      ])).map(
        intents => intents[0].intent,
      ).every(
        intent =>
          (intent === BOT_CONTROL_APPROVE_RESPONSE),
      )).to.be.true;
    });

    it("should recognize negate answers", async function() {
      this.timeout(TIMEOUT);
      expect((await Promise.all([
        watson.getIntents("not"),
      ])).map(
        intents => intents[0].intent,
      ).every(
        intent =>
          (intent === BOT_CONTROL_REJECT_RESPONSE),
      )).to.be.true;
    });
  });
});