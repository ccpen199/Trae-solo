const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth.optional, (req, res) => {
  const { page = 1, pageSize = 10, keyword, industry, scale, benefitType } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['status = ?'];
  let params = ['published'];
  
  if (keyword) {
    where.push('(title LIKE ? OR summary LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (benefitType) {
    where.push('benefit_type = ?');
    params.push(benefitType);
  }
  
  const whereSql = 'WHERE ' + where.join(' AND ');
  
  let policies = db.prepare(`
    SELECT * FROM policies ${whereSql}
    ORDER BY publish_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM policies ${whereSql}
  `).get(...params).count;
  
  if (req.userId) {
    const bindings = db.prepare(`
      SELECT e.industry, e.scale, e.tax_amount
      FROM enterprise_bindings eb
      JOIN enterprises e ON eb.enterprise_id = e.id
      WHERE eb.user_id = ? AND eb.status = 'verified'
    `).all(req.userId);
    
    if (bindings.length > 0) {
      const userEnterprise = bindings[0];
      policies = policies.map(policy => {
        let matchScore = 0;
        let matchTags = [];
        
        const policyIndustries = policy.industry_tags?.split(',') || [];
        const policyScales = policy.scale_tags?.split(',') || [];
        
        if (policyIndustries.includes('all') || policyIndustries.includes(userEnterprise.industry)) {
          matchScore += 30;
          matchTags.push('行业匹配');
        }
        
        if (policyScales.includes('all') || policyScales.includes(userEnterprise.scale)) {
          matchScore += 30;
          matchTags.push('规模匹配');
        }
        
        if ((policy.tax_min === null || userEnterprise.tax_amount >= policy.tax_min) &&
            (policy.tax_max === null || userEnterprise.tax_amount <= policy.tax_max)) {
          matchScore += 40;
          matchTags.push('税额匹配');
        }
        
        return { ...policy, matchScore, matchTags, isMatch: matchScore >= 60 };
      });
    }
  }
  
  res.json({ list: policies, total });
});

router.get('/recommended', auth, (req, res) => {
  const bindings = db.prepare(`
    SELECT e.id, e.industry, e.scale, e.tax_amount
    FROM enterprise_bindings eb
    JOIN enterprises e ON eb.enterprise_id = e.id
    WHERE eb.user_id = ? AND eb.status = 'verified'
  `).all(req.userId);
  
  if (bindings.length === 0) {
    return res.json({ list: [], message: '请先绑定企业' });
  }
  
  const userEnterprise = bindings[0];
  
  const allPolicies = db.prepare(`
    SELECT * FROM policies 
    WHERE status = 'published'
    ORDER BY publish_date DESC
  `).all();
  
  const scoredPolicies = allPolicies.map(policy => {
    let matchScore = 0;
    let matchTags = [];
    
    const policyIndustries = policy.industry_tags?.split(',') || [];
    const policyScales = policy.scale_tags?.split(',') || [];
    
    if (policyIndustries.includes('all') || policyIndustries.includes(userEnterprise.industry)) {
      matchScore += 30;
      matchTags.push('行业匹配');
    }
    
    if (policyScales.includes('all') || policyScales.includes(userEnterprise.scale)) {
      matchScore += 30;
      matchTags.push('规模匹配');
    }
    
    if ((policy.tax_min === null || userEnterprise.tax_amount >= policy.tax_min) &&
        (policy.tax_max === null || userEnterprise.tax_amount <= policy.tax_max)) {
      matchScore += 40;
      matchTags.push('税额匹配');
    }
    
    return { ...policy, matchScore, matchTags };
  }).filter(p => p.matchScore >= 60)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  res.json({ list: scoredPolicies, enterprise: userEnterprise });
});

router.get('/:id', auth.optional, (req, res) => {
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  
  if (!policy) {
    return res.status(404).json({ error: '政策不存在' });
  }
  
  db.prepare('UPDATE policies SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  
  res.json({ ...policy, viewCount: policy.view_count + 1 });
});

router.post('/:id/apply', auth, async (req, res) => {
  const { applicationData } = req.body;
  const policyId = req.params.id;
  
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId);
  if (!policy) {
    return res.status(404).json({ error: '政策不存在' });
  }
  
  const bindings = db.prepare(`
    SELECT e.id, e.name
    FROM enterprise_bindings eb
    JOIN enterprises e ON eb.enterprise_id = e.id
    WHERE eb.user_id = ? AND eb.status = 'verified'
  `).all(req.userId);
  
  if (bindings.length === 0) {
    return res.status(400).json({ error: '请先绑定已认证的企业' });
  }
  
  const enterpriseId = bindings[0].id;
  
  const existing = db.prepare(`
    SELECT id FROM policy_applications 
    WHERE policy_id = ? AND enterprise_id = ? AND status != 'rejected'
  `).get(policyId, enterpriseId);
  
  if (existing) {
    return res.status(400).json({ error: '已申请该政策，请勿重复申请' });
  }
  
  const applicationNo = 'PA' + Date.now();
  
  try {
    const result = db.prepare(`
      INSERT INTO policy_applications (policy_id, enterprise_id, user_id, application_data, status, current_stage)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(policyId, enterpriseId, req.userId, JSON.stringify(applicationData || {}), 'submitted', 'review');
    
    db.prepare(`
      INSERT INTO policy_application_logs (application_id, stage, status, operator, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, 'review', 'submitted', '用户', '政策申请已提交');
    
    res.json({ 
      id: result.lastInsertRowid, 
      applicationNo,
      message: '申请提交成功' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '申请失败' });
  }
});

router.get('/applications/my', auth, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['pa.user_id = ?'];
  let params = [req.userId];
  
  if (status) {
    where.push('pa.status = ?');
    params.push(status);
  }
  
  const whereSql = 'WHERE ' + where.join(' AND ');
  
  const applications = db.prepare(`
    SELECT pa.*, p.title as policy_title, p.benefit_amount, e.name as enterprise_name
    FROM policy_applications pa
    JOIN policies p ON pa.policy_id = p.id
    JOIN enterprises e ON pa.enterprise_id = e.id
    ${whereSql}
    ORDER BY pa.submitted_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM policy_applications pa ${whereSql}
  `).get(...params).count;
  
  res.json({ list: applications, total });
});

router.get('/applications/:id', auth, (req, res) => {
  const application = db.prepare(`
    SELECT pa.*, p.title as policy_title, p.content as policy_content, p.department,
           e.name as enterprise_name, e.unified_credit_code
    FROM policy_applications pa
    JOIN policies p ON pa.policy_id = p.id
    JOIN enterprises e ON pa.enterprise_id = e.id
    WHERE pa.id = ? AND pa.user_id = ?
  `).get(req.params.id, req.userId);
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const logs = db.prepare(`
    SELECT * FROM policy_application_logs 
    WHERE application_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id);
  
  res.json({
    ...application,
    applicationData: application.application_data ? JSON.parse(application.application_data) : null,
    logs
  });
});

router.put('/applications/:id/cancel', auth, (req, res) => {
  db.prepare(`
    UPDATE policy_applications 
    SET status = 'cancelled'
    WHERE id = ? AND user_id = ? AND status IN ('submitted', 'reviewing')
  `).run(req.params.id, req.userId);
  
  res.json({ message: '申请已取消' });
});

module.exports = router;
