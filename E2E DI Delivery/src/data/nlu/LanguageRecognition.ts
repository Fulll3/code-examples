import { IEntity } from "./IEntity";

// TODO: Make this class imutable to decrease the chance of bugs
export class LanguageRecognition {
  constructor(
    private confidenceThreshold: number,
    private intent: string = null,
    private confidence: number = 0,
    private entities: IEntity[] = [],
  ) {
    if (!confidenceThreshold) {
      throw new Error(`[${LanguageRecognition.name}]: Missing parameter. confidenceThreshold is required`);
    }
  }

  public setIntent(intent: string): void {
    this.intent = intent;
  }

  public getIntent(): string {
    return this.intent;
  }

  public setConfidence(confidence: number): void {
    this.confidence = confidence;
  }

  public getConfidence(): number {
    return this.confidence;
  }

  public getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  public getEntities(): IEntity[] {
    return this.entities;
  }

  public getFirstEntity(): IEntity {
    return this.entities[0];
  }

  public getFirstEntityText = (): string => {
    const entity = this.getFirstEntity();
    return entity ? this.getFirstEntity().text : undefined;
  }
  public filterEntities(type: string): IEntity[] {
    return this.entities.filter(e => e.type === type);
  }

  public addEntity(entity: string, confidence: number, canonical: string, type: string, startIndex: number, endIndex: number, text: string): void {
    this.entities.push({ entity, confidence, canonical, type, startIndex, endIndex, text });
  }

  public matchesIntent(arguable: string): boolean {
    if (this.confidence < this.confidenceThreshold) {
      return false;
    }
    return arguable === this.intent;
  }

  public containsEntity(entity: string): boolean {
    for (const e of this.entities) {
      if (e.confidence >= this.confidenceThreshold && e.entity === entity) {
        return true;
      }
    }
    return false;
  }
}


export enum InputType {
  PurchaseOrderNumber = "poNumber",
  InvoiceNumber = "invoiceNumber",
  VendorNumber = "vendorNumber"
}

export interface ILanguageRecognition {
  confidence: number;
  confidenceThreshold: number;
  entities
}