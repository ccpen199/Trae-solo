import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';
import { generateShareCode } from '../utils';

const router = Router();

router.get('/leads', authMiddleware, rbacMiddleware('lead', 'read'), (req: AuthRequest, res) => {
  const { status, industry, region, keyword } = req.query;
  let sql = 'SELECT * FROM leads WHERE tenant_id = ?';
  const params: any[] = [req.user!.tenantId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (industry) { sql += ' AND industry = ?'; params.push(industry); }
  if (region) { sql += ' AND region LIKE ?'; params.push(`%${region}%`); }
  if (keyword) { sql += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY updated_at DESC LIMIT 200';
  const leads = db.prepare(sql).all(...params);
  res.json({ leads: leads.map((l: any) => ({ ...l, tags: l.tags ? JSON.parse(l.tags) : [] })) });
});

router.post('/leads', authMiddleware, rbacMiddleware('lead', 'create'), auditMiddleware('create_lead', 'lead'), (req: AuthRequest, res) => {
  const { name, company, position, phone, email, industry, region, source, tags = [], notes } = req.body;
  if (!name) return res.status(400).json({ error: '姓名必填' });
  const id = uuidv4();
  db.prepare('INSERT INTO leads (id, tenant_id, owner_id, name, company, position, phone, email, industry, region, source, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user!.tenantId, req.user!.id, name, company, position, phone, email, industry, region, source, JSON.stringify(tags), notes);
  res.json({ id });
});

router.put('/leads/:id', authMiddleware, rbacMiddleware('lead', 'update'), auditMiddleware('update_lead', 'lead'), (req: AuthRequest, res) => {
  const { name, company, position, phone, email, industry, region, source, status, tags, notes } = req.body;
  db.prepare('UPDATE leads SET name = COALESCE(?, name), company = COALESCE(?, company), position = COALESCE(?, position), phone = COALESCE(?, phone), email = COALESCE(?, email), industry = COALESCE(?, industry), region = COALESCE(?, region), source = COALESCE(?, source), status = COALESCE(?, status), tags = COALESCE(?, tags), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?')
    .run(name, company, position, phone, email, industry, region, source, status, tags ? JSON.stringify(tags) : null, notes, req.params.id, req.user!.tenantId);
  res.json({ success: true });
});

router.delete('/leads/:id', authMiddleware, rbacMiddleware('lead', 'update'), auditMiddleware('delete_lead', 'lead'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM leads WHERE id = ? AND tenant_id = ?').run(req.params.id, req.user!.tenantId);
  res.json({ success: true });
});

router.post('/push/job', authMiddleware, rbacMiddleware('push', 'create'), auditMiddleware('push_job', 'push'), (req: AuthRequest, res) => {
  const { jobId, industry, region, experienceLevel } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND tenant_id = ?').get(jobId, req.user!.tenantId) as any;
  if (!job) return res.status(404).json({ error: '岗位不存在' });
  let sql = 'SELECT id FROM users WHERE role = ?';
  const params: any[] = ['jobseeker'];
  if (region) { sql += ' AND id IN (SELECT user_id FROM resumes WHERE location LIKE ?)'; params.push(`%${region}%`); }
  const users = db.prepare(sql).all(...params);
  const insertPush = db.prepare('INSERT INTO push_records (id, tenant_id, job_id, target_user_id, content, channel, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, tenant_id, type, title, content) VALUES (?, ?, ?, ?, ?, ?)');
  let count = 0;
  users.forEach((u: any) => {
    insertPush.run(uuidv4(), req.user!.tenantId, jobId, u.id, `精准推荐：${job.title}`, 'system', 'sent');
    insertNotif.run(uuidv4(), u.id, req.user!.tenantId, 'job_push', '新岗位推荐', `${job.title} - ${job.location || '远程'}`);
    count++;
  });
  res.json({ pushed: count });
});

router.get('/business-card/my', authMiddleware, (req: AuthRequest, res) => {
  let card = db.prepare('SELECT * FROM business_cards WHERE user_id = ?').get(req.user!.id) as any;
  if (!card) {
    const id = uuidv4();
    const user = db.prepare('SELECT name, email, phone, avatar FROM users WHERE id = ?').get(req.user!.id) as any;
    const tenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(req.user!.tenantId) as any;
    db.prepare('INSERT INTO business_cards (id, user_id, tenant_id, name, title, company, phone, email, avatar, share_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user!.id, req.user!.tenantId, user?.name || '', '', tenant?.name || '', user?.phone || '', user?.email || '', user?.avatar || '', generateShareCode());
    card = db.prepare('SELECT * FROM business_cards WHERE id = ?').get(id);
  }
  const traces = db.prepare('SELECT * FROM card_share_traces WHERE card_id = ? ORDER BY created_at DESC LIMIT 50').all(card.id);
  res.json({ card, traces });
});

router.post('/business-card', authMiddleware, auditMiddleware('update_business_card', 'business_card'), (req: AuthRequest, res) => {
  const { name, title, company, phone, email, wechat, avatar } = req.body;
  let card = db.prepare('SELECT id FROM business_cards WHERE user_id = ?').get(req.user!.id) as any;
  if (card) {
    db.prepare('UPDATE business_cards SET name = COALESCE(?, name), title = COALESCE(?, title), company = COALESCE(?, company), phone = COALESCE(?, phone), email = COALESCE(?, email), wechat = COALESCE(?, wechat), avatar = COALESCE(?, avatar) WHERE user_id = ?')
      .run(name, title, company, phone, email, wechat, avatar, req.user!.id);
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO business_cards (id, user_id, tenant_id, name, title, company, phone, email, wechat, avatar, share_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user!.id, req.user!.tenantId, name || '', title || '', company || '', phone || '', email || '', wechat || '', avatar || '', generateShareCode());
  }
  res.json({ success: true });
});

router.get('/business-card/share/:shareCode', (req, res) => {
  const card = db.prepare('SELECT * FROM business_cards WHERE share_code = ?').get(req.params.shareCode) as any;
  if (!card) return res.status(404).json({ error: '名片不存在' });
  const sharerId = card.user_id;
  const traceId = uuidv4();
  db.prepare('INSERT INTO card_share_traces (id, card_id, sharer_id, ip) VALUES (?, ?, ?, ?)').run(traceId, card.id, sharerId, req.ip);
  db.prepare('UPDATE business_cards SET views = views + 1 WHERE id = ?').run(card.id);
  res.json({ card, traceId });
});

router.post('/business-card/convert/:traceId', (req, res) => {
  db.prepare('UPDATE card_share_traces SET is_conversion = 1 WHERE id = ?').run(req.params.traceId);
  const trace = db.prepare('SELECT card_id FROM card_share_traces WHERE id = ?').get(req.params.traceId) as any;
  if (trace) db.prepare('UPDATE business_cards SET conversions = conversions + 1 WHERE id = ?').run(trace.card_id);
  res.json({ success: true });
});

router.get('/push/records', authMiddleware, rbacMiddleware('push', 'read'), (req: AuthRequest, res) => {
  const records = db.prepare('SELECT pr.*, j.title as job_title, u.name as target_name FROM push_records pr LEFT JOIN jobs j ON pr.job_id = j.id LEFT JOIN users u ON pr.target_user_id = u.id WHERE pr.tenant_id = ? ORDER BY pr.created_at DESC LIMIT 100').all(req.user!.tenantId);
  res.json({ records });
});

export default router;
