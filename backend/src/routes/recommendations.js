
const express = require('express');
const dayjs = require('dayjs');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { storeOnBlockchain } = require('../utils/blockchain');
const { createTransaction } = require('../utils/payment');
const { calculateReferrerCredibility, calculateCandidateCredibility } = require('../utils/credibility');

const router = express.Router();

const parseJson = (value, fallback = null) => {
  if (!value || typeof value !== 'string') return value || fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const buildWhereClause = (req, query = {}) => {
  const { status, referrer_id, company_id, min_credit, max_credit, min_hit_rate, max_hit_rate } = query;
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND r.status = ?';
    params.push(status);
  }
  if (referrer_id) {
    whereClause += ' AND r.referrer_id = ?';
    params.push(referrer_id);
  }
  if (company_id) {
    whereClause += ' AND r.company_id = ?';
    params.push(company_id);
  }
  if (min_credit) {
    whereClause += ' AND u.credit_score >= ?';
    params.push(parseInt(min_credit));
  }
  if (max_credit) {
    whereClause += ' AND u.credit_score <= ?';
    params.push(parseInt(max_credit));
  }
  if (min_hit_rate !== undefined && min_hit_rate !== null && min_hit_rate !== '') {
    whereClause += ` AND (
      SELECT ROUND(CASE WHEN COUNT(*) > 0 
        THEN 100.0 * SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) / COUNT(*)
        ELSE 0 END, 1)
      FROM recommendations WHERE referrer_id = r.referrer_id
    ) >= ?`;
    params.push(parseFloat(min_hit_rate));
  }
  if (max_hit_rate !== undefined && max_hit_rate !== null && max_hit_rate !== '') {
    whereClause += ` AND (
      SELECT ROUND(CASE WHEN COUNT(*) > 0 
        THEN 100.0 * SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) / COUNT(*)
        ELSE 0 END, 1)
      FROM recommendations WHERE referrer_id = r.referrer_id
    ) <= ?`;
    params.push(parseFloat(max_hit_rate));
  }
  if (req.user.role === 'user') {
    whereClause += ' AND r.referrer_id = ?';
    params.push(req.user.id);
  }
  if (req.user.role === 'company') {
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
    if (company) {
      whereClause += ' AND r.company_id = ?';
      params.push(company.id);
    }
  }

  return { whereClause, params };
};

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 20, status, referrer_id, company_id, min_credit, max_credit, min_hit_rate, max_hit_rate } = req.query;
  const offset = (page - 1) * pageSize;

  const { whereClause, params } = buildWhereClause(req, req.query);

  const total = db.prepare(`SELECT COUNT(*) as count FROM recommendations r LEFT JOIN users u ON r.referrer_id = u.id ${whereClause}`).get(...params).count;

  const recommendations = db.prepare(`
    SELECT r.*, 
           rc.candidate_name, rc.current_position, rc.current_company, rc.city,
           jr.title as job_title, jr.reward_amount, jr.city as job_city, jr.commission_tiers,
           c.company_name,
           u.real_name as referrer_name, u.credit_score as referrer_credit, 
           u.exposure_weight as referrer_exposure_weight,
           (SELECT ROUND(CASE WHEN COUNT(*) > 0 
                   THEN 100.0 * SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) / COUNT(*)
                   ELSE 0 END, 1)
            FROM recommendations WHERE referrer_id = r.referrer_id) as referrer_hit_rate,
           (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
             'installment_number', installment_number,
             'total_installments', total_installments,
             'amount', amount,
             'trigger_condition', trigger_condition,
             'trigger_date', trigger_date,
             'status', status,
             'paid_at', paid_at,
             'txn_id', txn_id
           )) FROM commission_plans cp WHERE cp.recommendation_id = r.id) as commission_installments,
           (SELECT al.details FROM audit_logs al 
            WHERE al.resource_type = 'recommendation' AND al.resource_id = r.id 
              AND al.action IN ('review', 'reject', 'approve')
            ORDER BY al.created_at DESC LIMIT 1) as latest_review_note,
           (SELECT JSON_OBJECT(
             'round', i.round,
             'interview_type', i.interview_type,
             'scheduled_at', i.scheduled_at,
             'interviewer', i.interviewer,
             'status', i.status,
             'result', i.result
           ) FROM interviews i WHERE i.recommendation_id = r.id 
            ORDER BY i.created_at DESC LIMIT 1) as latest_interview,
           (SELECT JSON_OBJECT(
             'feedback_node', pf.feedback_node,
             'feedback_date', pf.feedback_date,
             'rating', pf.rating,
             'comments', pf.comments,
             'passed', pf.passed
           ) FROM probation_feedbacks pf WHERE pf.recommendation_id = r.id
            ORDER BY pf.created_at DESC LIMIT 1) as latest_probation_feedback,
           (SELECT COUNT(*) FROM interviews i WHERE i.recommendation_id = r.id) as interview_count,
           (SELECT COUNT(*) FROM probation_feedbacks pf WHERE pf.recommendation_id = r.id) as probation_feedback_count,
           (SELECT br.txn_hash FROM blockchain_records br 
            WHERE br.contract_type = 'recommendation' AND br.reference_id = r.id ORDER BY br.created_at DESC LIMIT 1) as contract_hash,
           (SELECT JSON_OBJECT(
             'amount', t.amount,
             'status', t.status,
             'txn_type', t.type,
             'created_at', t.created_at
           ) FROM transactions t WHERE t.recommendation_id = r.id
            ORDER BY t.created_at DESC LIMIT 1) as latest_transaction
    FROM recommendations r
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    LEFT JOIN companies c ON r.company_id = c.id
    LEFT JOIN users u ON r.referrer_id = u.id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list: recommendations, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', authenticateToken, (req, res) => {
  const { whereClause, params } = buildWhereClause(req, req.query);

  const baseStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('pending', 'reviewing') THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'interviewing' THEN 1 ELSE 0 END) as interviewing,
      SUM(CASE WHEN status IN ('hired', 'probation') THEN 1 ELSE 0 END) as hired,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      COALESCE(SUM(commission_amount), 0) as total_commission
    FROM (
      SELECT DISTINCT r.id, r.status, r.commission_amount
      FROM recommendations r
      LEFT JOIN users u ON r.referrer_id = u.id
      ${whereClause}
    ) r
  `).get(...params);

  const commissionStats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN cp.status = 'paid' THEN cp.amount ELSE 0 END), 0) as paid_commission,
      COALESCE(SUM(CASE WHEN cp.status = 'pending' THEN cp.amount ELSE 0 END), 0) as pending_commission
    FROM commission_plans cp
    WHERE cp.recommendation_id IN (
      SELECT DISTINCT r.id
      FROM recommendations r
      LEFT JOIN users u ON r.referrer_id = u.id
      ${whereClause}
    )
  `).get(...params);

  res.json({
    ...baseStats,
    paid_commission: commissionStats.paid_commission,
    pending_commission: commissionStats.pending_commission
  });
});

router.get('/mine', authenticateToken, (req, res) => {
  const recommendations = db.prepare(`
    SELECT r.*, 
           rc.candidate_name, rc.current_position, rc.current_company,
           jr.title as job_title, jr.reward_amount,
           c.company_name
    FROM recommendations r
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  res.json(recommendations);
});

