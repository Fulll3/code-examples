import { InterruptionAction, RouterDialog } from "botbuilder-solutions";
import { InterruptionInput } from "./conversation/InterruptionInput";
import { LocalizedMessages } from "./conversation/LocalizedMessages";
import { DialogDetails, WatsonAssistant } from "./domain/watson/WatsonAssistant";
import { UserRepository } from "./data/storage/UserRepository";
import { WelcomeDialog } from "./conversation/dialogs/WelcomeDialog";
import { RestartDialog } from "./conversation/dialogs/RestartDialog";
import { ActivityTypes } from "botbuilder";
import { DialogContext, DialogTurnResult } from "botbuilder-dialogs";
import { HelpDialog } from "./conversation/dialogs/HelpDialog";
import { CheckTypes } from "./service/CheckTypes";
import { Services } from "./service/Services";
import { Logger } from "botanica";

import { RECOGNITION } from "./middlewares/watson/WatsonAssistantMiddleware";
import { InitialOptionsDialog } from "./conversation/dialogs/InitialOptionsDialog";
import { ChatbotCommands } from "./conversation/commands/ChatbotCommands";
import { ScheduleMainDialog } from "./conversation/dialogs/schedules/ScheduleMainDialog";
import { DialogStack } from "./conversation/DialogStack";
import { FreeSlotsDialog } from "./conversation/dialogs/robotStatus/FreeSlotsDialog";
import { ProcessStatusDialog } from "./conversation/dialogs/processStatus/ProcessStatusDialog";
import { RobotStatusRouteDialog } from "./conversation/dialogs/robotStatus/RobotStatusRouteDialog";
import { setPriority } from "os";
import { ScheduleInfoDialog } from "./conversation/dialogs/schedules/ScheduleInfoDialog";
import { GatherInputsDialog } from "./conversation/dialogs/GatherInputsDialog";
import { ScheduleCommands } from "./conversation/commands/ScheduleCommands";
import { UseCaseRunHistoryDialog } from "./conversation/dialogs/processStatus/UseCaseRunHistoryDialog";
import { SelectorSearchConfig } from "./conversation/dialogs/GatherInputHelper";
import { SplunkConnector } from "./data/splunk/SplunkConnector";
import { ScheduleDataConnector } from "./data/schedule/ScheduleDataConnector";
import { ExecutionsDialog } from "./conversation/dialogs/processStatus/ExecutionsDialog";
import { ProcessRunningDialog } from "./conversation/dialogs/processStatus/ProcessRunningDialog";
import { SplunkSimple } from "./domain/splunk/SplunkSimple";
import { Utils } from "./Utils";
import { AdaptiveCardCustom } from "./conversation/AdaptiveCard";
import { SchedulePreprocessor } from "./domain/schedules/SchedulePreprocessor";
import { RetirementStatus, SchedulesComposer } from "./domain/schedules/SchedulesComposer";
import { CardName } from "./conversation/values/CardName";
import { WatsonAssistantQna } from "./domain/watson/WatsonAssistantQna";
import { FaQDialog } from "./conversation/dialogs/faq/FaQDialog";

/**
 * This is the conversation container that act as the main point of creation for the ComponentDialogs.
 * Since we do not have an IoC based framework: this loads the root requrements of all
 * dialogs so they can focus on their specific conversation tasks. This can also make use of the
 * pre-loaded defined services in the app config
 */


export class Conversation extends RouterDialog {
  private readonly logger = new Logger(Conversation.name);

  /** Services */
  private userRepository: UserRepository;
  private interrupt: InterruptionInput;
  private watson: WatsonAssistant;

  /** Dialogs */
  private welcomeDialog: WelcomeDialog;
  private intialOptionsDialog: InitialOptionsDialog;
  private scheduleMainDialog: ScheduleMainDialog;
  private freeSlotsDialog: FreeSlotsDialog;
  private processStatusDialog: ProcessStatusDialog;
  private robotStatusRouteDialog: RobotStatusRouteDialog;
  private gatherInputsDialog: GatherInputsDialog;
  private splunkConnector: SplunkConnector;
  private scheduleDataConnector: ScheduleDataConnector;

  constructor() {
    super(Conversation.name, undefined);
    /** Retrieve loaded services */
    this.interrupt = Services.instance().get("InterruptionInput");
    this.watson = Services.instance().get("WatsonAssistantDomain");
    this.userRepository = Services.instance().get("UserRepository");
    this.splunkConnector = Services.instance().get("SplunkConnector");
    this.scheduleDataConnector = Services.instance().get("ScheduleDataConnector");

    /** Build dialogs in correct order */
    this.intialOptionsDialog = this.createInitialOptionsDialog();
    this.welcomeDialog = this.createWelcomeDialog();
    this.scheduleMainDialog = this.createScheduleMainDialog();
    this.freeSlotsDialog = this.createFreeSlotsDialog();
    this.processStatusDialog = this.createProcessStatusDialog();
    this.robotStatusRouteDialog = this.createRobotStatusRouteDialog();
    this.gatherInputsDialog = this.createGatherInputsDialog();

    /** Register dialogs in correct order */
    DialogStack.registerDialog(this, this.intialOptionsDialog, InitialOptionsDialog.name);
    DialogStack.registerDialog(this, this.scheduleMainDialog, ScheduleMainDialog.name);
    DialogStack.registerDialog(this, this.freeSlotsDialog, FreeSlotsDialog.name);
    DialogStack.registerDialog(this, this.robotStatusRouteDialog, RobotStatusRouteDialog.name);

    DialogStack.registerDialog(this, this.processStatusDialog, ProcessStatusDialog.name);
    DialogStack.registerDialog(this, this.gatherInputsDialog, GatherInputsDialog.name);

    this.addDialog(this.welcomeDialog)
      .addDialog(this.createRestartDialog())
      .addDialog(this.createHelpDialog())
      .addDialog(new ScheduleInfoDialog(ScheduleInfoDialog.name, this.userRepository))
      .addDialog(new UseCaseRunHistoryDialog(UseCaseRunHistoryDialog.name, this.userRepository))
      .addDialog(new ExecutionsDialog(ExecutionsDialog.name, this.userRepository))
      .addDialog(new ProcessRunningDialog(ProcessRunningDialog.name, this.userRepository))
      .addDialog(new FaQDialog(FaQDialog.name));
    this.logger.debug(`dialogs load completed`);
  }

