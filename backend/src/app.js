require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/database');

const authRoutes = require('./routes/auth');
const planetRoutes = require('./routes/planet');
const messageRoutes = require('./routes/message');
const postRoutes = require('./routes/post');

const app = express();
const PORT = process.env.PORT || 47631;

app.use(cors({
  origin: ['http://localhost:47632', 'http://127.0.0.1:47632'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api', planetRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
