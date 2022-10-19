// tslint:disable: space-before-function-paren
import { Env } from "botanica";
import { expect } from "chai";
import { Configuration } from "../../../src/Configuration";
import { WatsonAssistant } from "../../../src/domain/watson/WatsonAssistant";
import { AvailableLanguages } from "../../../src/conversation/LocalizedMessages";
import { WatsonAssistantFactory } from "../../../src/service/watson/data/WatsonAssistantFactory";
import { WatsonAssistantDomainFactory } from "../../../src/service/watson/domain/WatsonAssistantDomainFactory";
import { WatsonAssistant as WatsonAssistantConnector } from "../../../src/data/watson/WatsonAssistant";

import * as fs from "fs";
import * as path from "path";

describe("Watson Assistant Domain Interface", () => {
  let watson: WatsonAssistant;
  let connector: WatsonAssistantConnector;
  let lang: AvailableLanguages;
  const TIMEOUT = 6500;

  before(async function () {
    this.timeout(TIMEOUT);
    const config = Configuration.get(fs, path, Env.get("NODE_ENV"));
    connector = await (new WatsonAssistantFactory())
      .createAndReturnServiceInstance(config.services.find(s => s.name === "WatsonAssistant"), null);
    watson = await (new WatsonAssistantDomainFactory())
      .createAndReturnServiceInstance(
        config.services.find(s => s.name === "WatsonAssistantDomain"),
        new Map<string, any>([["WatsonAssistant", connector], ["Configuration", config]]),
      );
    lang = AvailableLanguages.EN;
  });

  it("should abstract watson connector", async function() {
    this.timeout(TIMEOUT);
    const rec = await watson.getAssistantOutput("Help", lang);
    expect(rec.intents[0].intent).to.equal("Help");
  });

  it("should provide easy methods for interacting with result", async function() {
    this.timeout(TIMEOUT);
    const out = await watson.getAssistantOutput("Help", lang);
    const rec = watson.getFirstIntentAndEntities(out);
    expect(rec.intent).to.equal("Help");
  });

  it("should provide easy methods for interacting with result", async function() {
    this.timeout(TIMEOUT);
    const out = await watson.getAssistantOutput("Help", lang);
    expect(watson.firstIntentIs(out.intents, "Help")).to.be.true;
  });
});
