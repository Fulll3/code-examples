import { TurnContext } from "botbuilder-core";
import { Channels } from "botframework-schema";
import { DeliveryDocument } from "../domain/values/DeliveryDocument";
import { LocalizedMessages } from "./LocalizedMessages";
interface AdaptiveCardRow {
  itemNO: string;
  orderStatus: string;
  lastMilestone: string;
  deliveredOn: string;
  quantity: string;
  customerPurchaseNumber: string;
  salesOrderNumber?: string;
  lastConfirmedDeliveryDate: string;
  MLFB?: string;
  itemNoR2?: string;
  salesOrderNumberR2?: string;
  deliveryNoteDate:string;
  deliveryNoteNo: string;
  trackingNo: string;
  PONumber: string;
}

type OverViewTableHeadingsLength = {
  itemNrLength: number;
  statusLength: number;
  latestMilestoneLength: number;
  dateLenght: number;
  quantityLength: number;
  customerPurchaseNumberLength: number;
};
export class OverviewTable {
  private static getTableRowsData = (turnContext: TurnContext, documents: DeliveryDocument[]): AdaptiveCardRow[] => {
    let rows: Array<AdaptiveCardRow> = [];
    documents.forEach((document) => {
      let rowData: AdaptiveCardRow = {
        salesOrderNumber: document.getSalesOrderNo(turnContext),
        itemNO: document.getItemNumber(),
        quantity: document.getQuantity(),
        MLFB: document.getMLFB(),
        customerPurchaseNumber: document.getCustomerPurchaseNumber(),
        salesOrderNumberR2: document.getR2SalesOrderNumber(),
        itemNoR2: document.getR2SalesOrderItem(),
        PONumber: document.getPurchaseOrderNo(),
        orderStatus: document.getStatus(),
        lastMilestone: document.getLatestMileston(),
        lastConfirmedDeliveryDate: document.getLCDD(turnContext),
        deliveryNoteDate: document.formatDate(document.getDeliveryNoteDate(), true, true),
        deliveredOn: document.formatDate(document.getOrderFulfilledAtDate(), true, true),
        deliveryNoteNo: document.getUCR(turnContext),
        trackingNo: document.getCarrierTracking(turnContext)
      }
      rows.push(rowData);
    });
    return rows;
  };

  private static getHeadingLenghts = (rows: AdaptiveCardRow[]): OverViewTableHeadingsLength => {
    let itemNrLength = 0;
    let statusLength = 0;
    let latestMilestoneLength = 0;
    let dateLenght = 0;
    let quantityLength = 0;
    let customerPurchaseNumberLength = 0;

    rows.forEach((row) => {
      if (row.itemNO.length > itemNrLength) {
        itemNrLength = row.itemNO.length;
      }
      if (row.orderStatus.length > statusLength) {
        statusLength = row.orderStatus.length;
      }
      if (row.lastMilestone.length > latestMilestoneLength) {
        latestMilestoneLength = row.lastMilestone.length;
      }
      if (row.deliveredOn.length > dateLenght) {
        dateLenght = row.deliveredOn.length;
      }
      if (row.quantity.length > quantityLength) {
        quantityLength = row.quantity.length;
      }
      if (row.customerPurchaseNumber.length > customerPurchaseNumberLength) {
        customerPurchaseNumberLength = row.customerPurchaseNumber.length;
      }
    });
    return {
      itemNrLength,
      statusLength,
      latestMilestoneLength,
      dateLenght,
      quantityLength,
      customerPurchaseNumberLength,
    };
  };
  private static getTranslatedHeadings = (
    turnContext: TurnContext,
    localizedMessages: LocalizedMessages,
    headingsLength: OverViewTableHeadingsLength
  ): string[] => {

    const headings = [
      localizedMessages.getTranslation(turnContext,"salesOrderNumber"),
      localizedMessages.getTranslation(turnContext,"itemNo").padEnd(headingsLength.itemNrLength),
      localizedMessages.getTranslation(turnContext,"quantity").padEnd(headingsLength.quantityLength),
      localizedMessages.getTranslation(turnContext,"MLFB"),
      localizedMessages.getTranslation(turnContext,"customerPurchaseNumber").padEnd(headingsLength.dateLenght),
      localizedMessages.getTranslation(turnContext,"salesOrderNumberShippingLocation"),
      localizedMessages.getTranslation(turnContext,"itemNo"),
      localizedMessages.getTranslation(turnContext,"PONumber"),
      localizedMessages.getTranslation(turnContext,"orderStatus").padEnd(headingsLength.statusLength),
      localizedMessages.getTranslation(turnContext,"lastMilestone").padEnd(headingsLength.latestMilestoneLength),
      localizedMessages.getTranslation(turnContext,"lastConfirmedDeliveryDate"),
      localizedMessages.getTranslation(turnContext,"deliveryNoteDate"),
      localizedMessages.getTranslation(turnContext,"delieveredHeading").padEnd(headingsLength.dateLenght),
      localizedMessages.getTranslation(turnContext,"deliveryNoteNo"),
      localizedMessages.getTranslation(turnContext,"trackingNo")
    ];
    return headings
  };

