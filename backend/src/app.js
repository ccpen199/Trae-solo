require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRouter = require('./routes/users');
const contentRouter = require('./routes/content');
const assessmentRouter = require('./routes/assessment');
const adminRouter = require('./routes/admin');

require('./database/init');

const app = express();
const PORT = process.env.PORT || 48231;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:48232',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', usersRouter);
app.use('/api/content', contentRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KnowMoreChinese API is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
