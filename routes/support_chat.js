
import express from "express";
import {
  createOrGetChat,
  sendMessage,
  getMessages,
  getAllSupportChats,
} from "../controller/support_chat.js";

const router = express.Router();

router.post("/create-get-chat", createOrGetChat);
router.post("/send-message", sendMessage);
router.get("/get-messages/:userId", getMessages);
router.get("/get-all-chats", getAllSupportChats); // Admin protected route ideally

export default router;
