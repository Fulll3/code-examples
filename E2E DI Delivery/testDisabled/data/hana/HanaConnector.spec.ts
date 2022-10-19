// tslint:disable: only-arrow-functions
// tslint:disable: no-unused-expression
// tslint:disable: no-string-literal
import * as sinon from "sinon";
import { fail } from "assert";
import { expect } from "chai";
import { HanaConnector } from "../../../src/data/hana/HanaConnector";

describe("Hana Connector utility", function() {
  describe("Initialization", function() {
    it("should require usename", function() {
      try {
        const connector = new HanaConnector("", "", "");
        fail("has accepted empty credentials parameters");
      } catch (error) {
        expect(error.message).to.equal(
          `[${HanaConnector.name}]: Missing parameter, username is required`,
        );
      }
    });

    it("should require password", function() {
      try {
        const connector = new HanaConnector("username", "", "");
        fail("has accepted empty credentials parameters");
      } catch (error) {
        expect(error.message).to.equal(
          `[${HanaConnector.name}]: Missing parameter, password is required`
        );
      }
    });

    it("should require endpoint", function() {
      try {
        const connector = new HanaConnector("username", "password", "");
        fail("has accepted empty connection endpoint");
      } catch (error) {
        expect(error.message).to.equal(
          `[${HanaConnector.name}]: Missing parameter, connection endpoint is required`
        );
      }
    });
  });

  describe("Runtime behavior", function() {
    it.skip("should add SSL layer in production", function() {
      //
    });
  });

  describe("Data gathering", function() {
    it("should issue http requests to HANA webservice appropriately", async function() {
      const connector = new HanaConnector(
        "username",
        "password",
        "https://hanadatalake.siemens.com/siemens/" +
        "SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/"
      );
      const http = sinon.fake.resolves({
        d: {
          results: [],
        },
      });
      connector["http"] = http as any;
      await connector.getData("123");
      const url = http.getCall(0).args[0];
      const post = http.getCall(0).args[1];

      expect(url).to.equal(
        "https://hanadatalake.siemens.com/siemens/" +
        "SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/" +
        "InputParams(I_DOC='123')/Results?$format=json",
      );

      expect(post.auth.username).to.equal("username");
      expect(post.auth.password).to.equal("password");
    });

    it("should extract most valuable ", async function() {
      const connector = new HanaConnector("username", "password", "hana.siemens.com");
      const http = sinon.fake.resolves({
        d: {
          results: [],
        },
      });
      connector["http"] = http as any;
      const result = await connector.getData("123");

      expect(result instanceof Array).to.be.true;
      expect(result.length).to.equal(0);
    });
  });

  describe("Health check", function() {
    it("should implement IHealthCheckable interface", async function() {
      const connector = new HanaConnector("username", "password", "hana.siemens.com");
      const http = sinon.fake.resolves({
        d: {
          results: [],
        },
      });
      connector["http"] = http as any;
      expect(await connector.isHealthy()).to.be.true;
    });

    it("should throw connection erros accordingly", async function() {
      const connector = new HanaConnector("username", "password", "hana.siemens.com");
      const http = sinon.fake.rejects("reason");
      connector["http"] = http as any;
      try {
        const health = await connector.isHealthy();
        fail("should have issued error");
      } catch (error) {
        expect(error.message).to.equal("reason");
      }
    });
  });
});
