import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { initDB } from './db/index.js';
import courseRoutes from './routes/courses.js';
import coachRoutes from './routes/coaches.js';
import rankingRoutes from './routes/rankings.js';
import challengeRoutes from './routes/challenges.js';
import userRoutes from './routes/users.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 48271;

app.use(cors({
  origin: [`http://localhost:${process.env.FRONTEND_PORT || 48272}`],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.use('/api/courses', courseRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误',
    data: null
  });
});

const initServer = async () => {
  try {
    initDB();
    console.log('Database initialized successfully');

    const server = app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    const wss = new WebSocketServer({ server, path: '/ws' });
    
    wss.on('connection', (ws) => {
      console.log('New WebSocket connection for smart device data');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(message));
            }
          });
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      });

      ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initServer();
