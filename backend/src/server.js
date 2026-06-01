const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const initDatabase = require("./db/init");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const orderRoutes = require("./routes/orders");
const nursingRoutes = require("./routes/nursing");
const dispatchRoutes = require("./routes/dispatch");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

initDatabase();

const app = express();
const host = process.env.BACKEND_HOST || process.env.HOST || "127.0.0.1";
const port = Number.parseInt(process.env.BACKEND_PORT || process.env.PORT || "53456", 10);

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://127.0.0.1:43456",
    `http://${process.env.FRONTEND_HOST || "127.0.0.1"}:${process.env.FRONTEND_PORT || "43456"}`
  ],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.get("/api/health", (req, res) => {
  res.json({
    code: 200,
    message: "服务运行正常",
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    },
    status: "ok",
    service: "may-63456-nursing-service",
    time: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/nursing", nursingRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: "接口不存在", data: null });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: 500, message: "服务内部错误", data: null });
});

app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
