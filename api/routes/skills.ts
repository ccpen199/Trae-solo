import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import authMiddleware, { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM skills';
    let params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY category, name';

    const skills = db.prepare(query).all(...params);
    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ success: false, error: '获取技能列表失败' });
  }
});

router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM skills ORDER BY category').all() as { category: string }[];
    res.json({ success: true, data: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: '获取技能分类失败' });
  }
});

router.post('/my-skills', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以管理技能' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;

    const skills = db.prepare(`
      SELECT s.id, s.name, s.category, js.proficiency_level, js.verified
      FROM job_seeker_skills js
      JOIN skills s ON js.skill_id = s.id
      WHERE js.job_seeker_id = ?
    `).all(jobSeeker.id);

    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get my skills error:', error);
    res.status(500).json({ success: false, error: '获取我的技能失败' });
  }
});

router.post('/add', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { skill_id, proficiency_level = 3 } = req.body;

    if (!skill_id) {
      res.status(400).json({ success: false, error: '技能ID为必填项' });
      return;
    }

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以添加技能' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;
    const skill = db.prepare('SELECT id FROM skills WHERE id = ?').get(skill_id);

    if (!skill) {
      res.status(404).json({ success: false, error: '技能不存在' });
      return;
    }

    try {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO job_seeker_skills (id, job_seeker_id, skill_id, proficiency_level)
        VALUES (?, ?, ?, ?)
      `).run(id, jobSeeker.id, skill_id, proficiency_level);
    } catch (e) {
      res.status(400).json({ success: false, error: '该技能已添加' });
      return;
    }

    res.json({ success: true, message: '技能添加成功' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ success: false, error: '添加技能失败' });
  }
});

router.delete('/remove/:skillId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { skillId } = req.params;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以删除技能' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;

    db.prepare(`
      DELETE FROM job_seeker_skills WHERE job_seeker_id = ? AND skill_id = ?
    `).run(jobSeeker.id, skillId);

    res.json({ success: true, message: '技能删除成功' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ success: false, error: '删除技能失败' });
  }
});

export default router;
