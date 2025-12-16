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
import authenticateUser from "../auth/middle.js";

const router = express.Router();

router.post(
  "/fetch-exsisting-conversationId",
  authenticateUser,
  fetchConversationId
);
router.post("/send-message", authenticateUser, sendMessage);
router.get(
  "/get-all-messages/:conversationId",
  authenticateUser,
  fetchMessages
);
router.get(
  "/get-all-conversations/:userId",
  authenticateUser,
  fetchAllConversations
);
router.put("/update-message-status", authenticateUser, updateAllMessagesStatus);
router.get("/unread_message_count", authenticateUser, getUnreadMessageCount);
router.post("/sent-image", authenticateUser, sendImageMessage);

router.delete("/delete-conversation/:conversationId", deleteConversationForUser);
router.delete("/delete-message/:messageId", authenticateUser, deleteMessage);
export default router;
