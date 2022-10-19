import { ActivityPrompt } from "botbuilder-dialogs";
import { WatsonAssistant } from "../../domain/watson/WatsonAssistant";

import { RECOGNITION } from "../../middlewares/watson/WatsonAssistantMiddleware";

/**
 * Reusable prompt that verifies if user answer is according
 * to list of given desired intents.
 */
export class IntentPrompt extends ActivityPrompt {
  constructor(
    dialogId: string,
    watson: WatsonAssistant,
    allowedIntents: string[],
  ) {
    super(dialogId, async (prompt): Promise<boolean> => {
      const recognition = prompt.context.turnState.get(RECOGNITION);
      for (const intent of allowedIntents) {
        if (watson.firstIntentIs(recognition.intents, intent)) {
          return true;
        }
      }
      return false;
    });
  }
}
