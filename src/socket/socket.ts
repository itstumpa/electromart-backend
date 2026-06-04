// src/socket/socket.ts
import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

let io: SocketServer;

// map userId → socketId so we can send to specific users
const userSocketMap = new Map<string, string>();

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.BACKEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    // frontend sends userId after connecting
    socket.on("register", (userId: string) => {
      userSocketMap.set(userId, socket.id);
      console.log(`🔌 User ${userId} connected → socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      // clean up map on disconnect
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`🔌 User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

// send real-time notification to a specific user
export const sendNotificationToUser = (
  userId: string,
  notification: {
    title: string;
    message: string;
    type: string;
  }
) => {
  const socketId = userSocketMap.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("notification", notification);
  }
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};