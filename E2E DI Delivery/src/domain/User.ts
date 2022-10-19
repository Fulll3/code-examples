export type UserDetails = {
  Country: string;
  External: boolean;
  Email?: string;
  GID?: string;
  CustomerID?:string;

}

export enum UserType {
  internal = "internal",
  external = "external"
}

export class User {
  constructor(private userDetails: UserDetails) {

  }

  public isExternal = () => {
    return this.userDetails.External;
  }
  public getUserType = () => {
    return this.userDetails.External ? UserType.external : UserType.internal;
  }

  public getUserDetails = () => {
    return this.userDetails;
  }

  public getCustomerId = () => {
    return this.userDetails.CustomerID;
  }

  public getEmail = () => {
    return this.userDetails.Email;
  }

  public getCountry = () => {
    return this.userDetails.Country;
  }
}