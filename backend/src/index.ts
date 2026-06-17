import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const PORT = parseInt(process.env.PORT || "4000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", apiRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "广西全域数字生活操作系统 - 后端服务",
    version: "1.0.0",
    status: "running",
    docs: {
      "GET /api/health": "健康检查",
      "GET /api/user/profile": "用户信息",
      "GET /api/services?role=citizen": "服务列表",
      "GET /api/news": "实时资讯",
      "GET /api/gov/documents": "公文列表",
      "GET /api/gov/meetings": "会议列表",
      "GET /api/gov/tasks": "任务列表",
      "GET /api/tour/spots": "景区列表",
      "POST /api/tour/complaints": "提交文旅投诉",
      "GET /api/livelihood/subsidies?type=elderly": "补贴申请",
      "GET /api/livelihood/insurance": "医保信息",
      "GET /api/monitor/sla": "SLA监控数据",
      "GET /api/monitor/policies": "政策兑现数据",
    },
  });
});

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: "接口不存在" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: "服务器内部错误", error: err.message });
});

app.listen(PORT, () => {
  console.log("=" .repeat(60));
  console.log("  广西全域数字生活操作系统 - 后端服务");
  console.log("=" .repeat(60));
  console.log(`  🚀 服务地址:  http://localhost:${PORT}`);
  console.log(`  📡 API 前缀:  http://localhost:${PORT}/api`);
  console.log(`  🌐 健康检查:  http://localhost:${PORT}/api/health`);
  console.log(`  💻 前端地址:  ${FRONTEND_URL}`);
  console.log(`  🔓 CORS 来源: ${FRONTEND_URL}`);
  console.log("=" .repeat(60));
});
