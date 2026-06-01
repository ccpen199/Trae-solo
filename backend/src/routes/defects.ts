import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    let query = 'SELECT * FROM defects WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSizeNum, offset);

    const defects = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM defects WHERE 1=1' + (status ? ' AND status = ?' : '');
    const countParams = status ? [status] : [];
    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      success: true,
      data: {
        list: defects,
        pagination: {
          page: pageNum,
          page_size: pageSizeNum,
          total: totalResult.total,
          total_pages: Math.ceil(totalResult.total / pageSizeNum)
        }
      }
    });
  } catch (error) {
    console.error('获取缺陷列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取缺陷列表失败'
    });
  }
});

router.get('/all', (req: Request, res: Response) => {
  try {
    const defects = db.prepare(`
      SELECT id, title, status, priority, assignee, created_at
      FROM defects
      WHERE status IN ('open', 'in_progress')
      ORDER BY priority DESC, created_at DESC
      LIMIT 100
    `).all();

    res.json({
      success: true,
      data: defects
    });
  } catch (error) {
    console.error('获取缺陷列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取缺陷列表失败'
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignee, created_by } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: '缺陷标题不能为空'
      });
    }

    const id = randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO defects (id, title, description, status, priority, assignee, created_by, created_at, updated_at)
      VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?)
    `).run(id, title, description || '', priority || 'medium', assignee || '', created_by || '系统', now, now);

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('创建缺陷失败:', error);
    res.status(500).json({
      success: false,
      error: '创建缺陷失败'
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const defect = db.prepare('SELECT * FROM defects WHERE id = ?').get(id);

    if (!defect) {
      return res.status(404).json({
        success: false,
        error: '缺陷不存在'
      });
    }

    res.json({
      success: true,
      data: defect
    });
  } catch (error) {
    console.error('获取缺陷详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取缺陷详情失败'
    });
  }
});

export default router;
