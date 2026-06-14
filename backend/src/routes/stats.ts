import { Router } from 'express';
import { getDb } from '../db/index.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/overview', (_req, res) => {
  const db = getDb();

  const totalBooks = (db.prepare('SELECT COUNT(*) as count FROM books').get() as any).count;
  const readingBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'reading'").get() as any).count;
  const completedBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'completed'").get() as any).count;
  const totalNotes = (db.prepare('SELECT COUNT(*) as count FROM notes').get() as any).count;
  const totalSessions = (db.prepare('SELECT COUNT(*) as count FROM reading_sessions').get() as any).count;
  const totalSeconds = (db.prepare('SELECT COALESCE(SUM(duration_seconds), 0) as total FROM reading_sessions').get() as any).total;

  res.json({
    data: {
      totalBooks,
      readingBooks,
      completedBooks,
      totalNotes,
      totalSessions,
      totalReadingSeconds: totalSeconds,
      totalReadingMinutes: Math.round(totalSeconds / 60),
      totalReadingHours: Math.round((totalSeconds / 3600) * 10) / 10,
    },
  });
});

router.get('/daily', (req, res) => {
  const db = getDb();
  const { days = '30' } = req.query;
  const numDays = parseInt(days as string);
  const start = dayjs().subtract(numDays - 1, 'day').format('YYYY-MM-DD');

  const rows = db
    .prepare(
      `SELECT 
         DATE(start_time) as date,
         SUM(duration_seconds) as total_seconds,
         COUNT(*) as session_count
       FROM reading_sessions 
       WHERE DATE(start_time) >= ?
       GROUP BY DATE(start_time)
       ORDER BY date DESC`
    )
    .all(start);

  const noteRows = db
    .prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as note_count
       FROM notes
       WHERE DATE(created_at) >= ?
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    )
    .all(start);

  const noteMap = new Map(noteRows.map((r: any) => [r.date, r.note_count]));

  const dailyStats: any[] = [];
  for (let i = 0; i < numDays; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const dayRow = rows.find((r: any) => r.date === date);
    dailyStats.push({
      date,
      totalSeconds: dayRow?.total_seconds || 0,
      totalMinutes: Math.round((dayRow?.total_seconds || 0) / 60),
      sessionCount: dayRow?.session_count || 0,
      noteCount: noteMap.get(date) || 0,
    });
  }

  res.json({ data: dailyStats.reverse() });
});

router.get('/by-category', (_req, res) => {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT 
         COALESCE(b.category, '未分类') as category,
         COALESCE(SUM(rs.duration_seconds), 0) as total_seconds,
         COUNT(DISTINCT b.id) as book_count,
         COUNT(rs.id) as session_count
       FROM books b
       LEFT JOIN reading_sessions rs ON rs.book_id = b.id
       GROUP BY b.category
       ORDER BY total_seconds DESC`
    )
    .all();

  res.json({
    data: rows.map((r: any) => ({
      category: r.category,
      totalSeconds: r.total_seconds,
      totalMinutes: Math.round(r.total_seconds / 60),
      bookCount: r.book_count,
      sessionCount: r.session_count,
    })),
  });
});

router.get('/heatmap', (req, res) => {
  const db = getDb();
  const { months = '12' } = req.query;
  const numMonths = parseInt(months as string);
  const start = dayjs().subtract(numMonths, 'month').format('YYYY-MM-DD');

  const rows = db
    .prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM notes
       WHERE DATE(created_at) >= ?
       GROUP BY DATE(created_at)
       ORDER BY date`
    )
    .all(start);

  const maxCount = Math.max(...rows.map((r: any) => r.count), 1);

  res.json({
    data: rows.map((r: any) => ({
      date: r.date,
      count: r.count,
      level: Math.min(4, Math.floor((r.count / maxCount) * 4)),
    })),
    maxCount,
  });
});

export default router;
