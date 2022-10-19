import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { config } from "../../src/config";
import { DELEGATE_CACHE_CONST } from "../../src/core/utils/DelegateCache";
import { DISABLED_CACHE_CONST } from "../../src/core/utils/DisabledCache";
import { AssistantCacheFactory } from "../../src/core/utils/IAssistantCache";
import { RAW_CACHE_CONST } from "../../src/core/utils/RawCache";

use(chaiAsPromised);
use(sinonChai);

let assistantMock;

beforeEach(function () {
  assistantMock = {
    message: function (params, callback) {
      setTimeout(function () {
        callback(null, {
          intents: [
            { intent: "intent 1", confidence: 0.8 },
            { intent: "intent 2", confidence: 0.5 }
          ],
          entities: null,
          alternate_intents: null,
          context: null,
          output: null,
        } as MessageResponse)
      }, 1500);
    }
  }
});

describe("Assistant Cache Factory", function () {
  it("should create a concrete implementation of IAssistantCache", function () {
    let options = config.get("AssistantCache");
    let instanceType = options.type;

    if (instanceType == 'raw') {
      expect(AssistantCacheFactory.get(assistantMock).tag()).to.equal(RAW_CACHE_CONST);
    } else if (instanceType == 'delegate') {
      expect(AssistantCacheFactory.get(assistantMock).tag()).to.equal(DELEGATE_CACHE_CONST);
    } else {
      expect(AssistantCacheFactory.get(assistantMock).tag()).to.equal(DISABLED_CACHE_CONST);
    }
  });
});