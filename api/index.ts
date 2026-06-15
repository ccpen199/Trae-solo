/**
 * Express API server entry point
 * - Local development: starts HTTP server on BACKEND_PORT/PORT
 * - Vercel serverless: exports default handler (detected by VERCEL env)
 */
import { isMainThread } from 'worker_threads';
import type { Request, Response } from 'express';
import app from './app.js';

const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59210);

const isVercelEnv = typeof process.env.VERCEL !== 'undefined';

if (!isVercelEnv && isMainThread) {
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server ready on http://${HOST}:${PORT}`);
    console.log(`   Health:    http://${HOST}:${PORT}/api/health`);
    console.log(`   Jobs:      http://${HOST}:${PORT}/api/jobs`);
    console.log(`   Townships: http://${HOST}:${PORT}/api/townships`);
    console.log(`   Analytics: http://${HOST}:${PORT}/api/analytics/overview`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
