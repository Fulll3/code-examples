import * as i18n from "i18n";
import { DialogBot } from "./DialogBot";
import { MainDialog } from "./dialogs/MainDialog";
import { DialogNames } from "./values/DialogNames";
import { ServerManager } from "botanica";
import { ChatBotAdapter } from "./ChatbotAdapter";

export class ChatbotBuilder {
  private static server;
  private static bot: DialogBot;

  public static async setup() {
    const adapter = ChatBotAdapter.getInstance();
    ChatbotBuilder.bot = new DialogBot(new MainDialog(DialogNames.MainDialog));

    ChatbotBuilder.server = await ServerManager.getServer();
    // Listen for messages from users
    ChatbotBuilder.server.post("/api/messages", (req, res) => {
      adapter.processActivity(req, res, async (context) => {
        // set location using activity's locate information
        i18n.setLocale(context.activity.locale || i18n.getLocale());
        // route to bot activity handler.
        await ChatbotBuilder.bot.run(context);
      });
    });
  }
}
