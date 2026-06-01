require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./models/db');
const recipeRoutes = require('./routes/recipes');
const materialRoutes = require('./routes/materials');
const priceRoutes = require('./routes/prices');
const costRoutes = require('./routes/costs');
const quoteRoutes = require('./routes/quotes');

const app = express();
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '56892');

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46892}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/recipes', recipeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/quotes', quoteRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${BACKEND_PORT}`);
});

module.exports = app;
