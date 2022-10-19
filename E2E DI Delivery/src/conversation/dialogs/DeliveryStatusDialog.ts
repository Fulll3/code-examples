import { ComponentDialog, WaterfallDialog, WaterfallStepContext, ChoicePrompt, TextPrompt, ConfirmPrompt, DialogTurnResult, DialogTurnStatus } from "botbuilder-dialogs";
import { PromptNames } from "../values/PromptNames";
import { DeliveryStatusDialogHelper } from "./helpers/DeliveryStatusDialogHelper";
import { ItemSearchDialog } from "./ItemSearchDialog";
import { DialogNames } from "../values/DialogNames";
import { LocalizedMessages } from "../LocalizedMessages";
import { MultipleGroupsDialog } from "./MultipleGroupsDialog";
import { SingleGroupDialog } from "./SingleGroupDialog";
import { DialogStack } from "../DialogStack";
import { DocumentTypeDialog } from "./DocumentTypeDialog";
import { DeliveryPreprocessor } from "../../domain/DeliveryPreprocessor";
import { HanaConnector } from "../../data/hana/HanaConnector";
import { BotServices } from "../../service/resolution/BotServices";
import { InputRepository } from "../../data/storage/InputRepository";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import * as util from "util";
import { IHanaResult } from "../../data/hana/IHanaResult";
import { DialogStateRepository } from "../../data/storage/DialogStateRepository";
import { PromiseHanaResult } from "../../data/hana/PromiseHanaResult";
import { ChoiceDialog } from "./ChoiceDialog";
import { HeroCardHelper } from "./helpers/HeroCardHelper";
import { Configuration } from "../../Configuration";
import * as fs from "fs";
import * as i18n from "i18n";
import * as path from "path";
import { Env, Logger } from "botanica";
import { DialogUtil } from "./helpers/DialogUtil";
import { Telemetry } from "../../monitoring/telemetry/Telemetry";
import { defaultClient } from "applicationinsights";
import { TurnContext } from "botbuilder-core";
import { DeliveryAggregate } from "../../domain/values/DeliveryAggregate";
import { UserDataRepository } from "../../data/storage/UserDataRepository";
import { Runtime } from "../../Runtime";
import { User } from "../../domain/User";

export class DeliveryStatusDialog extends ComponentDialog {
  private helper: DeliveryStatusDialogHelper;
  private localizationResponses: LocalizedMessages;
  private logger = new Logger(DeliveryStatusDialog.name);

  private userInput: InputRepository;
  private userData: UserDataRepository;
  private dialogStateRepository: DialogStateRepository;
  private hanaResultStorage: PromiseHanaResult[] = [];
  constructor(
    private itemSearchDialog: ItemSearchDialog,
    private singleGroupDialog: SingleGroupDialog,
    private multipleGroupDialog: MultipleGroupsDialog,
    private choiceDialog: ChoiceDialog
  ) {
    super(DeliveryStatusDialog.name);
    this.helper = new DeliveryStatusDialogHelper();
    this.localizationResponses = new LocalizedMessages(DeliveryStatusDialog.name);

    this.addDialog(new WaterfallDialog(DialogNames.WaterfallDialog, [
      this.getResults.bind(this),
      this.evaluateUserDecision.bind(this)

    ]));
    this.addDialog(new ChoicePrompt(PromptNames.choicePrompt));
    this.addDialog(new TextPrompt(PromptNames.textPrompt));

    DialogStack.registerDialog(this, this.itemSearchDialog, ItemSearchDialog.name);
    DialogStack.registerDialog(this, this.singleGroupDialog, SingleGroupDialog.name);
    DialogStack.registerDialog(this, this.multipleGroupDialog, MultipleGroupsDialog.name);
    DialogStack.registerDialog(this, this.choiceDialog, ChoiceDialog.name);
    this.userInput = InputRepository.getInstance();
    this.userData = UserDataRepository.getInstance();
    this.dialogStateRepository = DialogStateRepository.getInstance();

  }

  private getResults = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const conversationWasRestarted = await this.dialogStateRepository.getRestarted(step.context);
    if (!conversationWasRestarted) {
      await this.getDataFromDatabase(step);
    }
    await this.dialogStateRepository.saveRestarted(step.context, false);
    const index = await this.dialogStateRepository.getPromisehanaResultIndex(step.context);
    const promisehanaResult = this.hanaResultStorage[index];
    const start = new Date().getTime();
    while (promisehanaResult.isPromiseHanaResultPending()) {
      await this.delay(600);
      const now = new Date().getTime();
      if (this.hanaRespondingTooLong(now, start)) {
        await this.localizationResponses.sendMessage(step.context, "resultsDelayMessage");
        const yesNo = await DialogUtil.getInstance().getYesNoOptions(step.context);
        const keepWaitingMessage = await this.localizationResponses.getTranslation(step.context, "keepWaitingMessage");
        const prompOptions = HeroCardHelper.getPromptOptions(step, yesNo, keepWaitingMessage)
        return await step.prompt(PromptNames.choicePrompt, prompOptions)
      }
    }
    let rawData: IHanaResult[];
    let structuredResults: DeliveryAggregate

    let user: User;
    if (false) {  //TEMPORARY
      user = await this.userData.getUser(step.context);
    } else {
      user = new User({ Country: "CZ", External: false })
    }

    try {
      rawData = await promisehanaResult.getHanaResults()

      structuredResults = await this.helper.processDeliveryRelatedMilestones(
        step,
        promisehanaResult.getDocumentReferenceNumber(),
        rawData,
        promisehanaResult.getDocument(),
        user
      );

    } catch (error) {
      this.logger.error(error);
      await this.localizationResponses.sendMessage(step.context, "technicalIssuesMessage");
      return await step.cancelAllDialogs()
    }
    if (rawData.length > 0 && structuredResults.size() === 0) {
      this.logger.info(`Data not found for customerID: ${user.getCustomerId()}`);
    }
    switch (structuredResults.size()) {
      case 0:
        return await this.helper.noGroup(step, this);
      case 1:
        return await this.helper.singleGroup(step);
      default:
        return await this.helper.multipleGroups(step);
    }

  }
  private evaluateUserDecision = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const userAnswer = step.context.activity.text.toLowerCase();
    if (this.waitForHanaResults(step.context, userAnswer)) {
      await this.dialogStateRepository.saveRestarted(step.context, true);
      return await step.replaceDialog(DeliveryStatusDialog.name);
    } else {
      return await step.replaceDialog(ChoiceDialog.name)
    }
  }
  private waitForHanaResults = (turnContext: TurnContext, userAnswer: string) => {
    const yes = DialogUtil.getInstance().getYesNoOptions(turnContext)[0];
    return userAnswer.toLocaleLowerCase() === yes.toLocaleLowerCase();
  }
  private async getDataFromDatabase(step: WaterfallStepContext<{}>) {
    await this.helper.sendConfirmationMessage(step);
    const document = await this.userInput.get(step.context);
    const documentReferenceNumberLength = 10;
    const documentReferenceNumber = DeliveryPreprocessor.padStartWithZeroes(document, documentReferenceNumberLength);
    this.hanaResultStorage.push(new PromiseHanaResult(documentReferenceNumber, document));
    await this.dialogStateRepository.savePromisehanaResultIndex(step.context, this.hanaResultStorage.length - 1)
  }

  private hanaRespondingTooLong(now: number, start: number) {
    const configuration = Configuration.get(fs, path, Env.get("NODE_ENV"));
    return now - start >= configuration.hanaRespondWaitTimeInMs;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
