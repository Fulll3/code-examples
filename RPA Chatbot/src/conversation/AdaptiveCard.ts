import { Action, ActionSet, AdaptiveCard, CardElement, CardElementContainer, Column, ColumnSet, Container, ContainerStyle, HorizontalAlignment, ShowCardAction, SizeAndUnit, SizeUnit, SubmitAction, TextBlock, TextSize, TextWeight, ToggleVisibilityAction, Version } from "adaptivecards"
import { EvaluationContext, Template } from "adaptivecards-templating";
import { CardFactory, MessageFactory, TurnContext, Activity, ActivityFactory } from "botbuilder";
import { ListStyle } from "botbuilder-dialogs";
import { Attachment, AttachmentLayoutTypes } from "botframework-schema";
import * as fs from "fs";
import * as path from "path";
import { Schedule } from "../domain/schedules/values/Schedule";
import { ProcessStatisticsDetails } from "../domain/splunk/SplunkSimple";
import { ProcessRun, ProcessStatus } from "../domain/splunk/values/ProcessRun";
import { AdaptiveCardTitle } from "./values/AdaptiveCardTitle";
import { CardName } from "./values/CardName";

type CardDataProperty = {
  key: string,
  value: string
}
type ScheduleCardData = {
  title: string;
  properties: CardDataProperty[]
}

type AdaptiveCardDataProperty = {
  key: string;
  value: string;
}
type ColumnSetStylingOptions = {
  textWeight?: TextWeight;
  separator?: boolean;
  style?: any;
  horizonalAligment?: HorizontalAlignment;
  weightedColumnWidths?: number[]
}
export class AdaptiveCardCustom {

  public static sendCard = async (context: TurnContext, cardName: CardName, title: string, data: any[]) => {
    const cards = AdaptiveCardCustom.getCards(cardName, data);
    const cardsBulked: any[][] = [];
    const MAX_COUNT_OF_ADAPTIVE_CARDS_IN_MESSAGE = 10;
    for (let i = 0; i < cards.length; i += MAX_COUNT_OF_ADAPTIVE_CARDS_IN_MESSAGE) {
      const chunk = cards.slice(i, i + MAX_COUNT_OF_ADAPTIVE_CARDS_IN_MESSAGE);
      cardsBulked.push(chunk);
    }
    let isFirstBulk = true;
    for (const cardBulk of cardsBulked) {
      const adaptiveCardTitle = isFirstBulk ? title : "";
      const activity = AdaptiveCardCustom.createActivityFromCards(cardBulk, adaptiveCardTitle);
      await context.sendActivity(activity);
      isFirstBulk = false;
    }
  }
  public static sendTestingCard = async (context: TurnContext, cardName: CardName, title: AdaptiveCardTitle) => {
    const cards = AdaptiveCardCustom.loadAdaptiveCardFile(cardName, AdaptiveCardsFolder.testing);
    const activity = AdaptiveCardCustom.createActivityFromCards(cards, title);
    await context.sendActivity(activity);

  }

  public static sendUsecaseHistoryCard = async (context: TurnContext, processRuns: ProcessRun[]) => {

    const card = new AdaptiveCard();
    card.version = new Version(1, 2);
    const headingContainer = new Container();
    const headers = ["process name", "status", "started", "finished", "robot"];
    const weightedColumnWidths = [100, 45, 50, 50, 25];
    const headingColumnSet = AdaptiveCardCustom.generateColumnSet(headers, { textWeight: TextWeight.Bolder, style: ContainerStyle.Emphasis, weightedColumnWidths });
    headingContainer.addItem(headingColumnSet);
    card.addItem(headingContainer);
    const visibleContainer = AdaptiveCardCustom.createRunHistoryDetails(processRuns, weightedColumnWidths);
    card.addItem(visibleContainer);
    await fs.writeFileSync(path.join(__dirname, "../../resources/ProcessHistoryAdaptiveCard.json"), JSON.stringify(card), 'utf-8');
    const activity = AdaptiveCardCustom.createActivityFromSingleCard(card, "You can find results below");
    await context.sendActivity(activity);
  }

