// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Claim, JwtTokenValidation, SkillValidation } from 'botframework-connector';

// Load the AppIds for the configured callers (we will only allow responses from skills we have configured).
// process.env.AllowedCallers is the list of parent bot IDs that are allowed to access the skill
// To add a new parent bot, simply edit the .env file and add
// the parent bot's Microsoft AppId to the list under AllowedCallers, e.g.:
//  AllowedCallers=195bd793-4319-4a84-a800-386770c058b2,38c74e7a-3d01-4295-8e66-43dd358920f8

/**
 * Sample claims validator that loads an allowed list from configuration if present
 * and checks that requests are coming from allowed parent bots.
 * @param claims An array of Claims decoded from the HTTP request's auth header.
 */
export class AllowedCallersClaimsValidator {
  constructor() { };

  public async validateClaims(claims: Claim[]): Promise<void> {
    const allowedCallers = process.env.AllowedCallers ? process.env.AllowedCallers.split(',') : undefined;
    console.log("allowedCallers: ", allowedCallers);
    console.log("\n\nAllow callers list - ", allowedCallers);
    console.log('\n\nClaims -', claims);

    // For security, developer must specify allowedCallers.
    if (!allowedCallers || allowedCallers.length === 0) {
      throw new Error('AllowedCallers not specified in .env.');
    }
    console.log(!allowedCallers.includes('*'));
    console.log(SkillValidation.isSkillClaim(claims));
    // If allowedCallers contains '*', we allow all calls.
    if (!allowedCallers.includes('*') && SkillValidation.isSkillClaim(claims)) {
      console.log("Inside claims validator");
      // Check that the appId claim in the skill request is in the list of skills configured for this bot.
      const appId = JwtTokenValidation.getAppIdFromClaims(claims);
      console.log("\n\nApp ID - ", appId);
      if (!allowedCallers.includes(appId)) {
        throw new Error(`Received a request from a bot with an app ID of "${appId}". To enable requests from this caller, add the app ID to your configuration file.`);
      }
    }
  }
}


