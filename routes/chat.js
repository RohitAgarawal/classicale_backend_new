import express from "express";
import {
  createConversation,
  deleteConversationForUser,
  fetchAllConversations,
  fetchConversationId,
  fetchMessages,
  getUnreadMessageCount,
  sendImageMessage,
  sendMessage,
  updateAllMessagesStatus,
  deleteMessage,
} from "../controller/chat.js";
import authenticate from "../auth/middle.js";

const router = express.Router();

router.post(
  "/fetch-exsisting-conversationId",
  authenticate,
  fetchConversationId
);
router.post("/send-message", authenticate, sendMessage);
router.get(
  "/get-all-messages/:conversationId",
  authenticate,
  fetchMessages
);
router.get(
  "/get-all-conversations/:userId",
  authenticate,
  fetchAllConversations
);
router.put("/update-message-status", authenticate, updateAllMessagesStatus);
router.get("/unread_message_count", authenticate, getUnreadMessageCount);
router.post("/sent-image", authenticate, sendImageMessage);

router.delete("/delete-conversation/:conversationId", authenticate, deleteConversationForUser);
router.delete("/delete-message/:messageId", authenticate, deleteMessage);
export default router;
