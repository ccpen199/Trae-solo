const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware');

const router = express.Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  
  let sql = 'SELECT * FROM policies WHERE is_active = 1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC';
  
  const policies = db.prepare(sql).all(...params);
  res.json(policies);
});

router.get('/match/:jobId', authenticateToken, (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.is_encouraged_industry
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const matchedPolicies = [];
  const allPolicies = db.prepare('SELECT * FROM policies WHERE is_active = 1').all();

  for (const policy of allPolicies) {
    let matched = false;
    let matchReason = '';

    if (policy.policy_number === '财税〔2020〕31号' && job.is_encouraged_industry) {
      matched = true;
      matchReason = '企业属于海南自贸港鼓励类产业目录，可享受15%企业所得税优惠';
    }

    if (policy.policy_number === '财税〔2020〕32号' && job.salary_max >= 20000) {
      matched = true;
      matchReason = '岗位薪资水平符合高端紧缺人才认定标准，可享受15%个人所得税优惠';
    }

    if (policy.policy_number === '琼府〔2020〕30号' && (job.rcep_skills && job.rcep_skills.includes('外籍'))) {
      matched = true;
      matchReason = '岗位涉及外籍雇员招聘，可享受工作许可便利政策';
    }

    if (policy.policy_number === '琼办发〔2019〕41号') {
      matched = true;
      matchReason = '符合条件的人才可享受住房租赁补贴或购房补贴';
    }

    if (matched) {
      matchedPolicies.push({
        ...policy,
        matchReason
      });
    }
  }

  res.json({
    matchedPolicies,
    autoHasFtzSubsidy: matchedPolicies.length > 0,
    subsidyPolicyRef: matchedPolicies.map(p => p.policy_number).join(','),
    policyBasis: matchedPolicies.map(p => `${p.title_cn}：${p.matchReason}`).join('\n')
  });
});

router.post('/match-policy-for-company', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const { industryCode, salaryRange, jobCategory } = req.body;
  
  const industry = db.prepare('SELECT * FROM industry_catalog WHERE code = ?').get(industryCode);
  
  const matchedPolicies = [];
  const allPolicies = db.prepare('SELECT * FROM policies WHERE is_active = 1').all();

  for (const policy of allPolicies) {
    let matched = false;
    let matchReason = '';

    if (policy.policy_number === '财税〔2020〕31号' && industry && industry.is_encouraged) {
      matched = true;
      matchReason = `所属行业"${industry.name_cn}"属于鼓励类产业，企业减按15%征收企业所得税`;
    }

    if (policy.policy_number === '财税〔2020〕32号' && salaryRange && salaryRange.max >= 20000) {
      matched = true;
      matchReason = '薪资水平符合高端紧缺人才标准，个人所得税实际税负超过15%部分免征';
    }

    if (policy.policy_number === '琼办发〔2019〕41号') {
      matched = true;
      matchReason = '符合条件的人才可申请住房租赁补贴或购房补贴';
    }

    if (policy.policy_number === '琼府〔2020〕30号') {
      matched = true;
      matchReason = '如需聘用外籍人员，可享受工作许可便利';
    }

    if (matched) {
      matchedPolicies.push({
        ...policy,
        matchReason
      });
    }
  }

  res.json({
    industry,
    matchedPolicies,
    recommendations: [
      '建议在职位中标注"享受自贸港专项补贴"以吸引人才',
      '可在职位详情中关联相关政策文号，增强可信度',
      '鼓励类产业企业可优先享受各项税收优惠政策'
    ]
  });
});

module.exports = router;
