import { ActivityTypes } from "botbuilder";
import { ChoiceFactory, ChoicePrompt, DialogContext, DialogTurnResult } from "botbuilder-dialogs";
import { InterruptionAction, RouterDialog } from "botbuilder-solutions";
import { DialogNames } from "../values/DialogNames";
import { WelcomeDialog } from "./WelcomeDialog";
import { RestartDialog } from "./RestartDialog";
import { HelpDialog } from "./HelpDialog";
import { GatherReferenceNumberDialog } from "./GatherReferenceNumberDialog";
import { InterruptionRecognizer } from "../InterruptionRecognizer";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { AvailableLanguages, LocalizedMessages } from "../LocalizedMessages";
import { RECOGNITION } from "../middlewares/WatsonAssistantMiddleware";
import { LanguageRecognition } from "../../data/nlu/LanguageRecognition";
import { DocumentTypeDialog } from "./DocumentTypeDialog";
import { DeliveryStatusDialog } from "./DeliveryStatusDialog";
import { SingleGroupDialog } from "./SingleGroupDialog";
import { MultipleGroupsDialog } from "./MultipleGroupsDialog";
import { ItemSearchDialog } from "./ItemSearchDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { Feed } from "watson-developer-cloud/natural-language-understanding/v1-generated";
import { DialogStack } from "../DialogStack";
import { ChoiceDialog } from "./ChoiceDialog";
import { Axios } from "axios";
import {
  CardFactory,
  MessageFactory,
  AttachmentLayoutTypes,
  Channels,
} from "botbuilder";
import { DialogStateRepository } from "../../data/storage/DialogStateRepository";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { SelectLanguageDialog } from "./SelectLanguageDialog";
import { Runtime } from "../../Runtime";
import { Logger } from "botanica";

export class MainDialog extends RouterDialog {

  private interrupt: InterruptionRecognizer;
  private localization: LocalizedMessages;
  private feedBackDialog: FeedbackDialog;
  private itemSearchDialog: ItemSearchDialog;
  private singleGroupDialog: SingleGroupDialog;
  private multipleGroupDialog: MultipleGroupsDialog;
  private deliveryStatusDialog: DeliveryStatusDialog;
  private gatherReferenceNumberDialog: GatherReferenceNumberDialog;
  private documentTypeDialog: DocumentTypeDialog;
  private welcomeDialog: WelcomeDialog;
  private helpDialog: HelpDialog;
  private restartDialog: RestartDialog;
  private choiceDialog: ChoiceDialog;
  private logger = new Logger(MainDialog.name);
  private selectLanguageDialog: SelectLanguageDialog;
  private userDataRepository: UserDataRepository;
  constructor(dialogId: string) {
    // TODO: pass in telemetry client
    super(dialogId, undefined);
    if (!dialogId) {
      throw Error(`[${MainDialog.name}]: Missing parameter - dialog ID is required`);
    }
    this.interrupt = BotServices.getInstance().get(ServiceTypes.Interruption);
    this.localization = new LocalizedMessages(MainDialog.name);
    this.feedBackDialog = this.createFeedbackDialog();
    this.choiceDialog = this.createChoiceDialog(this.feedBackDialog);

    this.itemSearchDialog = this.createItemSearchDialog(this.feedBackDialog, this.choiceDialog);
    this.singleGroupDialog = this.createSingleGroupDialog(this.feedBackDialog, this.itemSearchDialog);
    this.multipleGroupDialog = this.createMultipleGroupDialog(this.feedBackDialog, this.singleGroupDialog);
    this.deliveryStatusDialog = this.createDeliveryStatusDialog(this.itemSearchDialog, this.singleGroupDialog, this.multipleGroupDialog, this.choiceDialog)
    this.gatherReferenceNumberDialog = this.createGatherReferenceDialog(this.deliveryStatusDialog);
    this.documentTypeDialog = this.createDocumentTypeDialog(this.gatherReferenceNumberDialog);
    this.welcomeDialog = this.createWelcomeDialog(this.documentTypeDialog);
    this.helpDialog = this.createHelpDialog();
    this.restartDialog = this.createRestartDialog();
    this.selectLanguageDialog = this.createSelectLanguageDialog()

    this.userDataRepository = UserDataRepository.getInstance();

    DialogStack.registerDialog(this, this.welcomeDialog, WelcomeDialog.name);
    DialogStack.registerDialog(this, this.selectLanguageDialog, SelectLanguageDialog.name)
    DialogStack.registerDialog(this, this.restartDialog, RestartDialog.name);
    DialogStack.registerDialog(this, this.helpDialog, HelpDialog.name);
    DialogStack.registerDialog(this, this.documentTypeDialog, DocumentTypeDialog.name);
    DialogStack.registerDialog(this, this.feedBackDialog, FeedbackDialog.name);
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
    await dc.beginDialog(DocumentTypeDialog.name);
  }
  private async handleInteruption(dc: DialogContext) {
    const recognition: LanguageRecognition = dc.context.turnState.get(RECOGNITION);
    const intent = recognition.getIntent();
    const input = dc.context.activity.text;
    if (Runtime.isDev()) {
      const user = await this.userDataRepository.getUser(dc.context);
      await dc.context.sendActivity(`Your email is: ${user.getEmail()} and you are ${user.getUserType()} from ${user.getCountry()} with customerId: ${user.getCustomerId()}`)
    }
    if (this.interrupt.isHelp(intent)) {
      await dc.beginDialog(HelpDialog.name);
      return InterruptionAction.StartedDialog;
    } else if (this.interrupt.isRestart(input)) {
      await dc.beginDialog(RestartDialog.name);
      return InterruptionAction.StartedDialog;
    } else if (this.interrupt.isForcedRestart(input)) {
      await dc.beginDialog(RestartDialog.name, { forceRestart: true });
      return InterruptionAction.StartedDialog;
    } else if (this.interrupt.isBye(input)) {
      await this.localization.sendMessage(dc.context, "goodbye");
      await dc.cancelAllDialogs();
      return InterruptionAction.NoAction;
    }
  }
  protected async complete(dc: DialogContext) {
  }

