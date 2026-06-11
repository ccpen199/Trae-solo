import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as http from "http";
import { Server as SocketIOServer } from "socket.io";
import { initializeDatabase } from "./database/data-source";
import routes from "./routes";
import { AuthController } from "./controllers/auth.controller";
import { InterviewService } from "./services/interview.service";
import { IMService } from "./services/im.service";
import { SeedService } from "./services/seed.service";

dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || "49078");
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "59078");
const HOST = process.env.HOST || "127.0.0.1";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: `http://${HOST}:${FRONTEND_PORT}`,
    credentials: true,
  },
});

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: `http://${HOST}:${FRONTEND_PORT}`,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));

app.use("/api", routes);

app.get("/", (req: express.Request, res: express.Response) => {
  res.json({
    message: "招聘协同工作台 API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    error: err.message || "服务器内部错误",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-interview", ({ roomId, userId, name, role }) => {
    socket.join(roomId);
    InterviewService.addParticipant(roomId, userId, name, role);
    io.to(roomId).emit("participant-joined", { userId, name, role });
    console.log(`${name} joined interview room: ${roomId}`);
  });

  socket.on("leave-interview", ({ roomId, userId }) => {
    socket.leave(roomId);
    InterviewService.removeParticipant(roomId, userId);
    io.to(roomId).emit("participant-left", { userId });
    console.log(`User ${userId} left interview room: ${roomId}`);
  });

  socket.on("webrtc-offer", ({ roomId, from, to, offer }) => {
    InterviewService.addOffer(roomId, from, to, offer);
    socket.to(roomId).emit("webrtc-offer", { from, offer });
  });

  socket.on("webrtc-answer", ({ roomId, from, to, answer }) => {
    InterviewService.addAnswer(roomId, from, to, answer);
    socket.to(roomId).emit("webrtc-answer", { from, answer });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, from, to, candidate }) => {
    InterviewService.addIceCandidate(roomId, from, candidate);
    socket.to(roomId).emit("webrtc-ice-candidate", { from, candidate });
  });

  socket.on("interview-transcript", ({ roomId, interviewId, transcriptData }) => {
    socket.to(roomId).emit("interview-transcript", transcriptData);
  });

  socket.on("behavior-marker", ({ roomId, marker }) => {
    socket.to(roomId).emit("behavior-marker", marker);
  });

  socket.on("send-message", async ({ senderId, receiverId, content, type }) => {
    try {
      const message = await IMService.sendMessage(senderId, receiverId, type || "text", content);
      io.emit(`new-message-${receiverId}`, message);
      io.emit(`new-message-${senderId}`, message);
    } catch (error) {
      console.error("Send message error:", error);
    }
  });

  socket.on("mark-message-read", async ({ userId, senderId }) => {
    try {
      await IMService.markAsRead(userId, senderId);
      io.emit(`messages-read-${senderId}`, { userId });
    } catch (error) {
      console.error("Mark message read error:", error);
    }
  });

  socket.on("typing", ({ from, to }) => {
    io.emit(`typing-${to}`, { from });
  });

  socket.on("stop-typing", ({ from, to }) => {
    io.emit(`stop-typing-${to}`, { from });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    await AuthController.initDefaultUsers();
    await SeedService.initDemoData();

    server.listen(BACKEND_PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 招聘协同工作台后端服务已启动                              ║
║                                                              ║
║   📡 API 地址:    http://${HOST}:${BACKEND_PORT}                 ║
║   🔍 健康检查:    http://${HOST}:${BACKEND_PORT}/api/health       ║
║   📄 API 文档:    http://${HOST}:${BACKEND_PORT}/api             ║
║                                                              ║
║   🌐 前端地址:    http://${HOST}:${FRONTEND_PORT}                ║
║                                                              ║
║   👤 默认账号:                                                 ║
║      admin / admin123   (管理员)                              ║
║      hr / hr123456      (HR专员)                              ║
║      manager / manager123 (部门经理)                          ║
║      interviewer / interview123 (面试官)                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
