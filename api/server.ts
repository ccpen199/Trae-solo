/**
 * local server entry file, for local development
 */
import app from './app.js';
import { WebSocketServer, WebSocket } from 'ws';
import { generateRealtimeVitals } from '../shared/mockData.js';
import { healthDataService } from './services/healthDataService.js';
import { alertService } from './services/alertService.js';

/**
 * start server with port
 */
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59163);
const DEFAULT_USER_ID = 'user-001';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

/**
 * WebSocket Server for realtime data streaming
 */
const wss = new WebSocketServer({ server, path: '/ws/realtime' });

interface ClientData {
  userId: string;
  lastHeartbeat: number;
}

const clients = new Map<WebSocket, ClientData>();

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  clients.set(ws, {
    userId: DEFAULT_USER_ID,
    lastHeartbeat: Date.now(),
  });

  ws.on('message', (data: WebSocket.RawData) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'pong') {
        const client = clients.get(ws);
        if (client) {
          client.lastHeartbeat = Date.now();
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcastToAll(type: string, data: unknown) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const ws of clients.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

setInterval(() => {
  const vital = generateRealtimeVitals();
  healthDataService.addVitalRecord(DEFAULT_USER_ID, vital);

  const baselineHR = healthDataService.getBaselineHeartRate(DEFAULT_USER_ID);
  const percentChange = baselineHR > 0
    ? ((vital.restingHeartRate - baselineHR) / baselineHR) * 100
    : 0;

  broadcastToAll('vitals', {
    ...vital,
    baselineHeartRate: baselineHR,
    heartRateChangePercent: Math.round(percentChange * 10) / 10,
  });

  const newAlerts = alertService.evaluateRules(DEFAULT_USER_ID);
  if (newAlerts.length > 0) {
    broadcastToAll('alerts', newAlerts);
  }
}, 3000);

setInterval(() => {
  const now = Date.now();
  for (const [ws, client] of clients.entries()) {
    if (now - client.lastHeartbeat > 30000) {
      ws.close();
      clients.delete(ws);
    } else if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: now }));
    }
  }
}, 10000);

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
