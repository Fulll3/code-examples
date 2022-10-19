// tslint:disable: object-literal-key-quotes
import {
  AdaptiveCard,
  CardElement,
  Column,
  ColumnSet,
  Container,
  ContainerStyle,
  HostConfig,
  TextBlock,
  TextColor,
  Version,
} from "adaptivecards";
import { TextWeight, HorizontalAlignment } from "adaptivecards";
import { ITextBlockOptions } from "./interfaces/ITextBlockOptions";
import {
  CardFactory,
  MessageFactory,
  TurnContext
} from "botbuilder";
import { DialogTurnResult, WaterfallStepContext } from "botbuilder-dialogs";
import { DeliveryDocumentType } from "../domain/values/DeliveryDocumentType";
import {
  DeliveryDocument,
  DeliveryStatus,
} from "../domain/values/DeliveryDocument";
import { LocalizedMessages } from "./LocalizedMessages";
import { StatusMessages } from "../domain/values/StatusMessages";

import { IMilestone } from "../data/hana/IMilestone";
import { HeroCardHelper } from "./dialogs/helpers/HeroCardHelper";
import { PromptNames } from "./values/PromptNames";
import { ItemSearchDialog } from "./dialogs/ItemSearchDialog";
import { Activity, ActivityTypes } from "botbuilder-schema";
import { writeFileSync } from "fs";
import { Runtime } from "../Runtime";
import { Logger } from "botanica";
import * as fs from "fs";
import * as path from "path";
import { OverviewTable } from "./OverviewTable";
import { DialogUtil } from "./dialogs/helpers/DialogUtil";



export class AdaptiveCards {
  private localizedMessages: LocalizedMessages;
  private logger: Logger;
  constructor() {
    this.localizedMessages = new LocalizedMessages(AdaptiveCards.name);
    this.logger = new Logger(AdaptiveCards.name);
  }

  public showSingleResult = async (
    step: WaterfallStepContext,
    document: DeliveryDocument,
    referenceNumber: string,
    referenceType: DeliveryDocumentType
  ): Promise<void> => {
    let isMsTeams = false;
    let adaptiveJSON;
    adaptiveJSON = this.getStatusAdaptiveCard(
      step.context,
      document,
      referenceNumber,
      referenceType
    );
    const attachment = CardFactory.adaptiveCard(adaptiveJSON);
    this.logger.info(`SENDING ADAPTIVE`);
    const response = MessageFactory.attachment(attachment);
    await step.context.sendActivity(response);
  };

  public static generateDownloadOverviewCard = (url: string) => {
    const cardJSON = {
      "type": "AdaptiveCard",
      "actions": [
        {
          "type": "Action.OpenUrl",
          "title": "Download overview",
          "url": url
        }
      ],
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
      "version": "1.2"
    }
    const attachment = CardFactory.adaptiveCard(cardJSON);
    const activity = MessageFactory.attachment(attachment);
    return activity;
  }
  public sendOverviewTable = async (
    step: WaterfallStepContext,
    documents: DeliveryDocument[],
    referenceNumber: string,
    referenceType: DeliveryDocumentType
  ): Promise<void> => {
    let includeSalesOrderColumnInOverview = false;
    if (referenceType === DeliveryDocumentType.customerPo) { includeSalesOrderColumnInOverview = true }
    const overviewTable = OverviewTable.createItemsOverviewTable(step.context,documents, this.localizedMessages, includeSalesOrderColumnInOverview, step.context.activity.channelId);
    await step.context.sendActivity(overviewTable);
  };



