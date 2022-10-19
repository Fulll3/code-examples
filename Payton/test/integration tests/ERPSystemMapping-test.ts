import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { ERPSystemMappingManager } from "../../src/data/ERPSystemMappingManager";

use(chaiAsPromised);
use(sinonChai);

var manager: ERPSystemMappingManager;

describe("ERP System Mapping Manager", () => {
  it("Error: not initialized", () => {
    try {
      ERPSystemMappingManager.GetInstance();
    } catch (err) {      
      expect(err).to.be.a("Error","ERPSystemMappingManager is not initialized.");
    }
  });
});

describe("ERP System Mapping Manager test", () => {
  before(async () => {
    await ERPSystemMappingManager.Initialize();
    manager = await ERPSystemMappingManager.GetInstance();
  });

  it("LoadERPSystem: for soc \"SDDTI\" should return \"PT201\"", () => {
    expect(manager.LoadERPSystem("SDDTI")).to.be.equal("PT201");
  });
  it("LoadERPSystem: for soc \"AAC\" should return \"OPP01\"", () => {
    expect(manager.LoadERPSystem("AAC")).to.be.equal("OPP01");
  });
  it("LoadCompanyCode: for soc \"SDDTI\" should return \"1000\"", () => {
    expect(manager.LoadCompanyCode("SDDTI")).to.be.equal("1000");
  });
  it("LoadCompanyCode: for soc \"AAC\" should return \"1800\"", () => {
    expect(manager.LoadCompanyCode("AAC")).to.be.equal("1800");
  });
  it("LoadSocCode: for cc \"1800\" should return \"AAC\"", () => {
    expect(manager.LoadSocCode("1800")[0]).to.be.equal("AAC");
  });
  it("LoadAdditionalCompanyCodeInfo: for company code \"0010\"", () => {
    var result = manager.LoadAdditionalCompanyCodeInfo("0010", "D35");

    expect(result.ezSuiteCode).to.be.equal("SCAN");
    expect(result.companyName).to.be.equal("Siemens Canada LTD");
    expect(result.mailCode).to.be.equal("MC-IMA061");
  });
  it("GetListOfSocCodes: first value and last value", () => {
    var listOfSoc = manager.GetListOfSocCodes();
    expect(listOfSoc[0]).to.be.equal("SDDTI");
    expect(listOfSoc[listOfSoc.length - 1]).to.be.equal("MEX-5564");
  });
  it("LoadAdditionalInfo: check of company name of third value", () => {
    var additionalInfo = manager.LoadAdditionalInfo("MC-IMA016");
    expect(additionalInfo.companyName).to.be.equal("Siemens Energy, Inc.");
  });
});