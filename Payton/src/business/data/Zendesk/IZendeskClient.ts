import { ITicketData } from "./ITicketData";

export interface IZENDeskClient {
  newTicket(ticketData: ITicketData): Promise<string>;
}