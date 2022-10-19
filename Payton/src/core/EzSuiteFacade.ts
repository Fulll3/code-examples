import { IEntitlement } from "../business/conversation/IEntiltement";
import { ISearchParameters } from "../business/conversation/ISearchParameters";
import { IEzSuiteConnector } from "../business/data/EzSuite/IEzSuiteConnector";
import { IEzSuiteConnectorParams } from "../business/data/EzSuite/IEzSuiteConnectorParams";
import { IEzSuiteInvoiceData } from "../business/data/EzSuite/IEzSuiteInvoiceData";
import { ERPSystemMappingManager } from "../data/ERPSystemMappingManager";
import moment = require("moment");

export class EzSuiteFacade {
  private connector: IEzSuiteConnector;

  //#region Initialization 
  constructor(connector: IEzSuiteConnector) {
    this.connector = connector;
  }
  //#endregion

  //#region Public Methods 
  public getData = async (authorization: IEntitlement[], searchParameters: ISearchParameters, isAdmin: boolean): Promise<{ count: number; results: IEzSuiteInvoiceData[] }> => {
    if (isAdmin) {
      const erpSystemMappingManager = ERPSystemMappingManager.GetInstance();
      authorization = erpSystemMappingManager.GetListOfSocCodes().map<IEntitlement>(item => {
        return { soc: item } as IEntitlement
      });
    }

    var socVendor = this.prepareAuthorizationParam(authorization);

    var params: IEzSuiteConnectorParams = {
      socVendor: socVendor,
      invoiceNumber: searchParameters.invoiceNumber,
      invoiceDate: searchParameters.invoiceDate,
      invoiceAmount: searchParameters.invoiceAmount,
      invoiceCurrency: searchParameters.invoiceCurrency,
      poNumber: searchParameters.poNumber
    };

    var results = await this.connector.getData(params).then(results => {
      return results.sort(this.compareDataByDateTime).sort(this.sortRejectedToEnd);
    });

    var count = results.length;

    return { count, results };
  }
  //#endregion

  //#region Private Methods 
  private sortRejectedToEnd(item1: IEzSuiteInvoiceData, item2: IEzSuiteInvoiceData) {
    if (item1.STATUS && item1.STATUS.toLowerCase() == "rejected") {
      return 1;
    }

    return 0;
  }

  private compareDataByDateTime(item1: IEzSuiteInvoiceData, item2: IEzSuiteInvoiceData) {
    let item1ChangeDate = moment(item1.invoice_status_changed_date, "MM-DD-YYYY");
    let item2ChangeDate = moment(item2.invoice_status_changed_date, "MM-DD-YYYY");


    if (item1ChangeDate < item2ChangeDate) {
      return 1;
    } else if (item1ChangeDate > item2ChangeDate) {
      return -1;
    } else {
      if (item1.invoice_status_changed_time < item2.invoice_status_changed_time) {
        return 1;
      } else if (item1.invoice_status_changed_time > item2.invoice_status_changed_time) {
        return -1;
      } else {
        return 0;
      }
    };
  }

  private prepareAuthorizationParam(entiltements: IEntitlement[]): string {
    var pairsSocVendor = entiltements.map(entiltement => {
      var temp = [];
      temp.push(entiltement.soc);

      if (entiltement.vendorId) {
        temp.push(entiltement.vendorId);
      }

      return temp.join("|");
    });

    return pairsSocVendor.join(",");
  }
  //#endregion
}