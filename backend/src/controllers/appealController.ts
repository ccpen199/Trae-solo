import { Request, Response } from 'express';
import db from '../db';

export const createAppeal = (req: Request, res: Response) => {
  try {
    const { exception_id, driver_id, content } = req.body;

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exception_id);
    if (!exception) {
      return res.error('Exception not found');
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
    const driverName = driver ? (driver as any).name : undefined;

    const info = db.prepare(`
      INSERT INTO appeals (exception_id, driver_id, reason)
      VALUES (?, ?, ?)
    `).run(exception_id, driver_id || null, content);

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(info.lastInsertRowid) as any;
    res.success({ ...appeal, driver_name: driverName });
  } catch (error) {
    res.error('Failed to create appeal');
  }
};

export const getAppeals = (req: Request, res: Response) => {
  try {
    const { exceptionId } = req.query;

    let appeals;
    if (exceptionId) {
      appeals = db.prepare(`
        SELECT a.*, d.name as driver_name
        FROM appeals a
        LEFT JOIN drivers d ON a.driver_id = d.id
        WHERE a.exception_id = ?
        ORDER BY a.created_at DESC
      `).all(exceptionId);
    } else {
      appeals = db.prepare(`
        SELECT a.*, d.name as driver_name
        FROM appeals a
        LEFT JOIN drivers d ON a.driver_id = d.id
        ORDER BY a.created_at DESC
      `).all();
    }

    res.success({ list: appeals, total: appeals.length });
  } catch (error) {
    res.error('Failed to fetch appeals');
  }
};

export const resolveAppeal = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!appeal) {
      return res.error('Appeal not found');
    }

    db.prepare(`
      UPDATE appeals 
      SET status = ?, resolved_at = datetime('now'), resolver_note = ?
      WHERE id = ?
    `).run(status || 'approved', remark || null, id);

    const updatedAppeal = db.prepare(`
      SELECT a.*, d.name as driver_name
      FROM appeals a
      LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE a.id = ?
    `).get(id);
    res.success(updatedAppeal);
  } catch (error) {
    res.error('Failed to resolve appeal');
  }
};

export const reviewAppeal = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!appeal) {
      return res.error('Appeal not found');
    }

    db.prepare(`
      UPDATE appeals 
      SET status = ?, resolved_at = datetime('now'), resolver_note = ?
      WHERE id = ?
    `).run(status, remark || null, id);

    const updatedAppeal = db.prepare(`
      SELECT a.*, d.name as driver_name
      FROM appeals a
      LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE a.id = ?
    `).get(id);
    res.success(updatedAppeal);
  } catch (error) {
    res.error('Failed to review appeal');
  }
};
