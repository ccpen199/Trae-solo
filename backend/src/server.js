require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');

const leadersRouter = require('./routes/leaders');
const activitiesRouter = require('./routes/activities');
const ordersRouter = require('./routes/orders');
const commissionsRouter = require('./routes/commissions');
const afterSalesRouter = require('./routes/aftersales');

const app = express();
const PORT = process.env.BACKEND_PORT || 58956;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48956}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/leaders', leadersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/aftersales', afterSalesRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
