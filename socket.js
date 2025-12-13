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

       // If a socket already exists for this user, disconnect it to prevent duplicates
       const existingSocketId = onlineUsers.get(userId.toString());
       // Multi-device friendly: A user can have multiple active sockets (e.g., from different devices).
       // We store all active socket IDs for a user.
       let userSockets = onlineUsers.get(userId.toString());
       if (!userSockets) {
         userSockets = new Set();
         onlineUsers.set(userId.toString(), userSockets);
       }
       userSockets.add(socket.id);
       console.log(`✅ User ${userId} connected with socket ${socket.id}. Total sockets for user: ${userSockets.size}`);
       
       // Join user to their personal room for reliable message delivery
       const userRoom = `user-${userId}`;
       await socket.join(userRoom);
       console.log(`✅ User ${userId} joined personal room: ${userRoom}`);

       // Handle disconnection
       socket.on("disconnect", () => {
         const disconnectedUserId = userId.toString();
         const socketsForUser = onlineUsers.get(disconnectedUserId);
         if (socketsForUser) {
           socketsForUser.delete(socket.id);
           if (socketsForUser.size === 0) {
             onlineUsers.delete(disconnectedUserId);
             console.log(`❌ User ${disconnectedUserId} has no active sockets left.`);
           } else {
             console.log(`🔌 Socket ${socket.id} disconnected for user ${disconnectedUserId}. Remaining sockets: ${socketsForUser.size}`);
           }
         }
         console.log(`Socket disconnected: ${socket.id}`);
       });

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

    // Admin support: allow admin clients to join a dedicated room
    socket.on("joinAdminSupport", async () => {
      try {
        await socket.join("admin-support");
        console.log("✅ Admin joined support room: admin-support");
      } catch (error) {
        console.error("Error joining admin support:", error);
      }
    });




    socket.on("error", (error) => {
      console.log(`Socket error on ${socket.id}:`, error);
    });
  });
};

export default socketInit;
export { onlineUsers };
