import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import venueRoutes from './routes/venues.js';
import eventRoutes from './routes/events.js';
import sessionRoutes from './routes/sessions.js';
import orderRoutes from './routes/orders.js';
import ticketRoutes from './routes/tickets.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import { seedTestData } from './seed.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 59029;

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 49029}`,
    `http://localhost:${process.env.FRONTEND_PORT || 49029}`
  ],
  credentials: true
}));

app.get('/favicon.ico', (req, res) => {
  res.type('image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill="#667eea"/>
    <text x="50" y="68" font-size="50" text-anchor="middle" fill="white">🎫</text>
  </svg>`);
});

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ide/v1/text_to_image', (req, res) => {
  const prompt = String(req.query.prompt || 'ticket event poster')
    .replace(/[<>&"']/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  const palette = ['#667eea', '#764ba2', '#f6ad55', '#38b2ac'];
  const seed = Array.from(prompt).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const primary = palette[seed % palette.length];
  const secondary = palette[(seed + 1) % palette.length];

  res.type('image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${primary}"/>
        <stop offset="1" stop-color="${secondary}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <circle cx="320" cy="54" r="74" fill="rgba(255,255,255,.18)"/>
    <circle cx="70" cy="250" r="92" fill="rgba(255,255,255,.12)"/>
    <rect x="44" y="72" width="312" height="156" rx="18" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
    <text x="200" y="138" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="700">泛文娱票务</text>
    <text x="200" y="176" text-anchor="middle" fill="rgba(255,255,255,.9)" font-family="Arial, sans-serif" font-size="18">${prompt.slice(0, 24)}</text>
  </svg>`);
});

app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  try {
    initDatabase();
    seedTestData();
    
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
      console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
