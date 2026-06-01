import express from 'express';
import db from '../database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const results = db.prepare('SELECT * FROM test_results ORDER BY executed_at DESC').all();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/save', authenticateToken, (req: any, res) => {
  const { testKey, status, result } = req.body;
  const userId = req.user?.userId;

  try {
    const existing = db.prepare('SELECT id FROM test_results WHERE test_key = ?').get(testKey) as any;
    
    if (existing) {
      db.prepare(`
        UPDATE test_results 
        SET status = ?, result = ?, user_id = ?, executed_at = CURRENT_TIMESTAMP
        WHERE test_key = ?
      `).run(status, result, userId, testKey);
    } else {
      db.prepare(`
        INSERT INTO test_results (test_key, status, result, user_id)
        VALUES (?, ?, ?, ?)
      `).run(testKey, status, result, userId);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM test_results').run();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
