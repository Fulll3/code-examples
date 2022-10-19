import { CheckNumberConnector } from "../../../data/CheckNumberConnector";
import { Logger } from "botanica";
import { IHanaRowData } from "../../../business/data/HanaDataLake/IHanaRowData";
import { FinnavigateConnector } from "../../../data/finnavigate/FinnavigateConnector";

export class FinnavigateHelper {
  private static logger: Logger;

  public static async getCheckNumber(invoice: IHanaRowData): Promise<string> {
    if (!FinnavigateHelper.logger) {
      FinnavigateHelper.logger = new Logger(FinnavigateHelper.name);
    }
    const document = {
      clearingDocumentNumber: invoice.ClearingDocument,
      voucherNumber: `${invoice.DocumentNumber}`,
    };
    try {
      const connector =  FinnavigateConnector.getInstance();
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
