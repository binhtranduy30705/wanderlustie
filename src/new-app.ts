import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import config from "./services/config";
import GraphApi from "./services/graph-api";
import { ConversationChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ verify: verifyRequestSignature }));

// Static assets
app.use(express.static(path.join(path.resolve(), "public")));

// Set template engine
app.set("view engine", "ejs");

// Homepage
app.get("/", (_req: Request, res: Response) => res.render("index"));

// Webhook verification
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  if (mode && token && mode === "subscribe" && token === config.verifyToken) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Load system prompt
const systemPromptPath = path.join(__dirname, "prompts", "wanderlustie.txt");
const systemPrompt = fs.readFileSync(systemPromptPath, "utf-8");

// Initialize LangChain LLM
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY || "",
  modelName: "gpt-4o",
  temperature: 0.7,
});

// Create LangChain PromptTemplate
const promptTemplate = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(systemPrompt),
  HumanMessagePromptTemplate.fromTemplate("Conversation so far: {chat_history}"),
  HumanMessagePromptTemplate.fromTemplate("User: {userInput}"),
]);

// Add Conversation Memory
const memory = new ConversationSummaryBufferMemory({
  memoryKey: "chat_history", // Key to store conversation history
  returnMessages: true, // Return messages in memory
  llm: llm, // Use the same LLM for summarization
});

console.log("Memory initialized:", memory);

// Create LangChain LLMChain with Memory
const chain = new ConversationChain({
  llm,
  prompt: promptTemplate,
  memory
});

// AI Integration using LangChain
async function getAIResponse(userInput: string): Promise<string> {
  try {
    // Call the chain with user input
    const response = await chain.call({ userInput });

    // Log the conversation history for debugging
    console.log("Updated Conversation History:", memory.chatHistory);
    console.log("User Input:", userInput);
    console.log("AI Response:", response.response);

    // Return the AI's response
    return response.response || "Sorry, I couldn’t understand that.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, something went wrong.";
  }
}

// Handle webhook events
app.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object === "page") {
    res.status(200).send("EVENT_RECEIVED");

    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.sender.id) {
          const senderPsid = event.sender.id;
          const userMessage = event.message.text;
          const aiReply = await getAIResponse(userMessage);

          await GraphApi.callSendApi({
            recipient: { id: senderPsid },
            message: { text: aiReply },
          });

          console.log(`Message sent to ${senderPsid}: ${aiReply}`);
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
});

// Verify Facebook signature
function verifyRequestSignature(
  req: Request,
  _res: Response,
  buf: Buffer,
  encoding?: string
): void {
  const signature = req.headers["x-hub-signature"] as string | undefined;
  if (!signature) return;

  const [method, signatureHash] = signature.split("=");

  if (!config.appSecret) {
    throw new Error("App secret is not defined in the environment variables.");
  }
  
  const expectedHash = crypto
    .createHmac("sha1", config.appSecret)
    .update(buf)
    .digest("hex");

  if (signatureHash !== expectedHash) {
    throw new Error("Couldn't validate request signature.");
  }
}

// Check environment variables
config.checkEnvVariables();

// Start server
const listener = app.listen(config.port, () => {
  const address = listener.address();
  const port = typeof address === "string" ? address : address?.port;

  console.log(`Wanderlustie is running on port ${port}`);
  if (config.appUrl && config.verifyToken) {
    console.log(
      "Set webhook/profile with:",
      `${config.appUrl}/profile?mode=all&verify_token=${config.verifyToken}`
    );
  }
  if (config.pageId) console.log(`Test the bot: https://m.me/${config.pageId}`);
});