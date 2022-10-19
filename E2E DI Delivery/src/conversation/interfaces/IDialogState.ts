import { IHanaResult } from "../../data/hana/IHanaResult";
import { PromiseHanaResult } from "../../data/hana/PromiseHanaResult";
import { UserDetails } from "../../domain/User";
import { DeliveryDocumentType } from "../../domain/values/DeliveryDocumentType";
import { CustomChoices } from "../dialogs/helpers/CustomChoises";

export interface IDialogState {
  restarted?: boolean;
  promiseHanaResult?: Promise<IHanaResult[]>
  hanaResult?: IHanaResult[];
  promiseHanaResulClass?: PromiseHanaResult,
  index?: number,
  customChoices?: CustomChoices
  userDetails?: UserDetails;

}