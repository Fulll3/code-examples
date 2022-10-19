import { Configuration } from "./Configuration";
import { ChatbotBuilder } from "./ChatbotBuilder";
import { Services } from "./service/Services";
import { Runtime } from "./Runtime";
import { Env } from "botanica";

import * as fs from "fs";
import * as i18n from "i18n";
import * as path from "path";


Env.init();

i18n.configure({
  locales: ["en"],
  directory: path.join(__dirname, "../locale"),
  objectNotation: true,
  defaultLocale: "en",
});

(async () => {
  Runtime.startTracking("Bot startup time");
  process.env.TZ = 'Europe/Amsterdam';
  await Runtime.init();
  await Services.init(Configuration.get(fs, path, Env.get("NODE_ENV")));
  await ChatbotBuilder.init();
  Runtime.endTracking(); 
})();
