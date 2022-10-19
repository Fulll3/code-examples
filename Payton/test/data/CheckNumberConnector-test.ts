// tslint:disable: only-arrow-functions
// tslint:disable: no-unused-expression
// tslint:disable: no-string-literal
import { fail } from "assert";
import { expect } from "chai";
import * as sinon from "sinon";
import { CheckNumberConnector } from "../../src/data/CheckNumberConnector";

describe("Check Number connector class", function() {
  let client: CheckNumberConnector;
  let http: any;  
  const datastoreResult = `[
    {"checknumber":"","clearingdocumentnumber":"105671727","documentnumber":"5400075546","invoicenumber":"C125320"},
    {"checknumber":"","clearingdocumentnumber":"103461727","documentnumber":"5400175226","invoicenumber":"C125320"}
  ]`;

  describe("Data input validation", function() {
    before(async function() {
      client = await CheckNumberConnector.getInstance(
        "https://url.example.com:8444/api/data", "username", "secure"
      );
      // fake http implementation
      http = sinon.fake.resolves(datastoreResult);
      client["http"] = http as any;
    });

    it("should not accept null as argument", async function() {
      try {
        const data = await client.getData(null);
        fail("accepted invalid input parameters");
      } catch (error) {
        expect(error.message).to.equal(
          `[${CheckNumberConnector.name}]:getData(): at least voucher number is required`
        );
      }
    });

    it("should not accept 'empty' voucher number", async function() {
      const voucherValues = [ null, undefined, '' ];
      while(voucherValues.length > 0) {
        try {
          const data = await client.getData({ voucherNumber: voucherValues.pop() });
          fail("accepted invalid input parameters");
        } catch (error) {
          expect(error.message).to.equal(
            `[${CheckNumberConnector.name}]:getData(): at least voucher number is required`
          );
        }
      }
    });
  });

  describe("Data gathering", function() {
    before(async function() {
      client = await CheckNumberConnector.getInstance(
        "https://url.example.com:8444/api/data", "username", "secure"
      );
    });

    beforeEach(function() {
      // fake http implementation
      http = sinon.fake.resolves(datastoreResult);
      client["http"] = http as any;
    });

    it("should format http request endpoints appropriately", async function() {
      const data = await client.getData({
        voucherNumber: "123456",
        clearingDocumentNumber: "123456",
      });
      const givenUrl = http.getCall(0).args[0];
      expect(givenUrl)
        .to
        .equal("https://url.example.com:8444/api/data?clearingdocumentnumber=123456&vouchernumber=123456");
    });

    it("should format http request options appropriately", async function() {
      const data = await client.getData({ voucherNumber: "987432" });
      const requestOptions = http.getCall(0).args[1];
      expect(requestOptions.auth.username).to.equal("username");
      expect(requestOptions.auth.password).to.equal("secure");
    });
  });
});
