
const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      companies: db.prepare('SELECT COUNT(*) as count FROM companies').get().count,
      jobs: db.prepare('SELECT COUNT(*) as count FROM jobs').get().count,
      referrals: db.prepare('SELECT COUNT(*) as count FROM referrals').get().count,
      pending_referrals: db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status = 'pending'").get().count,
      hired: db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status = 'hired'").get().count,
      messages: db.prepare('SELECT COUNT(*) as count FROM messages').get().count,
      verified_companies: db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 1').get().count,
      unverified_companies: db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 0').get().count
    };

    const recentReferrals = db.prepare(`
      SELECT 
        r.*,
        j.title as job_title,
        c.name as company_name,
        u.username as candidate_name,
        ref.username as referrer_name
      FROM referrals r
      JOIN jobs j ON r.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON r.candidate_id = u.id
      JOIN users ref ON r.referrer_id = ref.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all();

    const recentUsers = db.prepare(`
      SELECT id, username, phone, role, wechat_id, avatar, current_company_id, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const formattedStats = {
      total_users: stats.users,
      total_companies: stats.companies,
      pending_companies: stats.unverified_companies,
      total_jobs: stats.jobs,
      total_referrals: stats.referrals,
      success_referrals: stats.hired,
      pending_referrals: stats.pending_referrals,
      total_messages: stats.messages,
      verified_companies: stats.verified_companies,
      unverified_companies: stats.unverified_companies,
      today_new_users: 0,
      today_new_companies: 0,
      today_new_referrals: 0,
      today_messages: 0
    };

    res.json({ stats: formattedStats, recentReferrals, recentUsers });
  } catch (err) {
    console.error('获取管理后台数据失败:', err);
    res.status(500).json({ error: '获取管理后台数据失败' });
  }
});

router.get('/companies/pending', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT 
        c.*,
        u.username as owner_name, u.phone as owner_phone
      FROM companies c
      JOIN users u ON c.owner_id = u.id
      WHERE c.verified = 0
      ORDER BY c.created_at DESC
    `).all();

    res.json({ companies });
  } catch (err) {
    console.error('获取待审核公司失败:', err);
    res.status(500).json({ error: '获取待审核公司失败' });
  }
});

router.put('/companies/:id/verify',
  authenticateToken,
  requireRole('admin'),
  logAudit('verify_company'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
      if (!company) {
        return res.status(404).json({ error: '公司不存在' });
      }

      db.prepare('UPDATE companies SET verified = ? WHERE id = ?').run(verified ? 1 : 0, id);

      const updatedCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
      res.json({ company: updatedCompany });
    } catch (err) {
      console.error('审核公司失败:', err);
      res.status(500).json({ error: '审核公司失败' });
    }
  }
);

router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { role, keyword } = req.query;
    
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (keyword) {
      sql += ' AND (username LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const users = db.prepare(sql).all(...params);
    res.json({ users });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/audit-logs', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = db.prepare(`
      SELECT 
        a.*,
        u.username as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    res.json({ logs, total });
  } catch (err) {
    console.error('获取审计日志失败:', err);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

router.get('/rate-limits', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const limits = db.prepare(`
      SELECT * FROM ip_rate_limits 
      ORDER BY last_attempt DESC
      LIMIT 100
    `).all();

    res.json({ rate_limits: limits });
  } catch (err) {
    console.error('获取限流数据失败:', err);
    res.status(500).json({ error: '获取限流数据失败' });
  }
});

router.delete('/rate-limits/:id',
  authenticateToken,
  requireRole('admin'),
  logAudit('unblock_ip'),
  (req, res) => {
    try {
      const { id } = req.params;
      
      db.prepare('DELETE FROM ip_rate_limits WHERE id = ?').run(id);
      
      res.json({ message: '已解除该IP限制' });
    } catch (err) {
      console.error('解除IP限制失败:', err);
      res.status(500).json({ error: '解除IP限制失败' });
    }
  }
);

module.exports = router;
