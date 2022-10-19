import { Axios } from "axios";
import { Logger } from "botanica";
import { IHealthCheckable } from "../../monitoring/health/IHealthCheckable";
import { MyID } from "../myId/MyID";



export class ItemOverviewConnector  {
  private connector: Axios;
  private logger = new Logger(ItemOverviewConnector.name)
  private myIDConnector: MyID;
  private readonly TIMEOUT = 10000;
  constructor(
    private url: string,
    myidEndpoint: string,
    myidClientId: string,
    myidKey: string,
    myidPassphrase: string,
    myidCert: string
  ) {
    this.connector = new Axios({
      url,
      timeout: this.TIMEOUT
    })
    this.myIDConnector = new MyID(
      myidEndpoint,
      myidClientId,
      myidKey,
      myidPassphrase,
      myidCert
    )
  }

  public generateOverview = async (data: any): Promise<string> => {
    try {
      const token = (await this.myIDConnector.getToken()).access_token;
      const response = await this.connector.post(this.url, JSON.stringify(data), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      return JSON.parse(response.data).fileUrl;
    } catch (e) {
      this.logger.error(`${ItemOverviewConnector.name} generateOverview error: ${JSON.stringify(e)}`);
      throw new Error(e);
    }

  }
}