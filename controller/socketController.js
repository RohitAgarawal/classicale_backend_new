import { onlineUsers } from "../socket.js";

import mongoose from "mongoose";
import { UserModel } from "../model/user.js";

export default async function verifyuser(userId,socket) {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Invalid userId format:", userId);
    socket.emit("error", { message: "Invalid user ID format" });
    return;
  }

  const user = await UserModel.findById(userId);

  if (!user) {
    console.log("User not found:", userId);
    socket.emit("error", { message: "User not found" });
    return;
  }
}

// remove from socket
export function removeUserFromSocket(userId) {
  for (const [id, socketId] of onlineUsers.entries()) {
    if (id === userId) {
      onlineUsers.delete(id);
      console.log(`User ${id} disconnected`);
      break;
    }
  }
}

// add user to socket 
export function addUserToSocket(userId, socketId) {
  let sockets = onlineUsers.get(userId);
  if (!sockets) {
    sockets = new Set();
    onlineUsers.set(userId, sockets);
  }
  sockets.add(socketId);
  console.log(`User ${userId} connected with socket ${socketId}. Total sockets: ${sockets.size}`);
}