import { IEntitlement } from "../business/conversation/IEntiltement";
import { ISearchParameters } from "../business/conversation/ISearchParameters";
import { ERPSystemMappingManager } from "../data/ERPSystemMappingManager";
import { QueryLoader } from "./QueryLoader";
import { addLeadingZeros } from "./utils/PaytonUtilities";
import _ = require("lodash");
import moment = require("moment");

export interface IEntitlementView extends IEntitlement {
  view: string;
  mappedCompanyCode: string;
}

export interface IQueryData {
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceAmount: string;
  invoiceCurrency: string;
  poNumber: string;
}

export class QueryCreator {
  //#region Public Methods 
  public static async CreateQuery(entiltementData: IEntitlement[], queryData: ISearchParameters, isAdmin: boolean, schemaVersion: HanaSchemaVersion) {
    const erpSystemMappingManager = ERPSystemMappingManager.GetInstance();

    if (isAdmin) {
      entiltementData = erpSystemMappingManager.GetListOfSocCodes().map<IEntitlement>(item => {
        return { soc: item } as IEntitlement
      });
    }

    const listOfRelevantSystems = QueryCreator.GetListOfRelevantSystems(entiltementData, erpSystemMappingManager);
    const viewVendorMapping = QueryCreator.GetViewAuthorizationFilters(listOfRelevantSystems);
    const query = QueryCreator.GetSearchParameters(queryData, schemaVersion);

    let viewQueries = [];
    let values = [];
    viewVendorMapping.forEach((vendorViewMap) => {
      let sqlStatement = QueryCreator.generateViewQuery(vendorViewMap, values, query);
      viewQueries.push(sqlStatement);
    });

    var sql = this.getSql(schemaVersion)
    const finalQuery = `${sql} \r\nWHERE \r\n\t${viewQueries.join(" OR\r\n\t")} \r\norder by \"POSTINGDATE\" desc`;

    return {
      query: finalQuery,
      params: values
    };
  }

  public static async CreateQuerySnowflake(entiltementData: IEntitlement[], queryData: ISearchParameters, isAdmin: boolean, schemaVersion: HanaSchemaVersion) {
    const erpSystemMappingManager = ERPSystemMappingManager.GetInstance();

    if (isAdmin) {
      entiltementData = erpSystemMappingManager.GetListOfSocCodes().map<IEntitlement>(item => {
        return { soc: item } as IEntitlement
      });
    }

    const listOfRelevantSystems = QueryCreator.GetListOfRelevantSystems(entiltementData, erpSystemMappingManager);
    const viewVendorMapping = QueryCreator.GetViewAuthorizationFilters(listOfRelevantSystems);
    const query = QueryCreator.GetSearchParameters(queryData, schemaVersion);

    let viewQueries = [];
    let values = [];
    viewVendorMapping.forEach((vendorViewMap) => {
      let sqlStatement = QueryCreator.generateViewQuerySnowflake(vendorViewMap, values, query);
      viewQueries.push(sqlStatement);
    });

    var sql = this.getSql(schemaVersion)
    const finalQuery = `${sql} \r\nWHERE \r\n\t${viewQueries.join(" OR\r\n\t")} \r\norder by POSTINGDATE desc`;

    return {
      query: finalQuery,
      params: values
    };
  }
  //#endregion
  private static getSql = (schemaVersion: HanaSchemaVersion) => {
    return QueryLoader.GetInstance().Get("HANA_PERSISTANTTABLE", schemaVersion)
  }
  //#region Private Methods 
  private static generateViewQuery(vendorViewMap: { view: string; vendorIds: string[]; compenyCodes: string[]; }, values: any[], query: { key: string; value: string; note: string; }[]) {
    let fields = [];
    let countOfVendorIds = vendorViewMap.vendorIds.length;

    if (countOfVendorIds > 0) {
      fields.push(`"VENDORNUMBER" IN (${[...Array(countOfVendorIds + 1).join("?")].join(",")})`);
      vendorViewMap.vendorIds.forEach((vendorId) => values.push(addLeadingZeros(vendorId, 10)));
    }
    var countOfCompanyCodes = vendorViewMap.compenyCodes.length;
    if (countOfCompanyCodes > 0) {
      fields.push(`"COMPANYCODE" IN (${[...Array(countOfCompanyCodes + 1).join("?")].join(",")})`);
      vendorViewMap.compenyCodes.forEach((compenyCode) => values.push(compenyCode));
    }
    query.forEach((item) => {
      if (item.value) {
        fields.push(`${item.key.toUpperCase()} = ?`);
        values.push(item.value);
      }
    });

    fields.push(`"SYSTEM" = ?`);
    values.push(vendorViewMap.view.substring(0, 3));

    return fields.join(" AND ");
  }

