import { IHanaResult } from "../data/hana/IHanaResult";
import { DeliveryDocumentType } from "./values/DeliveryDocumentType";
import { IUserEnteredDocument } from "../conversation/interfaces/IUserEnteredDocument";
import { User } from "./User";

export class DeliveryPreprocessor {
  public static sanitize(data: IHanaResult[], reference: string, type: DeliveryDocumentType): IHanaResult[] {
    return this.filterByDocumentType(this.removeDuplicates(data), reference, type);
  }
  public static filterByCustomerId = (data: IHanaResult[], user: User) => {
    if (user.isExternal()) {
      const customerID = user.getCustomerId();
      return  data.filter(hanaResult => hanaResult.CHA_BY === customerID);
    } else {
      return data;
    }
  }

  public static padStartWithZeroes = (document: IUserEnteredDocument, documentLength: number) => {
    if (document.type === DeliveryDocumentType.ucrNumber || document.type === DeliveryDocumentType.customerPo) {
      return document.reference;
    } else {
      return document.reference.padStart(documentLength, "0");
    }
  }

  private static filterByDocumentType(data: IHanaResult[], reference: string, type: DeliveryDocumentType): IHanaResult[] {
    if (type === DeliveryDocumentType.deliveryNoteNumber) {
      return data.filter(item => item.CHA_DNN === reference || item.CHA_UCR === reference);
    } else if (type === DeliveryDocumentType.purchaseOrderNumber) {
      return data.filter(item => item.CHA_PON === reference);
    } else if (type === DeliveryDocumentType.salesOrderNumber) {
      return data.filter(item => item.CHA_SON === reference);
    } else if (type === DeliveryDocumentType.ucrNumber) {
      return data.filter(item => item.CHA_UCR === reference);
    } else if (type === DeliveryDocumentType.customerPo) {
      return data.filter(item => item.CHA_CPN === reference);
    } else if (type === DeliveryDocumentType.uknown) {
      return data;
    }
    return [];
  }

  private static removeDuplicates(data: IHanaResult[]): IHanaResult[] {
    const unique = [];

    data.forEach(item => {
      if (!this.contains(item, unique)) {
        unique.push(item);
      }
    });

    return unique;
  }

  private static contains(item: IHanaResult, set: IHanaResult[]): boolean {
    for (const data of set) {
      if (DeliveryPreprocessor.equalHanaResults(data, item)) {
        return true;
      }
    }
    return false;
  }

  private static equalHanaResults(a: IHanaResult, b: IHanaResult): boolean {
    return (
      a.CHA_CBY === b.CHA_CBY &&
      a.CHA_BY === b.CHA_BY &&
      a.CHA_CGL === b.CHA_CGL &&
      a.CHA_GLO === b.CHA_GLO &&
      a.CHA_SYS === b.CHA_SYS &&
      a.CHA_CLI === b.CHA_CLI &&
      a.CHA_SON === b.CHA_SON &&
      a.CHA_SOI === b.CHA_SOI &&
      a.CHA_SOS === b.CHA_SOS &&
      a.CHA_PON === b.CHA_PON &&
      a.CHA_POI === b.CHA_POI &&
      a.CHA_DNN === b.CHA_DNN &&
      a.CHA_DNI === b.CHA_DNI &&
      a.CHA_UCR === b.CHA_UCR &&
      a.MST_LSTAR === b.MST_LSTAR &&
      a.MST_L100 === b.MST_L100 &&
      a.MST_L130 === b.MST_L130 &&
      a.MST_L200 === b.MST_L200 &&
      a.MST_L210 === b.MST_L210 &&
      a.MST_L220 === b.MST_L220 &&
      a.MST_L230 === b.MST_L230 &&
      a.MST_L240 === b.MST_L240 &&
      a.MST_L290 === b.MST_L290 &&
      a.MST_L300 === b.MST_L300 &&
      a.MST_L310 === b.MST_L310 &&
      a.MST_L311 === b.MST_L311 &&
      a.MST_L313 === b.MST_L313 &&
      a.MST_L315 === b.MST_L315 &&
      a.MST_L318 === b.MST_L318 &&
      a.MST_L320 === b.MST_L320 &&
      a.MST_L330 === b.MST_L330 &&
      a.MST_L335 === b.MST_L335 &&
      a.MST_L340 === b.MST_L340 &&
      a.MST_L350 === b.MST_L350 &&
      a.MST_L360 === b.MST_L360 &&
      a.MST_L380 === b.MST_L380 &&
      a.MST_L390 === b.MST_L390 &&
      a.MST_L400 === b.MST_L400 &&
      a.MST_LGID === b.MST_LGID
    );
  }
}