import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, rbacMiddleware('resume', 'read'), (req: AuthRequest, res) => {
  const { keyword, experience, skill } = req.query;
  let sql = 'SELECT r.*, u.name as user_name FROM resumes r LEFT JOIN users u ON r.user_id = u.id WHERE r.is_public = 1';
  const params: any[] = [];
  if (req.user!.role === 'jobseeker') {
    sql += ' AND r.user_id = ?';
    params.push(req.user!.id);
  }
  if (keyword) { sql += ' AND (r.title LIKE ? OR r.summary LIKE ? OR u.name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (experience) { sql += ' AND r.experience >= ?'; params.push(parseInt(experience as string)); }
  if (skill) { sql += ' AND r.skills LIKE ?'; params.push(`%${skill}%`); }
  sql += ' ORDER BY r.updated_at DESC LIMIT 100';
  const resumes = db.prepare(sql).all(...params);
  res.json({ resumes: resumes.map((r: any) => ({ ...r, skills: r.skills ? JSON.parse(r.skills) : [] })) });
});

router.post('/', authMiddleware, rbacMiddleware('resume', 'create'), auditMiddleware('create_resume', 'resume'), (req: AuthRequest, res) => {
  const { title, summary, experience, education, skills = [], certifications = [], projects = [], workHistory = [], isPublic = 1 } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO resumes (id, user_id, tenant_id, title, summary, experience, education, skills, certifications, projects, work_history, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.id, req.user!.tenantId, title, summary, experience || 0, education,
    JSON.stringify(skills), JSON.stringify(certifications), JSON.stringify(projects), JSON.stringify(workHistory), isPublic ? 1 : 0
  );
  res.json({ id });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const r = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: '简历不存在' });
  if (!r.is_public && r.user_id !== req.user!.id && req.user!.role === 'jobseeker') return res.status(403).json({ error: '无权查看' });
  res.json({ resume: { ...r, skills: r.skills ? JSON.parse(r.skills) : [], certifications: r.certifications ? JSON.parse(r.certifications) : [], projects: r.projects ? JSON.parse(r.projects) : [], workHistory: r.work_history ? JSON.parse(r.work_history) : [] } });
});

router.put('/:id', authMiddleware, auditMiddleware('update_resume', 'resume'), (req: AuthRequest, res) => {
  const r = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id) as any;
  if (!r || r.user_id !== req.user!.id) return res.status(403).json({ error: '无权修改' });
  const { title, summary, experience, education, skills, certifications, projects, workHistory, isPublic } = req.body;
  db.prepare(`UPDATE resumes SET title = COALESCE(?, title), summary = COALESCE(?, summary), experience = COALESCE(?, experience), education = COALESCE(?, education), skills = COALESCE(?, skills), certifications = COALESCE(?, certifications), projects = COALESCE(?, projects), work_history = COALESCE(?, work_history), is_public = COALESCE(?, is_public), updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    title, summary, experience, education, skills ? JSON.stringify(skills) : null,
    certifications ? JSON.stringify(certifications) : null, projects ? JSON.stringify(projects) : null,
    workHistory ? JSON.stringify(workHistory) : null, isPublic != null ? (isPublic ? 1 : 0) : null, req.params.id
  );
  res.json({ success: true });
});

router.get('/mine/current', authMiddleware, (req: AuthRequest, res) => {
  const r = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(req.user!.id) as any;
  if (!r) return res.json({ resume: null });
  res.json({ resume: { ...r, skills: r.skills ? JSON.parse(r.skills) : [], certifications: r.certifications ? JSON.parse(r.certifications) : [], projects: r.projects ? JSON.parse(r.projects) : [], workHistory: r.work_history ? JSON.parse(r.work_history) : [] } });
});

export default router;
