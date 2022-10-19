import * as fs from "fs";
import * as i18n from "i18n";
import * as path from "path";
import { Configuration } from "./Configuration";
import { ChatbotBuilder } from "./conversation/ChatbotBuilder";
import { BotServices } from "./service/resolution/BotServices";
import { Env } from "botanica";
import { Runtime } from "./Runtime";


Env.init();

i18n.configure({
  directory: path.join(__dirname, "../locale"),
  defaultLocale: "en/en", // need to synchronize with Payton chatbot for future Admin Panel functionality
  objectNotation: true,
});

(async () => {
  await Runtime.init();
  Runtime.startTracking("Bot startup time");
  const configuration = Configuration.get(fs, path, Env.get("NODE_ENV"));
  await BotServices.initalize(configuration);
  await ChatbotBuilder.setup();
  await Runtime.startHealthMonitoring();
  Runtime.endTracking();
})();
