import * as _ from "lodash";
import { ValueIteratee } from "lodash";

export class Lodash {
  public static uniq<T>(data: T[]): T[] {
    return _.uniq(data);
  }

  public static uniqBy<T>(data: T[], iteratee: ValueIteratee<T>): T[] {
    return _.uniqBy(data, iteratee);
  }

  public static extractCommonPrefix(list: string[]): string {
    let common = "";
    if (list.length === 0) {
      return common;
    }
    const smallestLenght = Math.min(...list.map(ref => ref.length));
    if (smallestLenght === 0) {
      return common;
    }
    let currentChar = 0;
    while (currentChar < smallestLenght) {
      const pivotChar = list[0].charAt(currentChar);
      for (let i = 1; i < list.length; i++) {
        if (list[i].charAt(currentChar) !== pivotChar) {
          return common;
        }
      }
      common += pivotChar;
      currentChar++;
    }
    return common.trim();
  }
}