import { Request, Response } from 'express';
import db from '../db';

export const getExceptions = (req: Request, res: Response) => {
  try {
    const { keyword, type, status, level, page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSizeNum = parseInt(pageSize as string, 10) || 10;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (keyword) {
      whereClauses.push('(e.description LIKE ? OR o.order_no LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (type) {
      whereClauses.push('e.type = ?');
      params.push(type);
    }
    if (status) {
      whereClauses.push('e.status = ?');
      params.push(status);
    }
    if (level) {
      whereClauses.push('e.level = ?');
      params.push(level);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = (db.prepare(`
      SELECT COUNT(*) as count FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      ${whereStr}
    `).get(...params) as { count: number }).count;

    const exceptions = db.prepare(`
      SELECT e.*, o.order_no, d.name as driver_name
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      ${whereStr}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, (pageNum - 1) * pageSizeNum);

    res.success({ list: exceptions, total, page: pageNum, pageSize: pageSizeNum });
  } catch (error) {
    res.error('Failed to fetch exceptions');
  }
};

export const getExceptionById = (req: Request, res: Response) => {
  try {
    const exception = db.prepare(`
      SELECT e.*, o.order_no, d.name as driver_name
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!exception) {
      return res.error('Exception not found');
    }
    res.success(exception);
  } catch (error) {
    res.error('Failed to fetch exception');
  }
};

export const createException = (req: Request, res: Response) => {
  try {
    const { order_id, driver_id, type, level, description } = req.body;
    const info = db.prepare(`
      INSERT INTO exceptions (order_id, driver_id, type, level, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(order_id, driver_id || null, type, level || 'medium', description);

    const exception = db.prepare(`
      SELECT e.*, o.order_no, d.name as driver_name
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      WHERE e.id = ?
    `).get(info.lastInsertRowid);
    res.success(exception);
  } catch (error) {
    res.error('Failed to create exception');
  }
};

export const processException = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    if (!exception) {
      return res.error('Exception not found');
    }
    db.prepare('UPDATE exceptions SET status = ? WHERE id = ?').run('processing', id);
    const updatedException = db.prepare(`
      SELECT e.*, o.order_no, d.name as driver_name
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      WHERE e.id = ?
    `).get(id);
    res.success(updatedException);
  } catch (error) {
    res.error('Failed to process exception');
  }
};

export const resolveException = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    if (!exception) {
      return res.error('Exception not found');
    }

    db.prepare(`
      UPDATE exceptions
      SET status = ?, resolved_at = datetime('now'), handle_remark = ?
      WHERE id = ?
    `).run('resolved', remark || null, id);

    const updatedException = db.prepare(`
      SELECT e.*, o.order_no, d.name as driver_name
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      WHERE e.id = ?
    `).get(id);
    res.success(updatedException);
  } catch (error) {
    res.error('Failed to resolve exception');
  }
};
