import * as table from "table";

export class TableColumnGenerator {
  private generatedTable: any[]

  constructor(column: string[]) {
    this.generatedTable = [];
    for (let index = 0; index < column.length; index++) {
      this.generatedTable.push([column[index]]);
    }
  }

  public addColumn(column: string[]) {
    for (let index = 0; index < column.length; index++) {
      this.generatedTable[index].push(column[index]);
    }
  }

  public addColumn2(...args: string[]) {
    for (let index = 0; index < args.length; index++) {
      this.generatedTable[index].push(args[index]);
    }
  }

  public getTableAsString(): string {
    return table.table(this.generatedTable);
  }
}