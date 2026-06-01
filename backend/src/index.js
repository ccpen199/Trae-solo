const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const {
  initDb, listReports, getReport, createReport, updateReport,
  listClues, listCluesWithDistance, getClue, createClue, updateClue,
  listVerifications, createVerification, updateVerification,
  listTasks, getTask, createTask, updateTask,
  listCases, createCase,
  stats, dashboardFull
} = require('./db');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.BACKEND_PORT || 53468);
const host = '127.0.0.1';
const frontendPort = process.env.FRONTEND_PORT || 43468;

app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true
}));
app.use(express.json());

initDb();

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'pet-recovery-backend',
    database: 'ok',
    time: new Date().toISOString()
  });
});

app.get('/api/dashboard', (req, res) => {
  const dashboard = dashboardFull();
  res.json(dashboard);
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({ ok: true, dashboard: dashboardFull() });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({ ok: true, stats: stats() });
});

app.get('/api/reports', (req, res) => {
  const reports = listReports(req.query);
  res.json({ ok: true, reports });
});

app.get('/api/reports/:id', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, report });
});

app.post('/api/reports', (req, res) => {
  const body = req.body || {};
  if (!body.pet_name || !body.species || !body.area) {
    res.status(400).json({ ok: false, error: 'missing_required_fields' });
    return;
  }
  try {
    const created = createReport({
      pet_name: body.pet_name,
      species: body.species,
      breed: body.breed || '',
      color: body.color || '',
      features: body.features || '',
      chip_number: body.chip_number || '',
      photo_urls: body.photo_urls || '',
      lost_location: body.lost_location || body.area || '',
      lost_lat: body.lost_lat || 0,
      lost_lng: body.lost_lng || 0,
      lost_time: body.lost_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      area: body.area,
      reward: body.reward || '',
      contact_name: body.contact_name || '登记人',
      contact_phone: body.contact_phone || body.contact || '',
      contact_public_scope: body.contact_public_scope || 'phone',
      status: body.status || 'lost',
      description: body.description || ''
    });
    res.status(201).json({ ok: true, report: created });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch('/api/reports/:id', (req, res) => {
  const updated = updateReport(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, report: updated });
});

app.get('/api/clues', (req, res) => {
  const query = req.query || {};
  if (query.max_distance || query.with_distance) {
    const filters = { ...query };
    if (query.max_distance) filters.max_distance = parseInt(query.max_distance);
    const clues = listCluesWithDistance(filters);
    res.json({ ok: true, clues });
  } else {
    const clues = listClues(query);
    res.json({ ok: true, clues });
  }
});

app.get('/api/reports/:id/full', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  const clues = listCluesWithDistance({ report_id: req.params.id });
  const verifications = listVerifications({ report_id: req.params.id });
  res.json({ ok: true, report, clues, verifications });
});

app.get('/api/clues/:id', (req, res) => {
  const clue = getClue(req.params.id);
  if (!clue) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, clue });
});

app.post('/api/clues', (req, res) => {
  const body = req.body || {};
  if (!body.report_id || !body.sighting_location || !body.submitter_name) {
    res.status(400).json({ ok: false, error: 'missing_required_fields' });
    return;
  }
  try {
    const created = createClue({
      report_id: body.report_id,
      sighting_location: body.sighting_location,
      sighting_lat: body.sighting_lat || 0,
      sighting_lng: body.sighting_lng || 0,
      photo_url: body.photo_url || '',
      sighting_time: body.sighting_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      credibility: body.credibility || 'medium',
      description: body.description || '',
      submitter_name: body.submitter_name,
      submitter_phone: body.submitter_phone || '',
      status: body.status || 'pending'
    });
    res.status(201).json({ ok: true, clue: created });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch('/api/clues/:id', (req, res) => {
  const updated = updateClue(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, clue: updated });
});

app.get('/api/verifications', (req, res) => {
  const verifications = listVerifications(req.query);
  res.json({ ok: true, verifications });
});

app.post('/api/verifications', (req, res) => {
  const body = req.body || {};
  if (!body.clue_id || !body.report_id) {
    res.status(400).json({ ok: false, error: 'missing_required_fields' });
    return;
  }
  try {
    const created = createVerification({
      clue_id: body.clue_id,
      report_id: body.report_id,
      owner_action: body.owner_action || 'pending',
      contact_made: body.contact_made ? 1 : 0,
      meeting_arranged: body.meeting_arranged ? 1 : 0,
      meeting_time: body.meeting_time || '',
      meeting_location: body.meeting_location || '',
      result: body.result || ''
    });
    res.status(201).json({ ok: true, verification: created });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch('/api/verifications/:id', (req, res) => {
  const updated = updateVerification(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, verification: updated });
});

app.get('/api/tasks', (req, res) => {
  const tasks = listTasks(req.query);
  res.json({ ok: true, tasks });
});

app.get('/api/tasks/:id', (req, res) => {
  const task = getTask(req.params.id);
  if (!task) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, task });
});

app.post('/api/tasks', (req, res) => {
  const body = req.body || {};
  if (!body.task_type || !body.title) {
    res.status(400).json({ ok: false, error: 'missing_required_fields' });
    return;
  }
  try {
    const created = createTask({
      report_id: body.report_id || 0,
      task_type: body.task_type,
      title: body.title,
      area: body.area || '',
      description: body.description || '',
      priority: body.priority || 'medium',
      max_volunteers: body.max_volunteers || 10,
      status: body.status || 'open',
      assigned_volunteers: body.assigned_volunteers || ''
    });
    res.status(201).json({ ok: true, task: created });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  const updated = updateTask(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  res.json({ ok: true, task: updated });
});

app.get('/api/cases', (req, res) => {
  const cases = listCases(req.query);
  res.json({ ok: true, cases });
});

app.post('/api/cases', (req, res) => {
  const body = req.body || {};
  if (!body.report_id || !body.closure_type) {
    res.status(400).json({ ok: false, error: 'missing_required_fields' });
    return;
  }
  try {
    const created = createCase({
      report_id: body.report_id,
      closure_type: body.closure_type,
      summary: body.summary || '',
      reward_settled: body.reward_settled ? 1 : 0,
      reward_note: body.reward_note || '',
      experience: body.experience || ''
    });
    updateReport(body.report_id, { status: 'found' });
    res.status(201).json({ ok: true, case: created });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({ ok: true, stats: stats() });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' });
});

app.listen(port, host, () => {
  console.log(`Pet recovery backend listening on http://${host}:${port}`);
});
