import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ResumeContent } from '../types';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const resumes = db.prepare(
    'SELECT id, title, template_id, content, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.user!.id).map((resume: any) => ({
    ...resume,
    content: JSON.parse(resume.content)
  }));
  
  res.json({ resumes });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  resume.content = JSON.parse(resume.content);
  res.json({ resume });
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { title, template_id, content } = req.body;
  
  if (!title || title.length > 100) {
    return res.status(400).json({ error: '简历标题不能为空且长度不能超过100' });
  }
  
  const defaultContent: ResumeContent = {
    basicInfo: { name: '', phone: '', email: '', location: '', website: '' },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    summary: ''
  };
  
  const result = db.prepare(
    'INSERT INTO resumes (user_id, title, template_id, content) VALUES (?, ?, ?, ?)'
  ).run(
    req.user!.id,
    title,
    template_id || 'tech-modern',
    JSON.stringify(content || defaultContent)
  );
  
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  const { title, template_id, content } = req.body;
  
  const existing: any = db.prepare(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!existing) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  if (title && title.length > 100) {
    return res.status(400).json({ error: '简历标题长度不能超过100' });
  }
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (template_id !== undefined) {
    updates.push('template_id = ?');
    params.push(template_id);
  }
  if (content !== undefined) {
    updates.push('content = ?');
    params.push(JSON.stringify(content));
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id, req.user!.id);
  
  db.prepare(
    `UPDATE resumes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...params);
  
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare(
    'DELETE FROM resumes WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  res.json({ success: true });
});

export default router;