  private static getColumnNamesRow = (
    turnContext: TurnContext,
    localizedMessages: LocalizedMessages,
    headingsLength: OverViewTableHeadingsLength,
    includeSalesOrder: boolean
  ) => {
    const translatedHeadings = OverviewTable.getTranslatedHeadings(turnContext,localizedMessages, headingsLength);

    let columnNames = "|";
    let columnNamesSeparator = "|";
    translatedHeadings.forEach((heading) => {
      columnNames += ` ${heading} |`;
      const dash = "-".padEnd(heading.length + 2);
      columnNamesSeparator += `${dash}|`;
    });
    columnNames += "\n";
    columnNamesSeparator += "\n";
    return columnNames.concat(columnNamesSeparator);
  };
  private static createDataRows = (data: AdaptiveCardRow[], isMsTeams: boolean) => {
    let dataRows = "";
    data.forEach((row, dataRowIndex) => {
      let overViewDataRow = "| "
      Object.keys(row).forEach((key, index, array) => {
        if(key === "itemNO") {
          const itemNoLinkId = `itemNoId${dataRowIndex}`;
          overViewDataRow += isMsTeams ? `${row[key]} |` : OverviewTable.getItemNoAsLink(itemNoLinkId, dataRowIndex, row, key)
        } else if(key === "salesOrderNumber") {
          const salesOrderNoLinkId = OverviewTable.getSalesOrderNoLinkId(dataRowIndex);
          overViewDataRow += `<span id="${salesOrderNoLinkId}" >${row[key]}</span> |`
        } else {
          overViewDataRow += `${row[key]} |`
        }

      })
      dataRows += `${overViewDataRow}\n`
    });
    return dataRows;
  };
  private static getItemNoAsLink(itemNoLinkId: string, dataRowIndex: number, row: AdaptiveCardRow, key: string) {
    return `<a id="${itemNoLinkId}" onclick="sendMessage(getElementById('${OverviewTable.getSalesOrderNoLinkId(dataRowIndex)}').innerHTML, getElementById('${itemNoLinkId}').innerHTML)" >${row[key]}</a> |`;
  }

  private static getSalesOrderNoLinkId(dataRowIndex: number) {
    return `salesOrderNoId${dataRowIndex}`;
  }

  private static isItemNoKey(index: number) {
    return index === 1;
  }

  public static createItemsOverviewTable(turnContext: TurnContext, documents: DeliveryDocument[], localizedMessages: LocalizedMessages, includeSalesOrder: boolean, channelId: string) {
    const data = OverviewTable.getTableRowsData(turnContext,documents);
    const headingsLength = OverviewTable.getHeadingLenghts(data);
    const columnNamesRow = OverviewTable.getColumnNamesRow(turnContext, localizedMessages, headingsLength, includeSalesOrder);
    const dataRows = OverviewTable.createDataRows(data, OverviewTable.isMsTeamsChannel(channelId));
    const finalString = columnNamesRow.concat(dataRows);
    return finalString;
  }

  private static isMsTeamsChannel = (channelId: string) => {
    return channelId === Channels.Msteams;
  }
}
