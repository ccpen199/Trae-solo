const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { initDb, allQuery, getQuery, runQuery } = require('./utils/db');

const profilesRouter = require('./routes/profiles');
const matchingRouter = require('./routes/matching');
const matchmakerRouter = require('./routes/matchmaker');
const safetyRouter = require('./routes/safety');
const reportsRouter = require('./routes/reports');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.BACKEND_PORT || 53470);
const host = '127.0.0.1';
const frontendPort = process.env.FRONTEND_PORT || 43470;

const logStream = fs.createWriteStream(path.join(__dirname, '../../backend.log'), { flags: 'a' });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('combined'));

initDb();

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'dating-platform-backend',
    database: 'ok',
    time: new Date().toISOString()
  });
});

app.get('/api/dashboard', (req, res) => {
  const profiles = allQuery('SELECT * FROM profiles WHERE status = ? ORDER BY compatibility DESC LIMIT 20', ['active']);
  const events = allQuery('SELECT * FROM events ORDER BY starts_at ASC LIMIT 10');
  const conversations = allQuery(`
    SELECT c.id, c.last_message, c.last_message_at, c.message_count, c.has_sensitive_words,
           p.name, p.city, p.photo_url, p.real_name_verified
    FROM conversations c
    JOIN profiles p ON p.id = c.profile_id
    ORDER BY c.last_message_at DESC
    LIMIT 10
  `);
  
  const overview = getQuery(`
    SELECT 
      (SELECT COUNT(*) FROM profiles WHERE status = 'active') as total_profiles,
      (SELECT COUNT(*) FROM profiles WHERE real_name_verified = 1 AND photo_verified = 1 AND status = 'active') as verified_profiles,
      (SELECT COUNT(*) FROM matches WHERE status = 'matched') as total_matches,
      (SELECT ROUND(AVG(match_score), 1) FROM matches) as avg_match_score,
      (SELECT COUNT(*) FROM appointments WHERE status != 'cancelled') as total_appointments,
      (SELECT COUNT(*) FROM appointments WHERE a_attended = 1 AND b_attended = 1) as attended_appointments,
      (SELECT COUNT(*) FROM profiles WHERE is_vip = 1 AND status = 'active') as total_vip,
      (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
      (SELECT COUNT(*) FROM complaints WHERE status = 'pending') as pending_complaints
  `);
  
  const stats = {
    verifiedProfiles: overview.verified_profiles,
    totalProfiles: overview.total_profiles,
    averageCompatibility: Math.round(overview.avg_match_score || 0),
    upcomingEvents: events.length,
    activeChats: conversations.length,
    totalMatches: overview.total_matches,
    totalAppointments: overview.total_appointments,
    attendedAppointments: overview.attended_appointments,
    appointmentRate: overview.total_appointments > 0 ? Math.round((overview.attended_appointments / overview.total_appointments) * 100) : 0,
    totalVip: overview.total_vip,
    pendingReports: overview.pending_reports,
    pendingComplaints: overview.pending_complaints,
    verifyRate: overview.total_profiles > 0 ? Math.round((overview.verified_profiles / overview.total_profiles) * 100) : 0,
    matchSuccessRate: overview.total_matches > 0 ? Math.round((overview.total_matches / (overview.total_matches + 10)) * 100) : 0
  };

  res.json({ ok: true, stats, profiles, events, conversations });
});

app.use('/api/profiles', profilesRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/matchmaker', matchmakerRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/events', (req, res) => {
  const events = allQuery(`
    SELECT e.*,
           (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id) as registered_count
    FROM events e
    ORDER BY e.starts_at ASC
  `);
  res.json({ ok: true, events });
});

app.get('/api/events/:id', (req, res) => {
  const event = getQuery('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!event) {
    return res.status(404).json({ ok: false, error: 'event_not_found' });
  }
  
  const registrations = allQuery(`
    SELECT r.*, p.name, p.photo_url, p.real_name_verified
    FROM event_registrations r
    JOIN profiles p ON p.id = r.profile_id
    WHERE r.event_id = ?
  `, [req.params.id]);
  
  res.json({ ok: true, event, registrations });
});

app.post('/api/events/:id/register', (req, res) => {
  const { profile_id } = req.body;
  
  const exists = getQuery('SELECT * FROM event_registrations WHERE event_id = ? AND profile_id = ?',
    [req.params.id, profile_id]);
  if (exists) {
    return res.status(400).json({ ok: false, error: 'already_registered' });
  }
  
  const event = getQuery('SELECT * FROM events WHERE id = ?', [req.params.id]);
  const registeredCount = getQuery('SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = ?',
    [req.params.id]).count;
  
  if (registeredCount >= event.seats) {
    return res.status(400).json({ ok: false, error: 'event_full' });
  }
  
  runQuery(`
    INSERT INTO event_registrations (event_id, profile_id, payment_status, amount)
    VALUES (?, ?, 'completed', ?)
  `, [req.params.id, profile_id, event.fee || 0]);
  
  runQuery('UPDATE events SET registered = registered + 1 WHERE id = ?', [req.params.id]);
  
  runQuery(`
    INSERT INTO audit_logs (action, target_type, target_id, new_value)
    VALUES (?, ?, ?, ?)
  `, ['event_register', 'event', req.params.id, JSON.stringify({ profile_id })]);
  
  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'not_found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ ok: false, error: 'server_error', message: err.message });
});

app.listen(port, host, () => {
  console.log(`Dating platform backend listening on http://${host}:${port}`);
});
