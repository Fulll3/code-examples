import { Env } from "botanica";
import * as jwt from "jsonwebtoken";
import { IJwtPayload } from "../business/core/IJwtPayload";

export class JwtManager {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  public verify(token: string): IJwtPayload {
    let ignoreExpiration = false;
    if(Env.get("BotEnv", "dev") === "dev") {
      ignoreExpiration = true;
    }
    return jwt.verify(
      token,
      this.secret,
      {
        algorithms: ["HS256"],
        audience: ["SIEMENS"],
        ignoreExpiration
      }
    ) as IJwtPayload;
  }
}