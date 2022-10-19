import { ProcessRun } from "../domain/splunk/values/ProcessRun";
import * as fs from "fs"
import * as path from "path"
export class TableBuilder {
  
  public static buildUsecaseHistoryTable  = (processRuns: ProcessRun[]) => {
    const titleColumn = "| process name |status  |started at | finished at |robot\n"
    const titleSeparator = "|---|---|---|---|---|\n";
    let content = ""
    processRuns.forEach((process) => {
      const row = `|${process.getProcessName()}| ${process.getStatus()} |${process.getStarted()}|${process.getFinishedAt()}|${process.getRobotNumber()}|\n`
      content += row;
    })
    const table = titleColumn.concat(titleSeparator).concat(content);
    fs.writeFileSync(path.join(__dirname, "../../resources/RunHistoryTable.txt"), table, 'utf-8');

    return table;
  }
} 