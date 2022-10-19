import { ActivityHandler, ActivityTypes, EndOfConversationCodes, TurnContext } from "botbuilder";
import { DialogSet, DialogInstance, DialogContext } from "botbuilder-dialogs";
import { DialogNames } from "./values/DialogNames";
import { MainDialog } from "./dialogs/MainDialog";
import { BotServices } from "../service/resolution/BotServices";
import { ServiceTypes } from "../service/resolution/ServiceTypes";
import { Telemetry } from "../monitoring/telemetry/Telemetry";
import { LocalizedMessages } from "./LocalizedMessages";
import { Logger } from "botanica";
import { DialogResult } from "../monitoring/telemetry/DialogResult";
import { User, UserDetails } from "../domain/User";
import { UserDataRepository } from "../data/storage/UserDataRepository";
import { JWTParser } from "./JWTParser";
import { userInfo } from "os";
import { Runtime } from "../Runtime";

export class DialogBot extends ActivityHandler {
  private readonly solutionName: string = "sample-assistant";
  private dialogs: DialogSet;
  private logger = new Logger(DialogBot.name);
  private userRepository: UserDataRepository;
  constructor(dialog: MainDialog) {
    super();
    const conversationState = BotServices.getInstance().get(ServiceTypes.ConversationState);
    this.userRepository = UserDataRepository.getInstance();
    this.dialogs = new DialogSet(conversationState.createProperty(this.solutionName)).add(dialog);
    this.onTurn(this.turn.bind(this));
  }

  public async turn(turnContext: TurnContext, next: () => Promise<void>): Promise<any> {
    let dc: DialogContext;

    try {
      let dc = await this.dialogs.createContext(turnContext);
      this.logger.info(`recived activity type: ${dc.context.activity.type}`)
      if(this.isUserDetails(dc)) {
        const jwt = dc.context.activity.value;
        const userDetails =   await JWTParser.getUserDetails(jwt);
        await this.userRepository.saveUserDetails(dc.context , new User(userDetails));
      }

      if (turnContext.activity.code === EndOfConversationCodes.BotTimedOut) {
        Telemetry.trackTimeout(turnContext.activity);
      } else { // handle user message

        if (dc.activeDialog !== undefined) {
          await dc.continueDialog();
        } else {
          await dc.beginDialog(DialogNames.MainDialog);
        }
      }
    } catch (error) {
      this.logger.error(error);
      Telemetry.trackConversationFulfillment(turnContext.activity, DialogResult.error);
      await (new LocalizedMessages("Handlers")).sendMessage(turnContext, "uncaught");
      Telemetry.trackException(turnContext.activity, error);
      if (!!dc) {
        dc.cancelAllDialogs();
      }
    } finally {
      await next();
    }
  }

  private isUserDetails(dc: DialogContext) {
    return dc.context.activity.type === ActivityTypes.Event && dc.context.activity.name === "userDetails";
  }
}
  