  private static generateViewQuerySnowflake(vendorViewMap: { view: string; vendorIds: string[]; compenyCodes: string[]; }, values: any[], query: { key: string; value: string; note: string; }[]) {
    let fields = [];
    let countOfVendorIds = vendorViewMap.vendorIds.length;

    if (countOfVendorIds > 0) {
      fields.push(`VENDORNUMBER IN (${[...Array(countOfVendorIds + 1).join("?")].join(",")})`);
      vendorViewMap.vendorIds.forEach((vendorId) => values.push(addLeadingZeros(vendorId, 10)));
    }
    var countOfCompanyCodes = vendorViewMap.compenyCodes.length;
    if (countOfCompanyCodes > 0) {
      fields.push(`COMPANYCODE IN (${[...Array(countOfCompanyCodes + 1).join("?")].join(",")})`);
      vendorViewMap.compenyCodes.forEach((compenyCode) => values.push(compenyCode));
    }
    query.forEach((item) => {
      if (item.value) {
        fields.push(`${item.key.toUpperCase()} = ?`);
        values.push(item.value);
      }
    });

    fields.push(`SYSTEM = ?`);
    values.push(vendorViewMap.view.substring(0, 3));

    return fields.join(" AND ");
  }

  private static GetViewAuthorizationFilters(listOfRelevantSystems: IEntitlementView[]) {
    return _.map(
      _.groupBy(listOfRelevantSystems, (item) => item.view),
      (item, key) => {
        return {
          view: key,
          vendorIds: [...new Set(item.map((grouping) => grouping.vendorId).filter(vendorId => vendorId !== undefined))],
          compenyCodes: [...new Set(item.map((grouping) => grouping.mappedCompanyCode).filter(mappedCompanyCode => mappedCompanyCode !== undefined))]
        };
      }).filter(viewVendorMapping => viewVendorMapping.view !== "undefined");
  }

  private static GetListOfRelevantSystems(entiltementData: IEntitlement[], erpSystemMappingManager: ERPSystemMappingManager) {
    return (entiltementData as IEntitlementView[]).map(element => {
      element.view = erpSystemMappingManager.LoadERPSystem(element.soc);
      element.mappedCompanyCode = erpSystemMappingManager.LoadCompanyCode(element.soc);

      return element;
    });
  }

  private static GetSearchParameters(queryData: ISearchParameters, schemaVersion: HanaSchemaVersion) {
    let searchParams =  [{
      key: `"InvoiceNumber"`,
      value: queryData.invoiceNumber,
      note: "InvoiceNumber"
    },
    {
      key: `"DocumentDate"`,
      value: queryData.invoiceDate
        ? moment(queryData.invoiceDate).format("YYYYMMDD")
        : undefined,
      note: "InvoiceDate"
    },
    {
      key: `"DocumentAmount"`,
      value: queryData.invoiceAmount,
      note: "Amount"
    },
    {
      key: `"DocumentCurrency"`,
      value: queryData.invoiceCurrency,
      note: "Currency"
    },
    {
      key: `"PONumber"`,
      value: queryData.poNumber,
      note: "PoNumber"
    }];
    if(schemaVersion === HanaSchemaVersion.Snowflake) {
      searchParams = searchParams.map((elem) => {
        return {
          key: elem.key.replace(/"/g, ""),
          value: elem.value,
          note: elem.note
        } 
      })
    }
    return searchParams
  }
  //#endregion
}


export enum HanaSchemaVersion {
  Botanica = "Botanica",
  Energy = "Energy",
  Snowflake = "Snowflake"
} 