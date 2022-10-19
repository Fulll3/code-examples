import { IAttachment, Session } from "botbuilder";
import * as moment from "moment";
import { IInvoiceData } from "../../business/conversation/IInvoiceData";
import { IAdditionalCompanyCodeInfo } from "../../business/IAdditionalCompanyCodeInfo";
import * as LocalizationManager from "../bot/LocalizationManager";
import { InvoiceDataSource } from "./Results/AbstractResultsHelper";
import { SessionHelper } from "./SessionHelper";
import { TableColumnGenerator } from "./TableGenerator";

export class InvoiceQueryInformation {
  public static generate(session: Session, addGreeting: boolean, addNoResultsTitle?: boolean): IAttachment {
    var adaptiveCard = {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        body: []
      }
    };

    adaptiveCard.content.body.push(
      this.generateSummary(
        session,
        addGreeting
          ? LocalizationManager.getText(session, "greetingWithData_dataHeader")
          : addNoResultsTitle
            ? LocalizationManager.getText(session, "adaptiveCard_noResultsHeader")
            : LocalizationManager.getText(session, "adaptiveCard_header")
      )
    );

    if (addGreeting) { // add greeting footer
      adaptiveCard.content.body.push({  // TODO  when implementing OPTION TWO ensure proper save to history
        "type": "Container",
        "items": [{
          "type": "TextBlock",
          "text": LocalizationManager.getText(session, "greetingWithData_footer"),
          "wrap": true
        }]
      });
    }

    return adaptiveCard;
  }

  public static generateResultsAdaptiveCard = (value: any, numberOfResults: number, additionalInfo: IAdditionalCompanyCodeInfo, session: Session) => {
    return {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        "type": "AdaptiveCard",
        "body": [
          {
            "type": "Container",
            "items": [
              {
                "type": "FactSet",
                "facts": [
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_invoiceNumber"),
                    "value": value.InvoiceNumber
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_amount"),
                    "value": value.DocumentAmount + " " + value.DocumentCurrency
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_date"),
                    "value": moment(value.DocumentDate, "YYYYMMDD").format("MM/DD/YYYY")
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_vendorId"),
                    "value": value.VendorNumber
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_vendorName"),
                    "value": value.Name1
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_ezSuiteSoc"),
                    "value": additionalInfo.ezSuiteCode
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_iolMailCode"),
                    "value": additionalInfo.mailCode
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_siemensBillToName"),
                    "value": additionalInfo.companyName
                  }
                ]
              }
            ]
          }
        ],
        "actions": numberOfResults == 1
          ? []
          : [
            {
              "type": "Action.Submit",
              "title": LocalizationManager.getText(session, "showDetails"),
              "data": {
                "invoiceNumber": value.InvoiceNumber,
                "companyCode": value.CompanyCode,
                "sapSystem": value.System,
                "previousAmount": value.DocumentAmount,
                "previousDate": value.DocumentDate,
                "previousVendorNumber": value.VendorNumber
              }
            }
          ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.0"
      }
    };
  }

  public static generateResultsAdaptiveCardV2 = (value: IInvoiceData, numberOfResults: number, session: Session, dataSource: InvoiceDataSource) => {
    return {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        "type": "AdaptiveCard",
        "body": [
          {
            "type": "Container",
            "items": [
              {
                "type": "FactSet",
                "facts": [
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_invoiceNumber"),
                    "value": value.invoiceNumber
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_amount"),
                    "value": value.documentAmountAndCurrency
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_date"),
                    "value": value.formattedDocumentDate
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_vendorId"),
                    "value": value.vendorNumber
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_vendorName"),
                    "value": value.vendorName
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_ezSuiteSoc"),
                    "value": value.ezSuiteCode
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_iolMailCode"),
                    "value": value.mailCode
                  },
                  {
                    "title": LocalizationManager.getText(session, "adaptiveCardTitle_siemensBillToName"),
                    "value": value.companyName
                  }
                ]
              }
            ]
          }
        ],
        "actions": numberOfResults == 1
          ? []
          : [
            {
              "type": "Action.Submit",
              "title": LocalizationManager.getText(session, "showDetails"),
              "data": {
                "invoiceNumber": value.invoiceNumber,
                "companyCode": value.companyCode,
                "sapSystem": value.system,
                "previousAmount": value.documentAmount,
                "previousDate": value.documentDate,
                "previousVendorNumber": value.vendorNumber,
                "dataSource": dataSource
              }
            }
          ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.0"
      }
    };
  }

  private static generateSummary(session: Session, title: string): any {
    var invoiceNumber = session.conversationData.invoiceNumber;
    var amount = session.conversationData.invoiceCurrency
      ? session.conversationData.invoiceAmount + " " + session.conversationData.invoiceCurrency
      : session.conversationData.invoiceAmount;
    amount = amount ? amount : "";
    var date = session.conversationData.invoiceDate ? moment(session.conversationData.invoiceDate).format('L') : "";
    var poNumber = session.conversationData.poNumber;
    poNumber = poNumber ? poNumber : "";

    var tempHistoryData: Array<string> = [];
    tempHistoryData.push(title);
    tempHistoryData.push(`${session.gettext("adaptiveCardTitle_invoiceNumber")} ${invoiceNumber}`);
    tempHistoryData.push(`${session.gettext("adaptiveCardTitle_amount")} ${amount}`);
    tempHistoryData.push(`${session.gettext("adaptiveCardTitle_date")} ${date}`);
    tempHistoryData.push(`${session.gettext("adaptiveCardTitle_poNumber")} ${poNumber}`);

    var textTableForHistory = new TableColumnGenerator(tempHistoryData);
    SessionHelper.saveCustomMessageToHistory(session, textTableForHistory.getTableAsString());

    return {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": title,
          "wrap": true
        },
        {
          "type": "FactSet",
          "facts": [
            {
              "title": session.gettext("adaptiveCardTitle_invoiceNumber"),
              "value": invoiceNumber
            },
            {
              "title": session.gettext("adaptiveCardTitle_amount"),
              "value": amount
            },
            {
              "title": session.gettext("adaptiveCardTitle_date"),
              "value": date
            },
            {
              "title": session.gettext("adaptiveCardTitle_poNumber"),
              "value": poNumber
            }
          ]
        }
      ]
    };
  }
}