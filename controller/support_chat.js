
import { SupportChatModel } from "../model/support_chat.js";
import { SupportMessageModel } from "../model/support_message.js";
import { UserModel } from "../model/user.js";
import { io } from "../index.js";
import { onlineUsers } from "../socket.js"; // Needs to be exported from socket.js or managed similarly
import { saveBase64Image } from "../utils/image_store.js";

// Create or Get Chat for a User
export const createOrGetChat = async (req, res) => {
  const { userId } = req.body;

  try {
    let chat = await SupportChatModel.findOne({ userId });

    if (!chat) {
      chat = await SupportChatModel.create({ userId });
    }

    res.status(200).json({
      message: "Chat fetched successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error creating/getting support chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send Message
export const sendMessage = async (req, res) => {
  const { userId, senderRole, content, type, metaData } = req.body;

  try {
    // 1. Find or create the chat
    let chat = await SupportChatModel.findOne({ userId });
    if (!chat) {
      chat = await SupportChatModel.create({ userId });
    }

    const chatId = chat._id;

    // 2. Handle Content (Image vs Text)
    let finalContent = content;
    if (type === "image") {
       // Assuming metaData contains fileName for image save logic
       // Reuse existing image save logic if available or just save B64
       const fileName = metaData?.fileName || `support_${Date.now()}.png`;
       const imageURL = saveBase64Image(content, `support/images/${userId}`, fileName);
       if(!imageURL) {
            return res.status(500).json({ message: "Failed to save image" });
       }
       finalContent = imageURL;
    }

    // 3. Create Message
    const newMessage = await SupportMessageModel.create({
      chatId,
      senderId: senderRole === 'user' ? userId : null, // Admin doesn't have senderId in this simple model? Or we pass it? 
      senderRole,
      content: finalContent,
      type,
      status: "sent",
    });

    // 4. Update Chat (last message, unread count)
    // If Admin sent it, increment user's unread count? 
    // If User sent it, increment unread count for Admin (but admin panel usually fetches all).
    // Let's just track unread for the "other" party if needed. 
    // For now, update lastMessage.
    chat.lastMessage = newMessage._id;
    await chat.save();

    // 5. Real-time Notification
    // Emit to the specific User's socketroom (usually their userId) AND 'admin-support-room'
    
    // Convert IDs to strings
    const chatIdStr = chatId.toString();
    const userIdStr = userId.toString();

    // Emit to room (User should join their own userId room or specific chatId room)
    io.to(chatIdStr).emit("support_message", newMessage); 
    
    // Also emit to Admin specific room if exists, or just broadcast to all admins? 
    // For simplicity, admins join 'admin-support' room.
    io.to("admin-support").emit("support_message", { ...newMessage.toObject(), userId }); 

    res.status(200).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending support message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Messages for a Chat
export const getMessages = async (req, res) => {
  const { userId } = req.params; // Or query param

  try {
    const chat = await SupportChatModel.findOne({ userId });
    if (!chat) {
       return res.status(200).json({ data: [] }); // No chat yet
    }

    const messages = await SupportMessageModel.find({ chatId: chat._id }).sort({ createdAt: 1 });
    
    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching support messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Chats (For Admin)
export const getAllSupportChats = async (req, res) => {
  try {
    let chats = await SupportChatModel.find({})
      .populate("userId", "fName mName lName email profileImage")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    // Transform chats to get last index of name arrays
    chats = chats.map((chat) => {
      if (chat.userId) {
        const getLast = (arr) => (Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : "");
        
        chat.userId.fName = getLast(chat.userId.fName);
        chat.userId.mName = getLast(chat.userId.mName);
        chat.userId.lName = getLast(chat.userId.lName);
        chat.userId.profileImage = getLast(chat.userId.profileImage);
      }
      return chat;
    });

    res.status(200).json({
      message: "All support chats fetched",
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching all support chats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
