import { Logger } from "botanica";

import {
  HELP,
  GENERAL_AGENT_CAPABILITIES,
  BOT_CONTROL_CHANGE_SUBJECT,
  BOT_CONTROL_START_OVER,
} from "../data/watson/Intents";

export class InterruptionInput {
  private readonly logger = new Logger(InterruptionInput.name);

  constructor(
    private confidenceThreshold: number,
  ) {
    if (!confidenceThreshold) {
      throw new Error(`[${InterruptionInput.name}]: Missing parameter: confidence threshold is required`);
    }
    this.logger.debug(`constructor initialized [${this.confidenceThreshold}]`);
  }

  public async isIgnoringUserInput(): Promise<boolean> {
    return false;
  }

  public isHelp(intent: string, confidence: number): boolean {
    return (
      intent === HELP ||
      intent === GENERAL_AGENT_CAPABILITIES
    ) && confidence > this.confidenceThreshold;
  }

  public isRestart(intent: string, confidence: number): boolean {
    return (
      intent === BOT_CONTROL_CHANGE_SUBJECT ||
      intent === BOT_CONTROL_START_OVER
    ) && confidence > this.confidenceThreshold;
  }
}