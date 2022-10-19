import { Logger } from "botanica"
import { createHash, createPrivateKey, createPublicKey, KeyObject } from "crypto"
import {  Secret, sign } from "jsonwebtoken"
export class JWTGenerator {

  private readonly LIFETIME = 59 * 60 * 1000  // The tokens will have a 59 minute lifetime
  private readonly RENEWAL_DELTA = 54 * 60 * 1000  // Tokens will be renewed after 54 minutes
  private readonly ALGORITHM = "RS256"  // Tokens will be generated using RSA with SHA256
  private qualifiedUserName: string;
  private renewTime: number;
  private token: any;
  private privateKey: KeyObject;
  private logger: Logger;
  private static instance: JWTGenerator;

  constructor(
    account: string,
    user: string,
    private privateKeyString: string,
    private passphrase: string,
    lifeTime?: number,
    renewalDelta?: number
  ) {
    if (!account) throw new Error(`${JWTGenerator.name}: account paramater has to be provided.`)
    if (!privateKeyString) throw new Error(`${JWTGenerator.name}: privateKey paramater has to be provided.`)
    if (!lifeTime) lifeTime = this.LIFETIME
    if (!renewalDelta) renewalDelta = this.RENEWAL_DELTA;


    account = this.prepareAccount(account);
    user = user.toUpperCase();
    this.qualifiedUserName = account + "." + user;
    this.renewTime = Date.now();
    this.privateKey = createPrivateKey({
      key: privateKeyString,
      passphrase,
      format: 'pem'
    });
    this.logger = new Logger(JWTGenerator.name)

    this.logger.info(
      `Creating JWTGenerator with arguments
      account : ${account}, user : ${account}, lifetime :${lifeTime}, renewal_delay : ${renewalDelta}`)
  }

  public static getInstance(
    account?: string,
    user?: string,
    privateKeyString?: string,
    passphrase?: string,
    lifeTime?: number,
    renewalDelta?: number
  ): JWTGenerator {
    if (!JWTGenerator.instance) {
      JWTGenerator.instance = new JWTGenerator(
        account,
        user,
        privateKeyString,
        passphrase,
        lifeTime,
        renewalDelta
        );
    }
    return JWTGenerator.instance;
  }

  private prepareAccount = (account: string) => {
    return account.toUpperCase();
  }


  public getToken = () => {
    const now = new Date().getTime();

    if (this.renewTime <= now) {
      this.renewTime = now + this.RENEWAL_DELTA;
      const publicKeyFingerprint = this.calculatePublicKeyFingerprint();
      const payload = this.createPayload(publicKeyFingerprint);
      const secret: Secret = {
        key: this.privateKeyString,
        passphrase: this.passphrase
      }

      this.token = sign(payload, secret, {
        algorithm: this.ALGORITHM
      })
    }

    return this.token;
  }

  private calculatePublicKeyFingerprint = (): string => {
    const pubKeyObject = createPublicKey(this.privateKey);
    const publicKey = pubKeyObject.export({
      format: 'der',
      type: 'spki'
    })
    var fingerprintHash = createHash('sha256').update(publicKey).digest("base64");
    const fingerprint = Buffer.from(fingerprintHash).toString("utf-8")


    return fingerprint;
  }

  private createPayload = (publicKeyfingerprint: string) => {
    const payload = {
      // Set the issuer to the fully qualified username concatenated with the public key fingerprint.
      'iss': `${this.qualifiedUserName}.SHA256:${publicKeyfingerprint}`,

      // Set the subject to the fully qualified username.
      "sub": this.qualifiedUserName,

      // Set the issue time to now.
      "iat": new Date().getTime()/1000,

      // Set the expiration time, based on the lifetime specified for this object.
      "exp": (new Date().getTime() + this.LIFETIME)/1000
    }
    return payload;
  }


}