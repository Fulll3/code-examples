import { SplunkResultRow } from "../../../data/splunk/SplunkConnector";

export class SplunkResultsContainer {
  constructor(
    private results: SplunkResultRow[]
  ){

  }

  public getRunDetailsAdaptiveCardData = () => {
    this.results.forEach((result) => {
      
    })
  }
}