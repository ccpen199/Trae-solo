import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config';
import { initKnex, closeDatabaseConnection } from './database/connection';
import { authenticate as authMiddleware, optionalAuth as optionalAuthMiddleware } from './middleware/auth';

import authRoutes from './routes/auth-routes';
import patientRoutes from './routes/patient-routes';
import visitRoutes from './routes/visit-routes';
import prescriptionRoutes from './routes/prescription-routes';
import labRoutes from './routes/lab-routes';
import auditRoutes from './routes/audit-routes';
import reportRoutes from './routes/report-routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/visits', authMiddleware, visitRoutes);
app.use('/api/prescriptions', authMiddleware, prescriptionRoutes);
app.use('/api/lab', authMiddleware, labRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.server.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

interface WebSocketClient extends WebSocket {
  userId?: string;
  roles?: string[];
  isAlive?: boolean;
}

const clients = new Map<string, Set<WebSocketClient>>();

wss.on('connection', (ws: WebSocketClient) => {
  console.log('New WebSocket connection');
  ws.isAlive = true;

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'authenticate':
          ws.userId = message.userId;
          ws.roles = message.roles || [];
          
          if (!clients.has(message.userId)) {
            clients.set(message.userId, new Set());
          }
          clients.get(message.userId)?.add(ws);
          
          console.log(`WebSocket authenticated: user ${message.userId}, roles: ${ws.roles?.join(', ') || []}`);
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            timestamp: new Date().toISOString(),
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.get(ws.userId)?.delete(ws);
      if (clients.get(ws.userId)?.size === 0) {
        clients.delete(ws.userId);
      }
    }
    console.log('WebSocket disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

export const broadcastToUser = (userId: string, message: any) => {
  const userClients = clients.get(userId);
  if (userClients) {
    const messageStr = JSON.stringify(message);
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
};

export const broadcastToRole = (role: string, message: any) => {
  const messageStr = JSON.stringify(message);
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.roles?.includes(role) && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  });
};

export const broadcastToAll = (message: any) => {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

const PORT = config.server.port;

async function startServer() {
  try {
    await initKnex();
    
    httpServer.listen(PORT, config.server.host, () => {
      const dbType = config.database.type === 'sqlite' ? 'SQLite' : `PostgreSQL:${config.database.port}`;
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    EMR System - 电子病历系统                     ║
╠═══════════════════════════════════════════════════════════════╣
║  API Server:    http://localhost:${PORT}                         ║
║  WebSocket:     ws://localhost:${PORT}/ws                         ║
║  Environment:   ${config.server.nodeEnv}                                          ║
║  Database:      ${dbType}${dbType.length < 15 ? ' '.repeat(15 - dbType.length) : ''}                     ║
║  Redis:         ${config.redis.host}:${config.redis.port}                                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Default Accounts:                                               ║
║  - Admin:        admin / Emr@2024Secure                        ║
║  - Doctor:       doctor1 / Emr@2024Secure                      ║
║  - Nurse:        nurse1 / Emr@2024Secure                       ║
║  - Pharmacist:   pharmacist1 / Emr@2024Secure                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Core Engines:                                                   ║
║  - Structured Entry Engine:  ✓ Enabled                          ║
║  - CDSS Engine:              ✓ Enabled                          ║
║  - Digital Sign Engine:      ✓ Enabled                          ║
║  - Audit Engine:             ✓ Enabled                          ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await closeDatabaseConnection();
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await closeDatabaseConnection();
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, httpServer, wss };
