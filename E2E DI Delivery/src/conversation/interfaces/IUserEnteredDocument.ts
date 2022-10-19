import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";

export interface IUserEnteredDocument {
  reference?: string;
  type?: DeliveryDocumentType;
  itemNo?: string
  
}
