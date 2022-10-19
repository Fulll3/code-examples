import { IHealthCheckable } from "../../../core/healthManager/IHealthCheckable";
import { IEzSuiteConnectorParams } from "./IEzSuiteConnectorParams";
import { IEzSuiteInvoiceData } from "./IEzSuiteInvoiceData";

export interface IEzSuiteConnector extends IHealthCheckable {
  getData(inputParams: IEzSuiteConnectorParams): Promise<IEzSuiteInvoiceData[]>;
}