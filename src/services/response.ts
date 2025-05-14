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

import i18n from "../i18n.config";

export default class Response {
  static genQuickReply(text: string, quickReplies: { title: string; payload: string }[]): any {
    let response = {
      text: text,
      quick_replies: [] as { content_type: string; title: string; payload: string }[],
    };

    for (let quickReply of quickReplies) {
      response["quick_replies"].push({
        content_type: "text",
        title: quickReply["title"],
        payload: quickReply["payload"],
      });
    }

    return response;
  }

  static genGenericTemplate(
    image_url: string,
    title: string,
    subtitle: string,
    buttons: any[]
  ): any {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title,
              subtitle: subtitle,
              image_url: image_url,
              buttons: buttons,
            },
          ],
        },
      },
    };
    return response;
  }

  static genRecurringNotificationsTemplate(
    image_url: string,
    title: string,
    notification_messages_frequency: string,
    payload: string
  ): any {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "notification_messages",
          title: title,
          image_url: image_url,
          notification_messages_frequency: notification_messages_frequency,
          payload: payload,
        },
      },
    };
    return response;
  }

  static genImageTemplate(image_url: string, title: string, subtitle = ""): any {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title,
              subtitle: subtitle,
              image_url: image_url,
            },
          ],
        },
      },
    };

    return response;
  }

  static genButtonTemplate(title: string, buttons: any[]): any {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: title,
          buttons: buttons,
        },
      },
    };

    return response;
  }

  static genText(text: string): any {
  return { text }; // ← not empty!
  }


  static genTextWithPersona(text: string, persona_id: string): any {
    let response = {
      text: text,
      persona_id: persona_id,
    };

    return response;
  }

  static genPostbackButton(title: string, payload: string): any {
    let response = {
      type: "postback",
      title: title,
      payload: payload,
    };

    return response;
  }

  static genWebUrlButton(title: string, url: string): any {
    let response = {
      type: "web_url",
      title: title,
      url: url,
      messenger_extensions: true,
    };

    return response;
  }

  static genNuxMessage(user: { firstName: string }): any[] {
    let welcome = this.genText(
      i18n.__("get_started.welcome", {
        userFirstName: user.firstName,
      })
    );

    let guide = this.genText(i18n.__("get_started.guidance"));

    let curation = this.genQuickReply(i18n.__("get_started.help"), [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION",
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP",
      },
      {
        title: i18n.__("menu.product_launch"),
        payload: "PRODUCT_LAUNCH",
      },
    ]);

    return [welcome, guide, curation];
  }
}
