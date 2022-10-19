const adaptiveCardTeams = {
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.0",
  "body": [
      {
          "type": "ColumnSet",
          "columns": [
              {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                      {
                          "type": "Container",
                          "items": [
                              {
                                  "type": "Image",
                                  "url": "https://new.siemens.com/etc.clientlibs/siemens-sites/components/content/header/clientlibs/resources/logo/siemens-logo-default.svg",
                                  "size": "Large"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                      {
                          "type": "Container",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "SIRL12029418942",
                                  "wrap": true,
                                  "weight": "Bolder",
                                  "horizontalAlignment": "Center"
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "ColumnSet",
                  "columns": [
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "ORDER COMPLETE",
                                  "wrap": true,
                                  "color": "Good",
                                  "weight": "Bolder"
                              }
                          ]
                      },
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "Delivered on: 26.10.2021",
                                  "wrap": true,
                                  "weight": "Bolder"
                              }
                          ]
                      }
                  ],
                  "horizontalAlignment": "Center"
              }
          ],
          "spacing": "Medium"
      },
      {
          "type": "Container",
          "items": [
              {
                  "type": "ColumnSet",
                  "columns": [
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "History",
                                  "wrap": true,
                                  "weight": "Bolder"
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "TestMilestone",
                                  "wrap": true
                              }
                          ]
                      },
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "Milestone",
                                  "wrap": true,
                                  "weight": "Bolder",
                                  "horizontalAlignment": "Right"
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "1.1.2019",
                                  "wrap": true,
                                  "horizontalAlignment": "Right"
                              }
                          ]
                      }
                  ]
              }
          ],
          "horizontalAlignment": "Left",
          "style": "emphasis"
      },
      {
          "type": "Container",
          "spacing": "Large",
          "items": [
              {
                  "type": "ColumnSet",
                  "columns": [
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "Origin",
                                  "wrap": true,
                                  "weight": "Bolder"
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "Nuernberg",
                                  "wrap": true
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "(Nuernberg)",
                                  "wrap": true
                              }
                          ]
                      },
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "Image",
                                  "url": "https://snipstock.com/assets/cdn/png/ac7e36d0c342b2d6239843cfd1693788.png",
                                  "size": "Medium",
                                  "horizontalAlignment": "Center"
                              }
                          ]
                      },
                      {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "Destination",
                                  "wrap": true,
                                  "weight": "Bolder"
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "Nuernberg",
                                  "wrap": true
                              },
                              {
                                  "type": "TextBlock",
                                  "text": "(Nuernberg)",
                                  "wrap": true
                              }
                          ]
                      }
                  ]
              }
          ],
          "horizontalAlignment": "Center"
      }
  ]
}