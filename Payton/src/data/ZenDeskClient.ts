import { Logger } from "botanica";
import { UrlOptions } from "request";
import * as rp from "request-promise-native";
import { ITicketData } from "../business/data/Zendesk/ITicketData";
import { IZENDeskClient } from "../business/data/Zendesk/IZendeskClient";
import { IZENDeskConfig } from "../business/data/Zendesk/IZendeskConfig";
import { IHealthCheckable } from "../core/healthManager/IHealthCheckable";

export default class ZENDeskClient implements IZENDeskClient, IHealthCheckable {
  private logger: Logger = new Logger("ZENDeskClient");
  readonly baseURL: string;
  readonly authToken: string;
  readonly zenUser: string;
  readonly zenToken: string;

  //#region Initialization
  constructor(config: IZENDeskConfig) {
    this.zenUser = config.username;
    this.zenToken = "token:" + config.password;
    this.authToken =
      "Basic " +
      new Buffer(this.zenUser + "/" + this.zenToken).toString("base64");
    this.baseURL = config.url; // should be environment variable
  }
  //#endregion

  //#region Public Methods
  public async newTicket(ticketData: ITicketData): Promise<string> {
    try {
      //#region HTTP request options initiallization
      const request: (UrlOptions & rp.RequestPromiseOptions) = await this.genTicketCreationReq(ticketData);
      //#endregion
      this.logger.debug("(newTicket) Request: %o", request);

      const apiResponse: string = await rp(request);

      var ticketID: string = JSON.parse(apiResponse).ticket.id;
      this.logger.info("(newTicket) success: new ticket ID: " + ticketID);
      this.includeAttachment(ticketID, ticketData);

      return ticketID;
    } catch (err) {
      this.logger.error("(newTicket)", err);
      return undefined;
    }
  }

  public isHealthy = async (): Promise<boolean> => {
    var userId = await this.getUserId(this.zenUser);

    return typeof userId !== "undefined";
  }
  //#endregion

  //#region Private Methods
  private async getUserId(userEmail: string): Promise<any> {
    const request: (UrlOptions & rp.RequestPromiseOptions) = {
      method: "GET",
      url: this.baseURL + "users/search.json?query=email:" + userEmail,
      headers: {
        "content-type": "application/json",
        Authorization: this.authToken
      }
    };
    this.logger.debug("(getUserId) http request: ", request);
    return rp(request)
      .then((res) => {
        if (JSON.parse(res).count === 1) {
          const userId: string = JSON.parse(res).users[0].id;
          this.logger.debug("(getUserId) found Zendesk user ID:%s", JSON.parse(res).users[0].id);
          return JSON.parse(res).users[0].id;
        } else if (JSON.parse(res).count > 1) {
          this.logger.debug("(getUserId) found multiple ZenDesk user IDs. returning <undefined>");
        } else {
          this.logger.debug("(getUserId) no ZenDesk user ID(s) found. returning <undefined>");
          return undefined;
        }
      })
      .catch((err) => {
        this.logger.error("(getUserId) Error searching for ZenDesk user: ", err);
        return undefined;
      });
  }

  private async includeAttachment(ticketID: string, ticketData: ITicketData): Promise<any> {
    var uploadToken: string = undefined;

    return this.uploadConversation(ticketData)
      .then(response => {
        var responseObject: any = JSON.parse(response);
        uploadToken = responseObject.upload.token;
        this.logger.debug("(includeAttachment)(uploadConversation)success: Upload file with Token: %o", response);

        return this.attachConversation(ticketID, uploadToken);
      })
      .then(() => {
        this.logger.debug("(includeAttachment)(uploadConversation)(attachConversation)"
          + "success: file with token "
          + uploadToken
          + " attached to ticket ID:"
          + ticketID);
      })
      .catch(error => {
        this.logger.error("(includeAttachment) promise-chain", error);
      });
  }

  private async genTicketCreationReq(ticketData: ITicketData): Promise<UrlOptions & rp.RequestPromiseOptions> {
    const query = {
      method: "POST",
      url: this.baseURL + "tickets.json",
      headers: {
        "content-type": "application/json",
        Authorization: this.authToken
      },
      body: JSON.stringify({
        ticket: {
          requester_id: ticketData.systemFields.userEmail ? await this.getUserId(ticketData.systemFields.userEmail) : undefined,
          type: ticketData.systemFields.type,
          collaborator_ids: ticketData.systemFields.ccCollaboratorIds,
          subject: ticketData.systemFields.subject,
          raw_subject: ticketData.systemFields.subject,
          description: ticketData.systemFields.description,
          tags: ticketData.systemFields.tags,
          comment: {
            type: "Comment",
            body: ticketData.systemFields.description,
            public: "false"
          },
          priority: ticketData.systemFields.priority,
          custom_fields: ticketData.customFields
        }
      })
    };
    return query;
  }

  private async uploadConversation(ticketData: ITicketData): Promise<any> {
    //#region HTTP request options initiallization
    const conversationText: string = ticketData.conversationHistory;
    const filename: string = "Payton_" + ticketData.systemFields.userName + "_" + Date.now() + ".txt";
    const options: (UrlOptions & rp.RequestPromiseOptions) = {
      method: "POST",
      url: this.baseURL + "uploads.json",
      qs: { filename: filename },
      headers: {
        Authorization: this.authToken,
        "Content-Type": "text/plain"
      },
      body: conversationText
    };
    //#endregion
    this.logger.debug("[ZENDesk](uploadConversation) HTTP request: %o", options);
    return rp(options);
  }

  private async attachConversation(
    ticketID: string,
    uploadToken: string
  ): Promise<any> {
    //#region HTTP request initializaton    
    const options: (UrlOptions & rp.RequestPromiseOptions) = {
      url: this.baseURL + "tickets/" + ticketID + ".json",
      method: "PUT",
      json: true,
      headers: {
        "content-type": "application/json",
        Authorization: this.authToken
      },
      body: {
        ticket: {
          comment: { body: "Conversation Attachment", uploads: [uploadToken] }
        }
      }
    };
    this.logger.debug("[ZENDesk](attachConversation) HTTP request: %o", options);
    //#endregion
    return rp(options);
  }
  //#endregion
}
