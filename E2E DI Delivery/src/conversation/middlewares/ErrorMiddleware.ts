import { Middleware, TurnContext, ActivityTypes, StatePropertyAccessor } from "botbuilder";


export class ErrorMiddleware implements Middleware {

    constructor() { };

    public onTurn = async (context: TurnContext, next: () => Promise<void>): Promise<void> => {
        await context.sendActivity("Sorry, the chat is currently not available. We apologize for any inconvenience.")
    }
}