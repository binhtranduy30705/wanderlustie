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
import { default as BotResponse } from "./response";
import config from "./config";
import i18n from "../i18n.config";

interface User {
  firstName: string;
  gender: string;
}

interface WebhookEvent {
  // Define any properties of the webhook event if needed
}

export default class Curation {
  private user: User;
  private webhookEvent: WebhookEvent;

  constructor(user: User, webhookEvent: WebhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  handlePayload(payload: string): any {
    let response: any;
    let outfit: string;

    switch (payload) {
      case "SUMMER_COUPON":
        response = [
          BotResponse.genText(
            i18n.__("leadgen.promo", {
              userFirstName: this.user.firstName,
            })
          ),
          BotResponse.genGenericTemplate(
            `${config.appUrl}/coupon.png`,
            i18n.__("leadgen.title"),
            i18n.__("leadgen.subtitle"),
            [BotResponse.genPostbackButton(i18n.__("leadgen.apply"), "COUPON_50")]
          ),
        ];
        break;

      case "COUPON_50":
        outfit = `${this.user.gender}-${this.randomOutfit()}`;

        response = [
          BotResponse.genText(i18n.__("leadgen.coupon")),
          BotResponse.genGenericTemplate(
            `${config.appUrl}/looks/${outfit}.jpg`,
            i18n.__("curation.title"),
            i18n.__("curation.subtitle"),
            [
              BotResponse.genWebUrlButton(
                i18n.__("curation.shop"),
                `${config.shopUrl}/products/${outfit}`
              ),
              BotResponse.genPostbackButton(
                i18n.__("curation.show"),
                "CURATION_OTHER_STYLE"
              ),
              BotResponse.genPostbackButton(
                i18n.__("curation.sales"),
                "CARE_SALES"
              ),
            ]
          ),
        ];
        break;

      case "CURATION":
        response = BotResponse.genQuickReply(i18n.__("curation.prompt"), [
          {
            title: i18n.__("curation.me"),
            payload: "CURATION_FOR_ME",
          },
          {
            title: i18n.__("curation.someone"),
            payload: "CURATION_SOMEONE_ELSE",
          },
        ]);
        break;

      case "CURATION_FOR_ME":
      case "CURATION_SOMEONE_ELSE":
        response = BotResponse.genQuickReply(i18n.__("curation.occasion"), [
          {
            title: i18n.__("curation.work"),
            payload: "CURATION_OCASION_WORK",
          },
          {
            title: i18n.__("curation.dinner"),
            payload: "CURATION_OCASION_DINNER",
          },
          {
            title: i18n.__("curation.party"),
            payload: "CURATION_OCASION_PARTY",
          },
          {
            title: i18n.__("curation.sales"),
            payload: "CARE_SALES",
          },
        ]);
        break;

      case "CURATION_OCASION_WORK":
      case "CURATION_OCASION_DINNER":
      case "CURATION_OCASION_PARTY":
        response = BotResponse.genQuickReply(i18n.__("curation.price"), [
          {
            title: "~ $20",
            payload: `CURATION_BUDGET_20_${payload.split("_")[2]}`,
          },
          {
            title: "~ $30",
            payload: `CURATION_BUDGET_30_${payload.split("_")[2]}`,
          },
          {
            title: "+ $50",
            payload: `CURATION_BUDGET_50_${payload.split("_")[2]}`,
          },
        ]);
        break;

      case "CURATION_BUDGET_20_WORK":
      case "CURATION_BUDGET_30_WORK":
      case "CURATION_BUDGET_50_WORK":
      case "CURATION_BUDGET_20_DINNER":
      case "CURATION_BUDGET_30_DINNER":
      case "CURATION_BUDGET_50_DINNER":
      case "CURATION_BUDGET_20_PARTY":
      case "CURATION_BUDGET_30_PARTY":
      case "CURATION_BUDGET_50_PARTY":
        response = this.genCurationResponse(payload);
        break;

      case "CURATION_OTHER_STYLE":
        outfit = `${this.user.gender}-${this.randomOutfit()}`;

        response = BotResponse.genGenericTemplate(
          `${config.appUrl}/looks/${outfit}.jpg`,
          i18n.__("curation.title"),
          i18n.__("curation.subtitle"),
          [
            BotResponse.genWebUrlButton(
              i18n.__("curation.shop"),
              `${config.shopUrl}/products/${outfit}`
            ),
            BotResponse.genPostbackButton(
              i18n.__("curation.show"),
              "CURATION_OTHER_STYLE"
            ),
          ]
        );
        break;

      case "PRODUCT_LAUNCH":
        outfit = `${this.user.gender}-${this.randomOutfit()}`;
        response = BotResponse.genRecurringNotificationsTemplate(
          `${config.appUrl}/looks/${outfit}.jpg`,
          i18n.__("curation.productLaunchTitle"),
          "WEEKLY",
          "12345"
        );
        break;

      default:
        response = BotResponse.genText(i18n.__("fallback.default"));
        break;
    }

    return response;
  }

  genCurationResponse(payload: string): any {
    const occasion = payload.split("_")[3].toLowerCase();
    const budget = payload.split("_")[2].toLowerCase();
    const outfit = `${this.user.gender}-${occasion}`;

    const buttons = [
      BotResponse.genWebUrlButton(
        i18n.__("curation.shop"),
        `${config.shopUrl}/products/${outfit}`
      ),
      BotResponse.genPostbackButton(
        i18n.__("curation.show"),
        "CURATION_OTHER_STYLE"
      ),
    ];

    if (budget === "50") {
      buttons.push(
        BotResponse.genPostbackButton(i18n.__("curation.sales"), "CARE_SALES")
      );
    }

    return BotResponse.genGenericTemplate(
      `${config.appUrl}/looks/${outfit}.jpg`,
      i18n.__("curation.title"),
      i18n.__("curation.subtitle"),
      buttons
    );
  }

  private randomOutfit(): string {
    const occasions = ["work", "party", "dinner"];
    const randomIndex = Math.floor(Math.random() * occasions.length);
    return occasions[randomIndex];
  }
}