  public getStatusAdaptiveCard = (
    turnContext: TurnContext,
    document: DeliveryDocument,
    referenceNumber: string,
    referenceType: DeliveryDocumentType
  ): any => {
    try {
      const salesOrderAndItemNo = this.getSalesOrderAndItemNoBlock(turnContext, document, referenceType);
      const referenceNo = this.generateReferenceBlock(turnContext,DialogUtil.getInstance().getlocalizedMessageByDocumentType(turnContext,referenceType), document);
      const lastConfirmedDate = this.generateLastConfirmedDate(turnContext,document);
      const originCountry = document.getOrderProcessingCountry();
      const originCity = document.getOrderProcessingCity();
      const destinationCountry = document.getUltimateConsigneeCountry();
      const destinationCity = document.getUltimateConsigneeCity();

      const currentStatus = this.generateCurrentStatus(document);
      const orderHistoryFirstColumn = this.generateOrderHistoryFirstColumn(
        turnContext,
        document,
        referenceType
      );
      const orderHistoryThirdColumn = this.generateOrderHistoryThirdColumn(
        turnContext,
        document,
        referenceType
      );
      const adaptiveCard = {
        type: "AdaptiveCard",
        version: "1.3",
        msteams: {
          width: "Full",
        },
        body: [
          {
            type: "ColumnSet",
            columns: [
              {
                type: "Column",
                width: "stretch",
                items: [
                  {
                    type: "Image",
                    url: "https://logos-download.com/wp-content/uploads/2016/02/Siemens-logo-transparent-png.png",
                    spacing: "Medium",
                    separator: true,
                    selectAction: {
                      type: "Action.ToggleVisibility",
                    },
                    width: "120px",
                    horizontalAlignment: "Center",
                  },
                ],
              },
              {
                type: "Column",
                width: "stretch",
                items: [
                  {
                    type: "ColumnSet",
                    columns: [
                      {
                        type: "Column",
                        width: "stretch",
                        items: [salesOrderAndItemNo, referenceNo],
                      }
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "Container",
            items: [
              {
                type: "ColumnSet",
                columns: [
                  {
                    type: "Column",
                    width: "stretch",
                    items: [currentStatus],
                  },
                  {
                    type: "Column",
                    width: "stretch",
                    items: [lastConfirmedDate],
                  }
                ],
              }
            ],
            spacing: "Medium",
            height: "stretch",
            separator: true,
          },
          {
            type: "Container",
            items: [
              orderHistoryFirstColumn.length === 1 ||
                orderHistoryThirdColumn.length === 1
                ? {
                  type: "TextBlock",
                  text: this.localizedMessages.getTranslation(turnContext,"noMilestones"),
                }
                : {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "285px",
                      items: orderHistoryFirstColumn,
                      verticalContentAlignment: "Center",
                    },
                    {
                      type: "Column",
                      width: "stretch",
                      items: orderHistoryThirdColumn,
                      horizontalAlignment: "Right",
                    },
                  ],
                  spacing: "Large",
                },
            ],
            spacing: "Large",
            width: "stretch",
            selectAction: {
              type: "Action.ToggleVisibility",
              targetElements: [],
            },
            id: "adaptiveCard_history_view",
            isVisible: true,
            style: "emphasis",
          },
          {
            type: "Container",
            items: [
              {
                type: "ColumnSet",
                columns: [
                  {
                    type: "Column",
                    width: "stretch",
                    items: [
                      {
                        type: "TextBlock",
                        text: this.localizedMessages.getTranslation(turnContext,"origin"),
                        weight: "Bolder",
                        horizontalAlignment: "Center",
                      },
                      {
                        type: "TextBlock",
                        text: originCountry,
                        horizontalAlignment: "Center",
                      },
                      {
                        type: "TextBlock",
                        text: `(${originCity})`,
                        horizontalAlignment: "Center",
                      },
                    ],
                  },
                  {
                    type: "Column",
                    width: "70px",
                    items: [
                      {
                        type: "Image",
                        url: "https://snipstock.com/assets/cdn/png/ac7e36d0c342b2d6239843cfd1693788.png",
                        spacing: "Small",
                        selectAction: {
                          type: "Action.ToggleVisibility",
                        },
                      },
                    ],
                  },
                  {
                    type: "Column",
                    width: "stretch",
                    items: [
                      {
                        type: "TextBlock",
                        text: this.localizedMessages.getTranslation(turnContext,"destination"),
                        horizontalAlignment: "Center",
                        weight: "Bolder",
                      },
                      {
                        type: "TextBlock",
                        text: destinationCountry,
                        horizontalAlignment: "Center",
                      },
                      {
                        type: "TextBlock",
                        text: `(${destinationCity})`,
                        horizontalAlignment: "Center",
                      },
                    ],
                  },
                ],
              },
            ],
            id: "location_view",
            isVisible: true,
          },
        ],
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        id: "Result Display",
        minHeight: "0px",
        actions: [
          {
            type: "Action.ShowCard",
            title: this.localizedMessages.getTranslation(turnContext,"showAdditionalDetails"),
            card: {
              type: "AdaptiveCard",
              body: [
                {
                  type: "Container",
                  items: [
                    {
                      type: "ColumnSet",
                      columns: [
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              wrap: true,
                              text: this.localizedMessages.getTranslation(turnContext,"customerRequestedDate"),
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"firstConfirmedDeliveryDate"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"lastConfirmedDeliveryDate"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"MLFB"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"shippingLocation"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"AWB"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"lastMilestone"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"carrier"),
                              wrap: true,
                            },
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"carrierTracking"),
                              wrap: true,
                            },
                          ],
                        },
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              text: document.getCustomerRequestedDate(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getFCDD(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getLCDD(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getMLFB(),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getShippingLocation(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getAWB(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getLatestMileston(),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getCarrier(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                            {
                              type: "TextBlock",
                              text: document.getCarrierTracking(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                          ],
                        },
                      ],
                      separator: true,
                    },
                    {
                      type: "ColumnSet",
                      columns: [
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"buyer"),
                              wrap: true,
                            },
                          ],
                        },
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              text: document.getBuyer(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "ColumnSet",
                      columns: [
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              text: this.localizedMessages.getTranslation(turnContext,"ucr"),
                              wrap: true,
                            },
                          ],
                        },
                        {
                          type: "Column",
                          width: "stretch",
                          items: [
                            {
                              type: "TextBlock",
                              text: document.getUCR(turnContext),
                              wrap: true,
                              horizontalAlignment: "Right",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  isVisible: true,
                  id: "additonalDetails",
                  style: "emphasis",
                },
              ],
            },
          },
        ],
      };
      return adaptiveCard;
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  private generateLastConfirmedDate = (turnContext: TurnContext, document: DeliveryDocument): any => {
    const status = document.getStatus();
    const lastConfirmedDate = document.formatDate(
      document.getLastConfirmedDeliveryDate(),
      true
    );
    if (status === DeliveryStatus.orderComplete) {
      return this.generateFullfilledBlock(turnContext,lastConfirmedDate);
    } else {
      if (document.getLastConfirmedDeliveryDate() == null) {
        return this.generateEmptyBlock();
      }

      return this.generateTextBlock({
        Text: this.localizedMessages.getTranslation(turnContext,"schedule", [
          lastConfirmedDate.toString(),
        ]),
        HorizontalAlignment: HorizontalAlignment.Center,
        Weight: TextWeight.Bolder,
      });
    }
  };




  private generateEmptyBlock(): any {
    return this.generateTextBlock({
      Text: "   ",
    });
  }
  private generateFullfilledBlock(turnContext: TurnContext, lastConfirmedDate: string): any {
    return this.generateTextBlock({
      Text: this.localizedMessages.getTranslation(turnContext,"delivered", [
        lastConfirmedDate.toString(),
      ]),
      HorizontalAlignment: HorizontalAlignment.Center,
      Weight: TextWeight.Bolder,
    });
  }
  private getSalesOrderAndItemNoBlock(
    turnContext: TurnContext,
    hanaResult: DeliveryDocument,
    type: DeliveryDocumentType
  ) {
    switch (type) {
      case DeliveryDocumentType.deliveryNoteNumber:
        return this.generateItemBlock(turnContext,
          `${hanaResult.getDeliveryNoteNo()} \\ ${hanaResult.getDeliveryNoteItem()}`
        );
      case DeliveryDocumentType.purchaseOrderNumber:
        return this.generateItemBlock(turnContext,
          `${hanaResult.getPurchaseOrderNo()} \\ ${hanaResult.getPurchaseOrderItem()}`
        );
      case DeliveryDocumentType.salesOrderNumber:
        return this.generateItemBlock(turnContext,
          `${hanaResult.getSalesOrderNo(turnContext)} \\ ${hanaResult.getSalesOrderItem()}`
        );
      case DeliveryDocumentType.customerPo:
        return this.generateItemBlock(turnContext,
          `${hanaResult.getSalesOrderNo(turnContext)} \\ ${hanaResult.getSalesOrderItem()}`
        );
      case DeliveryDocumentType.ucrNumber:
        return this.generateTextBlock({
          Text: hanaResult.getUCR(turnContext),
          HorizontalAlignment: HorizontalAlignment.Center,
          Weight: TextWeight.Bolder,
          Separator: true,
        });
      default:
        return this.generateItemBlock(turnContext,
          `${hanaResult.getDeliveryNoteNo()} \\ ${hanaResult.getDeliveryNoteItem()}`
        );
    }
  }
  private generateItemBlock = (turnContext:TurnContext, itemNumber: string) => {
    return this.generateTextBlock({
      Text: `${this.localizedMessages.getTranslation(turnContext,"salesOrderNumber")}/${this.localizedMessages.getTranslation(turnContext,"itemNo")}: ${itemNumber}`,
      HorizontalAlignment: HorizontalAlignment.Center,
      Weight: TextWeight.Bolder,
      Separator: false,
    });
  };

  private generateReferenceBlock = (turnContext: TurnContext, documentTypeLocalized: string, hanaResult: DeliveryDocument) => {
    return this.generateTextBlock({
      Text: `${documentTypeLocalized}: ${hanaResult.getReferenceNumber(turnContext)}`,
      HorizontalAlignment: HorizontalAlignment.Center,
      Weight: TextWeight.Bolder,
      Separator: true,
    });
  };
  private generateCurrentStatus = (document: DeliveryDocument): any => {
    const status = document.getStatus();
    if (status === DeliveryStatus.orderComplete) {
      return this.generateStatusBlock(status, true);
    } else {
      return this.generateStatusBlock(status);
    }
  };
  private generateStatusBlock = (
    text: string,
    isOrderFulfilled: boolean = false
  ) => {
    let textColor = TextColor.Warning;
    if (isOrderFulfilled) {
      textColor = TextColor.Good;
    }
    return this.generateTextBlock({
      Text: text.toUpperCase(),
      HorizontalAlignment: HorizontalAlignment.Center,
      Color: textColor,
      Weight: TextWeight.Bolder,
    });
  };

  private generateOrderHistoryFirstColumn = (
    turnContext: TurnContext,
    document: DeliveryDocument,
    documentType: DeliveryDocumentType
  ): any[] => {
    const milestones = this.transformMilestones(
      documentType,
      document.getMilestones()
    );
    const textBlockArray: TextBlock[] = [
      this.generateTextBlock({
        Text: this.localizedMessages.getTranslation(turnContext,"history"),
        Weight: TextWeight.Bolder,
        HorizontalAlignment: HorizontalAlignment.Left,
      }),
    ];

    for (const milestone of milestones) {
      textBlockArray.push(
        this.generateTextBlock({
          Text: milestone.message,
          Separator: true,
          HorizontalAlignment: HorizontalAlignment.Left,
        })
      );
    }
    return textBlockArray;
  };

  private generateOrderHistoryThirdColumn = (
    turnContext: TurnContext,
    document: DeliveryDocument,
    documentType: DeliveryDocumentType
  ): any[] => {
    const milestones = this.transformMilestones(
      documentType,
      document.getMilestones()
    );
    const textBlockArray: TextBlock[] = [
      this.generateTextBlock({
        Text: this.localizedMessages.getTranslation(turnContext,"milestone"),
        Weight: TextWeight.Bolder,
        HorizontalAlignment: HorizontalAlignment.Right,
      }),
    ];
    for (const milestone of milestones) {
      textBlockArray.push(
        this.generateTextBlock({
          Text:
            typeof milestone.date.getMonth === "function"
              ? document.formatDate(milestone.date, true)
              : milestone.date + "",
          Separator: true,
          HorizontalAlignment: HorizontalAlignment.Right,
        })
      );
    }
    return textBlockArray;
  };
  private transformMilestones(
    documentType: DeliveryDocumentType,
    milestones: IMilestone[]
  ) {
    if (documentType === DeliveryDocumentType.ucrNumber) {
      const intitiationIndex = milestones.findIndex(
        (elem) => elem.note === "MST_L290"
      );
      milestones = milestones.slice(intitiationIndex, milestones.length);
    }
    return milestones;
  }



  private generateTextBlock(
    options: ITextBlockOptions,
    emptyIfNull?: boolean
  ): any {
    if (emptyIfNull) {
      if (options.Text == null) {
        return "";
      }
    }
    const textBlock = new TextBlock();
    textBlock.text = options.Text;
    if (options.Size != null) {
      textBlock.size = options.Size;
    }
    if (options.Weight != null) {
      textBlock.weight = options.Weight;
    }
    if (options.HorizontalAlignment != null) {
      textBlock.horizontalAlignment = options.HorizontalAlignment;
    }
    if (options.Color != null) {
      textBlock.color = options.Color;
    }
    if (options.Separator != null) {
      textBlock.separator = options.Separator;
    }

    return textBlock.toJSON();
  }
}
