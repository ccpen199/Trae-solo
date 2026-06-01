require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const { authenticate } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const scaleRoutes = require('./routes/scales');
const planRoutes = require('./routes/plans');
const assessmentRoutes = require('./routes/assessments');
const resultRoutes = require('./routes/results');
const interventionRoutes = require('./routes/interventions');
const todoRoutes = require('./routes/todos');
const userRoutes = require('./routes/users');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 56883;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46883}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/scales', authenticate, scaleRoutes);
app.use('/api/plans', authenticate, planRoutes);
app.use('/api/assessments', authenticate, assessmentRoutes);
app.use('/api/results', authenticate, resultRoutes);
app.use('/api/interventions', authenticate, interventionRoutes);
app.use('/api/todos', authenticate, todoRoutes);
app.use('/api/users', authenticate, userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
