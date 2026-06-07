
const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { checkRateLimit, logAudit } = require('../middleware/rateLimit');

const router = express.Router();

function logReferralStatus(referralId, oldStatus, newStatus, operatorId, note = null) {
  db.prepare(`
    INSERT INTO referral_status_logs (referral_id, old_status, new_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(referralId, oldStatus, newStatus, operatorId, note);
}

router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let sql, params;

    if (type === 'sent') {
      sql = `
        SELECT 
          r.*,
          j.title as job_title,
          c.name as company_name,
          u.username as candidate_name, u.avatar as candidate_avatar,
          ref.username as referrer_name,
          rw.reward_type, rw.reward_amount, rw.reward_days
        FROM referrals r
        JOIN jobs j ON r.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        JOIN users u ON r.candidate_id = u.id
        JOIN users ref ON r.referrer_id = ref.id
        LEFT JOIN referral_rewards rw ON r.reward_id = rw.id
        WHERE r.referrer_id = ?
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    } else if (type === 'received') {
      sql = `
        SELECT 
          r.*,
          j.title as job_title,
          c.name as company_name,
          ref.username as referrer_name, ref.avatar as referrer_avatar,
          rw.reward_type, rw.reward_amount, rw.reward_days
        FROM referrals r
        JOIN jobs j ON r.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        JOIN users ref ON r.referrer_id = ref.id
        LEFT JOIN referral_rewards rw ON r.reward_id = rw.id
        WHERE r.candidate_id = ?
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    } else if (type === 'company' && (req.user.role === 'employer' || req.user.role === 'admin')) {
      sql = `
        SELECT 
          r.*,
          j.title as job_title,
          c.name as company_name,
          u.username as candidate_name, u.avatar as candidate_avatar,
          ref.username as referrer_name, ref.avatar as referrer_avatar,
          rw.reward_type, rw.reward_amount, rw.reward_days
        FROM referrals r
        JOIN jobs j ON r.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        JOIN users u ON r.candidate_id = u.id
        JOIN users ref ON r.referrer_id = ref.id
        LEFT JOIN referral_rewards rw ON r.reward_id = rw.id
        WHERE c.id = ?
        ORDER BY r.created_at DESC
      `;
      params = [req.user.current_company_id];
    } else {
      sql = `
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
        WHERE r.candidate_id = ? OR r.referrer_id = ?
        ORDER BY r.created_at DESC
      `;
      params = [userId, userId];
    }

    const referrals = db.prepare(sql).all(...params);
    res.json({ referrals });
  } catch (err) {
    console.error('获取内推列表失败:', err);
    res.status(500).json({ error: '获取内推列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const referral = db.prepare(`
      SELECT 
        r.*,
        j.title as job_title, j.description as job_description, j.salary_min, j.salary_max,
        c.name as company_name, c.verified as company_verified, c.address as company_address,
        u.username as candidate_name, u.phone as candidate_phone, u.avatar as candidate_avatar,
        ref.username as referrer_name, ref.avatar as referrer_avatar,
        rw.reward_type, rw.reward_amount, rw.reward_days
      FROM referrals r
      JOIN jobs j ON r.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON r.candidate_id = u.id
      JOIN users ref ON r.referrer_id = ref.id
      LEFT JOIN referral_rewards rw ON r.reward_id = rw.id
      WHERE r.id = ?
    `).get(id);

    if (!referral) {
      return res.status(404).json({ error: '内推申请不存在' });
    }

    if (referral.candidate_id !== userId && 
        referral.referrer_id !== userId && 
        req.user.role !== 'admin' &&
        (req.user.role !== 'employer' || req.user.current_company_id !== referral.company_id)) {
      return res.status(403).json({ error: '无权查看此内推申请' });
    }

    const statusLogs = db.prepare(`
      SELECT 
        l.*,
        u.username as operator_name
      FROM referral_status_logs l
      JOIN users u ON l.operator_id = u.id
      WHERE l.referral_id = ?
      ORDER BY l.created_at ASC
    `).all(id);

    res.json({ referral, statusLogs });
  } catch (err) {
    console.error('获取内推详情失败:', err);
    res.status(500).json({ error: '获取内推详情失败' });
  }
});

router.post('/',
  authenticateToken,
  checkRateLimit('create_referral', 5, 60),
  logAudit('create_referral'),
  (req, res) => {
    try {
      const { job_id, candidate_id, message } = req.body;
      const referrerId = req.user.id;

      if (!job_id || !candidate_id) {
        return res.status(400).json({ error: '职位和候选人必填' });
      }

      if (candidate_id === referrerId) {
        return res.status(400).json({ error: '不能内推自己' });
      }

      const friendship = db.prepare(`
        SELECT id, wechat_verified FROM friendships 
        WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
      `).get(referrerId, candidate_id);

      if (!friendship) {
        return res.status(403).json({ error: '只能内推好友' });
      }

      const job = db.prepare(`
        SELECT j.*, c.id as company_id
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE j.id = ? AND j.status = 'active'
      `).get(job_id);

      if (!job) {
        return res.status(404).json({ error: '职位不存在或已下架' });
      }

      const referrer = db.prepare('SELECT current_company_id FROM users WHERE id = ?').get(referrerId);
      if (!referrer || referrer.current_company_id !== job.company_id) {
        return res.status(400).json({ error: '只能内推自己所在公司的职位' });
      }

      const existing = db.prepare(`
        SELECT id FROM referrals 
        WHERE job_id = ? AND candidate_id = ? AND status IN ('pending', 'reviewing', 'interviewing', 'offer')
      `).get(job_id, candidate_id);

      if (existing) {
        return res.status(400).json({ error: '该候选人已申请过此职位' });
      }

      const reward = db.prepare(`
        SELECT id FROM referral_rewards 
        WHERE company_id = ? AND position_level = ?
      `).get(job.company_id, job.position_level);

      const referrerWechat = db.prepare('SELECT wechat_id FROM users WHERE id = ?').get(referrerId);
      const candidateWechat = db.prepare('SELECT wechat_id FROM users WHERE id = ?').get(candidate_id);
      const wechat_verified = (referrerWechat.wechat_id && 
                               candidateWechat.wechat_id && 
                               friendship.wechat_verified) ? 1 : 0;

      const result = db.prepare(`
        INSERT INTO referrals (job_id, candidate_id, referrer_id, wechat_verified, reward_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(job_id, candidate_id, referrerId, wechat_verified, reward ? reward.id : null);

      const referralId = result.lastInsertRowid;
      logReferralStatus(referralId, null, 'pending', referrerId, message || '发起内推');

      db.prepare('UPDATE referrals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(referralId);

      const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId);
      res.json({ referral });
    } catch (err) {
      console.error('创建内推失败:', err);
      res.status(500).json({ error: '创建内推失败' });
    }
  }
);

