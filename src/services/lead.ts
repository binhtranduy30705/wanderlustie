/**
 * Copyright 2022-present, Facebook, Inc. All rights reserved.
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
import GraphApi from "./graph-api";
import config from "./config";
import i18n from "../i18n.config";

const ensureString = (value: string | undefined): string => {
  if (typeof value === "string") {
    return value;
  }
  throw new Error("Expected a string but received undefined");
};

interface User {
  firstName: string;
  psid: string;
}

interface WebhookEvent {
  // Define any properties of the webhook event if needed
}

export default class Lead {
  private user: User;
  private webhookEvent: WebhookEvent;

  constructor(user: User, webhookEvent: WebhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  handleReferral(type: string): any {
    switch (type) {
      case "LEAD_COMPLETE":
        return this.responseForLeadComplete();
      case "LEAD_INCOMPLETE":
        return null;
    }

    return;
  }

  responseForLeadComplete(): any {
    const responses = [
      Response.genTextWithPersona(
        i18n.__("wholesale_leadgen.intro", {
          userFirstName: this.user.firstName,
          agentFirstName: ensureString(config.personaSales.name),
          topic: i18n.__("care.order"),
        }),
        ensureString(config.personaSales.id)
      ),
      Response.genTextWithPersona(i18n.__("care.end"), ensureString(config.personaSales.id)),
    ];
    responses[0].delay = 4000;
    responses[1].delay = 6000;
    return responses;
  }

  handlePayload(payload: string): any {
    let response: any;

    switch (payload) {
      case "WHOLESALE_LEAD_AD":
        response = [
          Response.genText(
            i18n.__("wholesale_leadgen.lead_intro", {
              userFirstName: this.user.firstName,
            })
          ),
          Response.genQuickReply(i18n.__("wholesale_leadgen.lead_question"), [
            {
              title: i18n.__("common.yes"),
              payload: "WHOLESALE_LEAD_YES",
            },
            {
              title: i18n.__("common.no"),
              payload: "WHOLESALE_LEAD_NO",
            },
          ]),
        ];
        break;

      case "WHOLESALE_LEAD_YES":
        GraphApi.reportLeadSubmittedEvent(this.user.psid);
        response = [
          Response.genText(i18n.__("wholesale_leadgen.lead_qualified")),
        ];
        response = response.concat(this.responseForLeadComplete());
        break;

      case "WHOLESALE_LEAD_NO":
        response = [
          Response.genText(i18n.__("wholesale_leadgen.lead_disqualified")),
        ];
        response = response.concat(Response.genNuxMessage(this.user));
        break;

      default:
        response = Response.genText(i18n.__("fallback.default"));
        break;
    }

    return response;
  }
}