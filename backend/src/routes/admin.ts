import { Router } from 'express';
import db from '../db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', (req: AuthRequest, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const resumeCount = db.prepare('SELECT COUNT(*) as count FROM resumes').get() as { count: number };
  const deliveryCount = db.prepare('SELECT COUNT(*) as count FROM delivery_records').get() as { count: number };
  const todayDeliveries = db.prepare("SELECT COUNT(*) as count FROM delivery_records WHERE DATE(created_at) = DATE('now')").get() as { count: number };
  
  const industryStats = db.prepare(`
    SELECT r.template_id, COUNT(*) as count 
    FROM resumes r 
    GROUP BY r.template_id 
    ORDER BY count DESC 
    LIMIT 10
  `).all();
  
  res.json({
    stats: {
      total_users: userCount.count,
      total_resumes: resumeCount.count,
      total_deliveries: deliveryCount.count,
      today_deliveries: todayDeliveries.count
    },
    template_usage: industryStats
  });
});

router.get('/users', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;
  
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.created_at, u.is_admin,
           (SELECT COUNT(*) FROM resumes r WHERE r.user_id = u.id) as resume_count,
           (SELECT COUNT(*) FROM delivery_records d WHERE d.user_id = u.id) as delivery_count
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  res.json({ users, total: total.count, page, pageSize });
});

router.get('/resumes', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;
  
  const resumes = db.prepare(`
    SELECT r.id, r.title, r.template_id, r.created_at, r.updated_at,
           u.name as user_name, u.email as user_email
    FROM resumes r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM resumes').get() as { count: number };
  
  res.json({ resumes, total: total.count, page, pageSize });
});

router.get('/deliveries', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;
  
  const deliveries = db.prepare(`
    SELECT d.id, d.company, d.position, d.tracking_code, d.status, d.created_at,
           u.name as user_name, u.email as user_email,
           r.title as resume_title
    FROM delivery_records d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN resumes r ON d.resume_id = r.id
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM delivery_records').get() as { count: number };
  
  res.json({ deliveries, total: total.count, page, pageSize });
});

router.delete('/users/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '用户不存在或为管理员' });
  }
  
  db.prepare('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)').run(
    req.user!.id,
    'delete_user',
    `Deleted user ID: ${req.params.id}`
  );
  
  res.json({ success: true });
});

router.get('/logs', (req: AuthRequest, res) => {
  const logs = db.prepare(`
    SELECT al.*, u.name as admin_name
    FROM admin_logs al
    LEFT JOIN users u ON al.admin_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 100
  `).all();
  
  res.json({ logs });
});

export default router;
