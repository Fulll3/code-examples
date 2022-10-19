import { QnAMakerEndpoint, QnAMakerResult } from "botbuilder-ai";
import { QnAMakerOptionsV3, QnAMakerV3 } from "./QnAMakerV3";
import { Logger } from "botanica";

export enum AudienceTypes {
  internal = "audience_internal",
  external = "audience_external"
}

export class QnAMakerFacade {
  private readonly strictFilter_audience_value = "yes";
  private readonly qnaInstances: { [locale: string]: QnAMakerV3 };
  private readonly top: number;
  private logger: Logger;

  //#region Initialization 
  constructor(endpoint_EN: QnAMakerEndpoint, endpoint_FR: QnAMakerEndpoint, scoreThreshold?: number, top: number = 2) {
    this.logger = new Logger(QnAMakerFacade.name);
    this.qnaInstances = {
      "en": new QnAMakerV3(endpoint_EN, scoreThreshold),
      "fr": new QnAMakerV3(endpoint_FR, scoreThreshold)
    };

    this.top = top;
  }
  //#endregion

  //#region  Public Methods 
  public async getAnswers(question: string, conversationId: string, isInternal: boolean, locale: string): Promise<QnAMakerResult[]> {
    var options: QnAMakerOptionsV3 = {
      top: this.top,
      strictFilters: [
        {
          name: isInternal ? AudienceTypes.internal : AudienceTypes.external,
          value: this.strictFilter_audience_value
        }
      ],
      timeout: 3000,
      userId: conversationId
    };
    this.logger.info(`GetAsnwers: current locale is ${locale}`)
    if (locale === "en-US") {
      locale = "en";
    }
    return this.qnaInstances[locale].getAnswersV3(question, options);
  }
  //#endregion
}