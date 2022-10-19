import { fail } from "assert";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { AssistantV1 } from "watson-developer-cloud";
import { MessageResponse } from "watson-developer-cloud/assistant/v1";
import { RawCache } from "../../src/core/utils/RawCache";

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
      }, 1000);
    }
  }
  assistantSpy = sinon.spy(assistantMock, "message");
});

describe("Raw Assistant Cache", function () {

  this.timeout(5000);

  it("should accept configuration time on the fly", () => {
    const time = 10000;
    const assistant = new RawCache(
      assistantMock as AssistantV1
    ).withTimeSpan(time);

    expect(
      assistant.getTimeSpan()
    ).to.equal(time);
  });

  it("should expose a message compatible api", (done) => {
    const assistant = new RawCache(assistantMock as AssistantV1);

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
    const assistant = new RawCache(assistantMock as AssistantV1);
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
    const assistant = new RawCache(
      assistantMock as AssistantV1
    ).withTimeSpan(0);

    const params = {
      workspace_id: 'workspace_id',
      input: { text: 'input' }
    }

    assistant.message(params, (err: any, response: MessageResponse) => {
      assistant.message(params, (err: any, response: MessageResponse) => {
        expect(assistantSpy).to.have.been.calledTwice;
        done();
      });
    });
  });

  it("should clear memory after calls threshold", (done) => {
    const assistant = new RawCache(
      assistantMock as AssistantV1
    )
      .withCallsTreshold(2)
      .withTimeSpan(0);

    const param1 = { workspace_id: 'workspace_id', input: { text: 'input1' } };
    const param2 = { workspace_id: 'workspace_id', input: { text: 'input2' } };

    assistant.message(param1, (err: any, response: MessageResponse) => { });
    assistant.message(param2, (err: any, response: MessageResponse) => { });

    setTimeout(() => {
      expect(assistant.getNumberOfReferences()).to.equal(0); // clear has executed
      done();
    }, 2500);
  });
});