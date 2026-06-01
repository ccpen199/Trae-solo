require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 44851;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cityRoutes = require('./routes/cities');
const movieRoutes = require('./routes/movies');
const cinemaRoutes = require('./routes/cinemas');
const scheduleRoutes = require('./routes/schedules');
const orderRoutes = require('./routes/orders');
const bannerRoutes = require('./routes/banners');
const authRoutes = require('./routes/auth');

app.use('/api/cities', cityRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '电影票务服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
