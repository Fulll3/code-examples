import { IEzSuiteInvoiceData } from "../../../business/data/EzSuite/IEzSuiteInvoiceData";
import { IHanaRowData } from "../../../business/data/HanaDataLake/IHanaRowData";
import { AbstractResultsHelper, InvoiceDataSource } from "./AbstractResultsHelper";
import { EzSuiteResultsHelper } from "./EzSuiteResultsHelper";
import { HanaResultsHelper } from "./HanaResultsHelper";

export class ResultHelperFactory {
  private hanaHelper: HanaResultsHelper;
  private hanaHelperBotanica: HanaResultsHelper;
  private ezSuiteHelper: EzSuiteResultsHelper;

  constructor(hanaHelper: HanaResultsHelper, ezSuiteHelper: EzSuiteResultsHelper) {
    this.hanaHelper = hanaHelper;
    this.ezSuiteHelper = ezSuiteHelper;
  }

  public getResultHelper(type: InvoiceDataSource): AbstractResultsHelper<IHanaRowData | IEzSuiteInvoiceData> {
    switch (type) {
      case InvoiceDataSource.HANA:
        return this.hanaHelper;
      case InvoiceDataSource.EZSUITE:
        return this.ezSuiteHelper;
      default:
        throw new Error("Unknown type of result helper.");
    }
  }
}