/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Curation from "./curation";
import Order from "./order";
import Lead from "./lead";
import Response from "./response";
import Care from "./care";
import Survey from "./survey";
import GraphApi from "./graph-api";
import i18n from "../i18n.config";
import config from "./config";
import fs from "fs";
import path from "path";
import { ConversationChain } from "langchain/chains";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";
class Receive {
    constructor(user, webhookEvent, isUserRef) {
        // Load system prompt
        this.systemPromptPath = path.join(__dirname, "../prompts", "wanderlustie.txt");
        this.systemPrompt = fs.readFileSync(this.systemPromptPath, "utf-8");
        // Create LangChain PromptTemplate
        this.promptTemplate = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(this.systemPrompt),
            HumanMessagePromptTemplate.fromTemplate("Conversation so far: {chat_history}"),
            HumanMessagePromptTemplate.fromTemplate("User: {userInput}"),
        ]);
        this.chain = new ConversationChain({
            llm: Receive.llm,
            prompt: this.promptTemplate,
            memory: Receive.memory
        });
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.isUserRef = isUserRef;
    }
    handleMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            const event = this.webhookEvent;
            let responses;
            try {
                if (event.message) {
                    const message = event.message;
                    if (message.quick_reply) {
                        responses = this.handleQuickReply();
                    }
                    else if (message.attachments) {
                        responses = this.handleAttachmentMessage();
                    }
                    else if (message.text) {
                        responses = yield this.handleTextMessage();
                    }
                }
                else if (event.postback) {
                    responses = this.handlePostback();
                }
                else if (event.referral) {
                    responses = this.handleReferral();
                }
                else if (event.optin) {
                    responses = this.handleOptIn();
                }
                else if (event.pass_thread_control) {
                    responses = this.handlePassThreadControlHandover();
                }
            }
            catch (error) {
                console.error(error);
                responses = {
                    text: `An error has occurred: '${error}'. We have been notified and will fix the issue shortly!`,
                };
            }
            if (Array.isArray(responses)) {
                let delay = 0;
                for (const response of responses) {
                    this.sendMessage(response, delay * 2000, this.isUserRef);
                    delay++;
                }
            }
            else {
                this.sendMessage(responses, 0, this.isUserRef);
            }
        });
    }
    handlePrivateReply(type, id) {
        console.log(`Handling private reply for type: ${type}, id: ${id}`);
        // Add your logic for handling private replies here
    }
    handleTextMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            console.log("Received text:", `${(_a = this.webhookEvent.message) === null || _a === void 0 ? void 0 : _a.text} for ${this.user.psid}`);
            const event = this.webhookEvent;
            const message = ((_c = (_b = event.message) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) || "";
            try {
                // Call the LangChain ConversationChain with the user's input
                const response = yield this.chain.call({ userInput: message });
                // Log the conversation history for debugging
                console.log("User Input:", message);
                console.log("AI Response:", response.response.toString());
                console.log("Updated Memory:", Receive.memory.chatHistory); // Log the updated memorys
                const result = [
                    Response.genText(response.response.toString()),
                ];
                // Return the AI's response
                return result;
            }
            catch (error) {
                console.error("Error generating AI response:", error);
                return "Sorry, something went wrong.";
            }
        });
    }
    handleAttachmentMessage() {
        var _a, _b;
        const attachment = (_b = (_a = this.webhookEvent.message) === null || _a === void 0 ? void 0 : _a.attachments) === null || _b === void 0 ? void 0 : _b[0];
        console.log("Received attachment:", `${attachment} for ${this.user.psid}`);
        return Response.genQuickReply(i18n.__("fallback.attachment"), [
            {
                title: i18n.__("menu.help"),
                payload: "CARE_HELP",
            },
            {
                title: i18n.__("menu.start_over"),
                payload: "GET_STARTED",
            },
        ]);
    }
    handleQuickReply() {
        var _a, _b;
        const payload = ((_b = (_a = this.webhookEvent.message) === null || _a === void 0 ? void 0 : _a.quick_reply) === null || _b === void 0 ? void 0 : _b.payload) || "";
        return this.handlePayload(payload);
    }
    handlePostback() {
        var _a;
        const postback = this.webhookEvent.postback;
        let payload = "";
        if (((_a = postback === null || postback === void 0 ? void 0 : postback.referral) === null || _a === void 0 ? void 0 : _a.type) === "OPEN_THREAD") {
            payload = postback.referral.ref || "";
        }
        else if (postback === null || postback === void 0 ? void 0 : postback.payload) {
            payload = postback.payload;
        }
        if (payload.trim().length === 0) {
            console.log("Ignore postback with empty payload");
            return null;
        }
        return this.handlePayload(payload.toUpperCase());
    }
    handleReferral() {
        var _a, _b, _c;
        const type = (_a = this.webhookEvent.referral) === null || _a === void 0 ? void 0 : _a.type;
        if (type === "LEAD_COMPLETE" || type === "LEAD_INCOMPLETE") {
            const lead = new Lead(this.user, this.webhookEvent);
            return lead.handleReferral(type);
        }
        if (type === "OPEN_THREAD") {
            const payload = ((_c = (_b = this.webhookEvent.referral) === null || _b === void 0 ? void 0 : _b.ref) === null || _c === void 0 ? void 0 : _c.toUpperCase()) || "";
            if (payload.trim().length === 0) {
                console.log("Ignore referral with empty payload");
                return null;
            }
            return this.handlePayload(payload);
        }
        console.log("Ignore referral of invalid type");
    }
    handleOptIn() {
        var _a;
        const optin = this.webhookEvent.optin;
        if ((optin === null || optin === void 0 ? void 0 : optin.type) === "notification_messages") {
            const payload = "RN_" + ((_a = optin.notification_messages_frequency) === null || _a === void 0 ? void 0 : _a.toUpperCase());
            this.sendRecurringMessage(optin.notification_messages_token || "", 5000);
            return this.handlePayload(payload);
        }
        return null;
    }
    handlePassThreadControlHandover() {
        var _a, _b;
        const newOwnerAppId = (_a = this.webhookEvent.pass_thread_control) === null || _a === void 0 ? void 0 : _a.new_owner_app_id;
        const previousOwnerAppId = (_b = this.webhookEvent.pass_thread_control) === null || _b === void 0 ? void 0 : _b.previous_owner_app_id;
        if (config.appId === newOwnerAppId) {
            console.log("Received a handover event, but it is not for this app");
            return;
        }
        const leadGenAppId = "413038776280800"; // App ID for Messenger Lead Ads
        if (previousOwnerAppId === leadGenAppId) {
            console.log("Received a handover event from Lead Generation Ad, will handle Referral Webhook Instead");
            return;
        }
        return Response.genNuxMessage(this.user);
    }
    handlePayload(payload) {
        console.log("Received Payload:", `${payload} for ${this.user.psid}`);
        let response;
        if (payload === "GET_STARTED" ||
            payload === "DEVDOCS" ||
            payload === "GITHUB") {
            response = Response.genNuxMessage(this.user);
        }
        else if (payload.includes("CURATION") ||
            payload.includes("COUPON") ||
            payload.includes("PRODUCT_LAUNCH")) {
            const curation = new Curation(this.user, this.webhookEvent);
            response = curation.handlePayload(payload);
        }
        else if (payload.includes("CARE")) {
            const care = new Care(this.user, this.webhookEvent);
            response = care.handlePayload(payload);
        }
        else if (payload.includes("ORDER")) {
            response = Order.handlePayload(payload);
        }
        else if (payload.includes("CSAT")) {
            response = Survey.handlePayload(payload);
        }
        else if (payload.includes("CHAT-PLUGIN")) {
            response = [
                Response.genText(i18n.__("chat_plugin.prompt")),
                Response.genText(i18n.__("get_started.guidance")),
                Response.genQuickReply(i18n.__("get_started.help"), [
                    {
                        title: i18n.__("care.order"),
                        payload: "CARE_ORDER",
                    },
                    {
                        title: i18n.__("care.billing"),
                        payload: "CARE_BILLING",
                    },
                    {
                        title: i18n.__("care.other"),
                        payload: "CARE_OTHER",
                    },
                ]),
            ];
        }
        else if (payload.includes("BOOK_APPOINTMENT")) {
            response = [
                Response.genText(i18n.__("care.appointment")),
                Response.genText(i18n.__("care.end")),
            ];
        }
        else if (payload === "RN_WEEKLY") {
            response = {
                text: `[INFO] The following message is a sample Recurring Notification for a weekly frequency. This is usually sent outside the 24-hour window to notify users on topics that they have opted in.`,
            };
        }
        else if (payload.includes("WHOLESALE_LEAD")) {
            const lead = new Lead(this.user, this.webhookEvent);
            response = lead.handlePayload(payload);
        }
        else {
            response = {
                text: `This is a default postback message for payload: ${payload}!`,
            };
        }
        return response;
    }
    sendMessage(response, delay = 0, isUserRef) {
        if (!response)
            return;
        if ("delay" in response) {
            delay = response["delay"];
            delete response["delay"];
        }
        let requestBody = {
            recipient: isUserRef
                ? { user_ref: this.user.psid }
                : { id: this.user.psid },
            message: response, // wrap if not already wrapped
        };
        if ("persona_id" in response) {
            const personaId = response["persona_id"];
            delete response["persona_id"];
            requestBody.persona_id = personaId;
        }
        console.log("Request Body:", requestBody);
        setTimeout(() => GraphApi.callSendApi(requestBody), delay);
    }
    sendRecurringMessage(notificationMessageToken, delay) {
        console.log("Received Recurring Message token");
        const curation = new Curation(this.user, this.webhookEvent);
        const response = curation.handlePayload("CURATION_BUDGET_50_DINNER");
        if (!response)
            return;
        const requestBody = {
            recipient: {
                notification_messages_token: notificationMessageToken,
            },
            message: response,
        };
        setTimeout(() => GraphApi.callSendApi(requestBody), delay);
    }
    firstEntity(nlp, name) {
        var _a, _b;
        return (_b = (_a = nlp === null || nlp === void 0 ? void 0 : nlp.entities) === null || _a === void 0 ? void 0 : _a[name]) === null || _b === void 0 ? void 0 : _b[0];
    }
    handleReportLeadSubmittedEvent() {
        const requestBody = {
            custom_events: [
                {
                    _eventName: "lead_submitted",
                },
            ],
            advertiser_tracking_enabled: 1,
            application_tracking_enabled: 1,
            page_id: config.pageId,
            page_scoped_user_id: this.user.psid,
            logging_source: "messenger_bot",
            logging_target: "page",
        };
        try {
            GraphApi.callAppEventApi(requestBody);
        }
        catch (error) {
            console.error("Error while reporting lead submitted", error);
        }
    }
}
// Initialize LangChain LLM
Receive.llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || "",
    modelName: "gpt-4o",
    temperature: 0.7,
});
// Add Conversation Memory
Receive.memory = new ConversationSummaryBufferMemory({
    memoryKey: "chat_history", // Key to store conversation history
    returnMessages: true, // Return messages in memory
    llm: Receive.llm, // Use the same LLM for summarization
});
export default Receive;
