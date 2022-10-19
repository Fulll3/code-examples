import { Session } from "botbuilder";
import { ITicketData } from "./data/Zendesk/ITicketData";

export interface IZENDeskDataManager {
  getTicketData(session: Session): Promise<ITicketData>;
}
