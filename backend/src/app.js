const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDatabase } = require('./models/database');
const { seedDatabase } = require('./models/seed');
const routes = require('./routes');

const app = express();
const PORT = process.env.BACKEND_PORT || 45855;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ code: 200, msg: 'Server is running' });
});

const startServer = async () => {
  try {
    await initDatabase();
    await seedDatabase();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
