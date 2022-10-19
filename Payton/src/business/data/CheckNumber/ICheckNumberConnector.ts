import { IHealthCheckable } from "../../../core/healthManager/IHealthCheckable";
import { ICheckNumberQuery } from "./ICheckNumberQuery";
import { IDatastoreResult } from "./IDatastoreResult";

export interface ICheckNumberConnector extends IHealthCheckable {
  getData(inputParams: ICheckNumberQuery): Promise<IDatastoreResult[]>;
}
