import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', (req, res) => {
  try {
    const db = getDB();

    const totalItems = db.prepare('SELECT COUNT(*) as cnt FROM service_items').get().cnt;
    const totalCases = db.prepare('SELECT COUNT(*) as cnt FROM cases').get().cnt;
    const totalCertificates = db.prepare('SELECT COUNT(*) as cnt FROM certificates').get().cnt;
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;

    const casesByStatus = {};
    const statusRows = db.prepare("SELECT status, COUNT(*) as cnt FROM cases GROUP BY status").all();
    for (const row of statusRows) {
      casesByStatus[row.status] = row.cnt;
    }

    const todayCases = db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE date(created_at) = date('now','localtime')").get().cnt;

    const completedCases = db.prepare("SELECT AVG(julianday(complete_at) - julianday(accept_at)) as avg_days FROM cases WHERE status IN ('completed','archived') AND accept_at IS NOT NULL AND complete_at IS NOT NULL").get();
    const avgProcessDays = completedCases && completedCases.avg_days ? Math.round(completedCases.avg_days * 10) / 10 : 0;

    res.json({
      totalItems,
      totalCases,
      casesByStatus,
      totalCertificates,
      totalUsers,
      todayCases,
      avgProcessDays
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/timeout-warnings', (req, res) => {
  try {
    const db = getDB();
    const list = db.prepare(`
      SELECT c.*, si.name as item_name, si.time_limit, si.time_unit, d.name as department_name
      FROM cases c
      LEFT JOIN service_items si ON c.item_id = si.id
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE c.status NOT IN ('completed', 'archived', 'withdrawn', 'rejected')
        AND c.deadline IS NOT NULL
        AND (datetime(c.deadline) < datetime('now','localtime','+3 days'))
      ORDER BY c.deadline ASC
    `).all();

    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trend', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now','localtime','-29 days')
        UNION ALL
        SELECT date(date,'+1 day') FROM dates WHERE date < date('now','localtime')
      )
      SELECT dates.date, COALESCE(cnt, 0) as count
      FROM dates
      LEFT JOIN (
        SELECT date(created_at) as d, COUNT(*) as cnt FROM cases
        WHERE date(created_at) >= date('now','localtime','-29 days')
        GROUP BY date(created_at)
      ) sub ON dates.date = sub.d
      ORDER BY dates.date ASC
    `).all();

    res.json({ list: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/department-stats', (req, res) => {
  try {
    const db = getDB();
    const list = db.prepare(`
      SELECT d.id, d.name as department_name, COUNT(c.id) as case_count
      FROM departments d
      LEFT JOIN service_items si ON d.id = si.department_id
      LEFT JOIN cases c ON si.id = c.item_id
      GROUP BY d.id
      ORDER BY case_count DESC
    `).all();

    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
