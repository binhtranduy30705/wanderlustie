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
import Response from "./response";
import Survey from "./survey";
import config from "./config";
import i18n from "../i18n.config";
const ensureString = (value) => {
    if (typeof value === "string") {
        return value;
    }
    throw new Error("Expected a string but received undefined");
};
export default class Care {
    constructor(user, webhookEvent) {
        this.user = user;
        this.webhookEvent = webhookEvent;
    }
    handlePayload(payload) {
        let response;
        switch (payload) {
            case "CARE_HELP":
                response = Response.genQuickReply(i18n.__("care.prompt", {
                    userFirstName: this.user.firstName,
                }), [
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
                ]);
                break;
            case "CARE_ORDER":
                // Send using the Persona for order issues
                response = [
                    Response.genTextWithPersona(i18n.__("care.issue", {
                        userFirstName: this.user.firstName,
                        agentFirstName: ensureString(config.personaOrder.name),
                        topic: i18n.__("care.order"),
                    }), ensureString(config.personaOrder.id)),
                    Response.genTextWithPersona(i18n.__("care.end"), ensureString(config.personaOrder.id)),
                    Survey.genAgentRating(ensureString(config.personaOrder.name)),
                ];
                break;
            case "CARE_BILLING":
                // Send using the Persona for billing issues
                response = [
                    Response.genTextWithPersona(i18n.__("care.issue", {
                        userFirstName: this.user.firstName,
                        agentFirstName: ensureString(config.personaBilling.name),
                        topic: i18n.__("care.billing"),
                    }), ensureString(config.personaBilling.id)),
                    Response.genTextWithPersona(i18n.__("care.end"), ensureString(config.personaBilling.id)),
                    Survey.genAgentRating(ensureString(config.personaBilling.name)),
                ];
                break;
            case "CARE_SALES":
                // Send using the Persona for sales questions
                response = [
                    Response.genTextWithPersona(i18n.__("care.style", {
                        userFirstName: this.user.firstName,
                        agentFirstName: ensureString(config.personaSales.name),
                    }), ensureString(config.personaSales.id)),
                    Response.genTextWithPersona(i18n.__("care.end"), ensureString(config.personaSales.id)),
                    Survey.genAgentRating(ensureString(config.personaSales.name)),
                ];
                break;
            case "CARE_OTHER":
                // Send using the Persona for customer care issues
                response = [
                    Response.genTextWithPersona(i18n.__("care.default", {
                        userFirstName: this.user.firstName,
                        agentFirstName: ensureString(config.personaCare.name),
                    }), ensureString(config.personaCare.id)),
                    Response.genTextWithPersona(i18n.__("care.end"), ensureString(config.personaCare.id)),
                    Survey.genAgentRating(ensureString(config.personaCare.name)),
                ];
                break;
            default:
                response = Response.genText(i18n.__("fallback.default"));
                break;
        }
        return response;
    }
}