router.put('/:id/status',
  authenticateToken,
  logAudit('update_referral_status'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const userId = req.user.id;

      const validStatuses = ['pending', 'reviewing', 'interviewing', 'offer', 'hired', 'rejected', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: '无效的状态' });
      }

      const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(id);
      if (!referral) {
        return res.status(404).json({ error: '内推申请不存在' });
      }

      const job = db.prepare('SELECT company_id FROM jobs WHERE id = ?').get(referral.job_id);
      const isCompanyAdmin = req.user.current_company_id === job.company_id && 
                            (req.user.role === 'employer' || req.user.role === 'admin');

      if (!isCompanyAdmin && 
          referral.candidate_id !== userId && 
          referral.referrer_id !== userId) {
        return res.status(403).json({ error: '无权操作此内推申请' });
      }

      if (status === 'cancelled' && referral.candidate_id !== userId) {
        return res.status(403).json({ error: '只有候选人可以取消申请' });
      }

      if (['reviewing', 'interviewing', 'offer', 'hired', 'rejected'].includes(status) && !isCompanyAdmin) {
        return res.status(403).json({ error: '只有企业管理员可以更新此状态' });
      }

      const oldStatus = referral.status;

      db.prepare(`
        UPDATE referrals 
        SET status = ?, updated_at = CURRENT_TIMESTAMP, rejection_reason = ?
        WHERE id = ?
      `).run(status, status === 'rejected' ? note : null, id);

      logReferralStatus(id, oldStatus, status, userId, note);

      if (status === 'hired') {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 3);
        
        db.prepare(`
          INSERT INTO onboarding_flows (referral_id, candidate_id, company_id, step, expires_at)
          VALUES (?, ?, ?, 0, ?)
        `).run(id, referral.candidate_id, job.company_id, expiresAt.toISOString());
      }

      const updatedReferral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(id);
      res.json({ referral: updatedReferral });
    } catch (err) {
      console.error('更新内推状态失败:', err);
      res.status(500).json({ error: '更新内推状态失败' });
    }
  }
);

module.exports = router;
