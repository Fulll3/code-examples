import { FeedbackType } from "../../monitoring/telemetry/FeedbackType";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { UserState, StatePropertyAccessor, TurnContext, ConversationState } from "botbuilder";
import { StatePropertyAccessorNames } from "../../conversation/values/StatePropertyAccessorNames";
import { AvailabilityData } from "applicationinsights/out/Declarations/Contracts";
import { AvailableLanguages } from "../../conversation/LocalizedMessages";
import { User, UserDetails } from "../../domain/User";
import { Logger } from "botanica";

type UserDataRepositoryDataType = {
  lastFeedbackAskedDate: Date;
  genericFeedback: FeedbackType;
  additionalFeedback: string;
  userDetails?: UserDetails;
};


export class UserDataRepository {
  private static instance: UserDataRepository;
  private userRepositoryAccessor: StatePropertyAccessor<UserDataRepositoryDataType>;
  private logger: Logger;
  private userState: ConversationState;
  public static getInstance(): UserDataRepository {
    if (!UserDataRepository.instance) {
      UserDataRepository.instance = new UserDataRepository();
    }
    return UserDataRepository.instance;
  }

  private constructor() {
    this.userState = BotServices.getInstance().get(
      ServiceTypes.UserState
    );
    this.userRepositoryAccessor = this.userState.createProperty(
      StatePropertyAccessorNames.userData
    );
    this.logger = new Logger(UserDataRepository.name);
  }

  public async save(
    context: TurnContext,
    data: UserDataRepositoryDataType
  ): Promise<void> {
    await this.logger.info(`save conversationId:  ${context.activity.conversation.id}`)
    await this.logger.info(`save userId:  ${context.activity.from.id}`)
    await this.logger.info(`save data:  ${JSON.stringify(data)}`)
    await this.userRepositoryAccessor.set(context, data);
    return await this.userState.saveChanges(context, true);
  }

  public async get(context: TurnContext): Promise<UserDataRepositoryDataType> {
    await this.logger.info(`get conversationId:  ${context.activity.conversation.id}`)
    await this.logger.info(`get userId:  ${context.activity.from.id}`)
    const data = await this.userRepositoryAccessor.get(context, {
      lastFeedbackAskedDate: null,
      genericFeedback: FeedbackType.empty,
      additionalFeedback: "",
      userDetails: { Email: "", Country: "", External: null }
    });
    await this.logger.info(`get data:  ${JSON.stringify(data)}`)
    return data;

  }

  public saveGenericFeedback = async (
    context: TurnContext,
    genericFeedback: FeedbackType
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.genericFeedback = genericFeedback;
    return await this.save(context, savedData);
  };
  public getGenericFeedback = async (
    context: TurnContext
  ): Promise<FeedbackType> => {
    const savedData = await this.get(context);
    return savedData.genericFeedback;
  };

  public saveCustomFeedback = async (
    context: TurnContext,
    customFeedback: string
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.additionalFeedback = customFeedback;
    return await this.save(context, savedData);
  };
  public getCustomFeedback = async (context: TurnContext): Promise<string> => {
    const savedData = await this.get(context);
    return savedData.additionalFeedback;
  };

  public saveLastFeedbackAskedDate = async (
    context: TurnContext,
    date: Date
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.lastFeedbackAskedDate = date;
    return await this.save(context, savedData);
  };
  public getLastFeedbackAskedDate = async (
    context: TurnContext
  ): Promise<Date> => {
    const savedData = await this.get(context);
    return savedData.lastFeedbackAskedDate;
  };

  public resetFeedbackData = async (
    context: TurnContext
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.genericFeedback = FeedbackType.empty;
    savedData.additionalFeedback = ""
    return await this.save(context, savedData);
  }



  public saveUserDetails = async (
    context: TurnContext,
    user: User
  ): Promise<void> => {
    const savedData = await this.get(context);
    savedData.userDetails = user.getUserDetails();
    return await this.save(context, savedData);
  };

  public getUserDetails = async (
    context: TurnContext
  ): Promise<UserDetails> => {
    const savedData = await this.get(context);
    return savedData.userDetails;
  };
  public getUser = async (
    context: TurnContext
  ): Promise<User> => {
    const savedData = await this.get(context);
    return new User(savedData.userDetails);
  };
}
