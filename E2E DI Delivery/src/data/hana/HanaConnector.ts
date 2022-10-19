import { IHealthCheckable } from "../../monitoring/health/IHealthCheckable";
import { CoreOptions } from "request";
import { Logger } from "botanica";
import * as rp from "request-promise-native";
import * as request from "request";
import { IHanaResult } from "./IHanaResult";
import { Runtime } from "../../Runtime";
import * as path from "path";
import * as fs from "fs";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";
import { Axios } from "axios";
import { Agent } from "https";

export class HanaConnector implements IHealthCheckable {
  private logger: Logger;
  private http: request
    .RequestAPI<rp.RequestPromise, rp.RequestPromiseOptions, request.RequiredUriUrl>;

  constructor(
    private username: string,
    private password: string,
    private endpoint: string,
  ) {
    if (!this.username) {
      throw new Error(`[${HanaConnector.name}]: Missing parameter, username is required`);
    }
    if (!this.password) {
      throw new Error(`[${HanaConnector.name}]: Missing parameter, password is required`);
    }
    if (!this.endpoint) {
      throw new Error(`[${HanaConnector.name}]: Missing parameter, connection endpoint is required`);
    }
    this.http = rp;
    this.logger = new Logger(HanaConnector.name);

    if (Runtime.isLocal()) {
      this.logger.debug(`Created new ${HanaConnector.name}: \n[username: ${username}]\n[password: ${password}]\n[endpoint: ${endpoint}]`);
    } else {
      this.logger.debug(`Created new ${HanaConnector.name}`);
    }
  }

  public async getData(document: string, documentType: DeliveryDocumentType): Promise<IHanaResult[]> {
    if (!document) {
      throw new Error(`[${HanaConnector.name}]:getData(): document number is required`);
    }
    if (document.length > 15) {
      throw new Error(`[${HanaConnector.name}]: Hana Api does not accept input begger than 15 characters`);
    }
    this.logger.debug(`Next CheckNumber Query: ${document}`);

    try {
      const response = await this.http(
        this.getUrl(document, documentType),
        this.getRequest(document, documentType),
      );
      await fs.writeFileSync("hanaResponseData.json",JSON.stringify(response.d.results[0]))

      this.logger.debug(`Successfully got ${response.d.results.length} results from Query: ${document}`);
      return response.d.results;
    } catch (error) {
      this.logger.error(`Could not get results from Query: ${document}, ${error}`);
      throw error;
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const document = this.getRandomDocumentNumber();
      const response = await this.getData(document, DeliveryDocumentType.customerPo);
      return (!!response);
    } catch (error) {
      this.logger.debug(`${HanaConnector.name}.isHealthy() error "${error.error.error.message.value}"`);
      throw error;
    }
  }

  private getRequest(document: string, documentType: DeliveryDocumentType): CoreOptions {
    return {
      auth: this.getAuth(),
      rejectUnauthorized: false,
      json: true,
      timeout: 90000 //90s,

    };
  }

  private getUrl(document: string, documentType: DeliveryDocumentType): string {
    let filterQueryString;
    if (documentType === DeliveryDocumentType.uknown) {
      const documentTypes = [
        DeliveryDocumentType.customerPo,
        DeliveryDocumentType.deliveryNoteNumber,
        DeliveryDocumentType.purchaseOrderNumber,
        DeliveryDocumentType.salesOrderNumber,
        DeliveryDocumentType.ucrNumber
      ]
      let filterQueries = []
      for (const type of documentTypes) {
        filterQueries.push(`${type} eq '${document}'`)
      }
      filterQueryString = filterQueries.join(" or ");
    } else {
      filterQueryString = `${documentType} eq '${document}'`
    }
    return `${this.endpoint}?$filter=${filterQueryString}&$format=json`;
  }

  private getAuth(): { username: string, password: string } {
    return {
      username: this.username,
      password: this.password,
    };
  }

  private getRandomDocumentNumber(): string {
    return "4518312588"
  }


