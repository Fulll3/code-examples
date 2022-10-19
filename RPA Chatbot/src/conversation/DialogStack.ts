import { ComponentDialog } from "botbuilder-dialogs";
import { WatsonAssistant } from "../domain/watson/WatsonAssistant";
import { FieldPrompt } from "./prompts/FieldPrompt";
import { IntentPrompt } from "./prompts/IntentPrompt";
import { SimplePrompt } from "./prompts/SimplePrompt";

/**
 * Stack verification and loading reusability
 */
export class DialogStack {
  public static registerDialog(context: ComponentDialog, target: ComponentDialog, name: string): void {
    if (!context.findDialog(name)) {
      context.addDialog(target);
    }
  }

  public static registerSimplePrompt(context: ComponentDialog, name: string): void {
    if (!context.findDialog(name)) {
      context.addDialog(new SimplePrompt(name));
    }
  }
  public static registerValidatorPrompt(context: ComponentDialog, name: string): void {
    if (!context.findDialog(name)) {
      context.addDialog(new FieldPrompt(name));
    }
  }

  public static registerIntentPrompt(
    context: ComponentDialog,
    name: string,
    watson: WatsonAssistant,
    allowedIntents: string[],
  ): void {
    if (!context.findDialog(name)) {
      context.addDialog(new IntentPrompt(
        name,
        watson,
        allowedIntents,
      ));
    }
  }
}
