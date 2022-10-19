import { IAttachments, ServiceNow } from "js-servicenow-connector";
import { IServiceNowClient } from "../business/data/ServiceNow/IServiceNowClient";
import * as jwt from "jsonwebtoken";
import * as fs from "fs"
import * as path from "path"
import { ITicketOptions } from "../business/data/ServiceNow/ITicketOptions";
import { ITicketData } from "../business/data/ServiceNow/ITicketData";
import { BuildContext } from "../core/utils/BuildContext";
import { Env, Logger } from "botanica";
import { IHealthCheckable } from "../core/healthManager/IHealthCheckable";
import { SignOptions } from "jsonwebtoken";

export class ServiceNowClient implements IServiceNowClient, IHealthCheckable {
  private key: Buffer;
  private serviceNow: ServiceNow;
  private options: ITicketOptions;
  private passphrase: string;
  private logger = new Logger(ServiceNowClient.name);
  constructor(
    config: IServiceNowConfig
  ) {

    if (Env.get("BotEnv", "dev") === "dev") {
      this.key = fs.readFileSync(path.join(__dirname, '../../resources/paytonPrivateKey.key'));
      this.passphrase = config.passphrase;
    } else {
      this.logger.debug(`loading production certificate`);
      this.key = fs.readFileSync(path.join(__dirname, '../../resources/paytonPrivateKey.key'));
      this.passphrase = config.passphrase;
    }

    this.options = {
      host: config.url,
      interface: config.interfaceID,
      category: config.category,
      providerID: "",
      subCategory: ""
    }
  }

  public isHealthy = async (): Promise<boolean> => {
    return true;
  }
  public createTicket = async (ticketData: ITicketData): Promise<any> => {
    const token = this.generateToken(this.key, this.passphrase);
    const uniqueNumberCreatedFromTime = this.createNumberFromTime();
    this.options.providerID = uniqueNumberCreatedFromTime;
    this.serviceNow = new ServiceNow(
      this.options.host,
      this.options.interface,
      token,
      this.options.providerID,
      this.options.category,
      this.options.subCategory
    );
    const attachment = await this.createFileFromText(ticketData.conversationHistory);
    const type = "(P2P) Purchase to Pay";
    const response = await this.serviceNow.createCase(
      ticketData.email,
      ticketData.shortDescription,
      ticketData.detailedDescription,
      type,
      [attachment]
    )
    return response;
  }

  private generateToken = (key, passphrase): string => {
    const unixTime = Date.now() + 259200000;
    var payload = {
      "sub": "certificate issue",
      "exp": unixTime,

    };
    let secret: jwt.Secret = {
      key,
      passphrase
    }
    var signOptions: SignOptions = {
      algorithm: "RS256", // RSASSA [ "RS256", "RS384", "RS512" ]
      
    };
    var token = jwt.sign(payload, secret, signOptions);
    return token;
  }

  private createFileFromText = async (text: string): Promise<IAttachments> => {
    // create context
    const dirPath = path.resolve(__dirname);
    const dirName = `conversation_history`;
    const context = new BuildContext(dirPath, dirName);
    await context.create();
    const fileName = `conversation_history_${this.createNumberFromTime()}.txt`;
    const filePath = path.join(context.path, fileName);
    fs.writeFileSync(filePath, text);
    const fd = fs.openSync(filePath, "r");
    const fileContent = fs.readFileSync(filePath);
    fs.closeSync(fd);
    const encodedFile = Buffer.from(fileContent).toString('base64');
    context.deleteFilesFromFolder()
    return {
      fileName,
      mime: "text/plain",
      payload: encodedFile
    }
  }

    ;

  private createNumberFromTime() {
    return new Date().valueOf().toString().substring(5, 13);
  }
}


export interface IServiceNowResponse {
  customerID: string;
  status: string;
}

export interface IServiceNowConfig {
  url: string;
  interfaceID: string;
  category: string;
  passphrase: string;
}