  private createChoiceDialog = (feedbackDialog: FeedbackDialog) => {
    return new ChoiceDialog(feedbackDialog);
  }
  private createRestartDialog = () => {
    return new RestartDialog();
  }
  private createHelpDialog = () => {
    return new HelpDialog();
  }
  private createSelectLanguageDialog = () => {
    return new SelectLanguageDialog();
  }
  private createFeedbackDialog = () => {
    return new FeedbackDialog();
  }
  private createItemSearchDialog = (feedbackDialog: FeedbackDialog, choiceDialog: ChoiceDialog) => {
    return new ItemSearchDialog(feedbackDialog, choiceDialog)
  }

  private createSingleGroupDialog = (feedbackDialog: FeedbackDialog, itemSearchDialog: ItemSearchDialog) => {
    return new SingleGroupDialog(feedbackDialog, itemSearchDialog)
  }
  private createMultipleGroupDialog = (feedbackDialog: FeedbackDialog, singleGroupDialog: SingleGroupDialog) => {
    return new MultipleGroupsDialog(feedbackDialog, singleGroupDialog)
  }
  private createDeliveryStatusDialog = (itemSearchDialog: ItemSearchDialog, singleGroupDialog: SingleGroupDialog, multipleGroupDialog: MultipleGroupsDialog, choiceDialog: ChoiceDialog) => {
    return new DeliveryStatusDialog(itemSearchDialog, singleGroupDialog, multipleGroupDialog, choiceDialog)
  }
  private createGatherReferenceDialog = (deliveryStatusDialog: DeliveryStatusDialog) => {
    return new GatherReferenceNumberDialog(deliveryStatusDialog)
  }
  private createDocumentTypeDialog = (gatherReferenceNumberDialog: GatherReferenceNumberDialog): DocumentTypeDialog => {
    return new DocumentTypeDialog(gatherReferenceNumberDialog)
  }
  private createWelcomeDialog = (documentTypeDialog: DocumentTypeDialog) => {
    return new WelcomeDialog(documentTypeDialog)
  }

}
