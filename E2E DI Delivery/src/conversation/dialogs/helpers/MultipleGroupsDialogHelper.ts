import { LocalizedMessages } from "../../LocalizedMessages";
import { WaterfallStepContext, DialogTurnResult, ComponentDialog } from "botbuilder-dialogs";
import { PromptNames } from "../../values/PromptNames";
import { DialogNames } from "../../values/DialogNames";
import { InputRepository } from "../../../data/storage/InputRepository";
import { DeliveryRepository } from "../../../data/storage/DeliveryRepository";
import { DeliveryDocument } from "../../../domain/values/DeliveryDocument";
import { FeedbackDialog } from "../FeedbackDialog";
import { SingleGroupDialog } from "../SingleGroupDialog";

export class MultipleGroupsDialogHelper {
  private userInput: InputRepository;
  private documents: DeliveryRepository;
  private localization: LocalizedMessages;

  constructor() {
    this.userInput = InputRepository.getInstance();
    this.documents = DeliveryRepository.getInstance();
    this.localization = new LocalizedMessages(MultipleGroupsDialogHelper.name);
  }

  public async promptForCountry(step: WaterfallStepContext): Promise<DialogTurnResult> {
    const documentType =  await this.userInput.getType(step.context);
    const countries = await this.documents.getDocumentCountries(step.context, documentType);
    return await step.prompt(PromptNames.choicePrompt, {
      prompt: this.localization.getTranslation(step.context,"askUserToPickCountry"),
      choices: countries,
    });
  }

  public async getDocumentIndexByCountry(step: WaterfallStepContext, country: string): Promise<number> {
    const documentType =  await this.userInput.getType(step.context);
    return this.documents.getDocumentIndexByCountry(step.context, country, documentType);
  }

  public async routeToSingleGroup(step: WaterfallStepContext, index: number): Promise<DialogTurnResult> {
    await this.documents.saveDocumentGroupIndex(step.context, index);
    return await step.replaceDialog(SingleGroupDialog.name);
  }

  public informNoItemFound = async (step: WaterfallStepContext): Promise<void> => {
    await this.localization.sendMessage(step.context, "noResults");
  }

  public replaceWithFeedbackDialog = async (step: WaterfallStepContext, dialog: ComponentDialog) => {
    return await step.replaceDialog(FeedbackDialog.name);
  }
}
