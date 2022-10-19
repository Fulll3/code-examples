import { ITicketCustomField } from "./ITicketCustomField";

export interface ITicketData {
  systemFields: {
    userName: string,
    userEmail?: string;
    type: string;
    ccCollaboratorIds: string;
    subject: string;
    priority: string;
    description: string;
    tags: string;
  };
  customFields: ITicketCustomField[];
  conversationHistory: string;
}