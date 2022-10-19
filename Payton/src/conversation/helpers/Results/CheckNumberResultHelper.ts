import { CheckNumberConnector } from "../../../data/CheckNumberConnector";
import { Logger } from "botanica";
import { IHanaRowData } from "../../../business/data/HanaDataLake/IHanaRowData";

export class CheckNumberResultHelper {
  private static logger: Logger;

  public static async getCheckNumber(invoice: IHanaRowData): Promise<string> {
    if (!CheckNumberResultHelper.logger) {
      CheckNumberResultHelper.logger = new Logger(CheckNumberResultHelper.name);
    }
    const document = {
      clearingDocumentNumber: invoice.ClearingDocument,
      voucherNumber: invoice.DocumentNumber,
    };
    try {
      const connector = await CheckNumberConnector.getInstance();
      const result = await connector.getData(document);
      if (result && result.length == 0) {
        return null;
      }
      return result[0].checknumber;
    } catch (error) {
      this.logger.debug(`Error while trying to retrieve check number for invoice ${invoice.InvoiceNumber}:${document}, ${error}`);
      return null
    }
  }
}
