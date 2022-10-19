export interface IEntity {
  entity: string;
  confidence: number;
  canonical: string;
  type: string;
  startIndex: number;
  endIndex: number;
  text: string;
}
