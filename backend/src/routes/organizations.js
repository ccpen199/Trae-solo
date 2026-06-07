const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const orgs = db.prepare(`
    SELECT * FROM organizations ORDER BY credit_score DESC LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
  
  res.json({
    success: true,
    data: orgs,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/relations', (req, res) => {
  const relations = db.prepare(`
    SELECT 
      or2.id,
      or2.parent_org_id,
      or2.child_org_id,
      or2.relation_type,
      or2.created_at,
      po.name as parent_name,
      co.name as child_name,
      po.credit_score as parent_credit,
      co.credit_score as child_credit
    FROM org_relations or2
    JOIN organizations po ON or2.parent_org_id = po.id
    JOIN organizations co ON or2.child_org_id = co.id
    ORDER BY or2.id
  `).all();

  const orgs = db.prepare('SELECT id, name, credit_score, activity_count FROM organizations ORDER BY id').all();

  res.json({
    success: true,
    data: {
      nodes: orgs,
      edges: relations
    }
  });
});

router.post('/', (req, res) => {
  const { name, registration_number, contact_person, contact_phone, address } = req.body;
  
  try {
    const ocr_result = registration_number ? JSON.stringify({
      code: registration_number,
      name,
      verified: true,
      verified_at: new Date().toISOString()
    }) : null;
    
    const result = db.prepare(`
      INSERT INTO organizations (name, registration_number, credit_score, contact_person, contact_phone, address, ocr_result, activity_count)
      VALUES (?, ?, 80, ?, ?, ?, ?, 0)
    `).run(name, registration_number, contact_person, contact_phone, address, ocr_result);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, name, credit_score: 80 }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/:id/radar', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) {
    return res.status(404).json({ success: false, message: '组织不存在' });
  }
  
  const activityStats = db.prepare(`
    SELECT 
      COUNT(*) as total_activities,
      AVG(max_volunteers) as avg_volunteers,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_count
    FROM activities WHERE org_id = ?
  `).get(req.params.id);
  
  const volunteerSignupCount = db.prepare(`
    SELECT COUNT(DISTINCT volunteer_id) as count 
    FROM activity_signups asu
    JOIN activities a ON asu.activity_id = a.id
    WHERE a.org_id = ?
  `).get(req.params.id).count;
  
  const totalActivityHours = db.prepare(`
    SELECT COALESCE(SUM(required_hours), 0) as total
    FROM activities WHERE org_id = ? AND status IN ('published', 'completed')
  `).get(req.params.id).total;
  
  const data = {
    labels: ['活跃度', '组织规模', '信用评分', '活动质量', '服务能力'],
    datasets: [{
      label: org.name,
      data: [
        Math.min(100, Math.round(50 + (activityStats.published_count || 0) * 5 + (activityStats.completed_count || 0) * 3)),
        Math.min(100, Math.round(40 + volunteerSignupCount * 8 + (activityStats.avg_volunteers || 0) * 2)),
        org.credit_score || 80,
        Math.min(100, Math.round(60 + (activityStats.completed_count || 0) * 8 + (activityStats.avg_volunteers || 0) * 1)),
        Math.min(100, Math.round(55 + (org.activity_count || 0) * 3 + totalActivityHours * 0.1))
      ]
    }]
  };
  
  res.json({ success: true, data });
});

router.get('/:id', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) {
    return res.status(404).json({ success: false, message: '组织不存在' });
  }
  
  const activities = db.prepare('SELECT * FROM activities WHERE org_id = ? ORDER BY start_time DESC LIMIT 10').all(req.params.id);
  const relations = db.prepare(`
    SELECT or2.*, o.name as child_name 
    FROM org_relations or2 
    JOIN organizations o ON or2.child_org_id = o.id 
    WHERE or2.parent_org_id = ?
  `).all(req.params.id);
  
  const volunteers = db.prepare('SELECT COUNT(*) as count FROM volunteers WHERE current_org_id = ?').get(req.params.id);
  
  res.json({
    success: true,
    data: {
      ...org,
      ocr_result: org.ocr_result ? JSON.parse(org.ocr_result) : null,
      recent_activities: activities,
      relations,
      volunteer_count: volunteers.count
    }
  });
});

module.exports = router;
