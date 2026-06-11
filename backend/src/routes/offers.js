const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateSignToken() {
  return crypto.randomBytes(16).toString('hex');
}

const ONBOARDING_TASKS = [
  { name: '提交入职材料', type: 'document', required: 1 },
  { name: '签署劳动合同', type: 'signature', required: 1 },
  { name: '办理社保公积金', type: 'admin', required: 1 },
  { name: '分配办公设备', type: 'asset', required: 1 },
  { name: '开通系统账号', type: 'account', required: 1 },
  { name: '入职培训', type: 'training', required: 0 },
  { name: '导师配对', type: 'mentor', required: 0 }
];

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE o.hr_id IN (SELECT id FROM hr_users WHERE company_id = ?)';
  const params = [req.companyId];
  
  if (status && status !== 'all') {
    where += ' AND o.status = ?';
    params.push(status);
  }
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM offers o ${where}`).get(...params).count;
  
  const list = db.prepare(`
    SELECT o.*, j.title, j.salary_min as job_salary_min, j.salary_max as job_salary_max,
      c.name as candidate_name, c.phone, c.email, c.avatar,
      hu.name as hr_name, hu.avatar as hr_avatar
    FROM offers o
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN candidates c ON o.candidate_id = c.id
    LEFT JOIN hr_users hu ON o.hr_id = hu.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json(paginate(list, total, parseInt(page), parseInt(pageSize)));
});

