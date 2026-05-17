import { Router } from 'express';
import { getDb } from '../db';
import { success, error } from '../utils/response';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/hot', (req, res) => {
  try {
    const db = getDb();
    const hotSearches = db.prepare('SELECT * FROM hot_searches ORDER BY sort_order ASC, search_count DESC LIMIT 10').all();
    success(res, hotSearches);
  } catch (err) {
    console.error(err);
    error(res, '获取热门搜索失败');
  }
});

router.get('/history', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return success(res, []);
    }
    const db = getDb();
    const history = db.prepare(`
      SELECT keyword, MAX(last_search_at) as last_search_at
      FROM search_history 
      WHERE user_id = ? 
      GROUP BY keyword
      ORDER BY last_search_at DESC 
      LIMIT 10
    `).all(req.user.id);
    success(res, history);
  } catch (err) {
    console.error(err);
    error(res, '获取搜索历史失败');
  }
});

router.get('/', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return success(res, { books: [], courses: [], ebooks: [] });
    }

    const searchKeyword = `%${keyword}%`;
    const db = getDb();

    if (req.user) {
      const existing = db.prepare('SELECT id FROM search_history WHERE user_id = ? AND keyword = ?').get(req.user.id, keyword);
      if (existing) {
        db.prepare('UPDATE search_history SET search_count = search_count + 1, last_search_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
      } else {
        db.prepare('INSERT INTO search_history (user_id, keyword) VALUES (?, ?)').run(req.user.id, keyword);
      }
    }

    const books = db.prepare(`
      SELECT * FROM books 
      WHERE title LIKE ? OR author LIKE ? OR tags LIKE ? OR excerpt LIKE ?
      LIMIT 10
    `).all(searchKeyword, searchKeyword, searchKeyword, searchKeyword);

    const courses = db.prepare(`
      SELECT * FROM courses 
      WHERE title LIKE ? OR teacher LIKE ? OR intro LIKE ?
      LIMIT 5
    `).all(searchKeyword, searchKeyword, searchKeyword);

    const ebooks = db.prepare(`
      SELECT * FROM ebooks 
      WHERE title LIKE ? OR author LIKE ? OR intro LIKE ?
      LIMIT 5
    `).all(searchKeyword, searchKeyword, searchKeyword);

    success(res, { books, courses, ebooks });
  } catch (err) {
    console.error(err);
    error(res, '搜索失败');
  }
});

router.delete('/history', optionalAuthMiddleware, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return success(res, null, '清除成功');
    }
    const db = getDb();
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id);
    success(res, null, '清除成功');
  } catch (err) {
    console.error(err);
    error(res, '清除搜索历史失败');
  }
});

export default router;
