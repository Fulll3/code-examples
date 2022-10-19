import { IHanaRowData } from "../../../src/business/data/HanaDataLake/IHanaRowData";
import { IAdditionalCompanyCodeInfo } from "../../../src/business/IAdditionalCompanyCodeInfo";
import { IHanaXsjsClient } from "../../../src/data/HanaXsjsClient";

export function dataRowMockup(): IHanaRowData {
  return {
    DocumentNumber: "123456",
    DocumentDate: "20180101",
    VendorNumber: "1234",
    PONumber: "4567",
    CompanyCode: "3355",
    Assignment: "",
    PostingDate: "20180101",
    DocumentType: "R",
    PaymentBlock_DocLevel: "",
    Document_PaymentMethod: "",
    PaymentTerms: "SN90",
    ClearingDate: "20180101",
    ClearingDocument: "",
    Name1: "Siemens AG",
    Region: "EU",
    InvoiceNumber: "1234",
    BaselinePaymentDte: "",
    Vendor_PaymentMethod: "",
    PaymentBlock_VendorLevel: "",
    LocalAmount: "123.45",
    DocumentAmount: "123.45",
    DocumentCurrency: "USD",
    PBPrice: "",
    PBDate: "",
    PBQuality: "",
    PBQuantity: "",
    NetDueDate: "20180101"
  } as IHanaRowData;
}

export function dataAdditionalFields() {
  return {
    ezSuiteCode: "xxx",
    mailCode: "xxx",
    companyName: "xxx"
  } as IAdditionalCompanyCodeInfo
}

export class HanaMockup implements IHanaXsjsClient {
  getData(sql: string, params: string[]): Promise<IHanaRowData[]> {
    return Promise.resolve([dataRowMockup()]);
  }
}