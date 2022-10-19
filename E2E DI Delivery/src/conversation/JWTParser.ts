import { Logger, SecretManager } from "botanica";
import { verify } from "jsonwebtoken";
import { UserDetails } from "../domain/User";

export interface ParsedData {
  directLineToken: string;
  userDetails: UserDetails;
  iat: number;
  exp: number;
  aud: string;
  sub: string;
}


export class JWTParser {
  private static logger = new Logger(JWTParser.name)
  public static getUserDetails = async (token: string): Promise<UserDetails> => {
    const secretManager = new SecretManager();
    const cert = await secretManager.getSecret("PUBLIC_KEY_JWT");
    await JWTParser.logger.info(cert)
    const content = verify(token, cert) as ParsedData;
    return content.userDetails;
  }
}