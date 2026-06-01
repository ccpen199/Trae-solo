require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDatabase = require('./database/init');

const app = express();
const PORT = process.env.PORT || 44862;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/search', require('./routes/search'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sports Community API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Sports Community backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
});

module.exports = app;
