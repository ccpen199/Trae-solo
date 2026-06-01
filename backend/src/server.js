require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const routes = require('./routes');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || 58909);

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48909}`,
  credentials: true
}));

app.use(express.json());
app.use('/api', routes);

initDatabase();

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
