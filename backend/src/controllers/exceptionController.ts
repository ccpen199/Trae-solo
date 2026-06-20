import { Request, Response } from 'express';
import db from '../db';

export const getExceptions = (_req: Request, res: Response) => {
  try {
    const exceptions = db.prepare('SELECT * FROM exceptions ORDER BY created_at DESC').all();
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exceptions' });
  }
};

export const getExceptionById = (req: Request, res: Response) => {
  try {
    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
    if (!exception) {
      return res.status(404).json({ error: 'Exception not found' });
    }
    res.json(exception);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exception' });
  }
};

export const createException = (req: Request, res: Response) => {
  try {
    const { order_id, driver_id, type, description } = req.body;
    const info = db.prepare(`
      INSERT INTO exceptions (order_id, driver_id, type, description)
      VALUES (?, ?, ?, ?)
    `).run(order_id, driver_id, type, description);

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(exception);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exception' });
  }
};

export const resolveException = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    if (!exception) {
      return res.status(404).json({ error: 'Exception not found' });
    }

    db.prepare(`
      UPDATE exceptions 
      SET status = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).run(status || 'resolved', id);

    const updatedException = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    res.json(updatedException);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve exception' });
  }
};
