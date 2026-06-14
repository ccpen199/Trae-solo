import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { getDb } from '../db/index.js';
import dayjs from 'dayjs';

const router = Router();

function rowToSession(row: any) {
  return {
    id: row.id,
    bookId: row.book_id,
    mode: row.mode,
    durationSeconds: row.duration_seconds,
    startTime: row.start_time,
    endTime: row.end_time,
    startPage: row.start_page,
    endPage: row.end_page,
    notes: row.notes,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { book_id, mode, limit = '50', offset = '0' } = req.query;

  const conditions: string[] = [];
  const params: any[] = [];

  if (book_id) {
    conditions.push('book_id = ?');
    params.push(book_id);
  }
  if (mode) {
    conditions.push('mode = ?');
    params.push(mode);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (db
    .prepare(`SELECT COUNT(*) as total FROM reading_sessions ${where}`)
    .get(...params) as any).total;

  const rows = db
    .prepare(
      `SELECT * FROM reading_sessions ${where} ORDER BY start_time DESC LIMIT ? OFFSET ?`
    )
    .all(...params, parseInt(limit as string), parseInt(offset as string));

  res.json({
    data: rows.map(rowToSession),
    total,
  });
});

router.get('/today', (_req, res) => {
  const db = getDb();
  const today = dayjs().format('YYYY-MM-DD');
  const rows = db
    .prepare(
      `SELECT * FROM reading_sessions WHERE DATE(start_time) = ? ORDER BY start_time DESC`
    )
    .all(today);

  const totalSeconds = rows.reduce(
    (sum: number, r: any) => sum + r.duration_seconds,
    0
  );

  res.json({
    data: rows.map(rowToSession),
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM reading_sessions WHERE id = ?')
    .get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: rowToSession(row) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { body } = req;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reading_sessions (
      id, book_id, mode, duration_seconds,
      start_time, end_time, start_page, end_page, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.bookId || null,
    body.mode || 'manual',
    body.durationSeconds || 0,
    body.startTime || now,
    body.endTime || null,
    body.startPage || null,
    body.endPage || null,
    body.notes || null
  );

  const row = db.prepare('SELECT * FROM reading_sessions WHERE id = ?').get(id);
  res.status(201).json({ data: rowToSession(row) });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const body = req.body;

  const existing = db
    .prepare('SELECT * FROM reading_sessions WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
    return;
  }

  const updates: string[] = [];
  const params: any[] = [];

  const mappings: [string, string][] = [
    ['book_id', 'bookId'],
    ['mode', 'mode'],
    ['duration_seconds', 'durationSeconds'],
    ['end_time', 'endTime'],
    ['start_page', 'startPage'],
    ['end_page', 'endPage'],
    ['notes', 'notes'],
  ];

  mappings.forEach(([col, key]) => {
    if (body[key] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[key]);
    }
  });

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE reading_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const row = db.prepare('SELECT * FROM reading_sessions WHERE id = ?').get(id);
  res.json({ data: rowToSession(row) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM reading_sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true });
});

export default router;
