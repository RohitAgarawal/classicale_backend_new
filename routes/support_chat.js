
import express from "express";
import {
  createOrGetChat,
  sendMessage,
  getMessages,
  getAllSupportChats,
} from "../controller/support_chat.js";

import authenticate from "../auth/middle.js";

const router = express.Router();

router.post("/create-get-chat", authenticate, createOrGetChat);
router.post("/send-message", authenticate, sendMessage);
router.get("/get-messages/:userId", authenticate, getMessages);
router.get("/get-all-chats", authenticate, getAllSupportChats); // Admin protected route ideally

export default router;
