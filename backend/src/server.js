require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const materialRoutes = require('./routes/materials');
const progressRoutes = require('./routes/progress');
const resultRoutes = require('./routes/results');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.BACKEND_PORT || 56880;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46880}`,
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/todos', todoRoutes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Credit Repair Backend Server running on http://127.0.0.1:${PORT}`);
});
