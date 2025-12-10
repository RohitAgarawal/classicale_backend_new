import mongoose from "mongoose";
import { UserModel } from "./model/user.js";
import verifyuser, {
  addUserToSocket,
  removeUserFromSocket,
} from "./controller/socketController.js";
import { updateMessageStatus } from "./controller/chat.js";

const onlineUsers = new Map(); // userId → socket.id

const socketInit = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
       // verify user
       await verifyuser(userId, socket);
       // Check if userId is already connected
       removeUserFromSocket(userId);
       // Add user to onlineUsers map
       addUserToSocket(userId.toString(), socket.id);
    } else {
       console.log("Connection without userId:", socket.id);
    }
    // Listen for user registration
    socket.on("joinRoom", async (conversationId) => {
      try {
        // Check if userId is valid
        if (!conversationId) {
          socket.emit("error", {
            message: "Invalid chatId",
          });
          return;
        }
        await socket.join(conversationId);
        console.log("Registering user to room:", conversationId);
        socket.emit("joinRoom", {
          message: "User successfully registered to Room",
          conversationId,
        });
      } catch (error) {
        console.error("Error in register event:", error);
        socket.emit("error", {
          message: "Failed to register user",
          details: error.message,
        });
      }
    });

    socket.on("exitRoom", async (conversationId) => {
      try {
        // Check if userId is valid
        if (!conversationId) {
          socket.emit("error", {
            message: "Invalid conversation Id",
          });
          
          return;
        }

        socket.leave(conversationId); // Native socket leave
        console.log("Unregistering from room:", conversationId);
        socket.emit("exitRoomSuccess", {
          message: "User successfully exited from Room",
        });
      } catch (error) {
        console.error("Error in exitRoom event:", error);
        socket.emit("error", {
          message: "Failed to exit room",
          details: error.message,
        });
      }
    });

    socket.on("messageDelivered", async (data) => {
      console.log("Message delivered event:", data._id);
      await updateMessageStatus(data._id);
    });

    socket.on("joinAdminSupport", async () => {
      try {
        await socket.join("admin-support");
        console.log("Admin joined support room");
      } catch (error) {
        console.error("Error joining admin support:", error);
      }
    });

    socket.on("disconnect", () => {
      // Remove disconnected user from onlineUsers list
      for (const [id, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(id);
          console.log(`User ${id} disconnected`);
          break;
        }
      }
    });
    socket.on("error", (error) => {
      console.log(`Socket error on ${socket.id}:`, error);
    });
  });
};

export default socketInit;
export { onlineUsers };
