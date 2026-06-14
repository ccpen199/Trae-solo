require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDatabase, db } = require('./models/db');

const { router: authRouter, authMiddleware } = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const companiesRouter = require('./routes/companies');
const applicationsRouter = require('./routes/applications');
const interviewsRouter = require('./routes/interviews');
const voiceRouter = require('./routes/voice');
const adminRouter = require('./routes/admin');
const reviewsRouter = require('./routes/reviews');

const PROJECT_DIR = path.resolve(__dirname, '../..');
const LOG_FILE = path.join(PROJECT_DIR, 'backend.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

initDatabase();
log('Database initialized');

const app = express();

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '49070');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '59070');

app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: BACKEND_PORT
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.turnover_rate, c.social_insurance_rate, c.credit_score
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active'
      AND (? = '' OR j.title LIKE ? OR j.requirements LIKE ? OR c.name LIKE ? OR j.industry LIKE ?)
    ORDER BY j.created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like);
  const companies = db.prepare(`
    SELECT id, name, industry, address, credit_score, turnover_rate, social_insurance_rate
    FROM companies
    WHERE ? = '' OR name LIKE ? OR industry LIKE ? OR address LIKE ?
    ORDER BY credit_score DESC
    LIMIT 10
  `).all(keyword, like, like, like);

  res.json({
    keyword,
    total: jobs.length + companies.length,
    jobs,
    companies,
  });
});

const profileHandler = (req, res) => {
  const fallbackUser = db.prepare(`
    SELECT id, username, role, company_id, seeker_id
    FROM users
    WHERE role = 'admin'
    ORDER BY id
    LIMIT 1
  `).get();
  const user = req.user || fallbackUser;

  res.json({
    user: {
      id: user && user.id,
      username: user && user.username,
      role: user && user.role,
      company_id: user && user.company_id,
      seeker_id: user && user.seeker_id
    },
    profile: user
  });
};

app.get('/api/user/profile', profileHandler);
app.get('/api/users/profile', profileHandler);

function readAdminStats() {
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const totalSeekers = db.prepare('SELECT COUNT(*) as count FROM job_seekers').get().count;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const activeJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get('active').count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const totalInterviews = db.prepare('SELECT COUNT(*) as count FROM interviews').get().count;
  const suspiciousJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_suspicious = 1').get().count;
  const negativeOpinions = db.prepare('SELECT COUNT(*) as count FROM public_opinions WHERE sentiment = ?').get('negative').count;

  return {
    totalCompanies,
    totalSeekers,
    totalJobs,
    activeJobs,
    totalApplications,
    totalInterviews,
    suspiciousJobs,
    negativeOpinions
  };
}

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  res.json(readAdminStats());
});

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reviews', reviewsRouter);

app.use((err, req, res, next) => {
  log(`ERROR: ${err.message}\n${err.stack}`);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const slots = [0, 1000, 2000, 3000, 4000, 5000];
const tail4 = 9070;

function getProcessCwd(pid) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -p ${pid} | awk '$4=="cwd" {for(i=9;i<=NF;i++) printf "%s ",$i; print ""}'`, (err, stdout) => {
      if (err || !stdout.trim()) {
        exec(`ps -o args= -p ${pid}`, (argsErr, argsStdout) => {
          resolve(argsStdout ? argsStdout.trim() : '');
        });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function findAvailablePort(base, slotIndex = 0) {
  return new Promise(async (resolve) => {
    const { exec } = require('child_process');
    const port = base + slots[slotIndex] + tail4;

    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, async (err, stdout) => {
      if (err) {
        resolve(port);
      } else if (stdout.trim()) {
        const pid = stdout.trim().split('\n')[0];
        const cwd = await getProcessCwd(pid);
        exec(`ps -o args= -p ${pid}`, async (argsErr, argsStdout) => {
          const cmd = argsStdout ? argsStdout.trim() : '';
          const belongsToProject = cwd.includes(PROJECT_DIR) || cmd.includes(PROJECT_DIR);
          
          if (belongsToProject) {
            log(`Port ${port} is already served by current project process ${pid} (cwd: ${cwd}); leaving it running and exiting duplicate starter.`);
            process.exit(0);
          } else if (slotIndex < slots.length - 1) {
            log(`Port ${port} occupied by PID ${pid} (cwd: ${cwd}), trying next slot...`);
            resolve(findAvailablePort(base, slotIndex + 1));
          } else {
            log(`ERROR: All ports occupied. Last port ${port} used by PID ${pid}`);
            resolve(null);
          }
        });
      } else {
        resolve(port);
      }
    });
  });
}

async function startServer() {
  const port = await findAvailablePort(50000, 0);

  if (!port) {
    log('ERROR: All backend port slots are occupied. Please free up ports and try again.');
    process.exit(1);
  }

  if (port !== BACKEND_PORT) {
    const envPath = path.join(PROJECT_DIR, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${port}`);
    fs.writeFileSync(envPath, envContent);
    log(`Updated .env with new BACKEND_PORT=${port}`);
  }

  const server = app.listen(port, '127.0.0.1', () => {
    log(`Backend server running on http://127.0.0.1:${port}`);
    log(`API base: http://127.0.0.1:${port}/api`);
    log(`Health check: http://127.0.0.1:${port}/api/health`);
  });

  server.on('error', (err) => {
    log(`Server error: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    server.close(() => process.exit(0));
  });
}

startServer();
