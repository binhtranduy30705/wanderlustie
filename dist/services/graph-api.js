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
// Imports dependencies
import config from "./config"; // Importing the configuration
import fetch from "node-fetch"; // Importing fetch and Response types
import { URL, URLSearchParams } from "url";
export default class GraphApi {
    static callSendApi(requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL(`${config.apiUrl}/me/messages`);
            url.search = new URLSearchParams({
                access_token: config.pageAccesToken || "",
            }).toString(); // Convert URLSearchParams to a string
            console.warn("Request body is\n" + JSON.stringify(requestBody));
            const response = yield fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                console.warn(`Unable to call Send API: ${response.statusText}`, yield response.json());
            }
        });
    }
    static callMessengerProfileAPI(requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Setting Messenger Profile for app ${config.appId}`);
            const url = new URL(`${config.apiUrl}/me/messenger_profile`);
            url.search = new URLSearchParams({
                access_token: config.pageAccesToken || "",
            }).toString(); // Convert URLSearchParams to a string
            const response = yield fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                console.log(`Request sent.`);
            }
            else {
                console.warn(`Unable to callMessengerProfileAPI: ${response.statusText}`, yield response.json());
            }
        });
    }
    static callSubscriptionsAPI(customFields) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Setting app ${config.appId} callback URL to ${config.webhookUrl}`);
            let fields = "messages, messaging_postbacks, messaging_optins, " +
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
            const response = yield fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                console.log(`Request sent.`);
            }
            else {
                console.error(`Unable to callSubscriptionsAPI: ${response.statusText}`, yield response.json());
            }
        });
    }
    static callSubscribedApps(customFields) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Subscribing app ${config.appId} to page ${config.pageId}`);
            let fields = "messages, messaging_postbacks, messaging_optins, " +
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
            const response = yield fetch(url.toString(), {
                method: "POST",
            });
            if (response.ok) {
                console.log(`Request sent.`);
            }
            else {
                console.error(`Unable to callSubscribedApps: ${response.statusText}`, yield response.json());
            }
        });
    }
    static getUserProfile(senderIgsid) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL(`${config.apiUrl}/${senderIgsid}`);
            url.search = new URLSearchParams({
                access_token: config.pageAccesToken || "",
                fields: "first_name, last_name, gender, locale, timezone",
            }).toString();
            const response = yield fetch(url.toString());
            if (response.ok) {
                const userProfile = yield response.json();
                return {
                    firstName: userProfile.first_name,
                    lastName: userProfile.last_name,
                    gender: userProfile.gender,
                    locale: userProfile.locale,
                    timezone: userProfile.timezone,
                };
            }
            else {
                console.warn(`Could not load profile for ${senderIgsid}: ${response.statusText}`, yield response.json());
                return null;
            }
        });
    }
    static reportLeadSubmittedEvent(psid) {
        console.log(`Lead submitted event reported for PSID: ${psid}`);
    }
    static callAppEventApi(requestBody) {
        console.log("App event API called with:", requestBody);
    }
    static callNLPConfigsAPI() {
        console.log("Calling NLP Configs API...");
        // Add the actual implementation here
    }
}
