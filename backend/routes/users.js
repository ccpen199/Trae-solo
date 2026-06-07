
const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/friends', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const friends = db.prepare(`
      SELECT 
        u.id, u.username, u.phone, u.avatar, u.current_company_id,
        c.name as company_name,
        f.wechat_verified, f.created_at
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN companies c ON u.current_company_id = c.id
      WHERE f.user_id = ? AND f.status = 'accepted'
    `).all(userId);

    res.json({ friends });
  } catch (err) {
    console.error('获取好友列表失败:', err);
    res.status(500).json({ error: '获取好友列表失败' });
  }
});

router.post('/friends', authenticateToken, logAudit('add_friend'), (req, res) => {
  try {
    const { phone, wechat_id, friend_phone, friend_wechat_id } = req.body;
    const userId = req.user.id;

    const searchPhone = friend_phone || phone;
    const searchWechat = friend_wechat_id || wechat_id;

    let friend;
    if (searchPhone) {
      friend = db.prepare('SELECT id, wechat_id FROM users WHERE phone = ?').get(searchPhone);
    }

    if (!friend && searchWechat) {
      friend = db.prepare('SELECT id, wechat_id FROM users WHERE wechat_id = ?').get(searchWechat);
    }

    const wechat_verified = req.user.wechat_id && friend?.wechat_id && 
                            searchWechat && 
                            req.user.wechat_id === searchWechat ? 1 : 0;

    if (!friend) {
      return res.status(404).json({ error: '未找到该用户，请确认手机号或微信ID' });
    }

    if (friend.id === userId) {
      return res.status(400).json({ error: '不能添加自己为好友' });
    }

    const existing = db.prepare(`
      SELECT id FROM friendships WHERE user_id = ? AND friend_id = ?
    `).get(userId, friend.id);

    if (existing) {
      return res.status(400).json({ error: '已经是好友了' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO friendships (user_id, friend_id, wechat_verified, status)
      VALUES (?, ?, ?, 'accepted')
    `);

    const tx = db.transaction((userId, friendId, wechatVerified) => {
      insertStmt.run(userId, friendId, wechatVerified);
      insertStmt.run(friendId, userId, wechatVerified);
    });

    tx(userId, friend.id, wechat_verified);

    const friendInfo = db.prepare(`
      SELECT 
        u.id, u.username, u.phone, u.avatar, u.current_company_id,
        c.name as company_name,
        ? as wechat_verified
      FROM users u
      LEFT JOIN companies c ON u.current_company_id = c.id
      WHERE u.id = ?
    `).get(wechat_verified, friend.id);

    res.json({ friend: friendInfo });
  } catch (err) {
    console.error('添加好友失败:', err);
    res.status(500).json({ error: '添加好友失败' });
  }
});

router.get('/friends/:friendId/companies/:companyId/jobs', authenticateToken, (req, res) => {
  try {
    const { friendId, companyId } = req.params;
    const userId = req.user.id;

    const friendship = db.prepare(`
      SELECT id, wechat_verified FROM friendships 
      WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
    `).get(userId, friendId);

    if (!friendship) {
      return res.status(403).json({ error: '你们不是好友关系' });
    }

    const friend = db.prepare(`
      SELECT current_company_id FROM users WHERE id = ?
    `).get(friendId);

    if (!friend || friend.current_company_id !== parseInt(companyId)) {
      return res.status(404).json({ error: '好友不在该公司任职' });
    }

    const jobs = db.prepare(`
      SELECT 
        j.id, j.title, j.salary_min, j.salary_max, j.location, 
        j.position_level, j.description, j.created_at,
        c.name as company_name, c.verified as company_verified,
        r.reward_type, r.reward_amount, r.reward_days
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN referral_rewards r ON j.company_id = r.company_id AND j.position_level = r.position_level
      WHERE j.company_id = ? AND j.status = 'active'
    `).all(companyId);

    const jobsWithBenefits = jobs.map(job => {
      const benefits = db.prepare(`
        SELECT benefit_type, benefit_value FROM job_benefits WHERE job_id = ?
      `).all(job.id);
      return { ...job, benefits };
    });

    res.json({ jobs, wechat_verified: friendship.wechat_verified });
  } catch (err) {
    console.error('获取好友公司职位失败:', err);
    res.status(500).json({ error: '获取职位失败' });
  }
});

router.get('/friends/companies/jobs', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const jobs = db.prepare(`
      SELECT 
        j.id, j.title, j.salary_min, j.salary_max, j.location, 
        j.position_level, j.description, j.created_at,
        c.name as company_name, c.verified as company_verified,
        c.id as company_id,
        u.id as referrer_id, u.username as referrer_name, u.avatar as referrer_avatar,
        f.wechat_verified,
        r.reward_type, r.reward_amount, r.reward_days
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON c.id = u.current_company_id
      JOIN friendships f ON u.id = f.friend_id AND f.user_id = ? AND f.status = 'accepted'
      LEFT JOIN referral_rewards r ON j.company_id = r.company_id AND j.position_level = r.position_level
      WHERE j.status = 'active'
      GROUP BY j.id
    `).all(userId);

    const jobsWithBenefits = jobs.map(job => {
      const benefits = db.prepare(`
        SELECT benefit_type, benefit_value FROM job_benefits WHERE job_id = ?
      `).all(job.id);
      return { ...job, benefits };
    });

    res.json({ jobs: jobsWithBenefits });
  } catch (err) {
    console.error('获取好友公司所有职位失败:', err);
    res.status(500).json({ error: '获取职位失败' });
  }
});

module.exports = router;
