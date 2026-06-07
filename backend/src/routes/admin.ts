import express from 'express';
import db from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = express.Router();

router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as any;
    const todayApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE DATE(submit_time) = ?").get(today) as any;
    const completedApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'completed'").get() as any;
    
    const avgProcessingDays = db.prepare(`
      SELECT AVG(JULIANDAY(complete_time) - JULIANDAY(submit_time)) as avg_days
      FROM applications 
      WHERE status = 'completed' AND complete_time IS NOT NULL
    `).get() as any;

    const completionRate = totalApplications.count > 0 
      ? ((completedApplications.count / totalApplications.count) * 100).toFixed(2) + '%'
      : '0%';

    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `).all();

    const deptStats = db.prepare(`
      SELECT i.department, COUNT(*) as count,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM applications a
      LEFT JOIN service_items i ON a.item_id = i.id
      WHERE i.department IS NOT NULL
      GROUP BY i.department
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const weeklyTrend = db.prepare(`
      SELECT DATE(submit_time) as date, COUNT(*) as count
      FROM applications
      WHERE submit_time >= DATE('now', '-7 days')
      GROUP BY DATE(submit_time)
      ORDER BY date
    `).all();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE user_type != ?').get('admin') as any;
    const verifiedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE police_verified = 1').get() as any;

    res.json({
      code: 200,
      data: {
        overview: {
          totalApplications: totalApplications.count,
          todayApplications: todayApplications.count,
          completedApplications: completedApplications.count,
          completionRate,
          avgProcessingDays: avgProcessingDays.avg_days ? avgProcessingDays.avg_days.toFixed(1) : 0,
          totalUsers: totalUsers.count,
          verifiedUsers: verifiedUsers.count
        },
        statusStats,
        deptStats,
        weeklyTrend
      }
    });
  } catch (error) {
    logger.error('获取仪表盘数据失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/bottlenecks', authenticateToken, requireAdmin, (req, res) => {
  try {
    const pendingByDept = db.prepare(`
      SELECT i.department, 
        COUNT(*) as pending_count,
        AVG(JULIANDAY('now') - JULIANDAY(a.submit_time)) as avg_wait_days
      FROM applications a
      LEFT JOIN service_items i ON a.item_id = i.id
      WHERE a.status NOT IN ('completed', 'rejected')
        AND i.department IS NOT NULL
      GROUP BY i.department
      HAVING pending_count > 0
      ORDER BY avg_wait_days DESC
      LIMIT 10
    `).all();

    const slowNodes = db.prepare(`
      SELECT an.node_name, an.department,
        COUNT(*) as count,
        AVG(JULIANDAY('now') - JULIANDAY(an.receive_time)) as avg_wait_days
      FROM application_nodes an
      WHERE an.status = 'pending'
        AND an.receive_time IS NOT NULL
      GROUP BY an.node_name, an.department
      HAVING avg_wait_days > 1
      ORDER BY avg_wait_days DESC
      LIMIT 10
    `).all();

    const supplementCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM applications 
      WHERE supplement_deadline IS NOT NULL
    `).get() as any;

    const overdueReminders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM applications 
      WHERE reminder_sent = 1 AND status NOT IN ('completed', 'rejected')
    `).get() as any;

    res.json({
      code: 200,
      data: {
        pendingByDepartment: pendingByDept,
        slowNodes,
        supplementCount: supplementCount.count,
        overdueReminders: overdueReminders.count,
        suggestions: [
          '建议对市场监督管理局增加审批人员配置',
          '材料预审环节平均等待时间较长，建议优化审核流程',
          '部分办件补正材料即将到期，请及时提醒用户'
        ]
      }
    });
  } catch (error) {
    logger.error('获取堵点分析失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/packages', authenticateToken, requireAdmin, (req, res) => {
  try {
    const packages = db.prepare(`
      SELECT sp.*, 
        COUNT(usp.id) as user_count
      FROM service_packages sp
      LEFT JOIN user_service_packages usp ON sp.id = usp.package_id
      GROUP BY sp.id
      ORDER BY sp.created_at DESC
    `).all();

    res.json({
      code: 200,
      data: packages
    });
  } catch (error) {
    logger.error('获取服务包列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/packages', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const { name, description, targetIndustry, itemIds, benefits } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO service_packages (name, description, target_industry, item_ids, benefits, status)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, description, targetIndustry, JSON.stringify(itemIds), benefits);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '创建服务包', '服务包管理', name);

    logger.info(`服务包创建成功: ${name}`);
    res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    logger.error('创建服务包失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, pageSize = 10, userType, keyword } = req.query;

  try {
    let query = 'SELECT id, username, user_type, real_name, phone, police_verified, status, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (userType) {
      query += ' AND user_type = ?';
      params.push(userType);
    }
    if (keyword) {
      query += ' AND (username LIKE ? OR real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const total = db.prepare(query.replace('SELECT id, username, user_type, real_name, phone, police_verified, status, created_at', 'SELECT COUNT(*) as count')).get(...params) as any;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const users = db.prepare(query).all(...params);

    res.json({
      code: 200,
      data: {
        list: users,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取用户列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/logs', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;

  try {
    const logs = db.prepare(`
      SELECT ol.*, u.username 
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get() as any;

    res.json({
      code: 200,
      data: {
        list: logs,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取操作日志失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
