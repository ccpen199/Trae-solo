import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import sceneRoutes from './routes/scenes';
import permissionRoutes from './routes/permissions';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const FRONTEND_PORT = process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT) : 46779;
const BACKEND_PORT = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT) : 56779;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/admin', adminRoutes);

const connectedClients = new Map<string, WebSocket>();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  connectedClients.set(clientId, ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'device_state') {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'device_update',
              data: message.data,
              timestamp: Date.now()
            }));
          }
        });
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(clientId);
  });
});

export function broadcastDeviceUpdate(deviceId: string, state: any) {
  const message = JSON.stringify({
    type: 'device_update',
    data: { deviceId, state },
    timestamp: Date.now()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Smart Home Backend running on http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`WebSocket server running on ws://127.0.0.1:${BACKEND_PORT}`);
});

export default app;
