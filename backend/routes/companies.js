
const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/rateLimit');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT 
        c.*,
        u.username as owner_name,
        COUNT(DISTINCT j.id) as job_count,
        COUNT(DISTINCT cp.id) as photo_count
      FROM companies c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN jobs j ON c.id = j.company_id
      LEFT JOIN company_photos cp ON c.id = cp.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();

    res.json({ companies });
  } catch (err) {
    console.error('获取公司列表失败:', err);
    res.status(500).json({ error: '获取公司列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const company = db.prepare(`
      SELECT 
        c.*,
        u.username as owner_name
      FROM companies c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!company) {
      return res.status(404).json({ error: '公司不存在' });
    }

    const photos = db.prepare(`
      SELECT * FROM company_photos WHERE company_id = ?
    `).all(id);

    const rewards = db.prepare(`
      SELECT * FROM referral_rewards WHERE company_id = ?
    `).all(id);

    res.json({ company, photos, rewards });
  } catch (err) {
    console.error('获取公司详情失败:', err);
    res.status(500).json({ error: '获取公司详情失败' });
  }
});

router.post('/', 
  authenticateToken, 
  requireRole('employer', 'admin'),
  logAudit('create_company'),
  (req, res) => {
    try {
      const { name, license_number, license_image, address, latitude, longitude, description } = req.body;

      if (!name || !license_number || !address) {
        return res.status(400).json({ error: '公司名称、营业执照号和地址必填' });
      }

      const existing = db.prepare('SELECT id FROM companies WHERE license_number = ?').get(license_number);
      if (existing) {
        return res.status(400).json({ error: '该营业执照号已注册' });
      }

      const result = db.prepare(`
        INSERT INTO companies (name, license_number, license_image, address, latitude, longitude, description, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, license_number, license_image || null, address, latitude || null, longitude || null, description || null, req.user.id);

      if (req.user.role !== 'admin') {
        db.prepare('UPDATE users SET current_company_id = ? WHERE id = ?').run(result.lastInsertRowid, req.user.id);
      }

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
      res.json({ company });
    } catch (err) {
      console.error('创建公司失败:', err);
      res.status(500).json({ error: '创建公司失败' });
    }
  }
);

router.post('/:id/photos', 
  authenticateToken,
  logAudit('upload_company_photo'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { image_url, latitude, longitude, geofence_hash } = req.body;

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
      if (!company) {
        return res.status(404).json({ error: '公司不存在' });
      }

      if (company.owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '只有公司所有者可以上传照片' });
      }

      if (!image_url) {
        return res.status(400).json({ error: '图片地址必填' });
      }

      const result = db.prepare(`
        INSERT INTO company_photos (company_id, image_url, latitude, longitude, geofence_hash, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, image_url, latitude || null, longitude || null, geofence_hash || null, req.user.id);

      const photo = db.prepare('SELECT * FROM company_photos WHERE id = ?').get(result.lastInsertRowid);
      res.json({ photo });
    } catch (err) {
      console.error('上传公司照片失败:', err);
      res.status(500).json({ error: '上传照片失败' });
    }
  }
);

router.post('/:id/rewards',
  authenticateToken,
  logAudit('create_referral_reward'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { position_level, reward_type, reward_amount, reward_days, description } = req.body;

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
      if (!company) {
        return res.status(404).json({ error: '公司不存在' });
      }

      if (company.owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '只有公司所有者可以设置奖励规则' });
      }

      if (!position_level || !reward_type) {
        return res.status(400).json({ error: '职位级别和奖励类型必填' });
      }

      if (reward_type === 'cash' && !reward_amount) {
        return res.status(400).json({ error: '现金奖励必须填写金额' });
      }

      if (reward_type === 'vacation' && !reward_days) {
        return res.status(400).json({ error: '假期奖励必须填写天数' });
      }

      const result = db.prepare(`
        INSERT INTO referral_rewards (company_id, position_level, reward_type, reward_amount, reward_days, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, position_level, reward_type, reward_amount || null, reward_days || null, description || null);

      const reward = db.prepare('SELECT * FROM referral_rewards WHERE id = ?').get(result.lastInsertRowid);
      res.json({ reward });
    } catch (err) {
      console.error('创建奖励规则失败:', err);
      res.status(500).json({ error: '创建奖励规则失败' });
    }
  }
);

module.exports = router;
