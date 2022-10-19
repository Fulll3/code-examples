import { IDialogResult, Session } from "botbuilder";
import { IZENDeskClient } from "../../business/data/Zendesk/IZendeskClient";
import { IZENDeskDataManager } from "../../business/IZENDeskDataManager";
import { MetricsManager } from "../metrics/MetricManager";
import { SessionHelper } from "./SessionHelper";
import * as servicenow from "js-servicenow-connector";
import { ServiceNow } from "js-servicenow-connector";
import { IServiceNowResponse, ServiceNowClient } from "../../data/ServiceNowClient";
import { ITicketData } from "../../business/data/ServiceNow/ITicketData";
import { Logger } from "botanica";
import { IServiceNowClient } from "../../business/data/ServiceNow/IServiceNowClient";
export class TicketCreationHelper {
  public static async createTicketIfNeeded(results: IDialogResult<any>, zenDeskDataManager: IZENDeskDataManager, session: Session, zenTicket: IZENDeskClient, serviceNowClient: IServiceNowClient, messageCode: string) {
    try {
      if (results.response && results.response.index === 0) { // create ticket                    
        var data = await zenDeskDataManager.getTicketData(session);
        const ticketData: ITicketData = {
          email: data.systemFields.userEmail,
          shortDescription: data.systemFields.subject,
          detailedDescription: data.systemFields.description,
          conversationHistory: data.conversationHistory
        }
        console.log(`ticketData: ${JSON.stringify(ticketData)}`)
         const response: IServiceNowResponse = await serviceNowClient.createTicket(ticketData);

         if (response.status === 'success') {
          SessionHelper.sendMessage(session, messageCode, response.customerID);
          MetricsManager.trackTicketCreated(session, response.customerID);
        } else {
          SessionHelper.sendMessage(session, "ticketCreationNotSuccessfull");
        } 
      }
    } catch (err) {
      const logger = new Logger("TicketCreationHelper");
      logger.error(err);
    }
  }
}