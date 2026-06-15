/**
 * Express API server entry point
 * - Local development: starts HTTP server on PORT (default: 4000)
 * - Vercel serverless: exports default handler (detected by VERCEL env)
 */
import { isMainThread } from 'worker_threads';
import type { Request, Response } from 'express';
import app from './app.js';

const PORT = process.env.PORT || 4000;

const isVercelEnv = typeof process.env.VERCEL !== 'undefined';

if (!isVercelEnv && isMainThread) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log(`   Jobs:      http://localhost:${PORT}/api/jobs`);
    console.log(`   Townships: http://localhost:${PORT}/api/townships`);
    console.log(`   Analytics: http://localhost:${PORT}/api/analytics/overview`);
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
