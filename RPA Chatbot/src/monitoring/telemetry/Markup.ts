import { CheckTypes } from "../../service/CheckTypes";

export class Markup {
  private static readonly DEFINITION: RegExp = new RegExp(/<\?hide: .*? \?>/g);

  public static hide(text: string): string {
    CheckTypes.assertHasContent(text, `[${Markup.name}]: text input should be a string with content`);
    const contentsToHideWithMarkup = Markup.getContentToHideWithMarkup(text);
    if (contentsToHideWithMarkup.length > 0) {
      for (const content of contentsToHideWithMarkup) {
        text = text.replace(content, "_");
      }
    }
    return text;
  }

  public static clean(text: string): string {
    CheckTypes.assertHasContent(text, `[${Markup.name}]: text input should be a string with content`);
    const contentsToHideWithMarkup = Markup.getContentToHideWithMarkup(text);
    if (contentsToHideWithMarkup.length > 0) {
      for (const content of contentsToHideWithMarkup) {
        text = text.replace(
          content,
          Markup.getContentWithinMarkup(content),
        );
      }
    }
    return text.replace(/  +/g, " ");
  }

  private static getContentToHideWithMarkup(text: string): string[] {
    const result = text.match(Markup.DEFINITION);
    if (CheckTypes.isTypeArray(result)) {
      return result;
    }
    return [];
  }

  private static getContentWithinMarkup(markup: string): string {
    if (!markup.startsWith("<?hide: ")) {
      throw new Error(`${Markup.name}: Invalid input markup to process: ${markup}`);
    }
    if (!markup.endsWith(" ?>")) {
      throw new Error(`${Markup.name}: Invalid input markup to process: ${markup}`);
    }
    if (markup.length < 12) { // <?hide:  ?>
      return "";
    }
    return markup.substring(8, markup.length - 3);
  }
}