import { QnAMakerEndpoint, QnAMakerOptions, QnAMakerResult } from "botbuilder-ai";
import { Logger } from "botanica";
var botbuilderAi = require("botbuilder-ai");

export interface QnAMakerOptionsV3 extends QnAMakerOptions {
  userId: string;
}

export class QnAMakerV3 extends botbuilderAi.QnAMaker {
  private readonly scoreThreshold: number;
  private readonly endpoint: QnAMakerEndpoint;
  private logger = new Logger(QnAMakerV3.name);

  //#region Initialization 
  constructor(endpoint: QnAMakerEndpoint, scoreThreshold?: number) {
    super(endpoint);
    this.endpoint = endpoint;
    this.scoreThreshold = typeof scoreThreshold === 'number' ? scoreThreshold : 0.001;
  }
  //#endregion

  //#region Public Methods 
  public async getAnswersV3(question: string, options: QnAMakerOptionsV3): Promise<QnAMakerResult[]> {
    const trimmedAnswer = question ? question.trim() : '';

    if (trimmedAnswer.length > 0) {
      try{
      this.logger.info(`[QnAMakerV3] botbuilderAI: ${JSON.stringify(botbuilderAi.QnAMaker)}`)
      const qnaResponse = await this.generateAnswerUtils.queryQnaServiceRaw(this.endpoint, question, options);

      return qnaResponse.answers.filter(
        (ans) => ans.score >= this.scoreThreshold
      ).sort(
        (a, b) => b.score - a.score
      );
      } catch(e) {
        this.logger.error(e);
        throw e;
      }
    }

    return [];
  }
  //#endregion
}