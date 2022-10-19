import { Configuration } from "../src/Configuration";
import { expect } from "chai";
import * as path from "path";
import * as sinon from "sinon";

describe("Configuration Module", () => {

  beforeEach(() => {
    Configuration.reset();
  });

  describe("Provides interface to configuration files", () => {
    it("should load configuration files", () => {
      const config = `{
        "NLP_Treshold": 0.65,
        "DeveloperEmail":"martin.paroubek@siemens.com",
        "services": [
          {
            "type": "WatsonAssistant",
            "id": "WATSON_ASSISTANT_ASSISTANT_ID",
            "user": "WATSON_ASSISTANT_USERNAME",
            "password": "WATSON_ASSISTANT_PASSWORD",
            "gateway": "WATSON_ASSISTANT_GATEWAY"
          }
        ]
      }`;
      const fileSystem = {
        readFileSync: sinon.fake.returns(Buffer.from(config, "utf8")),
      };
      const result = Configuration.get(fileSystem, path, "dev");

      expect(result.NLP_Treshold).to.equal(0.65);
      expect(result.DeveloperEmail).to.equal("martin.paroubek@siemens.com");
      expect(result.services[0].type).to.equal("WatsonAssistant");
    });

    it("should load configuration files according to env", () => {
      const config = ``;
      const fileSystem = {
        readFileSync: sinon.fake.returns(Buffer.from(config, "utf8")),
      };
      Configuration.get(fileSystem, path, "dev");
      expect(
        fileSystem.readFileSync.args[0][0].includes(".prod."), // first call, first arg
      ).to.be.false;
      expect(
        fileSystem.readFileSync.args[0][0].includes(".dev."), // first call, first arg
      ).to.be.true;

      Configuration.reset();
      fileSystem.readFileSync = sinon.fake.returns(Buffer.from(config, "utf8")),

      Configuration.get(fileSystem, path, "prod");
      expect(
        fileSystem.readFileSync.args[0][0].includes(".prod."), // first call, first arg
      ).to.be.true;
      expect(
        fileSystem.readFileSync.args[0][0].includes(".dev."), // first call, first arg
      ).to.be.false;
    });

    it("should return undefined if configuration wrong format", () => {
      const config = `{a,b:a.,1}`;
      const fileSystem = {
        readFileSync: sinon.fake.returns(Buffer.from(config, "utf8")),
      };
      const result = Configuration.get(fileSystem, path, "prod");

      expect(result).to.be.undefined;
    });

    it("should go through the file system only once", () => {
      const config = `{
        "NLP_Treshold": 0.65
      }`;
      const fileSystem = {
        readFileSync: sinon.fake.returns(Buffer.from(config, "utf8")),
      };
      const result1 = Configuration.get(fileSystem, path, "prod");
      const result2 = Configuration.get(fileSystem, path, "prod");

      expect(result1 === result2).to.be.true;
      sinon.assert.calledOnce(fileSystem.readFileSync);
    });
  });
});