  private hanaMockupData = () => {
    return [
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512581')",
        },
        GenID: "7841004857512581",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145626",
        CHA_SOI: "000010",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028751853",
        CHA_DNI: "000010",
        CHA_UCR: "SIRL12028751853",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1628121600000)/",
        POM_LDD: "/Date(1628121600000)/",
        POM_LLD: "/Date(1627996440000)/",
        POM_TRA: "/Date(1628074080000)/",
        POM_GID: "/Date(1627996440000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6ES74050KA020AA0",
        KFG_RQA: "1",
        CHA_CPN: "4552627030",
        CHA_CPI: "000010",
        MST_LSTAR: "/Date(1627981482000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1627986759000)/",
        MST_L300: "/Date(1627990390789)/",
        MST_L310: "/Date(1627996440000)/",
        MST_L311: "/Date(1627996740000)/",
        MST_L313: null,
        MST_L315: "/Date(1628002140000)/",
        MST_L318: null,
        MST_L320: "/Date(1628007540000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1628060100000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1628074080000)/",
        MST_LGID: "/Date(1627996440000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028751853",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880368240",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880368240",
        R2_20_FCES_VPS_NO: null,
      },
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512582')",
        },
        GenID: "7841004857512582",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145626",
        CHA_SOI: "000020",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028928814",
        CHA_DNI: "000020",
        CHA_UCR: "SIRL12028928814",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1630368000000)/",
        POM_LDD: "/Date(1630368000000)/",
        POM_LLD: "/Date(1629787020000)/",
        POM_TRA: "/Date(1629885900000)/",
        POM_GID: "/Date(1629787020000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6ES74145HM060AB0",
        KFG_RQA: "1",
        CHA_CPN: "4552627030",
        CHA_CPI: "000020",
        MST_LSTAR: "/Date(1627981483000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1629722763000)/",
        MST_L300: "/Date(1629777087276)/",
        MST_L310: "/Date(1629787020000)/",
        MST_L311: "/Date(1629800040000)/",
        MST_L313: null,
        MST_L315: "/Date(1629805440000)/",
        MST_L318: null,
        MST_L320: "/Date(1629810840000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1629879840000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1629885900000)/",
        MST_LGID: "/Date(1629787020000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028928814",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880978715",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880978715",
        R2_20_FCES_VPS_NO: null,
      },
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512583')",
        },
        GenID: "7841004857512583",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145626",
        CHA_SOI: "000030",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028901328",
        CHA_DNI: "000030",
        CHA_UCR: "SIRL12028901328",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1631059200000)/",
        POM_LDD: "/Date(1629676800000)/",
        POM_LLD: "/Date(1629378420000)/",
        POM_TRA: "/Date(1629456060000)/",
        POM_GID: "/Date(1629378420000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6GK74431EX300XE0",
        KFG_RQA: "2",
        CHA_CPN: "4552627030",
        CHA_CPI: "000030",
        MST_LSTAR: "/Date(1627981483000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1629367890000)/",
        MST_L300: "/Date(1629376309127)/",
        MST_L310: "/Date(1629378420000)/",
        MST_L311: "/Date(1629389700000)/",
        MST_L313: null,
        MST_L315: "/Date(1629395100000)/",
        MST_L318: null,
        MST_L320: "/Date(1629400500000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1629446640000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1629456060000)/",
        MST_LGID: "/Date(1629378420000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028901328",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880866103",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880866103",
        R2_20_FCES_VPS_NO: null,
      },
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512584')",
        },
        GenID: "7841004857512584",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145626",
        CHA_SOI: "000040",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028751853",
        CHA_DNI: "000040",
        CHA_UCR: "SIRL12028751853",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1628121600000)/",
        POM_LDD: "/Date(1628121600000)/",
        POM_LLD: "/Date(1627996440000)/",
        POM_TRA: "/Date(1628074080000)/",
        POM_GID: "/Date(1627996440000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6GK74435DX050XE0",
        KFG_RQA: "2",
        CHA_CPN: "4552627030",
        CHA_CPI: "000040",
        MST_LSTAR: "/Date(1627981484000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1627986759000)/",
        MST_L300: "/Date(1627990390789)/",
        MST_L310: "/Date(1627996440000)/",
        MST_L311: "/Date(1627996740000)/",
        MST_L313: null,
        MST_L315: "/Date(1628002140000)/",
        MST_L318: null,
        MST_L320: "/Date(1628007540000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1628060100000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1628074080000)/",
        MST_LGID: "/Date(1627996440000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028751853",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880368240",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880368240",
        R2_20_FCES_VPS_NO: null,
      },
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512585')",
        },
        GenID: "7841004857512585",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145626",
        CHA_SOI: "000050",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028751853",
        CHA_DNI: "000050",
        CHA_UCR: "SIRL12028751853",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1628121600000)/",
        POM_LDD: "/Date(1628121600000)/",
        POM_LLD: "/Date(1627996440000)/",
        POM_TRA: "/Date(1628074080000)/",
        POM_GID: "/Date(1627996440000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6ES79601AB060XA0",
        KFG_RQA: "2",
        CHA_CPN: "4552627030",
        CHA_CPI: "000050",
        MST_LSTAR: "/Date(1627981484000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1627986759000)/",
        MST_L300: "/Date(1627990390789)/",
        MST_L310: "/Date(1627996440000)/",
        MST_L311: "/Date(1627996740000)/",
        MST_L313: null,
        MST_L315: "/Date(1628002140000)/",
        MST_L318: null,
        MST_L320: "/Date(1628007540000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1628060100000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1628074080000)/",
        MST_LGID: "/Date(1627996440000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028751853",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880368240",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880368240",
        R2_20_FCES_VPS_NO: null,
      },
      {
        __metadata: {
          type: "siemens.SIE_DELIVER.VIEWS_V2.Export.OD_CONNECTIONS.CHATBOT_PERFType",
          uri: "https://hanadatalake.siemens.com/siemens/SIE_DELIVER/VIEWS_V2/Export/OD_CONNECTIONS.xsodata/CHATBOT_PERF('7841004857512586')",
        },
        GenID: "7841004857512586",
        CHA_SYS: "A4P",
        CHA_CLI: "141",
        CHA_SON: "0121145627",
        CHA_SOI: "000010",
        CHA_SOS: "0000",
        CHA_PON: null,
        CHA_POI: null,
        CHA_DNN: "2028751853",
        CHA_DNI: "000060",
        CHA_UCR: "SIRL12028751853",
        CHA_LGS: "SFS",
        CHA_CBY: "DE",
        CHA_BY: "A4050656",
        CHA_CUC: "DE",
        ADRC_UC_CITY1: "Hamburg",
        ADRC_UC_COUNTRY: "DE",
        CHA_CGL: "DE",
        CHA_GLO: "Nuernberg",
        CHA_REG: "DE",
        R2_CHA_CGL: null,
        R2_CHA_GLO: null,
        R2_CHA_REG: null,
        POM_FDD: "/Date(1628121600000)/",
        POM_LDD: "/Date(1628121600000)/",
        POM_LLD: "/Date(1627996440000)/",
        POM_TRA: "/Date(1628074080000)/",
        POM_GID: "/Date(1627996440000)/",
        POM_CRD: "/Date(1628121600000)/",
        CHA_ISSO: "OFC_Order Fulfilled compl.",
        CHA_MLFB: "6ES79521KM000AA0",
        KFG_RQA: "1",
        CHA_CPN: "4552627030",
        CHA_CPI: "000060",
        MST_LSTAR: "/Date(1627981485000)/",
        MST_L100: "/Date(1627948800000)/",
        MST_L130: "/Date(1627948800000)/",
        MST_L200: null,
        MST_L210: null,
        MST_L220: null,
        MST_L230: null,
        MST_L240: null,
        MST_L290: "/Date(1627986759000)/",
        MST_L300: "/Date(1627990390789)/",
        MST_L310: "/Date(1627996440000)/",
        MST_L311: "/Date(1627996740000)/",
        MST_L313: null,
        MST_L315: "/Date(1628002140000)/",
        MST_L318: null,
        MST_L320: "/Date(1628007540000)/",
        MST_L330: null,
        MST_L335: null,
        MST_L340: null,
        MST_L350: null,
        MST_L360: "/Date(1628060100000)/",
        MST_L380: null,
        MST_L390: null,
        MST_L400: "/Date(1628074080000)/",
        MST_LGID: "/Date(1627996440000)/",
        KNA1_BY_NAME1: "Siemens Energy Global GmbH & Co. KG",
        R1_CHA_UCR: "SIRL12028751853",
        R2_CHA_UCR: null,
        R1_FCET_AWB_NO: "1Z77A4806880368240",
        R2_FCET_AWB_NO: null,
        R1_20_FCES_FWCDNM: "United Parcel Service",
        R2_20_FCES_FWCDNM: null,
        R1_20_FCES_VPS_NO: "1Z77A4806880368240",
        R2_20_FCES_VPS_NO: null,
      },
    ]
  }
}
