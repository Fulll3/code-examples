import { IHanaResult } from "./IHanaResult";
import * as util from "util";
import { HanaConnector } from "./HanaConnector";
import { BotServices } from "../../service/resolution/BotServices";
import { ServiceTypes } from "../../service/resolution/ServiceTypes";
import { IUserEnteredDocument } from "../../conversation/interfaces/IUserEnteredDocument";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";

export class PromiseHanaResult {
  private promiseHanaResult: Promise<IHanaResult[]>
  private hanaConnector: HanaConnector;
  private error: Error;

  constructor(
    private documentReferenceNumber,
    private document: IUserEnteredDocument
    ) {
    this.hanaConnector = BotServices.getInstance().get(ServiceTypes.HanaConnector);
    this.promiseHanaResult = this.hanaConnector.getData(documentReferenceNumber, document.type).catch((error) => {
      this.error = new Error(error)
      return null;
    })
  }

  public getDocumentReferenceNumber = () => {
    return this.documentReferenceNumber
  }
  public getDocument = () => {
    return this.document;
  }


  public isPromiseHanaResultPending = () => {
    return util.inspect(this.promiseHanaResult).includes("pending")
  }
  public getHanaResults = async (): Promise<IHanaResult[]> => {
    if(this.error){
      throw this.error;
    }else {
      return await this.promiseHanaResult.then((value) => { return value })
    }
  }



}