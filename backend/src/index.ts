import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { config } from './config/index.js';
import { managementRouter } from './controllers/management.controller.js';
import { gatewayRouter } from './controllers/gateway.controller.js';
import { TelemetryEngine } from './engines/index.js';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const telemetryEngine = new TelemetryEngine();
telemetryEngine.setWebSocketServer(wss);

app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(config.api.prefix, managementRouter);

app.use('/gateway', gatewayRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: config.server.port,
  });
});

app.get('/ws', (req, res) => {
  res.send({ message: 'WebSocket endpoint - use ws:// protocol' });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  const sendMetrics = () => {
    const metrics = telemetryEngine.getRealTimeMetrics();
    ws.send(JSON.stringify({ type: 'METRICS', data: metrics }));
  };

  const interval = setInterval(sendMetrics, 5000);
  sendMetrics();

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

httpServer.listen(config.server.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           API Gateway Management Platform                    ║
╠════════════════════════════════════════════════════════════╣
║  Backend Server:  http://localhost:${config.server.port}                   ║
║  Frontend URL:    ${config.server.frontendUrl}                    ║
║  API Prefix:      ${config.api.prefix}                             ║
║  Database:        SQLite (${config.database.path})  ║
╠════════════════════════════════════════════════════════════╣
║  Available Endpoints:                                        ║
║    GET    /health              - Health check                ║
║    GET    ${config.api.prefix}/services      - List services               ║
║    POST   ${config.api.prefix}/services      - Create service              ║
║    GET    ${config.api.prefix}/metrics       - Real-time metrics           ║
║    GET    ${config.api.prefix}/alerts        - Recent alerts               ║
║    GET    ${config.api.prefix}/audit-logs    - Audit logs                  ║
║    ALL    /gateway/:serviceCode/*  - Gateway proxy          ║
╠════════════════════════════════════════════════════════════╣
║  WebSocket:      ws://localhost:${config.server.port}                     ║
╚════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer };
