import "dotenv/config";
import express from "express";
import cors from "cors";
import "./data/db.js";
import taskRoutes from "./routes/tasks.js";
import submissionRoutes from "./routes/submissions.js";
import alertRoutes from "./routes/alerts.js";
import transactionRoutes from "./routes/transactions.js";
import userRoutes from "./routes/users.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: FRONTEND_ORIGINS, credentials: true }));
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(`🔑 CORS origins: ${FRONTEND_ORIGINS.join(", ")}`);
});
