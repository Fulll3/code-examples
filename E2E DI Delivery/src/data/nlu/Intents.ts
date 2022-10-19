/** Restart interruption */
export const BOT_CONTROL_CHANGE_SUBJECT = "Bot_Control_Change_Subject";
export const BOT_CONTROL_START_OVER = "Bot_Control_Start_Over";

/** Help interruption */
export const GENERAL_AGENT_CAPABILITIES = "General_Agent_Capabilities";
export const HELP = "Help";

/** Simple answers */
export const BOT_CONTROL_APPROVE_RESPONSE = "Bot_Control_Approve_Response";
export const BOT_CONTROL_REJECT_RESPONSE = "Bot_Control_Reject_Response";


export enum intent  {
  removing_block = "removing_block",
  putting_block = "putting_block",
  post_invoice = "post_invoice",
  other_question = "Other_question",
  change_due_date = "Change_Due_Date",
  invoice_status = "Invoice_status",
  greetings = "General_Greetings",
  help = "General_Agent_Capabilities"
}