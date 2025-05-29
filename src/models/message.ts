import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  messageType: { type: String, enum: ["text", "image", "button", "payload"], default: "text" }
});

const Message = mongoose.model("Message", messageSchema);
export default Message;