import * as path from "path";
import { loadCsv } from "../core/utils/CsvLoader";

export class PaymentTermsMapper {
  private static instance: PaymentTermsMapper;
  private mapping: { [locale: string]: any[] };

  //#region Initialization 
  private constructor(mapping: any) {
    this.mapping = mapping;
  }

  public static async GetInstance(): Promise<PaymentTermsMapper> {
    if (!PaymentTermsMapper.instance) {
      PaymentTermsMapper.instance = new PaymentTermsMapper(
        {
          "en": await loadCsv(path.join(__dirname, "../../configuration/ERP_payment_terms_mapping_EN.csv")),
          "fr": await loadCsv(path.join(__dirname, "../../configuration/ERP_payment_terms_mapping_FR.csv"))
        }
      );
    }

    return PaymentTermsMapper.instance;
  }
  //#endregion

  //#region Public Methods 
  public getText = (paymentTermsCode: string, system: string, locale: string) => {
    var results = this.mapping[locale].filter(
      row => row['ERP System'] == system && row.Payment_Term == paymentTermsCode
    );

    if (results && results.length > 0) {
      return results[0].Text;
    } else {
      return paymentTermsCode;
    }
  }
  //#endregion
}