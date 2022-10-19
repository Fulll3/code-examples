import { fail } from "assert";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { DelegateCache } from "../../src/core/utils/DelegateCache";

use(chaiAsPromised);
use(sinonChai);

let assistantMock;
let assistantSpy;

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
  assistantSpy = sinon.spy(assistantMock, "message");
});

describe("Delegate Assistant Cache", function () {

  this.timeout(5000);

  it("should expose a message compatible api", (done) => {
    const assistant = new DelegateCache(assistantMock as AssistantV1);

    assistant.message({
      workspace_id: 'workspace_id',
      input: { text: 'input' }
    }, (err: any, response: MessageResponse) => {
      if (err) {
        fail("Shold not return error: " + err.message);
      } else {
        expect(response.intents[0].intent).to.equal('intent 1');
        expect(response.intents[1].intent).to.equal('intent 2');
        done();
      }
    });
  });

  it("should avoid request if chache hits", (done) => {
    const assistant = new DelegateCache(assistantMock as AssistantV1);
    const params = {
      workspace_id: 'workspace_id',
      input: { text: 'input' }
    }

    assistant.message(params, (err: any, response: MessageResponse) => {
      assistant.message(params, (err: any, response: MessageResponse) => {
        expect(assistantSpy).to.have.been.calledOnce;
        done();
      });
    });
  });

  it("should issue request if chache expires", (done) => {
    const assistant = new DelegateCache(
      assistantMock as AssistantV1,
      1 // one second
    );

    const params = {
      workspace_id: 'workspace_id',
      input: { text: 'input' }
    }

    assistant.message(params, (err: any, response: MessageResponse) => { });

    // waits 3 seconds and it should invoke api because stdTTL=1sec
    setTimeout(() => {
      assistant.message(params, (err: any, response: MessageResponse) => {
        expect(assistantSpy).to.have.been.calledTwice;
        done();
      });
    }, 3000);
  });
});