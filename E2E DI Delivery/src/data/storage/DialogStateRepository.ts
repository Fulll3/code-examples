import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";
import { IDialogState } from "../../conversation/interfaces/IDialogState";
import { IHanaResult } from "../hana/IHanaResult";
import { PromiseHanaResult } from "../hana/PromiseHanaResult";
import { CustomChoices } from "../../conversation/dialogs/helpers/CustomChoises";



export class DialogStateRepository {
  private static instance: DialogStateRepository;
  public static getInstance(): DialogStateRepository {
    if (!DialogStateRepository.instance) {
      DialogStateRepository.instance = new DialogStateRepository();
    }

    return DialogStateRepository.instance;
  }

  private dialogState: StatePropertyAccessor<IDialogState>;
  private conversationState: ConversationState;
  private constructor() {
    this.conversationState = BotServices.getInstance().get(ServiceTypes.ConversationState);
    this.dialogState = this.conversationState.createProperty<IDialogState>(StatePropertyAccessorNames.dialogState);
  }
  public async save(context: TurnContext, data: IDialogState): Promise<void> {
    await this.dialogState.set(context, data)
    return await this.conversationState.saveChanges(context, false);
  }

  public get(context: TurnContext) {
    return this.dialogState.get(context, {
      promiseHanaResulClass: null,
      restarted: false,
      index: null
    });
  }
  public async savePromisehanaResultIndex(context: TurnContext, index: number): Promise<void> {
    const data = await this.get(context);
    data.index = index;
    return this.save(context, data);
  }
  public async getPromisehanaResultIndex(context: TurnContext): Promise<number> {
    const data = await this.dialogState.get(context);
    return data.index;
  }
  public async savePromiseHanaResult(context: TurnContext, promiseHanaResults: PromiseHanaResult): Promise<void> {
    const data = await this.get(context);
    data.promiseHanaResulClass = promiseHanaResults;
    return this.save(context, data);
  }
  public async getPromiseHanaResult(context: TurnContext): Promise<PromiseHanaResult> {
    const data = await this.dialogState.get(context);
    return data.promiseHanaResulClass;
  }
  public async saveRestarted(context: TurnContext, restarted: boolean): Promise<void> {
    const data = await this.get(context);
    data.restarted = restarted;
    return this.save(context, data);
  }
  public async getRestarted(context: TurnContext): Promise<boolean> {
    const data = await this.dialogState.get(context);
    return data ? data.restarted : false;
  }

  public async getCustomChoices(context: TurnContext): Promise<CustomChoices> {
    const data = await this.get(context)
    if (data.customChoices == undefined) {
      data.customChoices = new CustomChoices();
    }
    return data.customChoices;
  }

}
