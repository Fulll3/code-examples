import { ComponentDialog, DialogContext, ActivityPrompt, ChoicePrompt } from "botbuilder-dialogs";

/**
 * Stack verification and loading reusability
 */
export class DialogStack {
  public static registerDialog(context: ComponentDialog, target: ComponentDialog, name: string): void {
    if (!context.findDialog(name)) {
      context.addDialog(target);
    }
  }
  public static registerChoicePrompt(context: ComponentDialog, name: string): void {
    if (!context.findDialog(name)) {
      context.addDialog(new ChoicePrompt(name));
    }
  }
}
