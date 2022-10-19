import { ActivityPrompt } from "botbuilder-dialogs";

/**
 * Reusable prompt that simply receives text input
 */
export class SimplePrompt extends ActivityPrompt {
  constructor(private dialogId: string) {
    super(dialogId, async (prompt): Promise<boolean> => true);
  }
}
