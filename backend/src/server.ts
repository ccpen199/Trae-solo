import express from "express";
import cors from "cors";
import config from "./config";
import logger from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import healthCheckRoutes from "./routes/healthCheck";
import insuranceRoutes from "./routes/insurance";
import healthArchiveRoutes from "./routes/healthArchive";
import riskWarningRoutes from "./routes/riskWarning";
import adminRoutes from "./routes/admin";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://127.0.0.1:49082",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "health-saas-backend",
    timestamp: new Date().toISOString(),
    environment: config.environment,
  });
});

const demoUser = {
  id: "demo-admin",
  phone: "13800138000",
  name: "演示管理员",
  role: "ADMIN",
  status: "ACTIVE",
};

const emptyList = { list: [], total: 0, page: 1, pageSize: 20 };

app.get("/api/auth/me", (req, res) => {
  res.json({ ok: true, data: demoUser });
});

app.get(["/api/users/profile", "/api/user/profile"], (req, res) => {
  res.json({ ok: true, user: demoUser, profile: demoUser });
});

app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "");
  res.json({
    ok: true,
    keyword: q,
    total: 0,
    packages: [],
    products: [],
    institutions: [],
  });
});

app.get(["/api/admin/stats", "/api/admin/dashboard"], (req, res) => {
  res.json({
    ok: true,
    data: {
      overview: {
        totalUsers: 1286,
        totalInstitutions: 42,
        totalBookings: 536,
        totalInsuranceOrders: 218,
        pendingReviews: 6,
      },
    },
  });
});

app.get("/api/products", (req, res) => {
  res.json({
    ok: true,
    data: {
      list: [
        { id: "health-basic", name: "基础健康体检套餐", type: "health_check", price: 399 },
        { id: "insurance-family", name: "家庭综合医疗保险", type: "insurance", price: 688 },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    },
  });
});

app.get("/api/cart", (req, res) => {
  res.json({ ok: true, data: { items: [], totalAmount: 0 } });
});

app.get(["/api/orders", "/api/bookings", "/api/teachers", "/api/courses"], (req, res) => {
  res.json({ ok: true, data: emptyList });
});

app.use("/api/auth", authRoutes);
app.use("/api/health-check", healthCheckRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/health-archive", healthArchiveRoutes);
app.use("/api/risk-warning", riskWarningRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, "127.0.0.1", () => {
  logger.info(`服务器启动成功，运行在 http://127.0.0.1:${config.port}`);
  logger.info(`环境: ${config.environment}`);
  logger.info(`健康检查: http://127.0.0.1:${config.port}/api/health`);
});

process.on("SIGTERM", () => {
  logger.info("收到 SIGTERM 信号，正在关闭服务器...");
  server.close(() => {
    logger.info("服务器已关闭");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("收到 SIGINT 信号，正在关闭服务器...");
  server.close(() => {
    logger.info("服务器已关闭");
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {
  logger.error("未捕获的异常", { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("未处理的 Promise 拒绝", { reason, promise });
  process.exit(1);
});

export default app;
