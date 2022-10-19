# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## unreleased
### Added
### Changed
### Fixed

## 1.3.2 - 2019-10-05
### Fixed
- requests to HANA were optimalized for better performance after upgrade to HANA 2.0

## 1.3.1 - 2019-09-17
### Added
- Changed rules for D35 Cancelled and Paid Orbian
- New mexican company codes addded (except: 542E, 5564,5600 (554H))
- Survey monkey feedback gathering
- Check Number information on check paid invoices
### Changed
### Fixed

## 1.3.0 - 2019-06-24
### Added
- french support
### Changed
- Paid - Orbian and systems D35,PTC removed condition for filled ClearingDocument
- Payment held due to Management direction(Default(OPP) rule and PS1 rule) - added new condition ClearingDocument has to be empty
- Payment held awaiting IRS W9 or W8 and payment held due to Management direction for PS - added new condition ClearingDocument has to be empty
- Paid - EFT payment added rule PaymentMethod equals LU
- Paid - check payment (PTC system) added rule for PaymentMethod to be equals "C" or "S"
### Fixed
- rule for Cancelled status and PTC system

## 1.2.0 - 2019-06-17
### Added
- Ez Suite Integration support
### Changed
- cache added for Watson API 
- invoice number max lenght 22

## 1.1.1 - 2019-06-05
### Changed
- change of texting for awaiting payment status

## 1.1.0 - 2019-04-30
### Added
- QnA functionality
### Changed
- decrease of confidence for QnA to 50%
### Fixed
- Bot Messages of Prompts were saving twice to KPIs

## 1.0.11 - 2019-04-04
### Changed
- rules update 15 series added to cancelled and PAID EFT statuses
### Fixed
- status cancelled is correctly recognized by chatbot

## 1.0.10 - 2019-04-01
### Changed
- watson entity invoice number, second regex changed to (?i)invoice(?:\s+status)?(?:\s+for)?\s+(?:#)?\s*(\d[\d\w]{0,15}|\w{1,15}\d[\d\w]{0,14})\b
- watson library update
### Fixed
- no longer possible to search without any parameters filled
- spelling status unknown
- prevent saving text to amount value
- validation message for amount added

## 1.0.9 - 2019-03-13
### Fixed
- rules manager PS1 - Paid EFT rule fixed
- rules manager Payment held awaiting IRS W9 or W8 and payment held due to Management direction for E1P system. Removed condition for checking PaymentBlock_DocLevel = Z
### Changed
- adaptive cards connected to localization library
- goodbye message connected to localization library

## 1.0.8 - 2019-02-28
### Fixed
- rules manager P40, P41 and Paid - Check Payment and Paid - EFT payment

## 1.0.7 - 2019-02-28
### Fixed
- Comma as thousand separator is not supported by hana. Comma signs are removed from amount

## 1.0.6 - 2019-02-27
### Added
- KPI

## 1.0.5 - 2019-02-21
### Changed
- wording of greeting message

## 1.0.4 - 2019-02-19
### Added
- Healthcheck functionality for scenario 3, 4, 5, 6 (Zendesk related)
### Changed
- Treshold for Help dialogs added to configuraiton file
### Fixed
- Conversation History for outgoing messages
- Ticket text includes chatbot user email

## 1.0.3 - 2019-02-18
### Fixed
-	System PD2 – Status Paid EFT - condition for the clearing document number changed instead of 3xxxxxxxxx we are checking now 4xxxxxxxxx
-	Added conditions for system PT2

## 1.0.2 - 2019-02-12
### Added
- Healthcheck functionality for scenario 0, 1, 2 (Watson, HANA Datalake related)
- Configuration file
### Fixed
- chatbot texting

## 1.0.1 - 2019-02-07
### Fixed
- Fix of currency and date conflict when gathering paramters

## 1.0.0 - 2019-02-04
### Initial Version