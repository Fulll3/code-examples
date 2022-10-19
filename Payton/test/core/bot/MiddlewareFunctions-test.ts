import { Session } from "botbuilder";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { onMessageReceived } from "../../../src/conversation/bot/MiddlewareFunctions";
import { WatsonAssistantRecognizer } from "../../../src/conversation/bot/WatsonAssistantRecognizer";
import { ConversationHistoryManager } from "../../../src/conversation/helpers/ConversationHistoryManager";
import { MetricsManager } from "../../../src/conversation/metrics/MetricManager";
import { HealthManager } from "../../../src/core/healthManager/HealthManager";

use(chaiAsPromised);
use(sinonChai);

describe("Middleware Functions", function () {
  describe("handle flow on message received", function () {
    it("should ignore processing, when given inappropriate message type", async function () {
      const session = {
        message: { type: 'other' }
      } as Session;
      const health = {
        isChatbotHealthy: sinon.stub().returns(true)
      } as unknown as HealthManager;
      const assistant = {} as WatsonAssistantRecognizer;
      const next = sinon.fake();

      await onMessageReceived(session, next, health, assistant);
      expect(next.callCount).to.equal(0);
    });

    it("should continue chaining, when given appropriate message type", async function () {
      const session = {
        message: { type: 'message', text: 'hello bot' },
        sendTyping: sinon.fake(),
        delay: sinon.fake()
      } as unknown as Session;
      const health = {
        isChatbotHealthy: sinon.stub().returns(true)
      } as unknown as HealthManager;
      const assistant = {
        manualCachedRecognize: sinon.stub().resolves({}),
        topIntent: sinon.stub().returns(null),
      } as unknown as WatsonAssistantRecognizer;
      const next = sinon.fake();

      sinon.replace(ConversationHistoryManager, "save", sinon.fake());
      sinon.replace(MetricsManager, "trackUserMessage", sinon.fake());

      await onMessageReceived(session, next, health, assistant);
      expect(next.callCount).to.equal(1);
      sinon.restore();
    });
  });

  describe("processing behavior, when given appropriate message type", function () {
    it("should save message using conversation history manager", async function () {
      const session = {
        message: { type: 'message', text: 'hello bot' },
        sendTyping: sinon.fake(),
        delay: sinon.fake()
      } as unknown as Session;
      const health = {
        isChatbotHealthy: sinon.stub().returns(true)
      } as unknown as HealthManager;
      const assistant = {
        manualCachedRecognize: sinon.stub().resolves({}),
        topIntent: sinon.stub().returns(null),
      } as unknown as WatsonAssistantRecognizer;
      const next = sinon.fake();
      const saveSpy = sinon.fake();

      sinon.replace(ConversationHistoryManager, "save", saveSpy);
      sinon.replace(MetricsManager, "trackUserMessage", sinon.fake());

      await onMessageReceived(session, next, health, assistant);

      expect(saveSpy.calledOnce)
        .to.to.be.true;
      expect(saveSpy.calledWith(session, `user input: ${session.message.text}`))
        .to.to.be.true;
      sinon.restore();
    });

    it("should call ibm assistant and track user message", async function () {
      const session = {
        message: { type: 'message', text: 'hello bot' },
        sendTyping: sinon.fake(),
        userData: { locale: "en" },
        delay: sinon.fake()
      } as unknown as Session;
      const health = {
        isChatbotHealthy: sinon.stub().returns(true)
      } as unknown as HealthManager;
      const assistant = {
        manualCachedRecognize: sinon.stub().resolves({ intents: [] }),
        topIntent: sinon.stub().returns('invoiceStatus'),
      } as unknown as WatsonAssistantRecognizer;
      const next = sinon.fake();
      const metricsSpy = sinon.fake();

      sinon.replace(ConversationHistoryManager, "save", sinon.fake());
      sinon.replace(MetricsManager, "trackUserMessage", metricsSpy);

      await onMessageReceived(session, next, health, assistant);

      sinon.assert.calledWith(assistant.manualCachedRecognize as any, session.message.text, session.userData.locale);
      sinon.assert.calledWith(assistant.topIntent as any, { intents: [] });
      sinon.assert.calledOnce(metricsSpy);

      sinon.restore();
    });

    it("should handle ibm assistant herrors appropriatelly", async function () {
      const session = {
        message: { type: 'message', text: 'hello bot' },
        sendTyping: sinon.fake(),
        userData: { locale: "en" },
        delay: sinon.fake()
      } as unknown as Session;
      const health = {
        isChatbotHealthy: sinon.fake.returns(true)
      } as unknown as HealthManager;
      const assistant = {
        manualCachedRecognize: sinon.fake.rejects(new Error('error message')),
        topIntent: sinon.fake.returns('invoiceStatus'),
      } as unknown as WatsonAssistantRecognizer;
      const next = sinon.fake();
      const metricsSpy = sinon.fake();

      sinon.replace(ConversationHistoryManager, "save", sinon.fake());
      sinon.replace(MetricsManager, "trackUserMessage", metricsSpy);

      await onMessageReceived(session, next, health, assistant);

      sinon.assert.calledWith(assistant.manualCachedRecognize as any, session.message.text, session.userData.locale);
      sinon.assert.calledWith(metricsSpy, session, "N/A", "N/A");
      sinon.assert.notCalled(assistant.topIntent as any);

      sinon.restore();
    });
  });
});