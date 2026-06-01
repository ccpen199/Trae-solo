require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/db');

const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guides');
const hotelRoutes = require('./routes/hotels');
const userRoutes = require('./routes/user');
const destinationRoutes = require('./routes/destinations');

const app = express();
const PORT = process.env.BACKEND_PORT || 54865;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 44865}`,
  credentials: true
}));

app.use(express.json());

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/user', userRoutes);
app.use('/api/destinations', destinationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Travel API is running' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
