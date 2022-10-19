import { Middleware, TurnContext, ActivityTypes, StatePropertyAccessor, Channels, TeamsInfo } from "botbuilder";
import { BotanicaBotUser, UserJWTValidator, Logger } from "botanica";
import { UserRepository } from "../data/storage/UserRepository";
import { Services } from "../service/Services";

export class SetUserDataMiddleware implements Middleware {

  private userJWTVerifier: UserJWTValidator = new UserJWTValidator();
  private logger: Logger = new Logger(SetUserDataMiddleware.name);

  constructor(private userRepository: UserRepository) { };

  public onTurn = async (context: TurnContext, next: () => Promise<void>): Promise<void> => {
    if (context === null) {
      throw new Error(`[${SetUserDataMiddleware.name}] null context not allowed`);
    }

    if (context.activity !== null) {
      const email = await this.getUserEmail(context)
      await this.setUserData(context, email);
    }
    if (next !== null) {
      await next();
    }
  }

  private getUserEmail = async (context: TurnContext) => {
    try {
      if (context.activity.channelId === Channels.Msteams) {
        if (context.activity.type === ActivityTypes.Message) {
          const member = await TeamsInfo.getMember(context, context.activity.from.id);
          return member.email;
        }
      } else {
        if (context.activity.name === "user/join") {
          const userJWT = context.activity.value.user;
          const userData: BotanicaBotUser = await this.userJWTVerifier.verify(userJWT);
          return userData.email;
        }
      }
    } catch (e) {
      this.logger.warn("could not get user data from user jwt - %o", e);
    }
  }

  private isFromSiemensEnergy = (email: string) => {
    return email.includes("@siemens-energy.com");
  }
  private async setUserData(context: TurnContext, email: string) {
    if (email) {
      const isFromSiemensEnergy = this.isFromSiemensEnergy(email);
      await this.userRepository.saveIsUserFromSiemensEnergy(context, isFromSiemensEnergy);
    }
  }


}