router.get('/:id', authenticateToken, (req, res) => {
  const recommendation = db.prepare(`
    SELECT r.*, 
           rc.*,
           jr.title as job_title, jr.reward_amount, jr.commission_tiers, jr.installment_plan, jr.probation_months,
           c.company_name, c.industry,
           u.real_name as referrer_name, u.phone as referrer_phone, u.email as referrer_email,
           u.credit_score as referrer_credit, u.exposure_weight as referrer_exposure
    FROM recommendations r
    LEFT JOIN resumes rc ON r.resume_id = rc.id
    LEFT JOIN job_rewards jr ON r.job_id = jr.id
    LEFT JOIN companies c ON r.company_id = c.id
    LEFT JOIN users u ON r.referrer_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!recommendation) {
    return res.status(404).json({ error: '推荐记录不存在' });
  }

  if (recommendation.referrer_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限查看此推荐' });
  }

  recommendation.portrait_tags = parseJson(recommendation.portrait_tags, []);
  recommendation.commission_tiers = parseJson(recommendation.commission_tiers, []);
  recommendation.installment_plan = parseJson(recommendation.installment_plan, []);

  const commissionPlans = db.prepare(`
    SELECT * FROM commission_plans WHERE recommendation_id = ? ORDER BY installment_number
  `).all(req.params.id);

  const interviews = db.prepare(`
    SELECT * FROM interviews WHERE recommendation_id = ? ORDER BY round, scheduled_at
  `).all(req.params.id);

  const probationFeedbacks = db.prepare(`
    SELECT * FROM probation_feedbacks WHERE recommendation_id = ? ORDER BY created_at
  `).all(req.params.id);

  const blockchainRecord = db.prepare(`
    SELECT * FROM blockchain_records WHERE contract_type = 'recommendation' AND reference_id = ?
  `).get(req.params.id);

  const commissionBlockchain = db.prepare(`
    SELECT * FROM blockchain_records WHERE contract_type = 'commission_payment' AND reference_id IN (
      SELECT id FROM commission_plans WHERE recommendation_id = ?
    )
  `).all(req.params.id);

  const auditLogs = db.prepare(`
    SELECT al.*, u.real_name as operator_name, u.role as operator_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.resource_type = 'recommendation' AND al.resource_id = ?
    ORDER BY al.created_at DESC
  `).all(req.params.id);

  const transactions = db.prepare(`
    SELECT t.*, 
           f.real_name as from_user_name,
           t2.real_name as to_user_name
    FROM transactions t
    LEFT JOIN users f ON t.from_user_id = f.id
    LEFT JOIN users t2 ON t.to_user_id = t2.id
    WHERE t.recommendation_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  const referrerStats = db.prepare(`
    SELECT 
      COUNT(*) as total_recommendations,
      SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) as success_hires,
      ROUND(
        CASE WHEN COUNT(*) > 0 
        THEN 100.0 * SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) / COUNT(*)
        ELSE 0 END, 1
      ) as hit_rate
    FROM recommendations 
    WHERE referrer_id = ?
  `).get(recommendation.referrer_id);

  const offerInfo = db.prepare(`
    SELECT * FROM interviews 
    WHERE recommendation_id = ? AND result = 'pass'
    ORDER BY created_at DESC LIMIT 1
  `).get(req.params.id);

  const reviewFeedback = auditLogs.find(log => {
    const details = parseJson(log.details, {});
    return details.new_status === 'reviewing' || details.new_status === 'rejected';
  });

  res.json({
    ...recommendation,
    commission_plans: commissionPlans,
    interviews,
    probation_feedbacks: probationFeedbacks,
    blockchain_record: blockchainRecord || null,
    commission_blockchain: commissionBlockchain,
    audit_logs: auditLogs,
    transactions,
    referrer_stats: referrerStats,
    offer_info: offerInfo || null,
    review_feedback: reviewFeedback ? parseJson(reviewFeedback.details, null) : null
  });
});

router.post('/', authenticateToken, async (req, res) => {
  const { resume_id, job_id } = req.body;

  if (!resume_id || !job_id) {
    return res.status(400).json({ error: '简历ID和职位ID不能为空' });
  }

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(resume_id);
  const job = db.prepare('SELECT * FROM job_rewards WHERE id = ?').get(job_id);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }
  if (job.status !== 'active') {
    return res.status(400).json({ error: '该职位已关闭' });
  }

  const existing = db.prepare(`
    SELECT id FROM recommendations 
    WHERE resume_id = ? AND job_id = ? AND status NOT IN ('rejected', 'candidate_withdrew')
  `).get(resume_id, job_id);

  if (existing) {
    return res.status(400).json({ error: '该简历已推荐过此职位' });
  }

  const tiers = JSON.parse(job.commission_tiers || '[]');
  const referrerStats = db.prepare(`
    SELECT COUNT(*) as count, 
           SUM(CASE WHEN status IN ('hired', 'probation', 'completed') THEN 1 ELSE 0 END) as success
    FROM recommendations WHERE referrer_id = ?
  `).get(req.user.id);

  let commissionRate = 0.1;
  for (const tier of tiers) {
    if (referrerStats.success >= tier.threshold) {
      commissionRate = tier.rate;
    }
  }

  const commissionAmount = job.reward_amount * commissionRate;

  const stmt = db.prepare(`
    INSERT INTO recommendations (
      resume_id, job_id, referrer_id, company_id, 
      status, commission_rate, commission_amount
    ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `);

  const info = stmt.run(resume_id, job_id, req.user.id, job.company_id, commissionRate, commissionAmount);
  const recommendationId = info.lastInsertRowid;

  const installments = JSON.parse(job.installment_plan || '[]');
  const insertPlan = db.prepare(`
    INSERT INTO commission_plans (
      recommendation_id, installment_number, total_installments,
      amount, trigger_condition, trigger_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);

  for (let i = 0; i < installments.length; i++) {
    const inst = installments[i];
    insertPlan.run(
      recommendationId, i + 1, installments.length,
      commissionAmount * inst.ratio,
      `入职后${inst.month}个月`,
      dayjs().add(inst.month, 'month').format('YYYY-MM-DD')
    );
  }

  db.prepare(`
    UPDATE users 
    SET total_recommendations = total_recommendations + 1 
    WHERE id = ?
  `).run(req.user.id);

  const contractData = {
    recommendation_id: recommendationId,
    resume_id,
    job_id,
    referrer_id: req.user.id,
    company_id: job.company_id,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    installments,
    created_at: new Date().toISOString()
  };

  const blockchainResult = await storeOnBlockchain('recommendation', recommendationId, contractData);

  db.prepare(`
    UPDATE recommendations 
    SET contract_hash = ? 
    WHERE id = ?
  `).run(blockchainResult.hash, recommendationId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details)
    VALUES (?, 'create_recommendation', 'recommendation', ?, ?, ?)
  `).run(req.user.id, recommendationId, req.ip, JSON.stringify({
    resume_id, job_id, commission_amount: commissionAmount, contract_hash: blockchainResult.hash
  }));

  calculateReferrerCredibility(req.user.id);

  res.status(201).json({
    id: recommendationId,
    commission_amount: commissionAmount,
    commission_rate: commissionRate,
    contract_hash: blockchainResult.hash,
    blockchain: blockchainResult
  });
});

