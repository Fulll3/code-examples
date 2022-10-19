import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinonChai from "sinon-chai";
import { IEntitlement } from "../../src/business/conversation/IEntiltement";
import { ISearchParameters } from "../../src/business/conversation/ISearchParameters";
import { HanaSchemaVersion, QueryCreator } from "../../src/core/QueryCreator";
import { ERPSystemMappingManager } from "../../src/data/ERPSystemMappingManager";
import moment = require("moment");

use(chaiAsPromised);
use(sinonChai);

describe('Query Creator test', function () {
  // pending test below Query Creator needs refactoring
  it('sql statement generated succesfully for 2 soc no vendors', async () => {
    let entiltementData: IEntitlement[] = [
      {
        soc: "SFS-SAP",  //E1P01
        companyCode: "",
        vendorId: ""
      },
      {
        soc: "SMS-P51",  //P4101
        companyCode: "",
        vendorId: ""
      }
    ];

    let queryData: ISearchParameters = {
      invoiceNumber: "1515",
      invoiceDate: undefined,
      invoiceAmount: "",
      invoiceCurrency: "",
      poNumber: ""
    }

    await ERPSystemMappingManager.Initialize();
    let preparedQuery = await QueryCreator.CreateQuery(entiltementData, queryData, false, HanaSchemaVersion.Botanica);
    let expectedString = 
`SELECTTOP11DISTINCTDOCUMENTNUMBERas"DocumentNumber",DOCUMENTDATEas"DocumentDate",VENDORNUMBERas"VendorNumber",PONUMBERas"PONumber",COMPANYCODEas"CompanyCode",ASSIGNMENTas"Assignment",POSTINGDATEas"PostingDate",DOCUMENTTYPEas"DocumentType",PAYMENTBLOCK_DOCLEVELas"PaymentBlock_DocLevel",DOCUMENT_PAYMENTMETHODas"Document_PaymentMethod",PAYMENTTERMSas"PaymentTerms",CLEARINGDATEas"ClearingDate",CLEARINGDOCUMENTas"ClearingDocument",DOCUMENTTYPE_CLEAREDDOCUMENTas"DocumentType_ClearedDocument",NAME1as"Name1",REGIONas"Region",INVOICENUMBERas"InvoiceNumber",BASELINEPAYMENTDTEas"BaselinePaymentDte",VENDOR_PAYMENTMETHODas"Vendor_PaymentMethod",PAYMENTBLOCK_VENDORLEVELas"PaymentBlock_VendorLevel",LOCALAMOUNTas"LocalAmount",DOCUMENTAMOUNTas"DocumentAmount",DOCUMENTCURRENCYas"DocumentCurrency",PBPRICEas"PBPrice",PBDATEas"PBDate",PBAMOUNTas"PBAmount",PBQUALITYas"PBQuality",PBQUANTITYas"PBQuantity",NETDUEDATEas"NetDueDate",POSTINGKEYas"PostingKey",SYSTEMas"System"FROM"PS_BOTANICA"."siemens.BOTANICA.Botanica.model::T_CHATBOT_PERSISTENT_GBS"WHERE"VENDORNUMBER"IN(?)AND"COMPANYCODE"IN(?)AND"INVOICENUMBER"=?AND"SYSTEM"=?OR"VENDORNUMBER"IN(?)AND"COMPANYCODE"IN(?)AND"INVOICENUMBER"=?AND"SYSTEM"=?orderby"POSTINGDATE"desc`.replace(/\s/g, '');

    expect(preparedQuery.query.replace(/\s/g, '')).to.be.equal(expectedString);
  });
});