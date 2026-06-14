import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

function rowToNote(row: any) {
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    content: row.content,
    sourceType: row.source_type,
    sourceImageId: row.source_image_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { book_id, source_type, limit = '50', offset = '0' } = req.query;

  const conditions: string[] = [];
  const params: any[] = [];

  if (book_id) {
    conditions.push('book_id = ?');
    params.push(book_id);
  }
  if (source_type) {
    conditions.push('source_type = ?');
    params.push(source_type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (db
    .prepare(`SELECT COUNT(*) as total FROM notes ${where}`)
    .get(...params) as any).total;

  const rows = db
    .prepare(
      `SELECT * FROM notes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, parseInt(limit as string), parseInt(offset as string));

  res.json({
    data: rows.map(rowToNote),
    total,
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }

  const paragraphs = db
    .prepare('SELECT * FROM note_paragraphs WHERE note_id = ? ORDER BY order_index')
    .all(req.params.id)
    .map((p: any) => ({
      id: p.id,
      noteId: p.note_id,
      orderIndex: p.order_index,
      text: p.text,
      bbox: p.bbox ? JSON.parse(p.bbox) : undefined,
    }));

  const anchors = db
    .prepare('SELECT * FROM page_anchors WHERE note_id = ?')
    .all(req.params.id)
    .map((a: any) => ({
      id: a.id,
      noteId: a.note_id,
      pageNumber: a.page_number,
      confidence: a.confidence,
      comment: a.comment,
    }));

  res.json({
    data: {
      ...rowToNote(row),
      paragraphs,
      anchors,
    },
  });
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { body } = req;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO notes (id, book_id, title, content, source_type, source_image_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.bookId || null,
    body.title || null,
    body.content || '',
    body.sourceType || 'manual',
    body.sourceImageId || null,
    now,
    now
  );

  if (body.paragraphs && Array.isArray(body.paragraphs)) {
    const insertPara = db.prepare(`
      INSERT INTO note_paragraphs (id, note_id, order_index, text, bbox)
      VALUES (?, ?, ?, ?, ?)
    `);
    body.paragraphs.forEach((p: any, idx: number) => {
      insertPara.run(
        uuidv4(),
        id,
        p.orderIndex ?? idx,
        p.text || '',
        p.bbox ? JSON.stringify(p.bbox) : null
      );
    });
  }

  if (body.anchors && Array.isArray(body.anchors)) {
    const insertAnchor = db.prepare(`
      INSERT INTO page_anchors (id, note_id, page_number, confidence, comment)
      VALUES (?, ?, ?, ?, ?)
    `);
    body.anchors.forEach((a: any) => {
      insertAnchor.run(
        uuidv4(),
        id,
        a.pageNumber || 1,
        a.confidence ?? 1,
        a.comment || null
      );
    });
  }

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.status(201).json({ data: rowToNote(row) });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const body = req.body;

  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }

  const updates: string[] = [];
  const params: any[] = [];

  ['title', 'content', 'source_type', 'source_image_id', 'book_id'].forEach(col => {
    const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (body[key] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[key]);
    }
  });

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.json({ data: rowToNote(row) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true });
});

export default router;
