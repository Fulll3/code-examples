import { AbstractServiceFactory } from "../AbstractServiceFactory";
import * as fs from "fs";
import * as path from "path";
import { IInterruptionList } from "../../../conversation/interfaces/IInterruptionList";
import { InterruptionRecognizer } from "../../../conversation/InterruptionRecognizer";

export class InterruptionRecognizerFactory extends AbstractServiceFactory {

  protected async resolveServiceRequirements(service: any): Promise<IInterruptionList> {
    const slash = path.sep;
    const file = path.join(__dirname, `..${slash}..${slash}..${slash}..${slash}${service.file}`);
    const fileContents = JSON.parse(fs.readFileSync(file).toString());
    if (!fileContents) { return undefined; }

    return fileContents;
  }

  public async createAndReturnServiceInstance(service: any): Promise<any> {
    const interruptionList = await this.resolveServiceRequirements(service);
    return new InterruptionRecognizer(interruptionList);
  }
  //#endregion
}