router.get('/:id', authMiddleware, (req, res) => {
  const offer = db.prepare(`
    SELECT o.*, j.title, j.department, j.work_city,
      c.*, hu.name as hr_name, hu.avatar as hr_avatar,
      ja.status as application_status
    FROM offers o
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN candidates c ON o.candidate_id = c.id
    LEFT JOIN hr_users hu ON o.hr_id = hu.id
    LEFT JOIN job_applications ja ON o.application_id = ja.id
    WHERE o.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!offer) {
    return res.json(error('Offer不存在'));
  }
  
  const onboarding = db.prepare(`
    SELECT * FROM onboarding_processes 
    WHERE offer_id = ? 
    ORDER BY id ASC
  `).all(req.params.id);
  
  res.json(success({
    offer,
    onboarding
  }));
});

router.post('/', authMiddleware, (req, res) => {
  const { application_id, salary_min, salary_max, probation_salary, probation_period, entry_date, work_place, benefits, other_terms } = req.body;
  
  if (!application_id || !salary_min || !salary_max || !entry_date) {
    return res.json(error('请填写完整信息'));
  }
  
  const application = db.prepare(`
    SELECT ja.*, j.company_id, j.title, j.salary_min as job_salary_min, j.salary_max as job_salary_max
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = ? AND j.company_id = ?
  `).get(application_id, req.companyId);
  
  if (!application) {
    return res.json(error('投递记录不存在'));
  }
  
  const existing = db.prepare('SELECT id FROM offers WHERE application_id = ?').get(application_id);
  if (existing) {
    return res.json(error('该投递已存在Offer'));
  }
  
  const signToken = generateSignToken();
  const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const info = db.prepare(`
    INSERT INTO offers (application_id, job_id, candidate_id, hr_id, salary_min, salary_max, probation_salary, probation_period, entry_date, work_place, benefits, other_terms, status, sign_token, expire_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(application_id, application.job_id, application.candidate_id, req.userId, salary_min, salary_max, probation_salary || Math.round(salary_min * 0.8), probation_period || 3, entry_date, work_place, benefits, other_terms, signToken, expireAt);
  
  db.prepare(`
    UPDATE job_applications SET status = 'offer', updated_at = datetime('now')
    WHERE id = ?
  `).run(application_id);
  
  const tasks = ONBOARDING_TASKS.map(task => {
    db.prepare(`
      INSERT INTO onboarding_processes (offer_id, candidate_id, task_name, task_type, required, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(info.lastInsertRowid, application.candidate_id, task.name, task.type, task.required);
  });
  
  res.json(success({
    id: info.lastInsertRowid,
    sign_token: signToken,
    sign_url: `/offer/sign/${signToken}`
  }, 'Offer创建成功'));
});

router.put('/:id', authMiddleware, (req, res) => {
  const { salary_min, salary_max, probation_salary, probation_period, entry_date, work_place, benefits, other_terms } = req.body;
  
  const offer = db.prepare(`
    SELECT o.* FROM offers o
    LEFT JOIN jobs j ON o.job_id = j.id
    WHERE o.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!offer) {
    return res.json(error('Offer不存在'));
  }
  
  if (offer.status !== 'pending') {
    return res.json(error('只能修改待签署的Offer'));
  }
  
  db.prepare(`
    UPDATE offers SET
      salary_min = ?, salary_max = ?, probation_salary = ?, probation_period = ?,
      entry_date = ?, work_place = ?, benefits = ?, other_terms = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(salary_min || offer.salary_min, salary_max || offer.salary_max, probation_salary || offer.probation_salary, probation_period || offer.probation_period, entry_date || offer.entry_date, work_place, benefits, other_terms, req.params.id);
  
  res.json(success(null, '更新成功'));
});

router.post('/:id/send', authMiddleware, (req, res) => {
  const offer = db.prepare(`
    SELECT o.*, c.name, c.email, c.phone
    FROM offers o
    LEFT JOIN candidates c ON o.candidate_id = c.id
    LEFT JOIN jobs j ON o.job_id = j.id
    WHERE o.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!offer) {
    return res.json(error('Offer不存在'));
  }
  
  db.prepare(`
    UPDATE offers SET status = 'sent', updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);
  
  res.json(success({
    sign_url: `/offer/sign/${offer.sign_token}`,
    email: offer.email,
    phone: offer.phone
  }, `Offer已发送给 ${offer.name}`));
});

router.post('/sign/:token', (req, res) => {
  const { token } = req.params;
  const { signature, candidate_name } = req.body;
  
  const offer = db.prepare(`
    SELECT o.* FROM offers o
    LEFT JOIN jobs j ON o.job_id = j.id
    WHERE o.sign_token = ?
  `).get(token);
  
  if (!offer) {
    return res.json(error('Offer不存在或链接无效'));
  }
  
  if (offer.status !== 'sent') {
    return res.json(error('Offer状态不正确'));
  }
  
  if (new Date(offer.expire_at) < new Date()) {
    return res.json(error('Offer已过期，请联系HR重新发送'));
  }
  
  const companySignature = crypto.createHash('md5').update('company-' + offer.id + Date.now()).digest('hex');
  
  db.prepare(`
    UPDATE offers SET
      status = 'signed', signed_at = datetime('now'),
      candidate_signature = ?, company_signature = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(signature || candidate_name || '已签署', companySignature, offer.id);
  
  db.prepare(`
    UPDATE job_applications SET status = 'hired', updated_at = datetime('now')
    WHERE id = ?
  `).run(offer.application_id);
  
  const onboardingTasks = db.prepare(`
    SELECT * FROM onboarding_processes WHERE offer_id = ?
  `).all(offer.id);
  
  if (onboardingTasks.length === 0) {
    ONBOARDING_TASKS.forEach(task => {
      db.prepare(`
        INSERT INTO onboarding_processes (offer_id, candidate_id, task_name, task_type, required, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(offer.id, offer.candidate_id, task.name, task.type, task.required);
    });
  }
  
  res.json(success({
    offer_id: offer.id,
    entry_date: offer.entry_date,
    onboarding_tasks: ONBOARDING_TASKS.length
  }, 'Offer签署成功'));
});

router.post('/:id/decline', authMiddleware, (req, res) => {
  const { reason } = req.body;
  
  db.prepare(`
    UPDATE offers SET status = 'declined', updated_at = datetime('now')
    WHERE id IN (SELECT o.id FROM offers o LEFT JOIN jobs j ON o.job_id = j.id WHERE o.id = ? AND j.company_id = ?)
  `).run(req.params.id, req.companyId);
  
  res.json(success(null, 'Offer已拒绝'));
});

router.post('/:id/withdraw', authMiddleware, (req, res) => {
  const { reason } = req.body;
  
  db.prepare(`
    UPDATE offers SET status = 'withdrawn', updated_at = datetime('now')
    WHERE id IN (SELECT o.id FROM offers o LEFT JOIN jobs j ON o.job_id = j.id WHERE o.id = ? AND j.company_id = ?)
  `).run(req.params.id, req.companyId);
  
  res.json(success(null, 'Offer已撤回'));
});

router.put('/onboarding/:taskId', authMiddleware, (req, res) => {
  const { status, remark } = req.body;
  
  const task = db.prepare(`
    SELECT op.* FROM onboarding_processes op
    LEFT JOIN offers o ON op.offer_id = o.id
    LEFT JOIN jobs j ON o.job_id = j.id
    WHERE op.id = ? AND j.company_id = ?
  `).get(req.params.taskId, req.companyId);
  
  if (!task) {
    return res.json(error('任务不存在'));
  }
  
  db.prepare(`
    UPDATE onboarding_processes SET
      status = ?, remark = ?, completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END
    WHERE id = ?
  `).run(status, remark, status, req.params.taskId);
  
  res.json(success(null, '更新成功'));
});

router.get('/onboarding/list/:offerId', authMiddleware, (req, res) => {
  const tasks = db.prepare(`
    SELECT op.* 
    FROM onboarding_processes op
    LEFT JOIN offers o ON op.offer_id = o.id
    LEFT JOIN jobs j ON o.job_id = j.id
    WHERE op.offer_id = ? AND j.company_id = ?
    ORDER BY op.id ASC
  `).all(req.params.offerId, req.companyId);
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  res.json(success({
    tasks,
    progress,
    completed,
    total
  }));
});

module.exports = router;
