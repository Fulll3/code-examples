
import { TurnContext } from "botbuilder-core";
import { WaterfallStepContext } from "botbuilder-dialogs";
import { DeliveryRepository } from "../../data/storage/DeliveryRepository";
import { DeliveryDocument } from "./DeliveryDocument";
import { DeliveryDocumentType } from "./DeliveryDocumentType";

export class DeliveryAggregate {
  private documents: DeliveryRepository;
  constructor(private structuredDocuments: DeliveryDocument[][]) {
    if (!structuredDocuments) {
      this.structuredDocuments = [];
    }
    this.documents = DeliveryRepository.getInstance();
    this.structuredDocuments = this.structuredDocuments.filter(group => group[0].getCountry() != null);
  }

  public size(): number {
    return this.structuredDocuments.length;
  }

  public getStructuredDocuments(): DeliveryDocument[][] {
    return this.structuredDocuments;
  }

  public getGrouptAtIndex(index: number): DeliveryDocument[] {
    if (index < 0) {
      throw new Error(`[${DeliveryAggregate.name}]: getGrouptAtIndex(${index}) index cannot be negative`);
    }
    if (index > (this.size() - 1)) {
      throw new Error(`[${DeliveryAggregate.name}]: getGrouptAtIndex(${index}) index exceeds aggregate size`);
    }
    return this.structuredDocuments[index];
  }

  public getGroupCountries(): string[] {
    return this.structuredDocuments.map(group => group[0].getCountry());
  }

  public getGroupSalesOrders(turnContext:TurnContext): string[] {
    return this.structuredDocuments.map(group => group[0].getSalesOrderNo(turnContext));
  }


  public async getGroupItemNumbers(context: TurnContext): Promise<string[]> {
    const index = await this.documents.getDocumentGroupIndex(context);
    return Promise.all(this.structuredDocuments[index].map(async (group) => group.getItemNumber()));
  }
  public getGrouptIndexByCountry(country: string): number {
    for (let i = 0; i < this.structuredDocuments.length; i++) {
      if (this.structuredDocuments[i][0].getCountry() === country) {
        return i;
      }
    }
    return -1;
  }

  public getGrouptIndexBySalesOrder(turnContext: TurnContext,salesOrderNo: string): number {
    for (let i = 0; i < this.structuredDocuments.length; i++) {
      if (this.structuredDocuments[i][0].getSalesOrderNo(turnContext) === salesOrderNo) {
        return i;
      }
    }
    return -1;
  }

  public findDocumentsByItem(groupIndex: number, documentType: DeliveryDocumentType, documentItemNumber: string): DeliveryDocument[] {
    const documents = this.getGrouptAtIndex(groupIndex);

    return documents.filter((document) => DeliveryDocument.equalItemIgnoringLeadingZeros(document.getItemNumber(), documentItemNumber))
  }
}
