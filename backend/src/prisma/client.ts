import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from '@prisma/client';
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const adapter = new PrismaLibSql({
  url: `file:${resolve(__dirname, "../../dev.db")}`
});

const prisma = new PrismaClient({ adapter });

export default prisma;
