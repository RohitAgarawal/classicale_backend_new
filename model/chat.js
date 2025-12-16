import mongoose from "mongoose";
const metaDataSchema = new mongoose.Schema({
  fileName: { type: String, default: null },
  fileSize: { type: String, default: null },
  mimeType: { type: String, default: null },
});

const CommunicateSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "conversation" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    type: { type: String, enum: ["text", "image", "pdf"] },
    content: { type: String },
    metaData: {
      type: metaDataSchema,
    },
    status: { type: String, enum: ["sent", "delivered", "read"] },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const CommunicateModel = mongoose.model("Chats", CommunicateSchema);
