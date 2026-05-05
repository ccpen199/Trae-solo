import "reflect-metadata";
import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import * as helmet from "helmet";
import { initializeDatabase } from "./config/database";
import routes from "./routes";
import { errorResponse } from "./utils/response";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "22251");

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:22252",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", routes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    if (err instanceof SyntaxError && "body" in err) {
      return res
        .status(400)
        .json(errorResponse("Invalid JSON payload", "INVALID_JSON"));
    }

    return res
      .status(500)
      .json(errorResponse("Internal server error", "INTERNAL_ERROR"));
  }
);

app.use((req, res) => {
  res
    .status(404)
    .json(errorResponse(`Route not found: ${req.method} ${req.path}`, "NOT_FOUND"));
});

const startServer = async () => {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Bug Management System Backend`);
    console.log(`========================================`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${PORT}`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api`);
    console.log(`========================================`);
  });
};

startServer();
