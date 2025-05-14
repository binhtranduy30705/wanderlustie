var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import config from "./services/config";
import GraphApi from "./services/graph-api";
import { ConversationChain } from "langchain/chains";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, } from "@langchain/core/prompts";
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
app.get("/", (_req, res) => res.render("index"));
// Webhook verification
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode && token && mode === "subscribe" && token === config.verifyToken) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
    }
    else {
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
function getAIResponse(userInput) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Call the chain with user input
            const response = yield chain.call({ userInput });
            // Log the conversation history for debugging
            console.log("Updated Conversation History:", memory.chatHistory);
            console.log("User Input:", userInput);
            console.log("AI Response:", response.response);
            // Return the AI's response
            return response.response || "Sorry, I couldn’t understand that.";
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            return "Sorry, something went wrong.";
        }
    });
}
// Handle webhook events
app.post("/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (body.object === "page") {
        res.status(200).send("EVENT_RECEIVED");
        for (const entry of body.entry) {
            for (const event of entry.messaging) {
                if (event.message && event.sender.id) {
                    const senderPsid = event.sender.id;
                    const userMessage = event.message.text;
                    const aiReply = yield getAIResponse(userMessage);
                    yield GraphApi.callSendApi({
                        recipient: { id: senderPsid },
                        message: { text: aiReply },
                    });
                    console.log(`Message sent to ${senderPsid}: ${aiReply}`);
                }
            }
        }
    }
    else {
        res.sendStatus(404);
    }
}));
// Verify Facebook signature
function verifyRequestSignature(req, _res, buf, encoding) {
    const signature = req.headers["x-hub-signature"];
    if (!signature)
        return;
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
    const port = typeof address === "string" ? address : address === null || address === void 0 ? void 0 : address.port;
    console.log(`Wanderlustie is running on port ${port}`);
    if (config.appUrl && config.verifyToken) {
        console.log("Set webhook/profile with:", `${config.appUrl}/profile?mode=all&verify_token=${config.verifyToken}`);
    }
    if (config.pageId)
        console.log(`Test the bot: https://m.me/${config.pageId}`);
});
