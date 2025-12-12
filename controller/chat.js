import { CommunicateModel } from "../model/chat.js";
import { BikeModel } from "../model/bike.js";
import { BookSportHobbyModel } from "../model/book_sport_hobby.js";
import { CarModel } from "../model/car.js";
import { ConversationModel } from "../model/conversation.js";
import { ElectronicModel } from "../model/electronic.js";
import { FurnitureModel } from "../model/furniture.js";
import { JobModel } from "../model/job.js";
import { OtherModel } from "../model/other.js";
import { PetModel } from "../model/pet.js";
import { ProductTypeModel } from "../model/product_type.js";
import { PropertyModel } from "../model/property.js";
import { ServicesModel } from "../model/services.js";
import { SmartPhoneModel } from "../model/smart_phone.js";
import { io } from "../index.js";
import { onlineUsers } from "../socket.js";
import { saveBase64Image } from "../utils/image_store.js";
import mongoose from "mongoose";
const productModels = {
  Bike: BikeModel,
  Car: CarModel,
  book_sport_hobby: BookSportHobbyModel,
  electronic: ElectronicModel,
  furniture: FurnitureModel,
  Job: JobModel,
  pet: PetModel,
  smart_phone: SmartPhoneModel,
  services: ServicesModel,
  other: OtherModel,
  property: PropertyModel,
};
export const createConversation = async (req, res) => {
  console.log(req.body);
  const { userId, productId, productTypeId } = req.body;
  console.log("userId", userId);

  try {
    // find model by id
    const productType = await ProductTypeModel.findById(productTypeId);
    if (!productType) {
      throw new Error("Product type not found");
    }

    const modelName = productType.modelName;

    const Model = productModels[modelName];

    // Fetch the user who added the product
    const addProductUser = await Model.findById(productId);

    if (!addProductUser) {
      throw new Error("Product not found");
    }
    // Check if the product is active
    if (!addProductUser.isActive) {
      throw new Error("Product is not active");
    }

    if (addProductUser.isDeleted) {
      throw new Error("Product is deleted");
    }

    if (!addProductUser.userId) {
      throw new Error("User not found");
    }
    const addProductUserId = addProductUser.userId;
    // Check if the userId and addProductUserId are the same
    console.log("userId", userId);
    console.log("addProductUserId", addProductUserId);
    if (userId == addProductUserId) {
      throw new Error("Cannot create conversation with yourself");
    }
    // Check if a conversation already exists for this product
    let conversation = await ConversationModel.findOne({
      participants: { $all: [userId, addProductUserId] },
      product: productId, // Re-enabled to keep conversations separate per product
    }).sort({ updatedAt: -1 });

    // If a conversation exists for this product, return it
    if (conversation) {
      console.log(`✅ Found existing conversation ${conversation._id} for product ${productId}`);
      return conversation;
    }
    
    // No conversation exists for this product - create a new one
    console.log(`📝 Creating new conversation for product ${productId}`);
    conversation = await ConversationModel.create({
      participants: [userId, addProductUserId],
      product: productId,
      productTypeId: productTypeId,
    });
    console.log(`✅ Created new conversation ${conversation._id}`);
    return conversation;
  } catch (error) {
    console.log("Error creating conversation:", error);
    throw error;
  }
};

