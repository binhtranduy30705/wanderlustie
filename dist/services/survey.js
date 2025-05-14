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
export default class Survey {
    static genAgentRating(agent) {
        let response = Response.genQuickReply(i18n.__("survey.prompt", {
            agentFirstName: agent,
        }), [
            {
                title: i18n.__("survey.rating.good"),
                payload: "SURVEY_AGENT_GOOD",
            },
            {
                title: i18n.__("survey.rating.bad"),
                payload: "SURVEY_AGENT_BAD",
            },
        ]);
        return response;
    }
    static handlePayload(payload) {
        console.log(`Handling payload: ${payload}`);
        return { text: `Handled payload: ${payload}` };
    }
}
