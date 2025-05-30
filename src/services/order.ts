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
import i18n from "../i18n.config";
import config from "./config";

export default class Order {
  static handlePayload(payload: string): any {
    let response;

    switch (payload) {
      case "TRACK_ORDER":
        response = Response.genQuickReply(i18n.__("order.prompt"), [
          {
            title: i18n.__("order.account"),
            payload: "LINK_ORDER",
          },
          {
            title: i18n.__("order.search"),
            payload: "SEARCH_ORDER",
          },
          {
            title: i18n.__("menu.help"),
            payload: "CARE_ORDER",
          },
        ]);
        break;

      case "SEARCH_ORDER":
        response = Response.genText(i18n.__("order.number"));
        break;

      case "ORDER_NUMBER":
        response = Response.genImageTemplate(
          `${config.appUrl}/order.png`,
          i18n.__("order.status")
        );
        break;

      case "LINK_ORDER":
        response = [
          Response.genText(i18n.__("order.dialog")),
          Response.genText(i18n.__("order.searching")),
          Response.genImageTemplate(
            `${config.appUrl}/order.png`,
            i18n.__("order.status")
          ),
        ];
        break;

      default:
        response = Response.genText(i18n.__("fallback.default"));
        break;
    }

    return response;
  }
}
