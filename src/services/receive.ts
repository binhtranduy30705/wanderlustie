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
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";

interface WebhookEvent {
  message?: {
    text?: string;
    quick_reply?: { payload: string };
    attachments?: any[];
    nlp?: any;
  };
  postback?: { payload?: string; referral?: { type: string; ref?: string } };
  referral?: { type: string; ref?: string };
  optin?: { type: string; notification_messages_frequency?: string; notification_messages_token?: string };
  pass_thread_control?: { new_owner_app_id: string; previous_owner_app_id: string; metadata?: string };
}

interface User {
  psid: string;
  firstName: string;
  gender: string;
}

export default class Receive {
  private user: User;
  private webhookEvent: WebhookEvent;
  private isUserRef: boolean;

  constructor(user: User, webhookEvent: WebhookEvent, isUserRef: boolean) {
    this.user = user;
    this.webhookEvent = webhookEvent;
    this.isUserRef = isUserRef;
  }

  async handleMessage(): Promise<void> {
    const event = this.webhookEvent;
    let responses;

    try {
      if (event.message) {
        const message = event.message;

        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else if (message.attachments) {
          responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = await this.handleTextMessage();
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      } else if (event.referral) {
        responses = this.handleReferral();
      } else if (event.optin) {
        responses = this.handleOptIn();
      } else if (event.pass_thread_control) {
        responses = this.handlePassThreadControlHandover();
      }
    } catch (error) {
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
    } else {
      this.sendMessage(responses, 0, this.isUserRef);
    }
  }

  handlePrivateReply(type: string, id: string): void {
    console.log(`Handling private reply for type: ${type}, id: ${id}`);
    // Add your logic for handling private replies here
  }

  // Load system prompt
  private systemPromptPath: string = path.join(__dirname, "../prompts", "wanderlustie.txt");
  private systemPrompt: string = fs.readFileSync(this.systemPromptPath, "utf-8");
  
  // Initialize LangChain LLM
  private static llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || "",
    modelName: "gpt-4o",
    temperature: 0.7,
  });
  
  // Create LangChain PromptTemplate
  private promptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(this.systemPrompt),
    HumanMessagePromptTemplate.fromTemplate("Conversation so far: {chat_history}"),
    HumanMessagePromptTemplate.fromTemplate("User: {userInput}"),
  ]);
  
  // Add Conversation Memory
  private static memory = new ConversationSummaryBufferMemory({
    memoryKey: "chat_history", // Key to store conversation history
    returnMessages: true, // Return messages in memory
    llm: Receive.llm, // Use the same LLM for summarization
  });
  
  private chain = new ConversationChain({
    llm: Receive.llm,
    prompt: this.promptTemplate,
    memory: Receive.memory
  });
  
  async handleTextMessage(): Promise<any> {
    console.log(
      "Received text:",
      `${this.webhookEvent.message?.text} for ${this.user.psid}`
    );
  
    const event = this.webhookEvent;
    const message = event.message?.text?.trim().toLowerCase() || "";
  
    try {
      // Call the LangChain ConversationChain with the user's input
      const response = await this.chain.call({ userInput: message });
  
      // Log the conversation history for debugging
      console.log("User Input:", message);
      console.log("AI Response:", response.response.toString());
      console.log("Updated Memory:", Receive.memory.chatHistory); // Log the updated memorys
      const result = [
        Response.genText(response.response.toString()),
      ];
      // Return the AI's response
      return result;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Sorry, something went wrong.";
    }
  }

  handleAttachmentMessage(): any {
    const attachment = this.webhookEvent.message?.attachments?.[0];
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

  handleQuickReply(): any {
    const payload = this.webhookEvent.message?.quick_reply?.payload || "";
    return this.handlePayload(payload);
  }

  handlePostback(): any {
    const postback = this.webhookEvent.postback;
    let payload = "";

    if (postback?.referral?.type === "OPEN_THREAD") {
      payload = postback.referral.ref || "";
    } else if (postback?.payload) {
      payload = postback.payload;
    }

    if (payload.trim().length === 0) {
      console.log("Ignore postback with empty payload");
      return null;
    }

    return this.handlePayload(payload.toUpperCase());
  }

  handleReferral(): any {
    const type = this.webhookEvent.referral?.type;
    if (type === "LEAD_COMPLETE" || type === "LEAD_INCOMPLETE") {
      const lead = new Lead(this.user, this.webhookEvent);
      return lead.handleReferral(type);
    }
    if (type === "OPEN_THREAD") {
      const payload = this.webhookEvent.referral?.ref?.toUpperCase() || "";
      if (payload.trim().length === 0) {
        console.log("Ignore referral with empty payload");
        return null;
      }
      return this.handlePayload(payload);
    }
    console.log("Ignore referral of invalid type");
  }

  handleOptIn(): any {
    const optin = this.webhookEvent.optin;
    if (optin?.type === "notification_messages") {
      const payload = "RN_" + optin.notification_messages_frequency?.toUpperCase();
      this.sendRecurringMessage(optin.notification_messages_token || "", 5000);
      return this.handlePayload(payload);
    }
    return null;
  }

  handlePassThreadControlHandover(): any {
    const newOwnerAppId = this.webhookEvent.pass_thread_control?.new_owner_app_id;
    const previousOwnerAppId = this.webhookEvent.pass_thread_control?.previous_owner_app_id;

    if (config.appId === newOwnerAppId) {
      console.log("Received a handover event, but it is not for this app");
      return;
    }

    const leadGenAppId = "413038776280800"; // App ID for Messenger Lead Ads
    if (previousOwnerAppId === leadGenAppId) {
      console.log(
        "Received a handover event from Lead Generation Ad, will handle Referral Webhook Instead"
      );
      return;
    }

    return Response.genNuxMessage(this.user);
  }

  handlePayload(payload: string): any {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);

    let response;

    if (
      payload === "GET_STARTED" ||
      payload === "DEVDOCS" ||
      payload === "GITHUB"
    ) {
      response = Response.genNuxMessage(this.user);
    } else if (
      payload.includes("CURATION") ||
      payload.includes("COUPON") ||
      payload.includes("PRODUCT_LAUNCH")
    ) {
      const curation = new Curation(this.user, this.webhookEvent);
      response = curation.handlePayload(payload);
    } else if (payload.includes("CARE")) {
      const care = new Care(this.user, this.webhookEvent);
      response = care.handlePayload(payload);
    } else if (payload.includes("ORDER")) {
      response = Order.handlePayload(payload);
    } else if (payload.includes("CSAT")) {
      response = Survey.handlePayload(payload);
    } else if (payload.includes("CHAT-PLUGIN")) {
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
    } else if (payload.includes("BOOK_APPOINTMENT")) {
      response = [
        Response.genText(i18n.__("care.appointment")),
        Response.genText(i18n.__("care.end")),
      ];
    } else if (payload === "RN_WEEKLY") {
      response = {
        text: `[INFO] The following message is a sample Recurring Notification for a weekly frequency. This is usually sent outside the 24-hour window to notify users on topics that they have opted in.`,
      };
    } else if (payload.includes("WHOLESALE_LEAD")) {
      const lead = new Lead(this.user, this.webhookEvent);
      response = lead.handlePayload(payload);
    } else {
      response = {
        text: `This is a default postback message for payload: ${payload}!`,
      };
    }

    return response;
  }

  sendMessage(response: any, delay = 0, isUserRef: boolean): void {
    if (!response) return;

    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }

    let requestBody: any = {
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

  sendRecurringMessage(notificationMessageToken: string, delay: number): void {
    console.log("Received Recurring Message token");
    const curation = new Curation(this.user, this.webhookEvent);
    const response = curation.handlePayload("CURATION_BUDGET_50_DINNER");

    if (!response) return;

    const requestBody = {
      recipient: {
        notification_messages_token: notificationMessageToken,
      },
      message: response,
    };

    setTimeout(() => GraphApi.callSendApi(requestBody), delay);
  }

  firstEntity(nlp: any, name: string): any {
    return nlp?.entities?.[name]?.[0];
  }

  handleReportLeadSubmittedEvent(): void {
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
    } catch (error) {
      console.error("Error while reporting lead submitted", error);
    }
  }
}