  public static sendUsecaseStatisticsCard = async (context: TurnContext, processStatistics: Map<string, ProcessStatisticsDetails[]>) => {
    const cards: any[] = [];
    processStatistics.forEach((value, key, map) => {
      const containerTitle = new Container()
      const title = AdaptiveCardCustom.getMonthTitle(key);
      containerTitle.addItem(title)
      const containerContent = new Container();
      const weightedColumnWidths = [60, 20, 20];
      const headers = ["process name", "number of executions", " Total run time in hours"];
      const headingColumnSet = AdaptiveCardCustom.generateColumnSet(headers, { textWeight: TextWeight.Bolder, weightedColumnWidths, style: ContainerStyle.Emphasis });
      containerContent.addItem(headingColumnSet);
      let executionsSum = 0;
      let runtimeSum = 0;
      value.forEach((columnSetData) => {
        const duration = Number(columnSetData.duration).toFixed(0)
        runtimeSum += Number(duration);
        executionsSum += Number(columnSetData.number_of_executions);
        const columnData = [columnSetData.process, columnSetData.number_of_executions, duration];
        const columnSet = AdaptiveCardCustom.generateColumnSet(columnData, { separator: true, style: ContainerStyle.Emphasis, weightedColumnWidths });
        containerContent.addItem(columnSet)
      })
      const columnSetTotalSum = AdaptiveCardCustom.generateColumnSet(["Total SUM", executionsSum.toString(), runtimeSum.toString()], { textWeight: TextWeight.Bolder,weightedColumnWidths });
      columnSetTotalSum.style = ContainerStyle.Emphasis;
      containerContent.addItem(columnSetTotalSum);
      const card = new AdaptiveCard();
      card.version = new Version(1, 0)
      card.addItem(containerTitle);
      card.addItem(containerContent);
      cards.push(card.toJSON());
    })
    await fs.writeFileSync(path.join(__dirname, "../../resources/ProcessStatisticsAdaptiveCard.json"), JSON.stringify(cards[0]), 'utf-8');
    const activity = AdaptiveCardCustom.createActivityFromCards(cards, "You can find results below");
    await context.sendActivity(activity);
  }
  private static getContainerStyleBasedOnProcessStatus = (process: ProcessRun) => {
    let containerStyle: ContainerStyle;
    switch (process.getStatus()) {
      case ProcessStatus.completed:
        containerStyle = ContainerStyle.Good
        break;
      case ProcessStatus.running:
        containerStyle = ContainerStyle.Accent
        break;
      case ProcessStatus.terminated:
        containerStyle = ContainerStyle.Attention;
        break;
      default:
        containerStyle = ContainerStyle.Emphasis;
        break;
    }
    return containerStyle
  }
  private static generateColumnSet = (textArray: string[], styleOptions: ColumnSetStylingOptions = {}): ColumnSet => {
    const columnSet = new ColumnSet()
    columnSet.horizontalAlignment = styleOptions.horizonalAligment ? styleOptions.horizonalAligment : HorizontalAlignment.Left;
    textArray.forEach((text, index) => {
      const column = new Column();
      const textBlock = new TextBlock(text);
      textBlock.weight = styleOptions && styleOptions.textWeight ? styleOptions.textWeight : TextWeight.Default;
      textBlock.wrap = true;
      if (styleOptions.weightedColumnWidths && styleOptions.weightedColumnWidths[index]) {
        column.width = new SizeAndUnit(styleOptions.weightedColumnWidths[index], SizeUnit.Weight)
      }

      column.separator = styleOptions && styleOptions.separator ? styleOptions.separator : false;
      column.addItem(textBlock)
      columnSet.addColumn(column)
    })
    columnSet.style = styleOptions && styleOptions.style ? styleOptions.style : ContainerStyle.Default;
    return columnSet;
  }

  private static getCards = (cardName: CardName, allData: any[]) => {
    const cards: any[] = [];
    const payload = AdaptiveCardCustom.loadAdaptiveCardFile(cardName, AdaptiveCardsFolder.payload);
    for (const data of allData) {
      const card = AdaptiveCardCustom.templateCard(payload, data);
      cards.push(card);
    }
    return cards;
  }
  private static generateFinishedTimeProperty = (process: ProcessRun): AdaptiveCardDataProperty => {
    const status = process.getStatus();
    let property: AdaptiveCardDataProperty = {
      key: "",
      value: ""
    }
    switch (status) {
      case ProcessStatus.completed:
        property.key = "Completed at";
        property.value = process.getFinishedAt();
        break;
      case ProcessStatus.terminated:
        property.key = "Terminated at";
        property.value = process.getFinishedAt();
        break;
      default:
        property.key = "Completed at";
        property.value = "Process is still running";
        break;
    }
    return property;
  }
  public static buildRunDetailsData = (processRuns: ProcessRun[]) => {
    const data = [];
    processRuns.forEach((process) => {
      const adaptiveCardData = {
        title: `Run details of ${process.getUseCase()}`,
        properties: [
          {
            "key": "Started at",
            "value": process.getStarted()
          },
          AdaptiveCardCustom.generateFinishedTimeProperty(process),
          {
            "key": "Use Case",
            "value": process.getUseCase()
          },
          {
            "key": "Robot",
            "value": process.getRobotNumber()
          },
          {
            "key": "Process",
            "value": process.getProcessName()
          },
          {
            "key": "Status",
            "value": process.getStatus()
          }
        ]
      }
      data.push(adaptiveCardData);
    })
    return data;
  }


  public static loadAdaptiveCardFile = (name: string, folder: AdaptiveCardsFolder): any => {
    const slash = path.sep;
    let file: string;
    file = path.join(__dirname, `..${slash}..${slash}resources${slash}adaptiveCards${slash}${folder}${slash}${name}.json`);
    const fileContents = JSON.parse(fs.readFileSync(file).toString());
    return fileContents
  }

