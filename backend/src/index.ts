import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb } from './db/index.js';
import booksRouter from './routes/books.js';
import notesRouter from './routes/notes.js';
import sessionsRouter from './routes/sessions.js';
import statsRouter from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || '59194', 10);
const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const API_PREFIX = process.env.API_PREFIX || '/api';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean);

const app = express();

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDb();

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'reader-knowledge-backend',
    version: '1.0.0',
  });
});

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok', message: 'Reader Knowledge API running' });
});

app.use(`${API_PREFIX}/books`, booksRouter);
app.use(`${API_PREFIX}/notes`, notesRouter);
app.use(`${API_PREFIX}/sessions`, sessionsRouter);
app.use(`${API_PREFIX}/stats`, statsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

app.listen(PORT, HOST, () => {
  console.log(`\n📚 Reader Knowledge Backend`);
  console.log(`   Server running on http://${HOST}:${PORT}`);
  console.log(`   API prefix: ${API_PREFIX}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
