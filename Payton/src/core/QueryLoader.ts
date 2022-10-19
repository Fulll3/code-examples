import { readFileSync } from "fs";
import * as path from "path";
import { XmlDocument } from "xmldoc";
import { HanaSchemaVersion } from "./QueryCreator";

export class QueryLoader {
  private dictionaryEnergyQuery = {};
  private dictionaryBotanicaQuery = {};
  private dictionarySnowflakeQuery = {};
  private static instance: QueryLoader;
  private config = {
    Botanica: '../../configuration/queries_botanica.xml',
    Energy: '../../configuration/queries.xml',
    Snowflake: '../../configuration/queries_snowflake.xml'
  }
  //#region Initialization
  private constructor() {
    this.loadSqlQuery(HanaSchemaVersion.Botanica);
    this.loadSqlQuery(HanaSchemaVersion.Energy);
    this.loadSqlQuery(HanaSchemaVersion.Snowflake);
  }

  private loadSqlQuery(schemaVersion: HanaSchemaVersion) {
    var filePath = path.join(__dirname, this.config[schemaVersion]);
    var contents = readFileSync(
      filePath,
      'utf8'
    );
    var document = new XmlDocument(contents);

    document.eachChild((element) => {
      switch (schemaVersion) {
        case HanaSchemaVersion.Botanica:
          this.dictionaryBotanicaQuery[element.attr.code] = element.val.trim();
          break;
        case HanaSchemaVersion.Energy:
          this.dictionaryEnergyQuery[element.attr.code] = element.val.trim();
          break;
        case HanaSchemaVersion.Snowflake:
          this.dictionarySnowflakeQuery[element.attr.code] = element.val.trim();
          break;
        default:
          break;
      }
    });
  }
  private findKey = (dictionary: any, key: string) => {
    if (dictionary[key]) {
      return dictionary[key];
    } else {
      throw new Error(`Could not found query template according to key: ${key}`);
    }
  }
  public static GetInstance(): QueryLoader {
    if (!QueryLoader.instance) {
      QueryLoader.instance = new QueryLoader();
    }

    return QueryLoader.instance;
  }
  //#endregion

  //#region Public Methods 
  public Get(key: string, hanaVersion: HanaSchemaVersion): string {
    switch (hanaVersion) {
      case HanaSchemaVersion.Botanica:
        return this.findKey(this.dictionaryBotanicaQuery, key);
      case HanaSchemaVersion.Energy:
        return this.findKey(this.dictionarySnowflakeQuery, key);
    }

  }
  //#endregion
}