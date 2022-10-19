import { ITicketData } from "./ITicketData";
import { ITicketOptions } from "./ITicketOptions";

export interface IServiceNowClient {
  createTicket(ticketData: ITicketData): Promise<any>;
}