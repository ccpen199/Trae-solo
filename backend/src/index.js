require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 44852;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./database/connection');

app.use('/api/cities', require('./routes/cities'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/cinemas', require('./routes/cinemas'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'hiyou backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 hiyou backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
});

module.exports = app;
