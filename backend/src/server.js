require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');
const { initTestData } = require('./initTestData');
const routes = require('./routes');

const app = express();
const PORT = process.env.API_PORT || process.env.BACKEND_PORT || 58841;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48841}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();
initTestData();

app.use('/api', routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
