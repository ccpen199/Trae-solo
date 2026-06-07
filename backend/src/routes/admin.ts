import { Router, Response } from 'express';
import { db } from '../database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const totalPosts = (db.prepare('SELECT COUNT(*) as count FROM posts WHERE is_deleted = 0').get() as { count: number }).count;
    const totalMerchants = (db.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number }).count;
    const pendingPosts = (db.prepare('SELECT COUNT(*) as count FROM posts WHERE is_approved = 0 AND is_deleted = 0').get() as { count: number }).count;
    const pendingMerchants = (db.prepare('SELECT COUNT(*) as count FROM merchants WHERE is_verified = 0').get() as { count: number }).count;
    const todayPosts = (db.prepare("SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = DATE('now') AND is_deleted = 0").get() as { count: number }).count;
    const todayComments = (db.prepare("SELECT COUNT(*) as count FROM comments WHERE DATE(created_at) = DATE('now')").get() as { count: number }).count;

    const cityStats = db.prepare(`
      SELECT c.name, 
             COUNT(DISTINCT p.id) as post_count,
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT m.id) as merchant_count
      FROM cities c
      LEFT JOIN posts p ON c.id = p.city_id AND p.is_deleted = 0
      LEFT JOIN users u ON c.id = u.city_id
      LEFT JOIN merchants m ON c.id = m.city_id
      GROUP BY c.id
      ORDER BY post_count DESC
    `).all();

    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM posts
      WHERE is_deleted = 0
      GROUP BY category
    `).all();

    const hourlyStats = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM posts
      WHERE created_at >= datetime('now', '-24 hours') AND is_deleted = 0
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `).all();

    res.json({
      overview: {
        totalUsers,
        totalPosts,
        totalMerchants,
        pendingPosts,
        pendingMerchants,
        todayPosts,
        todayComments,
      },
      cityStats,
      categoryStats,
      hourlyStats,
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/posts/review', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const posts = db.prepare(`
      SELECT p.*, u.nickname as author_name, c.name as city_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      WHERE p.is_approved = 0 AND p.is_deleted = 0
      ORDER BY p.created_at DESC
    `).all();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: '获取待审核内容失败' });
  }
});

router.put('/posts/:id/approve', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('UPDATE posts SET is_approved = 1 WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO audit_logs (post_id, action, admin_id) VALUES (?, ?, ?)').run(req.params.id, 'approve', req.user!.id);
    res.json({ message: '审核通过' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.put('/posts/:id/reject', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    db.prepare('UPDATE posts SET is_deleted = 1 WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO audit_logs (post_id, action, reason, admin_id) VALUES (?, ?, ?, ?)').run(req.params.id, 'reject', reason || '内容违规', req.user!.id);
    res.json({ message: '已驳回' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/merchants/review', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const merchants = db.prepare(`
      SELECT m.*, u.nickname as owner_name, c.name as city_name
      FROM merchants m
      JOIN users u ON m.user_id = u.id
      JOIN cities c ON m.city_id = c.id
      WHERE m.is_verified = 0
      ORDER BY m.created_at DESC
    `).all();
    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ error: '获取待审核商户失败' });
  }
});

router.get('/audit-logs', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '20', 10);
    const offset = (page - 1) * pageSize;

    const logs = db.prepare(`
      SELECT a.*, p.title as post_title, u.nickname as user_name, ad.nickname as admin_name
      FROM audit_logs a
      LEFT JOIN posts p ON a.post_id = p.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users ad ON a.admin_id = ad.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset);

    const total = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number }).count;

    res.json({ logs, total, page, pageSize });
  } catch (error) {
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

router.get('/sensitive-words', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const words = db.prepare('SELECT * FROM sensitive_words ORDER BY level DESC').all();
    res.json({ words });
  } catch (error) {
    res.status(500).json({ error: '获取敏感词列表失败' });
  }
});

router.post('/sensitive-words', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { word, level } = req.body;
    if (!word) {
      res.status(400).json({ error: '敏感词不能为空' });
      return;
    }
    db.prepare('INSERT INTO sensitive_words (word, level) VALUES (?, ?)').run(word, level || 1);
    res.json({ message: '添加成功' });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: '敏感词已存在' });
    } else {
      res.status(500).json({ error: '添加失败' });
    }
  }
});

router.delete('/sensitive-words/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
