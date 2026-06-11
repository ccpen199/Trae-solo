import "reflect-metadata";
import { DataSource } from "typeorm";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "../data/app.sqlite"),
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, "../entities/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
  subscribers: [path.join(__dirname, "../subscribers/*.{ts,js}")],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connected successfully");
    }
    return AppDataSource;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
