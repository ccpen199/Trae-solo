import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { Book, BookStatus } from '../types.js';

const router = Router();

function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    authors: JSON.parse(row.authors || '[]'),
    publisher: row.publisher || undefined,
    publishDate: row.publish_date || undefined,
    isbn10: row.isbn10 || undefined,
    isbn13: row.isbn13 || undefined,
    category: row.category || undefined,
    coverImage: row.cover_image || undefined,
    coverImageData: row.cover_image_data || undefined,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    progress: row.progress,
    status: row.status as BookStatus,
    tagIds: JSON.parse(row.tag_ids || '[]'),
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    summary: row.summary || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const {
    status = 'all',
    category,
    search = '',
    sortBy = 'updated_at',
    sortOrder = 'desc',
    limit = '50',
    offset = '0',
  } = req.query;

  const conditions: string[] = [];
  const params: any[] = [];

  if (status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(title LIKE ? OR authors LIKE ? OR isbn13 LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const validSort = ['title', 'progress', 'created_at', 'updated_at'].includes(sortBy as string)
    ? sortBy
    : 'updated_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM books ${where}`);
  const total = (countStmt.get(...params) as any).total;

  const stmt = db.prepare(
    `SELECT * FROM books ${where} ORDER BY ${validSort} ${order} LIMIT ? OFFSET ?`
  );
  const rows = stmt.all(...params, parseInt(limit as string), parseInt(offset as string));

  res.json({
    data: rows.map(rowToBook),
    total,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Book not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ data: rowToBook(row) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const body = req.body;
  const now = new Date().toISOString();

  const totalPages = body.totalPages || 0;
  const currentPage = body.currentPage || 0;
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const stmt = db.prepare(`
    INSERT INTO books (
      id, title, subtitle, authors, publisher, publish_date,
      isbn10, isbn13, category, cover_image, cover_image_data,
      total_pages, current_page, progress, status, tag_ids,
      start_date, end_date, summary, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    body.title || '未命名书籍',
    body.subtitle || null,
    JSON.stringify(body.authors || []),
    body.publisher || null,
    body.publishDate || null,
    body.isbn10 || null,
    body.isbn13 || null,
    body.category || null,
    body.coverImage || null,
    body.coverImageData || null,
    totalPages,
    currentPage,
    progress,
    body.status || 'not_started',
    JSON.stringify(body.tagIds || []),
    body.startDate || null,
    body.endDate || null,
    body.summary || null,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  res.status(201).json({ data: rowToBook(row) });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const body = req.body;

  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Book not found', code: 'NOT_FOUND' });
    return;
  }

  const updates: string[] = [];
  const params: any[] = [];

  const fields = [
    ['title', 'title'],
    ['subtitle', 'subtitle'],
    ['publisher', 'publisher'],
    ['publish_date', 'publishDate'],
    ['isbn10', 'isbn10'],
    ['isbn13', 'isbn13'],
    ['category', 'category'],
    ['cover_image', 'coverImage'],
    ['cover_image_data', 'coverImageData'],
    ['total_pages', 'totalPages'],
    ['current_page', 'currentPage'],
    ['status', 'status'],
    ['start_date', 'startDate'],
    ['end_date', 'endDate'],
    ['summary', 'summary'],
  ];

  fields.forEach(([col, key]) => {
    if (body[key] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[key]);
    }
  });

  if (body.authors !== undefined) {
    updates.push('authors = ?');
    params.push(JSON.stringify(body.authors));
  }

  if (body.tagIds !== undefined) {
    updates.push('tag_ids = ?');
    params.push(JSON.stringify(body.tagIds));
  }

  const existingBook = rowToBook(existing);
  const totalPages = body.totalPages !== undefined ? body.totalPages : existingBook.totalPages;
  const currentPage = body.currentPage !== undefined ? body.currentPage : existingBook.currentPage;
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  updates.push('progress = ?');
  params.push(progress);
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());

  params.push(id);
  const stmt = db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...params);

  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  res.json({ data: rowToBook(row) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Book not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true, message: 'Book deleted' });
});

router.get('/:id/notes', (req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json({
    data: rows.map((r: any) => ({
      id: r.id,
      bookId: r.book_id,
      title: r.title,
      content: r.content,
      sourceType: r.source_type,
      sourceImageId: r.source_image_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

export default router;