export const sendMessage = async (req, res) => {
  try {
    let {
      senderId,
      productId,
      type,
      conversationId,
      content,
      metaData,
      productTypeId,
      status,
    } = req.body;

    // Validate the request body
    if (!senderId) {
      return res.status(400).json({
        message: "Sender Id  is missing",
      });
    }
    if (!productId) {
      return res.status(400).json({
        message: "Product Id  is missing",
      });
    }
    if (!type) {
      return res.status(400).json({
        message: "Message type  is missing",
      });
    }
    if (!content) {
      return res.status(400).json({
        message: "Message content  is missing",
      });
    }
    if (!metaData) {
      return res.status(400).json({
        message: "Metadata  is missing",
      });
    }
    if (!productTypeId) {
      return res.status(400).json({
        message: "ProductType Id  is missing",
      });
    }
    if (!status) {
      return res.status(400).json({
        message: "Status  is missing",
      });
    }
    let conversation;

    if (!conversationId) {
      // No conversation ID provided - create or find one
      conversation = await createConversation({
        body: { userId: senderId, productId, productTypeId },
      });
      conversationId = conversation._id;
    } else {
      // Conversation ID provided - verify it exists and matches the product
      conversation = await ConversationModel.findById(conversationId);
      
      if (!conversation) {
        // Conversation doesn't exist - create new one
        conversation = await createConversation({
          body: {
            userId: senderId,
            productId,
            productTypeId,
          },
        });
        conversationId = conversation._id;
      } else if (conversation.product.toString() !== productId.toString()) {
        // Conversation exists but for different product - find or create correct one
        console.log(`⚠️ Conversation ${conversationId} is for product ${conversation.product}, but message is for product ${productId}`);
        conversation = await createConversation({
          body: {
            userId: senderId,
            productId,
            productTypeId,
          },
        });
        conversationId = conversation._id;
        console.log(`✅ Using correct conversation ${conversationId} for product ${productId}`);
      }
      // else: conversation exists and matches product - use it as is
    }
    if (type === "text") {
      try {
        // Find the recipient
        const recipientId = conversation.participants.find(
          (id) => id.toString() !== senderId
        );

        // Remove both users from deletedBy array in conversation
        await ConversationModel.findByIdAndUpdate(conversationId, {
          $pull: {
            deletedBy: {
              $in: [senderId, recipientId],
            },
          },
        });

        const newMessage = await CommunicateModel.create({
          chatId: conversationId,
          senderId: senderId,
          productId: productId,
          type: type,
          content: content,
          metaData: metaData,
          status: status,
          deletedBy: [], // Initialize empty deletedBy array
        });

        // Populate senderId for the response
        await newMessage.populate("senderId");

        // console.log("response", newMessage);
        console.log("senderId", senderId);
        console.log("recipientId", recipientId);

        // Convert IDs to strings for consistent comparison
        const recipientIdStr = recipientId.toString();
        const senderIdStr = senderId.toString();
        const conversationIdStr = conversationId.toString();

        console.log("Checking socket connections:");
        console.log("All online users:", Array.from(onlineUsers.entries()));

        // Get socket IDs
        const recipientSocketId = onlineUsers.get(recipientIdStr);
        const senderSocketId = onlineUsers.get(senderIdStr);

        console.log(
          `Recipient socket ID (${recipientIdStr}):`,
          recipientSocketId
        );
        console.log(`Sender socket ID (${senderIdStr}):`, senderSocketId);

        // Emit to conversation room first
        console.log(`📤 Emitting message to room: ${conversationIdStr}`);
        
        // Get all sockets in the room to verify who will receive the message
        const socketsInRoom = await io.in(conversationIdStr).fetchSockets();
        console.log(`👥 Sockets in room ${conversationIdStr}:`, socketsInRoom.length);
        socketsInRoom.forEach(socket => {
          console.log(`  - Socket ID: ${socket.id}`);
        });
        
        io.to(conversationIdStr).emit("message", {
          type: "new_message",
          data: newMessage,
        });
        
        console.log(`✅ Message emitted to room ${conversationIdStr}`);

        // Send notifications to individual sockets
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("notification", {
            type: "new_message",
            data: newMessage,
          });
        }

        if (senderSocketId) {
          io.to(senderSocketId).emit("notification", {
            type: "message_sent",
            data: newMessage,
          });
        }

        // Notify both users to refresh their chat lists
        console.log(`📤 Emitting fetchAPI to update chat lists`);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("fetchAPI", {
            message: "fetch conversations",
            conversationId: conversationIdStr,
          });
          console.log(`📤 fetchAPI sent to recipient: ${recipientIdStr}`);
        }
        if (senderSocketId) {
          io.to(senderSocketId).emit("fetchAPI", {
            message: "fetch conversations",
            conversationId: conversationIdStr,
          });
          console.log(`📤 fetchAPI sent to sender: ${senderIdStr}`);
        }
///
        return res.status(200).json({
          message: "Message sent successfully",
          status: 200,
          data: newMessage,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    } else if (type === "image") {
    } else if (type === "pdf") {
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    // Emit the message to the socket
    // socket.emit("message", newMessage);

    res
      .status(200)
      .json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.log("Error sending message:", error);
    res.status(500).json({ message: error.message });
  }
};

export const fetchConversationId = async (req, res) => {
  const { userId, productId } = req.body; // productId maps to the peer user logic if needed, but here we just need participants.
  // Ideally, frontend sends `productUserId` or we derive it.
  // BUT: existing logic finds conversation based on participants and product.
  // We need to know who the OTHER participant is to find the conversation.
  // The current frontend sends `userId` and `productId`.
  // We need to find the OWNER of the product to know the other participant.

  try {
    // We first need to find the product owner to know who we are chating with
    // However, the original code assumed `participants: { $all: [userId] }` was enough combined with `product: productId`.
    // Wait, the original code was:
    // participants: { $all: [userId] },
    // product: productId,
    //
    // If we remove `product: productId`, we might find ANY conversation involving `userId`.
    // That's wrong. We need to find the conversation with the SPECIFIC PEER.
    // The `fetchConversationId` seems to only take `userId` and `productId`.
    // It does NOT take the peer ID explicitly in the body?
    // Let's re-read the original `fetchConversationId` carefully.
    // Original:
    // const conversation = await ConversationModel.findOne({
    //   participants: { $all: [userId] },
    //   product: productId,
    //   deletedBy: { $ne: userId },
    // });
    //
    // Use Case: "Do I have a conversation about THIS product?"
    // Now Use Case: "Do I have a conversation with the OWNER of this product?"
    //
    // So we need to look up the product owner first.

    // Let's rely on `createConversation` logic which does the heavy lifting of finding the owner?
    // Or we can duplicate the lookup logic here.
    // But `fetchConversationId` seems to be used to check "does it exist?".
    // If I simply remove `product`, it finds `findOne({participants: userId})` which is just ANY conversation the user has.
    // That is a BUG if I blindly remove `product`.

    // FIX: We need to find the product owner first to identifying the participants.

    // 1. Find Product to get Owner
    // We don't know the Model Type here easily? `createConversation` had `productTypeId`.
    // The request body here ONLY has `userId` and `productId`.
    // This makes it hard to know which Collection to query for the product owner.

    // Let's attempt to find the conversation by product FIRST (legacy way)
    // If found, great.
    // If NOT found, we want to find if there is a conversation with that user.
    // But we don't know the user!

    // Wait, if `fetchConversationId` is called, it might strictly expect a conversation about that product?
    // If I change the logic to "User to User", `fetchConversationId` returning a conversation ID associated with a DIFFERENT product
    // is exactly what we want.

    // ISSUE: We cannot easily identify the 'other user' without querying the product.
    // And we can't query the product without knowing the `productType` (Schema).
    // The current `fetchConversationId` impl relies on `product: productId` in the conversation document itself.

    // ALTERNATIVE:
    // If the frontend calls `createConversation` instead of `fetchConversationId` when entering a chat, it will handle the finding/creation.
    // Lets look at frontend `setUserId` in `ChatDetailsScreen`.
    // It calls `chatProvider.conversationList(body)`.
    // Let's check `conversationList` in `chat_provider.dart`. (Not visible, but likely calls an endpoint).
    // The endpoint used is likely `fetchConversationId` or `createConversation`.

    // If I look at `chat.js`, `fetchConversationId` implementation was weak.
    // It only checks `participants: { $all: [userId] }` and `product: productId`.
    // This implies "Conversation involving ME about PRODUCT X".
    // Since `product` is unique in the old model, this identified the unique conversation.
    //
    // In the NEW model, a conversation might be about Product Y, but involves the same users.
    // So searching by `product: productId` will fail if the existing conversation is stamped with Product Y.
    // But searching ONLY by `userId` will return some random conversation with ANYONE.
    //
    // To support `fetchConversationId` correctly for the new model, we MUST know the peer ID.
    // But the API signature is `req.body: { userId, productId }`.
    //
    // Does the frontend send `productTypeId`?
    // In `ChatDetailsScreen` (frontend):
    // Map<String, dynamic> body = {
    //   "userId": userId,
    //   "productId": productId,
    //   "productUserId": productUserId,  <-- LOOK! Frontend sends `productUserId`!
    //   "productTypeId": productTypeId,
    // };
    //
    // Ah, the frontend sends `productUserId`!
    // But the backend `fetchConversationId` (lines 270-271) destructures ONLY: `const { userId, productId } = req.body;`.
    //
    // I should update the backend to use `productUserId` if available!
    // If the frontend sends `productUserId`, we can find the conversation between `userId` and `productUserId`.

    const { userId, productUserId, productId } = req.body;

    let query = {};
    if (productUserId && productId) {
       // Look for conversation with specific participants AND product
       query = {
          participants: { $all: [userId, productUserId] },
          product: productId, // ✅ Must match product
          deletedBy: { $ne: userId }
       };
       console.log(`🔍 Looking for conversation: users [${userId}, ${productUserId}], product: ${productId}`);
    } else if (productUserId) {
       // Fallback: only participants (backward compatibility)
       query = {
          participants: { $all: [userId, productUserId] },
          deletedBy: { $ne: userId }
       };
       console.log(`⚠️ Looking for conversation without product filter (missing productId)`);
    } else {
       return res.status(400).json({ message: "productUserId and productId are required for fetching conversation" });
    }

    const conversation = await ConversationModel.findOne(query).sort({ updatedAt: -1 });

    if (!conversation) {
      console.log(`❌ No conversation found`);
      return res.status(201).json({ message: "Conversation not found" });
    }

    console.log(`✅ Found conversation ${conversation._id} for product ${conversation.product}`);
    res.status(200).json({
      message: "Conversation found",
      status: 200,
      data: conversation,
    });
  } catch (error) {
    console.error("Error fetching conversation ID:", error);
    res.status(500).json({ message: "Error fetching conversation ID:", error });
  }
};

// export const fetchAllConversations = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const conversations = await ConversationModel.find({
//       participants: { $all: [userId] },
//     })
//       .populate(
//         "participants",
//         "_id name email profileImage phone fName lName mName gender"
//       )
//       .populate("productTypeId");

//     if (!conversations || conversations.length === 0) {
//       return res.status(404).json({ message: "Conversations not found" });
//     }

//     // Enhance each conversation with last message and unread count
//     const enhancedConversations = await Promise.all(
//       conversations.map(async (conversation) => {
//         const lastMessage = await CommunicateModel.findOne({
//           chatId: conversation._id,
//         })
//           .populate(
//             "senderId",
//             "_id name email profileImage phone fName lName mName gender"
//           )
//           .sort({ createdAt: -1 })
//           .lean();

//         const unreadCount = await CommunicateModel.countDocuments({
//           chatId: conversation._id,
//           senderId: { $ne: userId }, // not sent by current user
//           status: { $ne: "read" },
//         });

//         return {
//           ...conversation.toObject(),
//           lastMessage,
//           unreadCount,
//         };
//       })
//     );

//     res.status(200).json({
//       message: "Conversations fetched successfully",
//       status: 200,
//       data: enhancedConversations,
//     });
//   } catch (error) {
//     console.error("Error fetching conversations:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

export const fetchAllConversations = async (req, res) => {
  const { userId } = req.params; // current user

  try {
    /* 1️⃣  Filter: exclude conversations soft‑deleted by this user */
    const conversations = await ConversationModel.find({
      participants: { $all: [userId] }, // user is a participant
      deletedBy: { $nin: [userId] }, // <-- NOT deleted by this user
    })
      .populate(
        "participants",
        "_id name email profileImage phone fName lName mName gender"
      )
      .populate("productTypeId");
    console.log("conversations", conversations);

    if (!conversations.length) {
      return res
        .status(404)
        .json({ message: "Conversations not found", status: 404 });
    }

    /* 2️⃣  Enhance with lastMessage + unreadCount as before */
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await CommunicateModel.findOne({
          chatId: conversation._id,
          deletedBy: { $nin: [userId] }, // Don't show messages deleted by this user
        })
          .populate(
            "senderId",
            "_id name email profileImage phone fName lName mName gender"
          )
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await CommunicateModel.countDocuments({
          chatId: conversation._id,
          senderId: { $ne: userId }, // not current user
          status: { $ne: "read" },
          deletedBy: { $nin: [userId] }, // Don't count deleted messages
        });

        const productSchemaModel = conversation.productTypeId.modelName;
        const ProductModel = productModels[productSchemaModel];
        let product = null;
        if (ProductModel) {
          product = await ProductModel.findById(conversation.product).select(
            "title images isActive isDeleted"
          );
        }

        return {
          ...conversation.toObject(),
          lastMessage,
          unreadCount,
          product,
        };
      })
    );

    return res.status(200).json({
      message: "Conversations fetched successfully",
      status: 200,
      data: enhancedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error, status: 500 });
  }
};

