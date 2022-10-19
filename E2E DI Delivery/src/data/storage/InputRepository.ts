import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { IUserEnteredDocument } from "../../conversation/interfaces/IUserEnteredDocument";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";

export class InputRepository {
  private static instance: InputRepository;
  public static getInstance(): InputRepository {
    if (!InputRepository.instance) {
      InputRepository.instance = new InputRepository();
    }

    return InputRepository.instance;
  }

  private userInput: StatePropertyAccessor<IUserEnteredDocument>;
  private conversationState: ConversationState;

  private constructor() {
    this.conversationState = BotServices.getInstance().get(ServiceTypes.ConversationState);
    this.userInput = this.conversationState.createProperty<IUserEnteredDocument>(StatePropertyAccessorNames.userInput);
  }

  public async saveSimple(context: TurnContext, data: IUserEnteredDocument): Promise<void> {
    await this.userInput.set(context, data)
    return await this.conversationState.saveChanges(context)
  }
  public async save(context: TurnContext, reference: string, type: DeliveryDocumentType): Promise<void> {
    await this.userInput.set(context, {
      reference,
      type,
    })
    return await this.conversationState.saveChanges(context)
  }

  public get(context: TurnContext): Promise<IUserEnteredDocument> {
    return this.userInput.get(context, {
      reference: "",
      type: null,
      itemNo: null
    });
  }

  public async resetUserInput(context: TurnContext): Promise<void> {
    return await this.saveSimple(context, null);
  }

  public saveType = async (context: TurnContext, type: DeliveryDocumentType): Promise<void> => {
    console.log(`id save: ${context.activity.conversation.id}`)
    let data = await this.get(context);
    if (data) {
      data.type = type;
    } else {
      data = {
        type
      }
    }
    return await this.saveSimple(context, data);
  }
  public getType = async (context: TurnContext): Promise<DeliveryDocumentType> => {
    console.log(`id get: ${context.activity.conversation.id}`)
    const data = await this.get(context);
    return data.type;
  }
  
  public saveItemNo = async (context: TurnContext, itemNo: string): Promise<void> => {
    console.log(`id save: ${context.activity.conversation.id}`)
    let data = await this.get(context);
    data.itemNo = itemNo;
    return await this.saveSimple(context, data);
  }

  public getItemNo = async (context: TurnContext): Promise<string> => {
    const data = await this.get(context);
    return data.itemNo;
  }
}
