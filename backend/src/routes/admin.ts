import express from 'express';
import db from '../database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/users', (req: AuthRequest, res) => {
  const users = db.prepare(`
    SELECT id, username, email, phone, wechat, role, plan, meeting_number, 
           recording_space, max_recording_space, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users);
});

router.put('/users/:id/plan', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { plan } = req.body;

  const maxRecordingSpace = plan === 'pro' ? 10000 : 1000;
  db.prepare('UPDATE users SET plan = ?, max_recording_space = ? WHERE id = ?').run(plan, maxRecordingSpace, id);

  res.json({ message: '更新成功' });
});

router.get('/meetings', (req: AuthRequest, res) => {
  const meetings = db.prepare(`
    SELECT m.*, u.username as host_name,
           (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = m.id) as participant_count
    FROM meetings m
    JOIN users u ON m.host_id = u.id
    ORDER BY m.created_at DESC
  `).all();

  res.json(meetings);
});

router.get('/participants/export', (req: AuthRequest, res) => {
  const participants = db.prepare(`
    SELECT mp.*, m.title as meeting_title, u.email as user_email
    FROM meeting_participants mp
    JOIN meetings m ON mp.meeting_id = m.id
    LEFT JOIN users u ON mp.user_id = u.id
    ORDER BY mp.join_time DESC
  `).all();

  res.json(participants);
});

router.get('/recordings', (req: AuthRequest, res) => {
  const recordings = db.prepare(`
    SELECT r.*, m.title as meeting_title, u.username as user_name
    FROM recordings r
    JOIN meetings m ON r.meeting_id = m.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();

  res.json(recordings);
});

router.get('/logs', (req: AuthRequest, res) => {
  const logs = db.prepare(`
    SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100
  `).all();

  res.json(logs);
});

router.get('/stats', (req: AuthRequest, res) => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const meetingCount = (db.prepare('SELECT COUNT(*) as count FROM meetings').get() as any).count;
  const activeMeetingCount = (db.prepare("SELECT COUNT(*) as count FROM meetings WHERE status = 'active'").get() as any).count;
  const totalRecordingSize = (db.prepare('SELECT SUM(file_size) as total FROM recordings').get() as any).total || 0;

  res.json({
    userCount,
    meetingCount,
    activeMeetingCount,
    totalRecordingSize
  });
});

export default router;
