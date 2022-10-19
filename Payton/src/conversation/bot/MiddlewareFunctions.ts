import { IEvent, Session, UniversalBot } from "botbuilder";
import { RuntimeIntent } from "watson-developer-cloud/conversation/v1-generated";
import { ConversationHistoryManager } from "../helpers/ConversationHistoryManager";
import { MetricsManager } from "../metrics/MetricManager";
import { HealthManager } from "../../core/healthManager/HealthManager";
import { WatsonAssistantRecognizer } from "./WatsonAssistantRecognizer";
import { config } from "../../config";
import { Logger } from "botanica";

const logger = new Logger("Middleware");
//#region Public Function 
export async function onMessageReceived(session: Session, next: any, healthCheckManager: HealthManager, ibmAssistant: WatsonAssistantRecognizer) {
  const areServicesHealthy = healthCheckManager.isChatbotHealthy();
  const isBotAlive = config.get("Alive");
  let callNext = true;
  let intent = "N/A";
  let confidence = "N/A";
  let intentResult: RuntimeIntent;
  if (session.message.type === "message") {
    saveMessage(session, "user input", session.message.text, false);

    if (session.message.text && session.message.text.trim().length > 0) {
      session.sendTyping();
      session.delay(500);
      intentResult = await getIntent(session, ibmAssistant);
      if (intentResult) {
        intent = intentResult.intent;
        confidence = intentResult.confidence + "";
      }
      MetricsManager.trackUserMessage(session, intent, confidence);
      if (!areServicesHealthy || !isBotAlive) {
        session.send("serviceIsDown");
        callNext = false;
      }
    }

    if (callNext) {
      next();
    }
  }
}

export function onMessageSent(event: IEvent, next: any, bot: UniversalBot) {
  next();
}
//#endregion


//#region Private Functions 
function saveMessage(session: Session, direction: string, text: string, forceSaveSession: boolean) {
  if (session && text && text.trim().length > 0) {
    ConversationHistoryManager.save(session, `${direction}: ${text}`);

    if (forceSaveSession) {
      session.save();
    }
  }
}

async function getIntent(session: Session, ibmAssistant: WatsonAssistantRecognizer): Promise<RuntimeIntent> {
  try {
    const recognition = await ibmAssistant.manualCachedRecognize(session.message.text, session.userData.locale);
    return ibmAssistant.topIntent(recognition);
  } catch (err) {
    return null;
  }
}
//#endregion