import { IEzSuiteInvoiceData } from "../../business/data/EzSuite/IEzSuiteInvoiceData";
import { IHanaRowData } from "../../business/data/HanaDataLake/IHanaRowData";

export class InvoicesAggregator {
  /*
  * removes invoices that contains same data as defined in funciton generateString
  * assumption incoming results are ordered by posting date
  */

  public static aggregateResultsHana(results: IHanaRowData[]): IHanaRowData[] {
    return InvoicesAggregator.aggregateResults(results, this.generateString);
  }
  public static aggregateResultsEzSuite(results: IEzSuiteInvoiceData[]): IEzSuiteInvoiceData[] {
    return InvoicesAggregator.aggregateResults(results, this.generateStringEzSuite);
  }

  private static aggregateResults<T>(results: T[], createIdentifier: (T) => string): T[] {
    var count = results.length;
    var outputResults: T[] = [];
    var alreadyAdded: string[] = []

    if (count < 2) {
      return results;
    } else {
      for (let index = 0; index < count; index++) {
        const element = results[index];
        const identifier = createIdentifier(element);

        if (!alreadyAdded.some(item => item === identifier)) {
          outputResults.push(element);
          alreadyAdded.push(identifier);
        }
      }

      return outputResults;
    }
  }

  private static generateStringEzSuite(dataRow: IEzSuiteInvoiceData) {
    return JSON.stringify({
      invoiceNumber: dataRow.invoice_number ? dataRow.invoice_number : "",
      companyCode: dataRow.invoice_company_code ? dataRow.invoice_company_code : "",
      amount: dataRow.invoice_amount ? dataRow.invoice_amount : "",
      currency: dataRow.invoice_currency ? dataRow.invoice_currency : "",
      date: dataRow.invoice_date ? dataRow.invoice_date : "",
      vendorId: dataRow.invoice_vendor_nbr ? dataRow.invoice_vendor_nbr : ""
    });
  }

  private static generateString(dataRow: IHanaRowData) {
    return JSON.stringify({
      invoiceNumber: dataRow.InvoiceNumber,
      companyCode: dataRow.CompanyCode,
      amount: dataRow.DocumentAmount,
      currency: dataRow.DocumentCurrency,
      date: dataRow.DocumentDate,
      vendorId: dataRow.VendorNumber
    });
  }
}