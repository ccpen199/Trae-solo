const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initTables } = require('./models/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.BACKEND_PORT || 56882;

app.use(cors({
  origin: ['http://127.0.0.1:46882', 'http://localhost:46882'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initTables();

app.use('/api', routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