router.post('/:id/status', authenticateToken, async (req, res) => {
  const { status, feedback } = req.body;
  const recommendationId = req.params.id;

  const recommendation = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(recommendationId);
  if (!recommendation) {
    return res.status(404).json({ error: '推荐记录不存在' });
  }

  const validTransitions = {
    pending: ['reviewing', 'rejected'],
    reviewing: ['interviewing', 'rejected'],
    interviewing: ['hired', 'rejected', 'candidate_withdrew'],
    hired: ['probation', 'candidate_withdrew'],
    probation: ['completed', 'candidate_withdrew'],
    completed: [],
    rejected: [],
    candidate_withdrew: []
  };

  if (!validTransitions[recommendation.status]?.includes(status)) {
    return res.status(400).json({ error: `无法从 ${recommendation.status} 转换为 ${status}` });
  }

  db.prepare(`
    UPDATE recommendations 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(status, recommendationId);

  if (status === 'hired') {
    db.prepare(`
      UPDATE users 
      SET success_hires = success_hires + 1 
      WHERE id = ?
    `).run(recommendation.referrer_id);
  }

  if (status === 'probation') {
    triggerInstallment(recommendationId, 1);
  }

  if (status === 'completed') {
    const plans = db.prepare('SELECT * FROM commission_plans WHERE recommendation_id = ?').all(recommendationId);
    for (const plan of plans) {
      if (plan.status === 'pending') {
        await payInstallment(plan.id, recommendation);
      }
    }
    calculateReferrerCredibility(recommendation.referrer_id);
    if (recommendation.candidate_id) {
      calculateCandidateCredibility(recommendation.candidate_id);
    }
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details)
    VALUES (?, 'update_recommendation_status', 'recommendation', ?, ?, ?)
  `).run(req.user.id, recommendationId, req.ip, JSON.stringify({
    old_status: recommendation.status, new_status: status, feedback
  }));

  res.json({ message: '状态更新成功', status });
});

