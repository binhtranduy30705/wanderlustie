/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import Receive from "./services/receive";
import GraphApi from "./services/graph-api";
import User from "./services/user";
import config from "./services/config";
import i18n from "./i18n.config";
import Profile from "./services/profile";

const app = express();
const users: Record<string, User> = {};

// Parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Parse application/json. Verify that callback came from Facebook
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Serving static files in Express
app.use(express.static(path.join(path.resolve(), "public")));

// Set template engine in Express
app.set("view engine", "ejs");

// Respond with index file when a GET request is made to the homepage
app.get("/", (_req: Request, res: Response) => {
  res.render("index");
});

// Add support for GET requests to our webhook
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode && token) {
    if (mode === "subscribe" && token === config.verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Create the endpoint for your webhook
app.post("/webhook", (req: Request, res: Response) => {
  const body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  if (body.object === "page") {
    res.status(200).send("EVENT_RECEIVED");

    body.entry.forEach(async (entry: any) => {
      // Iterate over messaging events
      entry.messaging.forEach(async (webhookEvent: any) => {
        const senderPsid = webhookEvent.sender.id;
        const user_ref = webhookEvent.sender.user_ref;
        const guestUser = isGuestUser(webhookEvent);

        if ("changes" in entry) {
          const receiveMessage = new Receive(users[senderPsid], webhookEvent, guestUser);
          if (entry.changes[0].field === "feed") {
            const change = entry.changes[0].value;
            switch (change.item) {
              case "post":
                return receiveMessage.handlePrivateReply("post_id", change.post_id);
              case "comment":
                return receiveMessage.handlePrivateReply("comment_id", change.comment_id);
              default:
                console.warn("Unsupported feed change type.");
                return;
            }
          }
        }

        if ("read" in webhookEvent) {
          console.log("Got a read event");
          return;
        } else if ("delivery" in webhookEvent) {
          console.log("Got a delivery event");
          return;
        } else if (webhookEvent.message && webhookEvent.message.is_echo) {
          console.log("Got an echo of our send, mid = " + webhookEvent.message.mid);
          return;
        }

        if (senderPsid) {
          if (!(senderPsid in users)) {
            if (!guestUser) {
              const user = new User(senderPsid);
              try {
                const userProfile = await GraphApi.getUserProfile(senderPsid);
                if (userProfile) {
                  user.setProfile({ ...userProfile, timezone: userProfile.timezone.toString() });
                }
              } catch (error) {
                console.log("Profile is unavailable:", error);
              } finally {
                users[senderPsid] = user;
                i18n.setLocale("en_US");
                return receiveAndReturn(users[senderPsid], webhookEvent, false);
              }
            } else {
              setDefaultUser(senderPsid);
              return receiveAndReturn(users[senderPsid], webhookEvent, false);
            }
          } else {
            i18n.setLocale(users[senderPsid].locale);
            return receiveAndReturn(users[senderPsid], webhookEvent, false);
          }
        } else if (user_ref) {
          setDefaultUser(user_ref);
          return receiveAndReturn(users[user_ref], webhookEvent, true);
        }
      });
    });
  } else {
    res.sendStatus(404);
  }
});

function setDefaultUser(id: string) {
  const user = new User(id);
  users[id] = user;
  i18n.setLocale("en_US");
}

function isGuestUser(webhookEvent: any): boolean {
  return webhookEvent.postback?.referral?.is_guest_user || false;
}

function receiveAndReturn(user: User, webhookEvent: any, isUserRef: boolean) {
  const receiveMessage = new Receive(user, webhookEvent, isUserRef);
  return receiveMessage.handleMessage();
}

// Set up your App's Messenger Profile
app.get("/profile", (req: Request, res: Response) => {
  const token = req.query["verify_token"] as string;
  const mode = req.query["mode"] as string;

  if (!config.webhookUrl.startsWith("https://")) {
    res.status(200).send("ERROR - Need a proper API_URL in the .env file");
  }

  const profile = new Profile();

  if (mode && token) {
    if (token === config.verifyToken) {
      if (mode === "webhook" || mode === "all") {
        profile.setWebhook();
        res.write(`<p>&#9989; Set app ${config.appId} call to ${config.webhookUrl}</p>`);
      }
      if (mode === "profile" || mode === "all") {
        profile.setThread();
        res.write(`<p>&#9989; Set Messenger Profile of Page ${config.pageId}</p>`);
      }
      if (mode === "personas" || mode === "all") {
        profile.setPersonas();
        res.write(`<p>&#9989; Set Personas for ${config.appId}</p>`);
      }
      if (mode === "nlp" || mode === "all") {
        GraphApi.callNLPConfigsAPI();
        res.write(`<p>&#9989; Enabled Built-in NLP for Page ${config.pageId}</p>`);
      }
      if (mode === "domains" || mode === "all") {
        profile.setWhitelistedDomains();
        res.write(`<p>&#9989; Whitelisted domains: ${config.whitelistedDomains}</p>`);
      }
      if (mode === "private-reply") {
        profile.setPageFeedWebhook();
        res.write(`<p>&#9989; Set Page Feed Webhook for Private Replies.</p>`);
      }
      res.status(200).end();
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
});

// Verify that the callback came from Facebook.
function verifyRequestSignature(req: Request, res: Response, buf: Buffer) {
  const signature = req.headers["x-hub-signature"] as string;

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature" in headers.`);
  } else {
    const elements = signature.split("=");
    const signatureHash = elements[1];
    if (!config.appSecret) {
      throw new Error("App secret is not defined in the configuration.");
    }
    const expectedHash = crypto.createHmac("sha1", config.appSecret).update(buf).digest("hex");
    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Check if all environment variables are set
config.checkEnvVariables();

// Listen for requests
const listener = app.listen(config.port, () => {
  const address = listener.address();
  if (address && typeof address === "object") {
    console.log(`The app is listening on port ${address.port}`);
  } else {
    console.error("Failed to retrieve the server address.");
  }
  if (Object.keys(config.personas).length === 0 && config.appUrl && config.verifyToken) {
    console.log(
      "Is this the first time running?\n" +
        "Make sure to set the both the Messenger profile, persona " +
        "and webhook by visiting:\n" +
        config.appUrl +
        "/profile?mode=all&verify_token=" +
        config.verifyToken
    );
  }

  if (config.pageId) {
    console.log("Test your app by messaging:");
    console.log(`https://m.me/${config.pageId}`);
  }
});