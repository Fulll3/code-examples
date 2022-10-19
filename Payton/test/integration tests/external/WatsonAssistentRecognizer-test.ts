import { SecretManager } from "botanica";
import { IRecognizeContext } from "botbuilder";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { WatsonAssistantRecognizer, WatsonAssistantRecognizerConfig } from "../../../src/conversation/bot/WatsonAssistantRecognizer";

use(chaiAsPromised);
use(sinonChai);
var secretManager = new SecretManager();
describe('Watson Assistent Recognized test', () => {
  // pending test below Query Loading needs refactoring

  it('Integration test of recognizing intent with onRecognize was successfull', (done) => {
    (async () => {
      var recognizer = new WatsonAssistantRecognizer({
        username: await secretManager.getSecret("WATSON_ASSISTANT_USERNAME"),
        password: await secretManager.getSecret("WATSON_ASSISTANT_PASSWORD"),
        workspace_id_EN: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID"),
        workspace_id_FR: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID")
      } as WatsonAssistantRecognizerConfig);

      recognizer.onRecognize(
        { message: { text: "What is status of my invoice?" } } as IRecognizeContext,
        (err, result) => {
          expect(result.intent).to.be.equal("invoiceStatus");
          done();
        }
      );
    })();
  });

  it('Integration test of recognizing intent with manualRecognize was successfull', async () => {
    var recognizer = new WatsonAssistantRecognizer({
      username: await secretManager.getSecret("WATSON_ASSISTANT_USERNAME"),
      password: await secretManager.getSecret("WATSON_ASSISTANT_PASSWORD"),
      workspace_id_EN: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID"),
      workspace_id_FR: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID")
    } as WatsonAssistantRecognizerConfig);

    var manualRecognition = await recognizer.manualRecognize("What is status of my inovice.", "en");
    expect(manualRecognition.intents[0].intent).to.be.equal("invoiceStatus");
  });

  it('Integration test of recognizing intent with isHealthy was successfull', async () => {
    var recognizer = new WatsonAssistantRecognizer({
      username: await secretManager.getSecret("WATSON_ASSISTANT_USERNAME"),
      password: await secretManager.getSecret("WATSON_ASSISTANT_PASSWORD"),
      workspace_id_EN: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID"),
      workspace_id_FR: await secretManager.getSecret("WATSON_ASSISTANT_WORKSPACE_ID")
    } as WatsonAssistantRecognizerConfig);

    var isHealthy = await recognizer.isHealthy();
    expect(isHealthy).to.be.equal(true);
  });
});