  protected async onInterruptDialog(dc: DialogContext): Promise<InterruptionAction> {
    if (dc.context.activity.type === ActivityTypes.Message) {
      return await this.handleInteruption(dc);
    }
  }

  protected async onStart(dc: DialogContext): Promise<void> {
    await dc.beginDialog(WelcomeDialog.name);
  }

  protected async route(dc: DialogContext): Promise<void> {

    const command = dc.context.activity.text.toLowerCase().trim();

    if (this.watson.isGreeting(dc.context)) {
      await dc.beginDialog(WelcomeDialog.name);
      return;
    } else if (command === ChatbotCommands.checkSchedules.toLowerCase().trim()) {
      await dc.beginDialog(ScheduleMainDialog.name);
      return;
    } else if (command === ChatbotCommands.robotStatus.toLowerCase().trim()) {
      await dc.beginDialog(RobotStatusRouteDialog.name);
      return;
    } else if (command === ChatbotCommands.proccessStatus.toLowerCase().trim()) {
      await dc.beginDialog(ProcessStatusDialog.name);
      return;
    } else if (command === ChatbotCommands.faq.toLowerCase().trim()) {
      await dc.beginDialog(FaQDialog.name, FaQDialog.getOptions(true));
      return;
    } else {
      const dialog = this.watson.getDialogOptionsBasedOnRecognition(dc.context);
      await this.startDialogWithOptions(dc, dialog);
    }

  }
  protected async complete(innerDc: DialogContext, result: DialogTurnResult<any>): Promise<void> {

  }

  private async startDialogWithOptions(dc: DialogContext, dialog: DialogDetails): Promise<DialogTurnResult<any>> {
    return dc.beginDialog(dialog.dialogName, dialog.dialogOptions);
  }

  private async handleInteruption(dc: DialogContext): Promise<InterruptionAction> {
    if (await this.interrupt.isIgnoringUserInput()) {
      return InterruptionAction.StartedDialog; // ignore input while back end search is executing
    }
    const firstIntent = this.watson.getFirstIntentAndEntities(dc.context.turnState.get(RECOGNITION));
    if (CheckTypes.hasContent(firstIntent)) {
      if (this.interrupt.isHelp(firstIntent.intent, firstIntent.confidence)) {
        await dc.beginDialog(HelpDialog.name);
        return InterruptionAction.StartedDialog;
      } else if (this.interrupt.isRestart(firstIntent.intent, firstIntent.confidence)) {
        await dc.beginDialog(RestartDialog.name);
        return InterruptionAction.StartedDialog;
      }
    }
  }

  private createInitialOptionsDialog(): InitialOptionsDialog {
    return new InitialOptionsDialog(InitialOptionsDialog.name, this.userRepository);
  }

  private createScheduleMainDialog(): ScheduleMainDialog {
    return new ScheduleMainDialog(ScheduleMainDialog.name, this.userRepository, this.watson);
  }

  private createFreeSlotsDialog(): FreeSlotsDialog {
    return new FreeSlotsDialog(FreeSlotsDialog.name, this.userRepository);
  }
  private createProcessStatusDialog(): ProcessStatusDialog {
    return new ProcessStatusDialog(ProcessStatusDialog.name, this.userRepository, this.watson);
  }

  private createWelcomeDialog(): WelcomeDialog {
    return new WelcomeDialog(new LocalizedMessages(WelcomeDialog.name, this.userRepository), this.intialOptionsDialog);
  }

  private createRestartDialog(): RestartDialog {
    return new RestartDialog(
      new LocalizedMessages(RestartDialog.name, this.userRepository),
      this.watson,
      this.welcomeDialog
    );
  }

  private createHelpDialog(): HelpDialog {
    return new HelpDialog(new LocalizedMessages(HelpDialog.name, this.userRepository));
  }
  private createRobotStatusRouteDialog(): RobotStatusRouteDialog {
    return new RobotStatusRouteDialog(RobotStatusRouteDialog.name, this.userRepository, this.watson);
  }
  private createGatherInputsDialog(): GatherInputsDialog {
    return new GatherInputsDialog(GatherInputsDialog.name, this.userRepository);
  }
}
