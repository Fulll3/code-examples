import { TextSize, TextColor, TextWeight, HorizontalAlignment } from "adaptivecards";

/**
 * Properties: Text, Color, Weight, Size, Separator
 */

export interface  ITextBlockOptions {
  Text: string;
  Color?: TextColor;
  Weight?: TextWeight;
  Size?: TextSize;
  HorizontalAlignment?: HorizontalAlignment;
  Separator?: boolean;
}
