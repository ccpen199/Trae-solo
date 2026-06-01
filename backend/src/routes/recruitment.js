const express = require('express');
const db = require('../database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/campaigns', authMiddleware, (req, res) => {
  const { club_id, status } = req.query;
  let sql = `
    SELECT rc.*, c.name as club_name
    FROM recruitment_campaigns rc
    JOIN clubs c ON rc.club_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (club_id) {
    sql += ' AND rc.club_id = ?';
    params.push(club_id);
  }
  if (status) {
    sql += ' AND rc.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY rc.created_at DESC';
  
  const campaigns = db.prepare(sql).all(...params);
  res.json(campaigns);
});

router.post('/campaigns', authMiddleware, (req, res) => {
  const { club_id, title, description, requirements, start_date, end_date, interview_info } = req.body;
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '只有社团负责人可以创建纳新活动' });
  }

  const result = db.prepare(`
    INSERT INTO recruitment_campaigns (club_id, title, description, requirements, start_date, end_date, interview_info, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(club_id, title, description, requirements, start_date, end_date, interview_info);

  res.json({ id: result.lastInsertRowid, message: '纳新活动创建成功' });
});

router.get('/campaigns/:id', authMiddleware, (req, res) => {
  const campaign = db.prepare(`
    SELECT rc.*, c.name as club_name
    FROM recruitment_campaigns rc
    JOIN clubs c ON rc.club_id = c.id
    WHERE rc.id = ?
  `).get(req.params.id);
  
  if (!campaign) {
    return res.status(404).json({ error: '纳新活动不存在' });
  }
  res.json(campaign);
});

router.post('/campaigns/:id/apply', authMiddleware, (req, res) => {
  const campaignId = req.params.id;
  const { reason, resume } = req.body;
  
  const campaign = db.prepare('SELECT * FROM recruitment_campaigns WHERE id = ?').get(campaignId);
  if (!campaign) {
    return res.status(404).json({ error: '纳新活动不存在' });
  }
  if (campaign.status !== 'active') {
    return res.status(400).json({ error: '纳新活动已结束' });
  }

  const isMember = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND status = 'active'
  `).get(campaign.club_id, req.user.id);
  
  if (isMember) {
    return res.status(400).json({ error: '您已经是该社团成员' });
  }

  try {
    db.prepare(`
      INSERT INTO recruitment_applications (campaign_id, user_id, club_id, reason, resume)
      VALUES (?, ?, ?, ?, ?)
    `).run(campaignId, req.user.id, campaign.club_id, reason, resume);
    
    res.json({ message: '报名成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '您已经报名过该纳新活动' });
    }
    throw err;
  }
});

router.get('/campaigns/:id/applications', authMiddleware, (req, res) => {
  const campaignId = req.params.id;
  
  const campaign = db.prepare('SELECT club_id FROM recruitment_campaigns WHERE id = ?').get(campaignId);
  if (!campaign) {
    return res.status(404).json({ error: '纳新活动不存在' });
  }
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(campaign.club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '权限不足' });
  }

  const applications = db.prepare(`
    SELECT ra.*, u.name, u.student_id, u.phone, u.email
    FROM recruitment_applications ra
    JOIN users u ON ra.user_id = u.id
    WHERE ra.campaign_id = ?
    ORDER BY ra.applied_at DESC
  `).all(campaignId);
  res.json(applications);
});

router.put('/applications/:id/status', authMiddleware, (req, res) => {
  const { status, interview_time } = req.body;
  const applicationId = req.params.id;
  
  const application = db.prepare('SELECT * FROM recruitment_applications WHERE id = ?').get(applicationId);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const isLeader = db.prepare(`
    SELECT 1 FROM club_members 
    WHERE club_id = ? AND user_id = ? AND role = 'leader'
  `).get(application.club_id, req.user.id);
  
  const isAdmin = req.user.role === 'admin';
  
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ error: '权限不足' });
  }

  db.prepare(`
    UPDATE recruitment_applications 
    SET status = ?, interview_time = ?
    WHERE id = ?
  `).run(status, interview_time, applicationId);

  if (status === 'accepted') {
    const club = db.prepare('SELECT member_count, max_members FROM clubs WHERE id = ?').get(application.club_id);
    if (club.member_count >= club.max_members) {
      return res.status(400).json({ error: '社团人数已满' });
    }

    const existingMember = db.prepare(`
      SELECT * FROM club_members WHERE club_id = ? AND user_id = ?
    `).get(application.club_id, application.user_id);

    if (existingMember) {
      if (existingMember.status !== 'active') {
        db.prepare(`
          UPDATE club_members 
          SET status = 'active', role = 'member', join_date = CURRENT_TIMESTAMP, leave_date = NULL
          WHERE club_id = ? AND user_id = ?
        `).run(application.club_id, application.user_id);
        db.prepare(`
          UPDATE clubs SET member_count = member_count + 1 WHERE id = ?
        `).run(application.club_id);
      }
    } else {
      db.prepare(`
        INSERT INTO club_members (club_id, user_id, role, status)
        VALUES (?, ?, 'member', 'active')
      `).run(application.club_id, application.user_id);
      db.prepare(`
        UPDATE clubs SET member_count = member_count + 1 WHERE id = ?
      `).run(application.club_id);
    }

    db.prepare(`
      INSERT INTO member_history (club_id, user_id, action, operator_id)
      VALUES (?, ?, 'join', ?)
    `).run(application.club_id, application.user_id, req.user.id);
  }

  res.json({ message: '状态更新成功' });
});

router.get('/my-applications', authMiddleware, (req, res) => {
  const applications = db.prepare(`
    SELECT ra.*, c.name as club_name, rc.title as campaign_title
    FROM recruitment_applications ra
    JOIN clubs c ON ra.club_id = c.id
    JOIN recruitment_campaigns rc ON ra.campaign_id = rc.id
    WHERE ra.user_id = ?
    ORDER BY ra.applied_at DESC
  `).all(req.user.id);
  res.json(applications);
});

module.exports = router;