router.post('/:id/probation-feedback', authenticateToken, async (req, res) => {
  const { feedback_node, feedback_date, rating, comments, passed } = req.body;
  const recommendationId = req.params.id;

  const recommendation = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(recommendationId);
  if (!recommendation) {
    return res.status(404).json({ error: '推荐记录不存在' });
  }

  if (recommendation.status !== 'probation' && recommendation.status !== 'hired') {
    return res.status(400).json({ error: '该推荐不处于试用期状态' });
  }

  db.prepare(`
    INSERT INTO probation_feedbacks (
      recommendation_id, feedback_node, feedback_date, rating, comments, passed, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(recommendationId, feedback_node, feedback_date, rating, comments, passed ? 1 : 0, req.user.id);

  const plans = db.prepare(`
    SELECT * FROM commission_plans 
    WHERE recommendation_id = ? AND status = 'pending'
    ORDER BY installment_number
  `).all(recommendationId);

  const passedCount = db.prepare(`
    SELECT COUNT(*) as count FROM probation_feedbacks 
    WHERE recommendation_id = ? AND passed = 1
  `).get(recommendationId).count;

  if (passedCount >= 1 && plans.length >= 2) {
    await payInstallment(plans[0].id, recommendation);
  }
  if (passedCount >= 2 && plans.length >= 3) {
    await payInstallment(plans[1].id, recommendation);
  }

  res.json({ message: '反馈已提交' });
});

async function triggerInstallment(recommendationId, installmentNumber) {
  const plan = db.prepare(`
    SELECT * FROM commission_plans 
    WHERE recommendation_id = ? AND installment_number = ?
  `).get(recommendationId, installmentNumber);

  if (plan && plan.status === 'pending') {
    const recommendation = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(recommendationId);
    await payInstallment(plan.id, recommendation);
  }
}

async function payInstallment(planId, recommendation) {
  const plan = db.prepare('SELECT * FROM commission_plans WHERE id = ?').get(planId);
  if (!plan || plan.status !== 'pending') return;

  const result = await createTransaction(
    'commission',
    plan.amount,
    recommendation.company_id,
    recommendation.referrer_id,
    recommendation.id,
    planId,
    `分佣发放 - 第${plan.installment_number}期`
  );

  db.prepare(`
    UPDATE commission_plans 
    SET status = 'paid', paid_at = CURRENT_TIMESTAMP, txn_id = ?
    WHERE id = ?
  `).run(result.txnId, planId);

  db.prepare(`
    UPDATE users 
    SET total_commission = total_commission + ? 
    WHERE id = ?
  `).run(plan.amount, recommendation.referrer_id);

  const contractData = {
    commission_plan_id: planId,
    recommendation_id: recommendation.id,
    amount: plan.amount,
    installment_number: plan.installment_number,
    paid_at: new Date().toISOString(),
    txn_id: result.txnId
  };

  await storeOnBlockchain('commission_payment', planId, contractData);
}

module.exports = router;
