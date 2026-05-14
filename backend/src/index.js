require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./database');
const routes = require('./routes');

const app = express();
const port = process.env.BACKEND_PORT || 9851;

app.use(cors({
  origin: `http://localhost:${process.env.FRONTEND_PORT || 9852}`,
  credentials: true
}));
app.use(express.json());

app.use('/api', routes);

db.init().then(() => {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});