export const fetchMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await CommunicateModel.find({
      chatId: conversationId,
      deletedBy: { $nin: [req.user._id] }, // Use $nin for array field
    })
      .populate(
        "senderId",
        "_id name email profileImage phone fName lName mName gender"
      )
      .sort({ createdAt: 1 });
    console.log("Request user ID:", req.user._id);
    // console.log("Fetched messages:", messages);
    if (!messages || messages.length === 0) {
      // Added check for empty array
      return res.status(404).json({ message: "Messages not found" });
    }

    res.status(200).json({
      message: "Messages fetched successfully",
      status: 200,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// update message status
export const updateMessageStatus = async (messageId) => {
  try {
    const updatedMessage = await CommunicateModel.findByIdAndUpdate(
      messageId,
      {
        status: "delivered",
      },
      { new: true } // returns the updated document instead of the original
    );

    if (!updatedMessage) {
      io.emit("messageDeliveredError", {
        message: "Message not found",
        error: "Message not found",
      });
    }
    io.emit("messageDelivered", {
      message: "Message status updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    io.emit("messageDeliveredError", {
      message: "Error updating message status",
      error: error.message,
    });
    // res.status(500).json({ message: "Internal server error" });
  }
};

// get userId and conversationId then update the all messages to delivered if it is not sent by the userId
export const updateAllMessagesStatus = async (req, res) => {
  const { userId, conversationId } = req.body;

  try {
    // Step 1: Find all matching messages
    const messagesToUpdate = await CommunicateModel.find({
      chatId: conversationId,
      senderId: { $ne: userId },
      status: { $ne: "read" },
    });

    if (messagesToUpdate.length === 0) {
      return res.status(404).json({ message: "No unread messages to update" });
    }

    // Step 2: Update each message and collect updated versions
    const updatedMessages = await Promise.all(
      messagesToUpdate.map(async (msg) => {
        msg.status = "read";
        return await msg.save(); // Save the updated message and return it
      })
    );

    // Step 3: Send updated messages in response
    res.status(200).json({
      message: "Messages status updated successfully",
      status: 200,
      data: updatedMessages,
    });
  } catch (error) {
    console.error("Error updating messages status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//unread message count
export const getUnreadMessageCount = async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const unreadCount = await CommunicateModel.countDocuments({
      senderId: { $ne: userId }, // not sent by the user
      status: { $ne: "read" }, // not yet read
      receiverId: userId, // optional: only if you store receiverId
    });

    res.status(200).json({
      message: "Unread message count fetched successfully",
      status: 200,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// sent image message
export const sendImageMessage = async (req, res) => {
  try {
    const { chatId, senderId, productId, type, content, metaData, status } =
      req.body;
    const { fileName, fileSize, mimeType } = metaData;

    if (
      !chatId ||
      !senderId ||
      !productId ||
      !type ||
      !content ||
      !metaData ||
      !status
    ) {
      // return array of missing field
      const missingFields = [];
      if (!chatId) missingFields.push("chatId");
      if (!senderId) missingFields.push("senderId");
      if (!productId) missingFields.push("productId");
      if (!type) missingFields.push("type");
      if (!content) missingFields.push("content");
      if (!metaData) missingFields.push("metaData");

      if (metaData) {
        if (!fileName) missingFields.push("metaData.fileName");
        if (!fileSize) missingFields.push("metaData.fileSize");
        if (!mimeType) missingFields.push("metaData.mimeType");
      }
      if (!status) missingFields.push("status");
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Validate that the conversation exists and matches the product
    const conversation = await ConversationModel.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Verify the conversation is for the correct product
    if (conversation.product.toString() !== productId.toString()) {
      return res.status(400).json({ 
        message: "Product mismatch",
        error: `Conversation ${chatId} is for product ${conversation.product}, but image is for product ${productId}`
      });
    }

    const imageURL = saveBase64Image(
      content,
      `chat/images/${senderId}`,
      fileName
    );
    if (!imageURL) {
      return res.status(500).json({ message: "Failed to save image" });
    }
    const imageName = imageURL.split("/").pop();
    const newMessage = await CommunicateModel.create({
      chatId,
      senderId,
      productId,
      type,
      content: imageURL, // Store the URL of the saved image
      metaData: {
        imageName,
        fileSize,
        mimeType,
      },
      status,
    });

    // Update the conversation with the new message
    await newMessage.save();
    // Populate senderId
    await newMessage.populate("senderId");
    if (!newMessage) {
      return res.status(404).json({ message: "Message creation failed" });
    }
    
    // Identify recipient (the other participant) - conversation already fetched above
    const recipientId = conversation.participants.find(
      (id) => id.toString() !== senderId
    );
    console.log("recipientId", recipientId);
    
    // Notify about new message (metadata refresh)
    const onlineUserSocketId = onlineUsers.get(recipientId.toString());
    const onlineSenderSocketId = onlineUsers.get(senderId.toString());
    
    if (onlineUserSocketId) {
      io.to(onlineUserSocketId).emit("fetchAPI", {
        message: "fetch message",
        conversationId: chatId.toString(),
      });
    }
    if (onlineSenderSocketId) {
      io.to(onlineSenderSocketId).emit("fetchAPI", {
        message: "fetch message",
        conversationId: chatId.toString(),
      });
    }

    // Broadcast message to the conversation room (both participants should be joined)
    io.to(chatId.toString()).emit("message", newMessage);

    res.status(200).json({
      message: "Image message sent successfully",
      status: 200,
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending image message:", error);
    res.status(500).json({ message: error.message });
  }
};

//conversation delete for user
export const deleteConversationForUser = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId || req.body.userId;

  try {
    // Find conversation and validate
    const conv = await ConversationModel.findById(conversationId);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is a participant
    if (!conv.participants.map((id) => id.toString()).includes(userId)) {
      return res.status(403).json({ message: "Not your conversation" });
    }

    // Check if already deleted by this user
    if (conv.deletedBy.includes(userId)) {
      return res.status(200).json({ message: "Already deleted" });
    }

    try {
      // Add user to deletedBy array in conversation
      conv.deletedBy.push(userId);
      await conv.save();

      // Add deletedBy field to all messages in this conversation for this user
      await CommunicateModel.updateMany(
        {
          chatId: conversationId,
          deletedBy: { $ne: userId }, // Only update if not already deleted by this user
        },
        {
          $addToSet: { deletedBy: userId },
        }
      );

      return res.status(200).json({
        message:
          "Conversation and associated messages soft deleted successfully",
        status: 200,
      });
    } catch (error) {
      console.error("Error in delete operation:", error);
      throw error;
    }
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ message: "Internal server error", status: 500 });
  }
};
