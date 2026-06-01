import { Router } from 'express';
import { getDb } from '../db/init.js';
import { auth } from '../middleware/auth.js';
import { success, error, paginate } from '../utils/response.js';

const router = Router();

function addAuditLog(userId, action, targetType, targetId, detail, ip) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address) VALUES (?,?,?,?,?,?)`
  ).run(userId, action, targetType, targetId, JSON.stringify(detail || {}), ip || '');
}

router.get('/conversations', auth, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  const userId = req.user.id;
  const total = db.prepare(
    `SELECT COUNT(*) as cnt FROM chat_conversations WHERE employer_id = ? OR worker_id = ?`
  ).get(userId, userId).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT cc.*,
       e.nickname as employer_nickname, e.avatar as employer_avatar,
       w.nickname as worker_nickname, w.avatar as worker_avatar,
       j.title as job_title
     FROM chat_conversations cc
     LEFT JOIN users e ON cc.employer_id = e.id
     LEFT JOIN users w ON cc.worker_id = w.id
     LEFT JOIN jobs j ON cc.job_id = j.id
     WHERE cc.employer_id = ? OR cc.worker_id = ?
     ORDER BY cc.last_message_at DESC
     LIMIT ? OFFSET ?`
  ).all(userId, userId, Number(pageSize), offset);
  res.json(paginate(list, total, page, pageSize));
});

router.post('/conversations', auth, (req, res) => {
  const { job_id, employer_id, worker_id } = req.body;
  if (!job_id || !employer_id || !worker_id) {
    return res.status(400).json(error('job_id、employer_id、worker_id 为必填'));
  }
  const db = getDb();
  let conv = db.prepare(
    `SELECT * FROM chat_conversations WHERE job_id = ? AND employer_id = ? AND worker_id = ?`
  ).get(job_id, employer_id, worker_id);
  if (!conv) {
    const result = db.prepare(
      `INSERT INTO chat_conversations (job_id, employer_id, worker_id) VALUES (?,?,?)`
    ).run(job_id, employer_id, worker_id);
    conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(result.lastInsertRowid);
    addAuditLog(req.user.id, 'create_conversation', 'chat_conversation', conv.id, { job_id, employer_id, worker_id }, req.ip);
  }
  res.json(success(conv));
});

router.get('/conversations/:id/messages', auth, (req, res) => {
  const { page = 1, pageSize = 30 } = req.query;
  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json(error('会话不存在'));
  if (conv.employer_id !== req.user.id && conv.worker_id !== req.user.id) {
    return res.status(403).json(error('无权查看此会话'));
  }
  const total = db.prepare(
    'SELECT COUNT(*) as cnt FROM chat_messages WHERE conversation_id = ?'
  ).get(req.params.id).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT cm.*, u.nickname as sender_nickname, u.avatar as sender_avatar
     FROM chat_messages cm LEFT JOIN users u ON cm.sender_id = u.id
     WHERE cm.conversation_id = ?
     ORDER BY cm.created_at ASC
     LIMIT ? OFFSET ?`
  ).all(req.params.id, Number(pageSize), offset);
  res.json(paginate(list, total, page, pageSize));
});

router.post('/conversations/:id/messages', auth, (req, res) => {
  const { content, message_type } = req.body;
  if (!content) return res.status(400).json(error('消息内容不能为空'));
  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json(error('会话不存在'));
  if (conv.employer_id !== req.user.id && conv.worker_id !== req.user.id) {
    return res.status(403).json(error('无权发送消息'));
  }
  const result = db.prepare(
    `INSERT INTO chat_messages (conversation_id, sender_id, content, message_type) VALUES (?,?,?,?)`
  ).run(req.params.id, req.user.id, content, message_type || 'text');
  db.prepare(
    `UPDATE chat_conversations SET last_message = ?, last_message_at = datetime('now','localtime') WHERE id = ?`
  ).run(content.slice(0, 200), req.params.id);
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'send_message', 'chat_message', result.lastInsertRowid, { conversation_id: Number(req.params.id) }, req.ip);
  res.json(success(msg));
});

router.put('/messages/:id/read', auth, (req, res) => {
  const db = getDb();
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json(error('消息不存在'));
  if (msg.sender_id === req.user.id) return res.status(400).json(error('不能标记自己的消息'));
  db.prepare('UPDATE chat_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json(success({ id: Number(req.params.id), is_read: 1 }));
});

router.post('/conversations/:id/interview', auth, (req, res) => {
  const { proposed_time, location, notes } = req.body;
  if (!proposed_time) return res.status(400).json(error('提议时间为必填'));
  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json(error('会话不存在'));
  if (conv.employer_id !== req.user.id && conv.worker_id !== req.user.id) {
    return res.status(403).json(error('无权操作'));
  }
  const result = db.prepare(
    `INSERT INTO interview_appointments (conversation_id, job_id, proposed_time, location, notes) VALUES (?,?,?,?,?)`
  ).run(req.params.id, conv.job_id, proposed_time, location || '', notes || '');
  db.prepare(
    `INSERT INTO chat_messages (conversation_id, sender_id, content, message_type) VALUES (?,?,?,?)`
  ).run(req.params.id, req.user.id, `面试邀请: ${proposed_time}`, 'interview_invite');
  addAuditLog(req.user.id, 'propose_interview', 'interview_appointment', result.lastInsertRowid, { proposed_time, location }, req.ip);
  const appointment = db.prepare('SELECT * FROM interview_appointments WHERE id = ?').get(result.lastInsertRowid);
  res.json(success(appointment));
});

router.get('/conversations/:id/interviews', auth, (req, res) => {
  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json(error('会话不存在'));
  if (conv.employer_id !== req.user.id && conv.worker_id !== req.user.id) {
    return res.status(403).json(error('无权查看'));
  }
  const list = db.prepare(
    'SELECT * FROM interview_appointments WHERE conversation_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json(success(list));
});

router.put('/interviews/:id', auth, (req, res) => {
  const { status, confirmed_time } = req.body;
  if (!['confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json(error('状态仅支持 confirmed 或 cancelled'));
  }
  const db = getDb();
  const interview = db.prepare('SELECT * FROM interview_appointments WHERE id = ?').get(req.params.id);
  if (!interview) return res.status(404).json(error('面试预约不存在'));
  db.prepare(
    `UPDATE interview_appointments SET status = ?, confirmed_time = ? WHERE id = ?`
  ).run(status, confirmed_time || '', req.params.id);
  addAuditLog(req.user.id, `interview_${status}`, 'interview_appointment', Number(req.params.id), { status, confirmed_time }, req.ip);
  const updated = db.prepare('SELECT * FROM interview_appointments WHERE id = ?').get(req.params.id);
  res.json(success(updated));
});

export default router;
