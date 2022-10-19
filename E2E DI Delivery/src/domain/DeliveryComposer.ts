import { IHanaResult } from "../data/hana/IHanaResult";
import { DeliveryDocument } from "./values/DeliveryDocument";
import { DeliveryAggregate } from "./values/DeliveryAggregate";
import { TurnContext } from "botbuilder-core";

enum SortingField {
  country = "country",
  salesOrder = "salesOrder"
}
export class DeliveryComposer {

  public static groupBySalesOrder = (turnContext:TurnContext,documents: DeliveryDocument[]) => {
    const groups = [];

    documents.forEach((document) => {
      DeliveryComposer.insertInMatchingGroup(turnContext,document, groups, SortingField.salesOrder);
    })
    return new DeliveryAggregate(groups);
  }

  public static groupByCountry(turnContext:TurnContext, data: IHanaResult[], documentType: string): DeliveryAggregate {
    const groups = [];

    data.forEach(item => {
      const document = DeliveryDocument.buildDeliveryDocumentFromHanaResult(turnContext,item, documentType)
      DeliveryComposer.insertInMatchingGroup(turnContext,document, groups, SortingField.country);
    });

    return new DeliveryAggregate(groups);
  }

  private static insertInMatchingGroup(turnContext: TurnContext,document: DeliveryDocument, groups: DeliveryDocument[][], sortByField: SortingField): void {
    for (const group of groups) {
      if (DeliveryComposer.documentBelongsToGroup(turnContext,document, group, sortByField)) {
        this.addToGroup(document, group);
        return;
      }
    }
    DeliveryComposer.addNewGroup(document, groups);
  }

  private static documentBelongsToGroup(turnContext:TurnContext, document: DeliveryDocument, group: DeliveryDocument[], sortByField: SortingField): boolean {
    if(sortByField === SortingField.country) {
      return document.getCountry() === group[0].getCountry()
    } else if (sortByField === SortingField.salesOrder) {
      return document.getSalesOrderNo(turnContext) === group[0].getSalesOrderNo(turnContext);
    }
  }

  private static addNewGroup(document: DeliveryDocument, groups: DeliveryDocument[][]): void {
    groups.push([
      document
    ]);
  }

  private static addToGroup(document: DeliveryDocument, group: DeliveryDocument[] ): void {
    group.push(document);
  }
}
