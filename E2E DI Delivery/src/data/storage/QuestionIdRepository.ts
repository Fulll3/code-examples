import { ConversationState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";

export class QuestionIdRepository {
  private static instance: QuestionIdRepository;
  public static getInstance(): QuestionIdRepository {
    if (!QuestionIdRepository.instance) {
      QuestionIdRepository.instance = new QuestionIdRepository();
    }

    return QuestionIdRepository.instance;
  }

  private questionID: StatePropertyAccessor<string>;
  private conversationState: ConversationState;

  private constructor() {
    this.conversationState = BotServices.getInstance().get(ServiceTypes.ConversationState);
    this.questionID = this.conversationState.createProperty<string>(StatePropertyAccessorNames.questionId);
  }

  public async save(context: TurnContext, questionId: string): Promise<void> {
    await this.questionID.set(context, questionId);
    return await this.conversationState.saveChanges(context);
  }

  public async get(context: TurnContext): Promise<string> {
    const id = await this.questionID.get(context);
    return !!id ? id : "";
  }
}
