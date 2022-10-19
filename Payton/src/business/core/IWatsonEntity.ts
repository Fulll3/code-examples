import { IEntity } from "botbuilder";

export interface IWatsonEntity extends IEntity {
  groups?: IWatsonPatternGroup[];
}

export interface IWatsonPatternGroup {
  group: string;
  startIndex: number;
  endIndex: number;
}