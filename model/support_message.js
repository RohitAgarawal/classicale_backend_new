
import mongoose from "mongoose";

const SupportMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportChat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required if senderRole is user, can be null if admin? 
      // Actually, plan said senderRole. Let's keep senderId for User refs.
    },
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

export const SupportMessageModel = mongoose.model(
  "SupportMessage",
  SupportMessageSchema
);
