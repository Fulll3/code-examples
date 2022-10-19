import { ComponentDialog, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { WatsonAssistantQna } from "../../../domain/watson/WatsonAssistantQna";
import { Services } from "../../../service/Services";
import { HeroCardHelper } from "../../HeroCardHelper";
import { InitialOptionsDialog } from "../InitialOptionsDialog";

export type FaQDialogOptions = {
  startedDialog: boolean;
}
export class FaQDialog extends ComponentDialog {
  private qnaAssistant: WatsonAssistantQna = Services.instance().get("WatsonAssistantQnaDomain");
  constructor(name) {
    super(name);
    this.addDialog(new WaterfallDialog(WaterfallDialog.name, [
      this.sendIntialOptions.bind(this),
      this.getUserResponse.bind(this)
    ]))
  }

  private sendIntialOptions = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    const dialogOptions = <FaQDialogOptions>step.options
    let assistantReponse;
    if (dialogOptions.startedDialog) {
      assistantReponse = await this.qnaAssistant.getAssistantOutput("hi");
    } else {
      assistantReponse = await this.qnaAssistant.getAssistantOutput(step.context.activity.text);
    }
    await this.qnaAssistant.replicateMessages(step.context, assistantReponse);

    if (this.qnaAssistant.isFinalAnswer(step.context, assistantReponse)) {
      return await step.replaceDialog(InitialOptionsDialog.name);
    } else {
      return {
        status: DialogTurnStatus.waiting
      }
    }
  }

  private getUserResponse = async (step: WaterfallStepContext): Promise<DialogTurnResult> => {
    return await step.replaceDialog(FaQDialog.name, FaQDialog.getOptions(false));
  }
  public static getOptions = (startedDialog: boolean): FaQDialogOptions => {
    return {
      startedDialog: startedDialog
    }
  }
}