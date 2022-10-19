import { Session } from "botbuilder";
import { ITicketData } from "../../../src/business/data/Zendesk/ITicketData";
import { IZENDeskClient } from "../../../src/business/data/Zendesk/IZendeskClient";
import { IZENDeskDataManager } from "../../../src/business/IZENDeskDataManager";

export class ZendeskMockup implements IZENDeskClient {
  newTicket(ticketData: ITicketData): Promise<string> {
    return new Promise(resolve => resolve("123"));
  }
}

export class ZendeskDataMockup implements IZENDeskDataManager {
  getTicketData(session: Session): Promise<ITicketData> {
    return undefined;
  }
}