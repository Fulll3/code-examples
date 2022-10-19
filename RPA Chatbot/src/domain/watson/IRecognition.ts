import { RuntimeEntity } from "ibm-watson/assistant/v2";

export interface IRecognition {
  /** Confidence that the users utterance was understood on a scale from 0.0 - 1.0.  */
  confidence?: number;

  /** Top intent that was matched. */
  intent?: string;

  /** List of entities recognized. */
  entities?: RuntimeEntity[];
}