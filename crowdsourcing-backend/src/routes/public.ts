import { Router, Request, Response } from 'express';
import db from '../database';
import { success, error } from '../utils/common';

const router = Router();

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(t.id) as taskCount
      FROM categories c
      LEFT JOIN tasks t ON t.categoryId = c.id AND t.status NOT IN ('draft', 'cancelled')
      GROUP BY c.id
      ORDER BY c.sortOrder
    `).all();
    res.json(success(categories));
  } catch (err: any) {
    res.json(error(err.message, 500));
  }
});

router.get('/services', async (req: Request, res: Response) => {
  try {
    const { categoryId, keyword, page = 1, pageSize = 20, status } = req.query;
    const conditions: string[] = ["t.status NOT IN ('draft', 'cancelled')"];
    const params: any[] = [];

    if (categoryId) {
      conditions.push('t.categoryId = ?');
      params.push(Number(categoryId));
    }
    if (keyword) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const total = db.prepare(`SELECT COUNT(*) as count FROM tasks t ${whereClause}`).get(...params) as any;
    const list = db.prepare(`
      SELECT t.*, c.name as categoryName, c.icon as categoryIcon,
             u.name as applicantName
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    res.json(success({
      list,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize)
    }));
  } catch (err: any) {
    res.json(error(err.message, 500));
  }
});

router.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const task = db.prepare(`
      SELECT t.*, c.name as categoryName, c.icon as categoryIcon,
             u.name as applicantName, u.phone as applicantPhone
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      res.json(error('服务事项不存在', 404));
      return;
    }

    const milestones = db.prepare(`
      SELECT * FROM payments WHERE taskId = ? ORDER BY createdAt
    `).all(req.params.id);

    res.json(success({ ...task, milestones }));
  } catch (err: any) {
    res.json(error(err.message, 500));
  }
});

router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { name, phone, type, title, description, contact } = req.body;
    if (!title || !description) {
      res.json(error('标题和描述不能为空', 400));
      return;
    }
    const id = db.prepare(`
      INSERT INTO audit_logs (module, action, details, riskLevel)
      VALUES (?, ?, ?, ?)
    `).run('feedback', 'submit', JSON.stringify({ name, phone, type, title, description, contact }), 'low');
    res.json(success({ id: id.lastInsertRowid }, '反馈提交成功'));
  } catch (err: any) {
    res.json(error(err.message, 500));
  }
});

router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status NOT IN ('draft', 'cancelled')").get() as any;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as any;
    const inProgressTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('published', 'bidding', 'in_progress', 'reviewing')").get() as any;
    const categories = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;

    const onlineRate = totalTasks.count > 0 ? Math.round((completedTasks.count + inProgressTasks.count) / totalTasks.count * 1000) / 10 : 0;
    const satisfaction = 96.8;
    const avgDays = 2.3;

    res.json(success({
      totalTasks: totalTasks.count,
      completedTasks: completedTasks.count,
      inProgressTasks: inProgressTasks.count,
      categoryCount: categories.count,
      onlineRate,
      satisfaction,
      avgDays
    }));
  } catch (err: any) {
    res.json(error(err.message, 500));
  }
});

export default router;
