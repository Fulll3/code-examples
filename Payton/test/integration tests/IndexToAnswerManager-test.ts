import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { IndexToAnswerManager } from "../../src/core/IndexToAnswerManager";

use(chaiAsPromised);
use(sinonChai);

var manager: IndexToAnswerManager;

before(async () => {
  manager = await IndexToAnswerManager.getInstance();
});

describe('IndexToAnswerManager test', function () {
  it('Returns correct answer for stack 1.1.2.1.', () => {
    expect(manager.getAnswers("1.1.2.1").answer1).to.be.equal("invoiceStatusAnswer1_Awaiting Payment");
  });
  it('Returns correct answer for stack 1.1.1.1.2.1', () => {
    expect(manager.getAnswers("1.1.1.1.2.1").answer2).to.be.equal("invoiceStatusAnswer2_Paid - EFT payment");
  });
  it('Returns generated parameters for stack 1.1.1.1.2.2', async () => {
    var definition = manager.getAnswers("1.1.1.1.2.2");

    var resultParams = await IndexToAnswerManager.prepareParameters(definition.params1, {
      ClearingDate: "20190411",
      ClearingDocument: "109002546"
    }, "en");
    expect(resultParams[0]).to.be.equal("04/11/2019");
    expect(resultParams[1]).to.be.equal("109002546");
  });
  it('Returns generated parameters for stack 1.1.2.1', async () => {
    var definition = manager.getAnswers("1.1.2.1");

    var resultParams = await IndexToAnswerManager.prepareParameters(definition.params1, {
      PaymentTerms: "A001",
      System: "E1P"
    }, "en");
    expect(resultParams[0]).to.be.equal("Immediately due");
  });
});