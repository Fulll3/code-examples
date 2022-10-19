import * as fs from "fs";
import * as path from "path";
import { Configuration } from "../../src/Configuration";
import { BotServices } from "../../src/service/resolution/BotServices";
import { ServiceTypes } from "../../src/service/resolution/ServiceTypes";
import { expect } from "chai";

describe("Bot Services Resolution", () => {
  let configuration;

  before(async () => {
    Configuration.reset();
    configuration = Configuration.get(fs, path, "dev");
    await BotServices.initalize(configuration);
  });

  describe("Loads services from correct factories", () => {

    it("should create concrete ConversationState", async () => {
      const state = BotServices.getInstance().get(ServiceTypes.ConversationState);
      // check object format: types are removed at runtime
      expect(state.storage).not.undefined;
      expect(state.storageKey).not.undefined;
      expect(state.properties).not.undefined;
      expect(state.stateKey).not.undefined;
    });

    it("should create concrete UserState", async () => {
      const state = BotServices.getInstance().get(ServiceTypes.UserState);
      // check object format: types are removed at runtime
      expect(state.storage).not.undefined;
      expect(state.storageKey).not.undefined;
      expect(state.properties).not.undefined;
      expect(state.stateKey).not.undefined;
    });
  });
});
