const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const schemeRoutes = require('./routes/schemes');
const essayRoutes = require('./routes/essays');
const materialRoutes = require('./routes/materials');
const applicationRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.BACKEND_PORT || 58828;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/essays', essayRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务器运行在 http://127.0.0.1:${PORT}`);
});
