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

// Imports dependencies
import config from "./config"; // Importing the configuration
import fetch, { Response } from "node-fetch"; // Importing fetch and Response types
import { URL, URLSearchParams } from "url";

export default class GraphApi {
  static async callSendApi(requestBody: object): Promise<void> {
    const url = new URL(`${config.apiUrl}/me/messages`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken || "",
    }).toString(); // Convert URLSearchParams to a string
  
    console.warn("Request body is\n" + JSON.stringify(requestBody));
  
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  
    if (!response.ok) {
      console.warn(
        `Unable to call Send API: ${response.statusText}`,
        await response.json()
      );
    }
  }
  
  static async callMessengerProfileAPI(requestBody: object): Promise<void> {
    console.log(`Setting Messenger Profile for app ${config.appId}`);
    const url = new URL(`${config.apiUrl}/me/messenger_profile`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken || "",
    }).toString(); // Convert URLSearchParams to a string

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.warn(
        `Unable to callMessengerProfileAPI: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callSubscriptionsAPI(customFields?: string): Promise<void> {
    console.log(
      `Setting app ${config.appId} callback URL to ${config.webhookUrl}`
    );

    let fields =
      "messages, messaging_postbacks, messaging_optins, " +
      "message_deliveries, messaging_referrals";

    if (customFields) {
      fields += `, ${customFields}`;
    }

    console.log({ fields });

    const url = new URL(`${config.apiUrl}/${config.appId}/subscriptions`);
    url.search = new URLSearchParams({
      access_token: `${config.appId}|${config.appSecret}`,
      object: "page",
      callback_url: config.webhookUrl || "",
      verify_token: config.verifyToken || "",
      fields: fields,
      include_values: "true",
    }).toString();

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.error(
        `Unable to callSubscriptionsAPI: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async callSubscribedApps(customFields?: string): Promise<void> {
    console.log(`Subscribing app ${config.appId} to page ${config.pageId}`);

    let fields =
      "messages, messaging_postbacks, messaging_optins, " +
      "message_deliveries, messaging_referrals";

    if (customFields) {
      fields += `, ${customFields}`;
    }

    console.log({ fields });

    const url = new URL(`${config.apiUrl}/${config.pageId}/subscribed_apps`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken || "",
      subscribed_fields: fields,
    }).toString();

    const response = await fetch(url.toString(), {
      method: "POST",
    });

    if (response.ok) {
      console.log(`Request sent.`);
    } else {
      console.error(
        `Unable to callSubscribedApps: ${response.statusText}`,
        await response.json()
      );
    }
  }

  static async getUserProfile(senderIgsid: string): Promise<{
    firstName: string;
    lastName: string;
    gender: string;
    locale: string;
    timezone: number;
  } | null> {
    const url = new URL(`${config.apiUrl}/${senderIgsid}`);
    url.search = new URLSearchParams({
      access_token: config.pageAccesToken || "",
      fields: "first_name, last_name, gender, locale, timezone",
    }).toString();

    const response = await fetch(url.toString());

    if (response.ok) {
      const userProfile = await response.json();
      return {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        gender: userProfile.gender,
        locale: userProfile.locale,
        timezone: userProfile.timezone,
      };
    } else {
      console.warn(
        `Could not load profile for ${senderIgsid}: ${response.statusText}`,
        await response.json()
      );
      return null;
    }
  }

  static reportLeadSubmittedEvent(psid: string): void {
    console.log(`Lead submitted event reported for PSID: ${psid}`);
  }

  static callAppEventApi(requestBody: object): void {
    console.log("App event API called with:", requestBody);
  }

  static callNLPConfigsAPI(): void {
    console.log("Calling NLP Configs API...");
    // Add the actual implementation here
  }
}