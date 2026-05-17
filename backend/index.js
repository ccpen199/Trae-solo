import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';

try {
  execSync('node database/init.js', { cwd: process.cwd(), stdio: 'inherit' });
} catch (error) {
  console.error('Database init error:', error);
}

import topicsRouter from './routes/topics.js';
import notesRouter from './routes/notes.js';

const app = express();
const PORT = process.env.PORT || 47682;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:47681',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/topics', topicsRouter);
app.use('/api/notes', notesRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});

export default app;
