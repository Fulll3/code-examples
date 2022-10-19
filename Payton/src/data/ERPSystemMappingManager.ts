import * as path from "path";
import { IAdditionalCompanyCodeInfo } from "../business/IAdditionalCompanyCodeInfo";
import { loadCsv } from "../core/utils/CsvLoader";

export class ERPSystemMappingManager {
  private mapping: [];
  private static instance: ERPSystemMappingManager;

  //#region Initialization 
  private constructor(mapping: any) {
    this.mapping = mapping;
  }

  public static Initialize = async () => {
    var filePath: string = path.join(__dirname, "../../configuration/mappingTable.csv");

    if (!ERPSystemMappingManager.instance) {
      ERPSystemMappingManager.instance = new ERPSystemMappingManager(await loadCsv(filePath));
    }

    return ERPSystemMappingManager.instance;
  }

  public static GetInstance = () => {
    if (!ERPSystemMappingManager.instance) {
      throw Error("ERPSystemMappingManager is not initialized.");
    }

    return ERPSystemMappingManager.instance;
  }
  //#endregion

  //#region Public Methods 
  public GetListOfSocCodes(): string[] {
    return this.mapping.map<string>(item =>
      (item['EZ-Suite SOC'] as string)
    );
  }

  public LoadERPSystem(soc: string) {
    var result: any = this.mapping.find((item) => (item['EZ-Suite SOC'] as string).toUpperCase() == soc.toUpperCase());

    return result
      ? result.View
      : undefined;
  }

  public LoadCompanyCode(soc: string) {
    var result: any = this.mapping.find(
      (item) => (item['EZ-Suite SOC'] as string).toUpperCase() == soc.toUpperCase()
    );

    return result
      ? result["Company Code"]
      : undefined;
  }

  public LoadSocCode(companyCode: string): string[] {
    var result: any = this.mapping.filter(
      (item) => (item['Company Code'] as string).toUpperCase() == companyCode.toUpperCase()
    );

    return result
      ? result.map((item) => item["EZ-Suite SOC"])
      : undefined;
  }

  public LoadAdditionalCompanyCodeInfo(companyCode: string, system: string): IAdditionalCompanyCodeInfo {
    var result: any = this.mapping.filter(
      (item) =>
        (item['Company Code'] as string).toUpperCase() == companyCode.toUpperCase() &&
        (item['View'] as string).substr(0, 3).toUpperCase() === system.toUpperCase()
    );

    return result
      ? {
        ezSuiteCode: result[0]['EZ-Suite SOC'],
        companyName: result[0]['Siemens Company Legal Name'],
        mailCode: result[0]['Mail Code']
      } as IAdditionalCompanyCodeInfo
      : undefined;
  }

  public LoadAdditionalInfo(mailCode: string): IAdditionalCompanyCodeInfo {
    var result: any = this.mapping.filter(
      (item) => (item['Mail Code'] as string).toUpperCase() == mailCode.toUpperCase()
    );

    return result && result.length > 0
      ? {
        ezSuiteCode: result[0]['EZ-Suite SOC'],
        companyName: result[0]['Siemens Company Legal Name'],
        mailCode: result[0]['Mail Code']
      } as IAdditionalCompanyCodeInfo
      : undefined;
  }
  //#endregion
}