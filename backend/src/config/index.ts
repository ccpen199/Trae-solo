import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const candidateEnvFiles = [
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envFile of candidateEnvFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

interface Config {
  port: number;
  environment: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  encryptionKey: string;
  encryptionIv: string;
  logLevel: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || "59082", 10),
  environment: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "file:../data/app.sqlite",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  encryptionKey: process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef",
  encryptionIv: process.env.ENCRYPTION_IV || "0123456789abcdef",
  logLevel: process.env.LOG_LEVEL || "info",
};

export default config;
