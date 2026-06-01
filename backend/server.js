import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/db.js';
import projectsRouter from './src/routes/projects.js';
import participantsRouter from './src/routes/participants.js';
import sessionsRouter from './src/routes/sessions.js';
import taskStepsRouter from './src/routes/taskSteps.js';
import observationsRouter from './src/routes/observations.js';
import issuesRouter from './src/routes/issues.js';
import reportsRouter from './src/routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadRootEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};

  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return env;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return env;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = value;
    return env;
  }, {});
}

const rootEnv = loadRootEnv();
const port = Number(process.env.BACKEND_PORT || rootEnv.BACKEND_PORT || 53477);
const frontendPort = Number(process.env.FRONTEND_PORT || rootEnv.FRONTEND_PORT || 43477);
const host = process.env.HOST || '127.0.0.1';
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, _res, next) => {
  req.db = db;
  next();
});

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'usability-backend', health: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  const participantCount = db.prepare('SELECT COUNT(*) AS count FROM participants').get().count;
  res.json({
    ok: true,
    service: 'usability-backend',
    db: 'sqlite',
    projectCount,
    participantCount,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/summary', (_req, res) => {
  const projects = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  const participants = db.prepare('SELECT COUNT(*) AS count FROM participants').get().count;
  const sessions = db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count;
  const openIssues = db.prepare("SELECT COUNT(*) AS count FROM issues WHERE status != 'resolved'").get().count;
  const completionRate = db.prepare('SELECT AVG(task_completion_rate) AS rate FROM reports').get().rate || 0;

  res.json({ projects, participants, sessions, openIssues, completionRate });
});

app.get('/api/projects/:id/dashboard', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const participants = db.prepare('SELECT * FROM participants WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  const sessions = db.prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY scheduled_at ASC').all(req.params.id);
  const tasks = db.prepare('SELECT * FROM task_steps WHERE project_id = ? ORDER BY step_order ASC').all(req.params.id);
  const observations = db.prepare('SELECT * FROM observations WHERE project_id = ? ORDER BY timestamp_seconds ASC').all(req.params.id);
  const issues = db.prepare('SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  const report = db.prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);

  res.json({ project, participants, sessions, tasks, observations, issues, report });
});

app.use('/api/projects', projectsRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/task-steps', taskStepsRouter);
app.use('/api/observations', observationsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/reports', reportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, host, () => {
  console.log(`usability-backend listening on http://${host}:${port}`);
});
