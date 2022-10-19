import { IInvoiceStatusRules } from "./IInvoiceStatus";

export interface IInvoiceStatusConfiguration {
  configuration: IInvoiceStatusRules[];
}

export interface IGroupInvoiceStatusConfiguration {
  status: string;
  configurationList: IInvoiceStatusRules[];
}
