import { Session } from "botbuilder";
import { ServiceNow } from "js-servicenow-connector";
import { IServiceNowClient } from "../../../src/business/data/ServiceNow/IServiceNowClient";
import { ITicketData } from "../../../src/business/data/ServiceNow/ITicketData";
import { ITicketOptions } from "../../../src/business/data/ServiceNow/ITicketOptions";

export class ServiceNowMockup implements IServiceNowClient {
  createTicket(ticketData: ITicketData): Promise<string> {
    return new Promise(resolve => resolve("123"));
  }
}