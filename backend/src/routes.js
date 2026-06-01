const express = require('express');
const { db } = require('./database');
const jobDiagnosis = require('./services/jobDiagnosis');
const talentPool = require('./services/talentPool');
const smartInvitation = require('./services/smartInvitation');
const analytics = require('./services/analytics');

const router = express.Router();
const COMPANY_ID = 1;

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/jobs', (req, res) => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE company_id = ? ORDER BY created_at DESC');
  const jobs = stmt.all(COMPANY_ID).map(job => ({
    ...job,
    diagnosis_result: job.diagnosis_result ? JSON.parse(job.diagnosis_result) : null
  }));
  res.json(jobs);
});

router.post('/jobs', (req, res) => {
  const stmt = db.prepare(`
    INSERT INTO jobs (company_id, title, description, salary_min, salary_max, location, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    COMPANY_ID,
    req.body.title,
    req.body.description,
    req.body.salary_min,
    req.body.salary_max,
    req.body.location,
    req.body.department
  );
  
  const diagnosis = jobDiagnosis.diagnoseJob(req.body);
  jobDiagnosis.saveDiagnosis(result.lastInsertRowid, diagnosis);
  
  res.json({
    id: result.lastInsertRowid,
    diagnosis
  });
});

router.get('/jobs/:id/diagnose', (req, res) => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?');
  const job = stmt.get(req.params.id, COMPANY_ID);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const diagnosis = jobDiagnosis.diagnoseJob(job);
  jobDiagnosis.saveDiagnosis(job.id, diagnosis);
  
  res.json(diagnosis);
});

router.put('/jobs/:id/publish', (req, res) => {
  const companyStmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  const company = companyStmt.get(COMPANY_ID);
  
  if (!company || company.auth_status !== 'approved') {
    return res.status(403).json({ 
      error: 'company_not_verified',
      message: '企业未完成认证，请先完成营业执照、法人身份证和对公账户验证' 
    });
  }

  const jobStmt = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?');
  const job = jobStmt.get(req.params.id, COMPANY_ID);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const diagnosis = job.diagnosis_result ? JSON.parse(job.diagnosis_result) : null;
  
  if (!diagnosis) {
    return res.status(400).json({ 
      error: 'no_diagnosis',
      message: '职位未经过智能诊断，请先完成诊断' 
    });
  }

  if (!diagnosis.compliance || !diagnosis.compliance.passed) {
    return res.status(403).json({ 
      error: 'compliance_failed',
      message: '职位合规审查未通过，存在歧视性表述或薪资问题',
      violations: diagnosis.compliance ? diagnosis.compliance.violations : []
    });
  }

  if (diagnosis.overallScore < 60) {
    return res.status(403).json({ 
      error: 'quality_too_low',
      message: '职位诊断分数过低，建议优化后再发布',
      currentScore: diagnosis.overallScore,
      requiredScore: 60
    });
  }

  const updateStmt = db.prepare(`
    UPDATE jobs SET status = 'published', published_at = CURRENT_TIMESTAMP, published_by = ? 
    WHERE id = ? AND company_id = ?
  `);
  const result = updateStmt.run(1, req.params.id, COMPANY_ID);
  
  res.json({ 
    success: true, 
    auditRecord: {
      publishedBy: 'admin@demo.com',
      publishedAt: new Date().toISOString(),
      complianceScore: diagnosis.overallScore,
      salaryVerified: diagnosis.compliance.salaryVerified,
      channel: '后台人工审批'
    }
  });
});

router.get('/candidates', (req, res) => {
  const { RESIGNATION_REASON_MAP, JOB_ACTIVITY_MAP } = require('./services/talentPool');
  const stmt = db.prepare('SELECT * FROM candidates WHERE company_id = ? ORDER BY created_at DESC');
  const candidates = stmt.all(COMPANY_ID).map(c => ({
    ...c,
    resignation_reason_display: RESIGNATION_REASON_MAP[c.resignation_reason] || c.resignation_reason,
    job_activity_display: JOB_ACTIVITY_MAP[c.job_activity] || c.job_activity
  }));
  res.json(candidates);
});

router.post('/candidates', (req, res) => {
  const candidateId = talentPool.addCandidate(req.body, COMPANY_ID);
  res.json({ id: candidateId });
});

router.get('/candidates/:id', (req, res) => {
  const candidate = talentPool.getCandidateWithTags(req.params.id, COMPANY_ID);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }
  res.json(candidate);
});

router.get('/candidates/:id/similar', (req, res) => {
  const similar = talentPool.findSimilarCandidates(req.params.id, COMPANY_ID);
  res.json(similar);
});

router.put('/candidates/:id/tags', (req, res) => {
  talentPool.updateCandidateTags(req.params.id, req.body.tags);
  res.json({ success: true });
});

router.post('/candidates/search', (req, res) => {
  const results = talentPool.searchCandidatesByTags(COMPANY_ID, req.body.tags || []);
  res.json(results);
});

router.post('/behavior/track', (req, res) => {
  const result = smartInvitation.trackCandidateBehavior(
    req.body.candidate_id,
    req.body.job_id,
    req.body.action || 'view_job'
  );
  res.json(result);
});

router.get('/candidates/:id/engagement', (req, res) => {
  const score = smartInvitation.getCandidateEngagementScore(req.params.id);
  res.json(score);
});

router.get('/jobs/:id/auto-invite', (req, res) => {
  const candidates = smartInvitation.getAutoInvitationCandidates(req.params.id);
  res.json(candidates);
});

router.post('/invitations', (req, res) => {
  const result = smartInvitation.sendInvitation(
    req.body.candidate_id,
    req.body.job_id,
    req.body.channel,
    req.body.message
  );
  res.json(result);
});

router.get('/invitations/candidate/:id', (req, res) => {
  const invitations = smartInvitation.getInvitationsByCandidate(req.params.id);
  res.json(invitations);
});

router.get('/dashboard', (req, res) => {
  const metrics = analytics.getDashboardMetrics(COMPANY_ID);
  res.json(metrics);
});

router.get('/analytics/channels', (req, res) => {
  const channels = analytics.getChannelCostAnalysis(COMPANY_ID);
  res.json(channels);
});

router.get('/analytics/team', (req, res) => {
  const team = analytics.getTeamEfficiency(COMPANY_ID);
  res.json(team);
});

router.post('/channels', (req, res) => {
  const id = analytics.addRecruitmentChannel(COMPANY_ID, req.body.name, req.body.cost_per_candidate);
  res.json({ id });
});

router.post('/interviews', (req, res) => {
  const id = analytics.recordInterview(req.body);
  res.json({ id });
});

router.put('/interviews/:id/result', (req, res) => {
  analytics.updateInterviewResult(
    req.params.id,
    req.body.passed,
    req.body.hired,
    req.body.retention_30d
  );
  res.json({ success: true });
});

router.get('/companies/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  const company = stmt.get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  res.json(company);
});

router.put('/companies/:id/verify', (req, res) => {
  const stmt = db.prepare(`
    UPDATE companies 
    SET business_license = ?, legal_person_id = ?, corporate_account = ?, auth_status = 'pending'
    WHERE id = ?
  `);
  stmt.run(
    req.body.business_license,
    req.body.legal_person_id,
    req.body.corporate_account,
    req.params.id
  );
  res.json({ success: true, status: 'pending' });
});

router.get('/hris/integrations', (req, res) => {
  const stmt = db.prepare('SELECT id, provider, sync_status, last_sync_at FROM hris_integrations WHERE company_id = ?');
  const integrations = stmt.all(COMPANY_ID);
  res.json(integrations);
});

router.post('/hris/connect', (req, res) => {
  const stmt = db.prepare(`
    INSERT INTO hris_integrations (company_id, provider, api_key, api_url, sync_status)
    VALUES (?, ?, ?, ?, 'connected')
  `);
  const id = stmt.run(COMPANY_ID, req.body.provider, req.body.api_key, req.body.api_url).lastInsertRowid;
  res.json({ id, status: 'connected' });
});

router.post('/hris/sync/:provider', (req, res) => {
  const stmt = db.prepare(`
    UPDATE hris_integrations 
    SET sync_status = 'syncing', last_sync_at = CURRENT_TIMESTAMP
    WHERE company_id = ? AND provider = ?
  `);
  stmt.run(COMPANY_ID, req.params.provider);
  
  setTimeout(() => {
    const updateStmt = db.prepare(`
      UPDATE hris_integrations SET sync_status = 'connected'
      WHERE company_id = ? AND provider = ?
    `);
    updateStmt.run(COMPANY_ID, req.params.provider);
  }, 2000);
  
  res.json({ status: 'syncing', provider: req.params.provider });
});

module.exports = router;
