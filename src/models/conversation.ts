import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  status: { type: String, enum: ["active", "ended"], default: "active" },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  contextTags: [String] // e.g. ["budget", "japan", "foodie"] for AI memory
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