  public static generateScheduleCardData = (schedules: Schedule[]) => {
    const cardData: ScheduleCardData[] = [];
    schedules.forEach((schedule) => {
      cardData.push({
        title: schedule.getScheduleName(),
        properties: AdaptiveCardCustom.createScheduleCardProperties(schedule)
      })
    })
    return cardData;
  }

  private static createScheduleCardProperties = (schedule: Schedule) => {
    const properties = [
      {
        "key": "Robot name",
        "value": schedule.getRobot()
      },
      {
        "key": "Retired",
        "value": schedule.getScheduleRetiredText()
      },
      {
        "key": "Frequency",
        "value": schedule.getFrequency()
      },
      {
        "key": "Calendar name",
        "value": schedule.getCalendarName()
      },
      {
        "key": "Start time",
        "value": `${schedule.getStartTime(false)} CET`
      },
      {
        "key": "End time",
        "value": schedule.getStopAfterTime()
      }
    ]
    if (schedule.isMonthlySchedule()) {
      properties.push(AdaptiveCardCustom.createNextRunDateProperty(schedule))
    }
    return properties;
  }

  private static createNextRunDateProperty = (schedule: Schedule) => {
    return {
      "key": "Next run date",
      "value": schedule.getMonthlyStartDateAsString()
    }
  }

  private static getMonthTitle(key: string) {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    const month = new Date(key);
    const title = new TextBlock(month.toLocaleString('en-GB', options));
    title.horizontalAlignment = HorizontalAlignment.Center;
    title.size = TextSize.Medium;
    title.weight = TextWeight.Bolder;
    return title;
  }

  private static createToggleVisibilityActionSet(title:string, targetId: string ) {
    const toggleVisibility = new ToggleVisibilityAction();
    toggleVisibility.addTargetElement(targetId, true);
    toggleVisibility.title = title;
    const actionSet = new ActionSet();
    actionSet.addAction(toggleVisibility);
    return actionSet;
  }

  private static createRunHistoryDetails(processRuns: ProcessRun[], weightedColumnWidths: number[], isVisible = true, id?: string ) {
    const container = new Container();
    container.isVisible = isVisible;
    if(id) container.id = id
    processRuns.forEach((process) => {
      const columnData = [process.getProcessName(), process.getStatus(), process.getStarted(), process.getFinishedAt(), process.getRobotNumber()];
      const style = AdaptiveCardCustom.getContainerStyleBasedOnProcessStatus(process);
      const columnSet = AdaptiveCardCustom.generateColumnSet(columnData, { separator: true, style, weightedColumnWidths });
      container.addItem(columnSet);
    });
    return container;
  }

  private static createActivityFromCards(cards: any[], title: string) {
    const attachments: Attachment[] = [];
    for (const card of cards) {
      const attachment = CardFactory.adaptiveCard(card);
      attachments.push(attachment);
    }
    const activity = AdaptiveCardCustom.createActivity(attachments, title, true);
    return activity;
  }

  private static createActivityFromSingleCard(card: AdaptiveCard, title: string) {
    const cardJson = card.toJSON()
    cardJson.msTeams = {
      "width": "full"
    }
    const cardContent = CardFactory.adaptiveCard(cardJson)
    const attachments: Attachment[] = [cardContent];
    const activity = AdaptiveCardCustom.createActivity(attachments, title, false);
    return activity;
  }
  private static generateSubmitActionSet = (text: string) => {
    const actionSet = new ActionSet();
    const action = new SubmitAction()
    action.title = text;
    action.data = {
      "msteams": {
        "type": "imBack",
        "value": text
      }
    }
    actionSet.addAction(action);
    return actionSet;
  }

  public static getActionCardAsActivity = (title: string, choices: string[]) => {
    const adaptiveCard = new AdaptiveCard();
    adaptiveCard.version = new Version(1, 2);
    const titleTextBlock = new TextBlock(title);
    adaptiveCard.addItem(titleTextBlock);
    choices.forEach((choice) => adaptiveCard.addItem(AdaptiveCardCustom.generateSubmitActionSet(choice)));
    return AdaptiveCardCustom.createActivityFromSingleCard(adaptiveCard, "")

  }
  private static createActivity(attachments: Attachment[], title: string, multipleCards: boolean) {
    const activity = ActivityFactory.fromObject(title);
    activity.attachments = attachments;
    activity.attachmentLayout = multipleCards ? AttachmentLayoutTypes.Carousel : AttachmentLayoutTypes.List;
    return activity;
  }

  private static templateCard(payload: any, data: any) {
    const adaptiveCard = new AdaptiveCard();
    const template = new Template(payload);
    const context = new EvaluationContext();
    context.$root = data;
    const card = template.expand(context);
    adaptiveCard.parse(card);
    return adaptiveCard;
  }
}
export enum AdaptiveCardsFolder {
  data = "data",
  payload = "payload",
  testing = "testingCards"
}
