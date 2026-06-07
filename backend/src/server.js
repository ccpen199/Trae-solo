const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const jobSeekerRoutes = require('./routes/jobSeekers');
const applicationRoutes = require('./routes/applications');
const enterpriseRoutes = require('./routes/enterprises');
const jdTemplateRoutes = require('./routes/jdTemplates');
const interviewRoutes = require('./routes/interviews');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59064');
const PROJECT_DIR = '/Users/chen/Documents/trae_projects/local_projects/may-89064';

const frontendPort = parseInt(process.env.FRONTEND_PORT || '49064');

app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    project: 'Manufacturing Recruitment SaaS',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-seekers', jobSeekerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/jd-templates', jdTemplateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, (err, stdout) => {
      if (stdout && stdout.trim()) {
        const pid = stdout.trim().split('\n')[0];
        exec(`ps -o cwd= -p ${pid}`, (err2, cwdOut) => {
          const cwd = cwdOut?.trim() || '';
          if (cwd.startsWith(PROJECT_DIR)) {
            exec(`kill ${pid}`, () => {
              console.log(`Killed existing process ${pid} on port ${port} (cwd: ${cwd})`);
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
};

const startServer = async () => {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`Port ${PORT} is occupied by another project. Please check or use an alternate port.`);
    process.exit(1);
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`========================================`);
    console.log(`Manufacturing Recruitment SaaS Backend`);
    console.log(`========================================`);
    console.log(`Server running on: http://127.0.0.1:${PORT}`);
    console.log(`API base:         http://127.0.0.1:${PORT}/api`);
    console.log(`Health check:     http://127.0.0.1:${PORT}/api/health`);
    console.log(`Frontend URL:     http://127.0.0.1:${frontendPort}`);
    console.log(`Database:         SQLite (${process.env.DATABASE_URL})`);
    console.log(`========================================`);
    console.log(`Test accounts:`);
    console.log(`  - admin / 123456 (管理员)`);
    console.log(`  - hr1 / 123456 (企业HR)`);
    console.log(`  - seeker1 / 123456 (求职者)`);
    console.log(`========================================`);
  });
};

startServer();
