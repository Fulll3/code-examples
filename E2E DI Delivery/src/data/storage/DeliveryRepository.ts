import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";
import { DeliveryAggregate } from "../../domain/values/DeliveryAggregate";
import { DeliveryDocument } from "../../domain/values/DeliveryDocument";
import { InputRepository } from "./InputRepository";

export class DeliveryRepository {
  private static instance: DeliveryRepository;
  public static getInstance(): DeliveryRepository {
    if (!DeliveryRepository.instance) {
      DeliveryRepository.instance = new DeliveryRepository();
    }

    return DeliveryRepository.instance;
  }

  private groupedDocumentIndex: StatePropertyAccessor<number>;
  private groupedDocuments: StatePropertyAccessor<DeliveryDocument[][]>;
  private conversationState: ConversationState;

  private constructor() {
    this.conversationState = BotServices.getInstance().get(ServiceTypes.ConversationState);
    this.groupedDocumentIndex = this.conversationState.createProperty<number>(StatePropertyAccessorNames.groupedDocumentIndex);
    this.groupedDocuments = this.conversationState.createProperty<DeliveryDocument[][]>(StatePropertyAccessorNames.groupedDocuments);
  }

  public async saveDocumentGroup(context: TurnContext, documents: DeliveryAggregate): Promise<void> {
    await this.groupedDocuments.set(context, documents.getStructuredDocuments())
    return await this.conversationState.saveChanges(context);
  }

  public async getDocumentGroup(context: TurnContext, documentType): Promise<DeliveryAggregate> {
    const unstructuredDDGroup = await this.groupedDocuments.get(context);
    for (const group of unstructuredDDGroup) {
      for (let j = 0; j < group.length; j++) {
        const unstructuredDD = group[j];
        group[j] = DeliveryDocument.buildDeliveryDocumentFromStorageResult(unstructuredDD, documentType);
      }
    }
    return new DeliveryAggregate(unstructuredDDGroup);
  }

  public async saveDocumentGroupIndex(context: TurnContext, index: number): Promise<void> {
    await this.groupedDocumentIndex.set(context, index);
    return await this.conversationState.saveChanges(context)
  }

  public getDocumentGroupIndex(context: TurnContext): Promise<number> {
    return this.groupedDocumentIndex.get(context);
  }

  public async getDocumentGroupAtIndex(context: TurnContext, index: number, type: string): Promise<DeliveryDocument[]> {
    const groups = await this.getDocumentGroup(context, type);
    return groups.getGrouptAtIndex(index);
  }

  public async getDocumentCountries(context: TurnContext, type: string): Promise<string[]> {
    const groups = await this.getDocumentGroup(context, type);
    return groups.getGroupCountries();
  }
  public async getItemNumbers(context: TurnContext, type: string): Promise<string[]> {
    const groups = await this.getDocumentGroup(context, type);
    return await groups.getGroupItemNumbers(context);
  }

  public async getDocumentIndexByCountry(context: TurnContext, country: string, type: string): Promise<number> {
    const groups = await this.getDocumentGroup(context, type);
    const index = groups.getGrouptIndexByCountry(country);
    if (index < 0) {
      throw new Error("Country index not found");
    }
    return index;
  }
}
