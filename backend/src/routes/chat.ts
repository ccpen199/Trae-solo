import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';
import { filterSensitiveWords, checkMessageQuality } from '../utils';

const router = Router();

router.get('/sessions', authMiddleware, (req: AuthRequest, res) => {
  const sessions = db.prepare(`
    SELECT cs.*, 
      CASE WHEN cs.user1_id = ? THEN u2.name ELSE u1.name END as other_name,
      CASE WHEN cs.user1_id = ? THEN u2.avatar ELSE u1.avatar END as other_avatar,
      CASE WHEN cs.user1_id = ? THEN cs.user2_id ELSE cs.user1_id END as other_id,
      SUM(CASE WHEN cm.is_read = 0 AND cm.receiver_id = ? THEN 1 ELSE 0 END) as unread_count
    FROM chat_sessions cs
    LEFT JOIN users u1 ON cs.user1_id = u1.id
    LEFT JOIN users u2 ON cs.user2_id = u2.id
    LEFT JOIN chat_messages cm ON cm.session_id = cs.id
    WHERE cs.user1_id = ? OR cs.user2_id = ?
    GROUP BY cs.id
    ORDER BY cs.last_message_at DESC NULLS LAST
  `).all(req.user!.id, req.user!.id, req.user!.id, req.user!.id, req.user!.id, req.user!.id);
  res.json({ sessions });
});

router.get('/sessions/:sessionId/messages', authMiddleware, (req: AuthRequest, res) => {
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND (user1_id = ? OR user2_id = ?)').get(req.params.sessionId, req.user!.id, req.user!.id);
  if (!session) return res.status(403).json({ error: '无权访问此会话' });
  const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 200').all(req.params.sessionId);
  db.prepare('UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND receiver_id = ? AND is_read = 0').run(req.params.sessionId, req.user!.id);
  res.json({ messages });
});

router.post('/sessions', authMiddleware, auditMiddleware('create_chat_session', 'chat_session'), (req: AuthRequest, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId || targetUserId === req.user!.id) return res.status(400).json({ error: '无效的对话对象' });
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
  if (!target) return res.status(404).json({ error: '用户不存在' });
  let session: any = db.prepare('SELECT * FROM chat_sessions WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').get(req.user!.id, targetUserId, targetUserId, req.user!.id);
  if (!session) {
    const id = uuidv4();
    db.prepare('INSERT INTO chat_sessions (id, tenant_id, user1_id, user2_id) VALUES (?, ?, ?, ?)').run(id, req.user!.tenantId, req.user!.id, targetUserId);
    session = { id };
  }
  res.json({ sessionId: session.id });
});

router.post('/sessions/:sessionId/messages', authMiddleware, (req: AuthRequest, res) => {
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(req.params.sessionId) as any;
  if (!session) return res.status(404).json({ error: '会话不存在' });
  const receiverId = session.user1_id === req.user!.id ? session.user2_id : session.user1_id;
  const { type = 'text', content, fileUrl } = req.body;
  if (!content && !fileUrl) return res.status(400).json({ error: '消息内容不能为空' });
  const filtered = filterSensitiveWords(content || '');
  const quality = checkMessageQuality(content || '');
  const id = uuidv4();
  db.prepare('INSERT INTO chat_messages (id, session_id, sender_id, receiver_id, type, content, file_url, is_blocked, block_reason, quality_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.params.sessionId, req.user!.id, receiverId, type, filtered.text, fileUrl || null, filtered.blocked ? 1 : 0, filtered.matchedWords.join(',') || null, quality.score);
  db.prepare('UPDATE chat_sessions SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(filtered.text.substring(0, 100), req.params.sessionId);
  res.json({ id, message: { id, content: filtered.text, blocked: filtered.blocked, qualityScore: quality.score, created_at: new Date().toISOString() } });
});

router.post('/sessions/:sessionId/read', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND receiver_id = ? AND is_read = 0').run(req.params.sessionId, req.user!.id);
  res.json({ success: true });
});

router.get('/unread/count', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare(`SELECT COUNT(*) as cnt FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cm.receiver_id = ? AND cm.is_read = 0 AND (cs.user1_id = ? OR cs.user2_id = ?)`).get(req.user!.id, req.user!.id, req.user!.id) as { cnt: number };
  res.json({ count: result.cnt });
});

router.get('/quality/stats', authMiddleware, rbacMiddleware('chat', 'read'), (req: AuthRequest, res) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  const blocked = db.prepare('SELECT COUNT(*) as cnt FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.tenant_id = ? AND cm.is_blocked = 1').get(req.user!.tenantId) as { cnt: number };
  const avgQuality = db.prepare('SELECT AVG(quality_score) as avg FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.tenant_id = ?').get(req.user!.tenantId) as { avg: number };
  const lowQuality = db.prepare('SELECT cm.*, u.name as sender_name, cs.id as session_id FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id LEFT JOIN users u ON cm.sender_id = u.id WHERE cs.tenant_id = ? AND cm.quality_score < 0.6 ORDER BY cm.created_at DESC LIMIT 50').all(req.user!.tenantId);
  res.json({ stats: { total: total.cnt, blocked: blocked.cnt, avgQuality: avgQuality.avg || 0, lowQuality } });
});

export default router;
