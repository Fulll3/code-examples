import { Axios } from "axios";
import { Logger } from "botanica";
import { IMyidInfo } from "./IMyidInfo";
const https = require('node:https');

export class MyID {
  private readonly TIMEOUT = 5000;
  private axios: Axios;
  private logger: Logger;
  constructor(
    private endpoint: string,
    private clientId: string,
    private key: string,
    private passphrase: string,
    private cert: string
  ) {
    if (!this.endpoint) {
      throw new Error(`[${MyID.name}]: Missing parameter, endpoint is required`);
    }
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    const agentOptions = this.getAgentOptions();
    this.axios = new Axios({
      httpsAgent: agentOptions,
      headers,
      timeout: this.TIMEOUT
    });
    this.logger = new Logger(MyID.name)
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const request = await this.checkhealth();
      const errorMessageExists = request.error_message !== "";
      if (errorMessageExists) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      this.logger.error(`${MyID.name} healthcheck error: ${JSON.stringify(error)}`)
      return false;
    }
  }

  public checkhealth = async (): Promise<any> => {
    return await this.getToken();
  }


  // TODO get CERTIFICATE and KEY and send request over HTTP
  // CURL working : curl -x http://de.coia.siemens.net:9400 https://cpki.myid-qa.siemens.com/as/token.oauth2  -d 'grant_type=client_credentials&client_id=fc64ea80-60e5-426f-a7c4-b47ce2d50955' --cert ccmtqcrt.pem --key ccmtqkey.pem 
  public getToken = async (): Promise<IMyidInfo> => {
    let result: IMyidInfo = { access_token: "", token_type: "", expires_in: new Date(), error_message: "" };
    try {
      const data = this.createDataPayload();

      const response = await this.axios.post(
        this.endpoint,
        data);
      this.logger.info("myID response", response);
      const responseBody = JSON.parse(response.data);
      // handle the response as you would see fit 
      result.access_token = responseBody.access_token;
      result.token_type = responseBody.token_type;

      // Add the expiration time to set the end parameter for the token
      result.expires_in.setSeconds(result.expires_in.getSeconds() + responseBody.expires_in);

      result.error_message = "";
    } catch (error) {
      this.logger.error(`${MyID.name} getToken error: ${JSON.stringify(error)}`)
      throw new Error(error);
    }

    return result;
  }

  private createDataPayload = () => {
    var data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('client_id', this.clientId);
    return data.toString();
  }
  private getAgentOptions = () => {
    const httpsAgent = new https.Agent({
      cert: this.cert,
      key: this.key,
      passphrase: this.passphrase,
      rejectUnauthorized: false,
      keepAlive: true,
    })
    return httpsAgent;
  }
}


