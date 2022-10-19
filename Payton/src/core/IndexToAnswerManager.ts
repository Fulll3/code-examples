import * as moment from "moment";
import * as path from "path";
import { PaymentTermsMapper } from "../data/PaymentTermsMapper";

export class IndexToAnswerManager {
  private mappingTable: any;
  private static instance: IndexToAnswerManager;

  //#region Initialization 
  private constructor(filePath?: string) {
    if (!filePath) {
      filePath = '../../configuration/indexAnswerMapping.json';
    }

    this.mappingTable = require(path.join(__dirname, filePath));
  }

  public static getInstance(filePath?: string) {
    if (!IndexToAnswerManager.instance) {
      IndexToAnswerManager.instance = new IndexToAnswerManager(filePath);
    }

    return IndexToAnswerManager.instance;
  }
  //#endregion

  //#region Public Methods 
  public getAnswers = (conversationIndex: string): AnswerMapping => {
    return this.mappingTable[conversationIndex];
  }

  public static prepareParameters = async (paramsDefinition: AnswerParameter[], data: any, locale: string): Promise<any[]> => {
    var generatedParams = [];

    if (paramsDefinition) {
      for (let index = 0; index < paramsDefinition.length; index++) {
        const element = paramsDefinition[index];

        if (element.type == ParameterType.date) {
          generatedParams.push(
            moment(data[element.value], element.inputFormat).format(element.outputFormat)
          );
        } else if (element.type == ParameterType.paymentTerms) {
          generatedParams.push(
            (await PaymentTermsMapper.GetInstance()).getText(data[element.value], data.System, locale)
          );
        } else if (element.type == ParameterType.checkNumber) {
          generatedParams.push(
            data[element.value]
          );
        } else {
          generatedParams.push(data[element.value]);
        }
      }
    }

    return generatedParams;
  }
  //#endregion
}

//#region Type Definitions 
export interface AnswerParameter {
  type: ParameterType;
  value: string;
  inputFormat?: string;
  outputFormat?: string;
}

export interface AnswerMapping {
  answer1: string;
  answer2?: string;
  answerAfterTicket?: string;
  params1?: AnswerParameter[];
  params2?: AnswerParameter[];
}

export enum ParameterType {
  simple = "simple",
  date = "date",
  paymentTerms = "paymentTerms",
  checkNumber = "checkNumber",
}
//#endregion