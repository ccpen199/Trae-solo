import { Request, Response } from 'express';
import db from '../db';

export const createAppeal = (req: Request, res: Response) => {
  try {
    const { exception_id, driver_id, reason, evidence } = req.body;

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exception_id);
    if (!exception) {
      return res.status(404).json({ error: 'Exception not found' });
    }

    const info = db.prepare(`
      INSERT INTO appeals (exception_id, driver_id, reason, evidence)
      VALUES (?, ?, ?, ?)
    `).run(exception_id, driver_id || null, reason, evidence || null);

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(appeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appeal' });
  }
};

export const getAppeals = (_req: Request, res: Response) => {
  try {
    const appeals = db.prepare(`
      SELECT a.*, e.type as exception_type, e.description as exception_description
      FROM appeals a
      LEFT JOIN exceptions e ON a.exception_id = e.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(appeals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
};

export const resolveAppeal = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolver_note } = req.body;

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    db.prepare(`
      UPDATE appeals 
      SET status = ?, resolved_at = datetime('now'), resolver_note = ?
      WHERE id = ?
    `).run(status || 'resolved', resolver_note || null, id);

    const updatedAppeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    res.json(updatedAppeal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve appeal' });
  }
};
