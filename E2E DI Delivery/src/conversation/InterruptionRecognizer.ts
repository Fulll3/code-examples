import { intent } from "../data/nlu/Intents";
import { IInterruptionList } from "./interfaces/IInterruptionList";

export class InterruptionRecognizer {
  constructor(private interruptionList: IInterruptionList) {
    if (!interruptionList) {
      throw new Error(`[${InterruptionRecognizer.name}]: Missing parameter, interruption list is required`);
    }
    this.interruptionList.help = this.interruptionList.help.map(str => this.normalize(str));
    this.interruptionList.restart = this.interruptionList.restart.map(str => this.normalize(str));
    this.interruptionList.bye = this.interruptionList.bye.map(str => this.normalize(str));
    this.interruptionList.restartForced = this.interruptionList.restartForced.map(str => this.normalize(str));
  }

  private normalize(str: string): string {
    return str.toLocaleLowerCase().trim().replace(/\s/g, "").replace(/[.,;:?]/g, "");
  }

  public isHelp(intentName: string): boolean {
    if(intentName === intent.help){
      return true;
    }
    return false;
  }

  public isRestart(message: string): boolean {
    message = this.normalize(message);
    for (const restartMessage of this.interruptionList.restart) {
      if (restartMessage === message) {
        return true;
      }
    }
    return false;
  }

  public isForcedRestart(message: string): boolean {
    message = this.normalize(message);
    for (const restartMessage of this.interruptionList.restartForced) {
      if (restartMessage === message) {
        return true;
      }
    }
    return false;
  }

  public isBye(message: string): boolean {
    message = this.normalize(message);
    for (const byeMessage of this.interruptionList.bye) {
      if (byeMessage === message) {
        return true;
      }
    }
    return false;
  }
}
