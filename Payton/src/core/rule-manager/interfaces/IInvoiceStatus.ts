import { IRule } from "./IRule";

export interface IInvoiceStatusRules {
  invoiceStatus: string;
  system?: string;
  conversationIndex: string;
  rules: IRule[];
}