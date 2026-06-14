import { Router } from 'express';
import { getDb } from '../db/index.js';

const router = Router();

function scalar(sql: string, fallback = 0) {
  const db = getDb();
  const row = db.prepare(sql).get() as any;
  return Number(row?.value ?? fallback);
}

function buildStats() {
  const totalBooks = scalar('SELECT COUNT(*) as value FROM books');
  const readingBooks = scalar("SELECT COUNT(*) as value FROM books WHERE status = 'reading'");
  const completedBooks = scalar("SELECT COUNT(*) as value FROM books WHERE status = 'completed'");
  const totalNotes = scalar('SELECT COUNT(*) as value FROM notes');
  const ocrNotes = scalar("SELECT COUNT(*) as value FROM notes WHERE source_type = 'ocr'");
  const totalSessions = scalar('SELECT COUNT(*) as value FROM reading_sessions');
  const totalSeconds = scalar('SELECT COALESCE(SUM(duration_seconds), 0) as value FROM reading_sessions');
  const totalEntities = scalar('SELECT COUNT(*) as value FROM entities');
  const totalRelations = scalar('SELECT COUNT(*) as value FROM entity_relations');
  const totalTags = scalar('SELECT COUNT(*) as value FROM tags');

  return {
    users: 1,
    totalBooks,
    readingBooks,
    completedBooks,
    totalNotes,
    ocrNotes,
    totalSessions,
    totalReadingMinutes: Math.round(totalSeconds / 60),
    totalEntities,
    totalRelations,
    totalTags,
    exportFormats: ['md', 'md+json'],
    health: 'ok',
  };
}

router.get('/stats', (_req, res) => {
  res.json({ data: buildStats() });
});

router.get('/dashboard', (_req, res) => {
  const db = getDb();
  const stats = buildStats();
  const recentBooks = db
    .prepare('SELECT id, title, status, progress, updated_at FROM books ORDER BY updated_at DESC LIMIT 5')
    .all();
  const recentNotes = db
    .prepare('SELECT id, title, source_type, created_at FROM notes ORDER BY created_at DESC LIMIT 5')
    .all();
  const recentSessions = db
    .prepare('SELECT id, book_id, mode, duration_seconds, start_time, end_time FROM reading_sessions ORDER BY start_time DESC LIMIT 5')
    .all();

  res.json({
    data: {
      stats,
      panels: ['数据概览', '用户管理', '内容管理', '运营数据'],
      recentBooks,
      recentNotes,
      recentSessions,
    },
  });
});

export default router;
