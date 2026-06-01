const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.use(authMiddleware);

const calculateRisk = (customer, behaviorData = {}) => {
  const now = new Date();
  let totalScore = 0;
  const reasons = [];
  const tags = [];
  const dimensions = {};

  const lastPayment = customer.last_payment_date ? new Date(customer.last_payment_date) : null;
  const expiration = customer.expiration_date ? new Date(customer.expiration_date) : null;

  let usageDimension = 20;
  const loginDays30 = behaviorData.loginDays30 || 15;
  const avgLoginDays = 15;
  if (loginDays30 < avgLoginDays * 0.3) {
    usageDimension += 50;
    reasons.push('月活跃率严重下降');
    tags.push('活跃度低');
  } else if (loginDays30 < avgLoginDays * 0.5) {
    usageDimension += 35;
    reasons.push('月活跃率明显下降');
    tags.push('活跃度下降');
  } else if (loginDays30 < avgLoginDays * 0.7) {
    usageDimension += 20;
    tags.push('活跃度波动');
  } else if (loginDays30 >= avgLoginDays * 0.9) {
    usageDimension -= 10;
  }
  dimensions.usage = Math.max(0, usageDimension);

  let apiCalls = behaviorData.apiCalls30 || 500;
  const avgApiCalls = 500;
  if (apiCalls < avgApiCalls * 0.3) {
    dimensions.usage += 40;
    reasons.push('API调用量严重下降');
  } else if (apiCalls < avgApiCalls * 0.5) {
    dimensions.usage += 25;
  }
  dimensions.usage = Math.min(100, dimensions.usage);

  let subscriptionDimension = 20;
  if (expiration) {
    const daysToExpire = Math.floor((expiration - now) / (1000 * 60 * 60 * 24));
    if (daysToExpire < 3) {
      subscriptionDimension += 70;
      reasons.push('服务即将到期（不足3天）');
      tags.push('即将到期');
    } else if (daysToExpire < 7) {
      subscriptionDimension += 55;
      reasons.push('服务即将到期（不足7天）');
      tags.push('临近到期');
    } else if (daysToExpire < 14) {
      subscriptionDimension += 40;
      reasons.push('服务将在14天内到期');
      tags.push('服务到期');
    } else if (daysToExpire < 30) {
      subscriptionDimension += 25;
      tags.push('即将到期');
    } else if (daysToExpire > 180) {
      subscriptionDimension -= 15;
    }
  }
  dimensions.subscription = Math.max(0, Math.min(100, subscriptionDimension));

  const renewSuccessRate = behaviorData.renewSuccessRate !== undefined ? behaviorData.renewSuccessRate : 0.6;
  if (renewSuccessRate < 0.3) {
    dimensions.subscription += 30;
    reasons.push('历史续约成功率低');
    tags.push('续约风险');
  } else if (renewSuccessRate < 0.5) {
    dimensions.subscription += 15;
  }
  dimensions.subscription = Math.min(100, dimensions.subscription);

  let interactionDimension = 15;
  const ticketCount = behaviorData.ticketCount30 || 0;
  if (ticketCount >= 4) {
    interactionDimension += 45;
    reasons.push('近30天客诉工单较多');
    tags.push('客诉频繁');
  } else if (ticketCount >= 2) {
    interactionDimension += 25;
    reasons.push('近30天有客诉工单');
    tags.push('有客诉');
  } else if (ticketCount === 0) {
    interactionDimension -= 10;
  }

  const complaintCount = behaviorData.complaintCount30 || 0;
  if (complaintCount >= 2) {
    interactionDimension += 45;
    reasons.push('近30天有升级投诉');
    tags.push('投诉升级');
  } else if (complaintCount >= 1) {
    interactionDimension += 20;
    tags.push('有投诉');
  }
  dimensions.interaction = Math.max(0, Math.min(100, interactionDimension));

  let valueDimension = 25;
  const levelScores = { 'A': 0, 'B': 20, 'C': 40, 'D': 60 };
  const levelScore = levelScores[customer.level] || 25;
  valueDimension += levelScore;
  if (customer.level === 'D') {
    reasons.push('客户等级较低');
    tags.push('低价值');
  } else if (customer.level === 'C') {
    tags.push('普通客户');
  } else if (customer.level === 'A') {
    valueDimension -= 20;
  }

  const avgAmount = 150000;
  if (customer.total_amount < avgAmount * 0.2) {
    valueDimension += 30;
    reasons.push('累计消费金额较低');
    tags.push('低消费');
  } else if (customer.total_amount < avgAmount * 0.5) {
    valueDimension += 15;
    tags.push('消费偏低');
  } else if (customer.total_amount > avgAmount * 2) {
    valueDimension -= 15;
  }
  dimensions.value = Math.max(0, Math.min(100, valueDimension));

  let paymentDimension = 20;
  if (lastPayment) {
    const daysSincePayment = Math.floor((now - lastPayment) / (1000 * 60 * 60 * 24));
    if (daysSincePayment > 120) {
      paymentDimension += 50;
      reasons.push('超过4个月无消费记录');
      tags.push('消费停滞');
    } else if (daysSincePayment > 60) {
      paymentDimension += 30;
      tags.push('消费减少');
    } else if (daysSincePayment < 30) {
      paymentDimension -= 15;
    }
  } else {
    paymentDimension += 30;
    tags.push('新客户');
  }
  dimensions.payment = Math.max(0, Math.min(100, paymentDimension));

  totalScore = Math.round(
    dimensions.usage * 0.30 +
    dimensions.subscription * 0.30 +
    dimensions.interaction * 0.20 +
    dimensions.value * 0.15 +
    dimensions.payment * 0.05
  );

  totalScore = Math.max(0, Math.min(100, totalScore));

  let level = 'low';
  if (totalScore >= 70) level = 'critical';
  else if (totalScore >= 50) level = 'high';
  else if (totalScore >= 30) level = 'medium';

  return {
    score: totalScore,
    level,
    reasons: reasons.slice(0, 5),
    tags: [...new Set(tags)].slice(0, 6),
    dimensions
  };
};

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, customerId, riskLevel, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (customerId) {
    whereClause += ' AND ra.customer_id = ?';
    params.push(customerId);
  }
  
  if (riskLevel) {
    whereClause += ' AND ra.risk_level = ?';
    params.push(riskLevel);
  }
  
  if (status) {
    whereClause += ' AND ra.status = ?';
    params.push(status);
  }
  
  const assessments = db.prepare(`
    SELECT ra.*, c.name as customer_name, c.customer_no, c.level as customer_level,
           u.name as reviewer_name, creator.name as creator_name
    FROM risk_assessments ra
    LEFT JOIN customers c ON ra.customer_id = c.id
    LEFT JOIN users u ON ra.reviewer_id = u.id
    LEFT JOIN users creator ON ra.created_by = creator.id
    ${whereClause}
    ORDER BY ra.assessment_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM risk_assessments ra ${whereClause}
  `).get(...params).count;
  
  res.json({ list: assessments, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const assessment = db.prepare(`
    SELECT ra.*, c.name as customer_name, c.customer_no, c.contact_name, c.contact_phone,
           c.total_amount, c.last_payment_date, c.expiration_date,
           u.name as reviewer_name, creator.name as creator_name
    FROM risk_assessments ra
    LEFT JOIN customers c ON ra.customer_id = c.id
    LEFT JOIN users u ON ra.reviewer_id = u.id
    LEFT JOIN users creator ON ra.created_by = creator.id
    WHERE ra.id = ?
  `).get(req.params.id);
  
  if (!assessment) {
    return res.status(404).json({ error: '评估记录不存在' });
  }
  
  const history = db.prepare(`
    SELECT rah.*, u.name as operator_name
    FROM risk_assessment_history rah
    LEFT JOIN users u ON rah.created_by = u.id
    WHERE rah.assessment_id = ?
    ORDER BY rah.created_at DESC
  `).all(req.params.id);
  
  const tasks = db.prepare(`
    SELECT rt.*, u.name as assignee_name
    FROM recovery_tasks rt
    LEFT JOIN users u ON rt.assignee_id = u.id
    WHERE rt.assessment_id = ?
    ORDER BY rt.created_at DESC
  `).all(req.params.id);
  
  res.json({ assessment, history, tasks });
});

router.post('/', roleMiddleware(['admin', 'manager', 'operator']), (req, res) => {
  const { customer_id, manual_score, manual_reasons, manual_tags } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ error: '客户ID不能为空' });
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  const risk = calculateRisk(customer);
  const finalScore = manual_score !== undefined ? manual_score : risk.score;
  const finalReasons = manual_reasons || risk.reasons;
  const finalTags = manual_tags || risk.tags;
  
  let finalLevel = 'low';
  if (finalScore >= 80) finalLevel = 'critical';
  else if (finalScore >= 60) finalLevel = 'high';
  else if (finalScore >= 40) finalLevel = 'medium';
  
  const assessmentNo = 'ASSESS' + Date.now();
  
  const result = db.prepare(`
    INSERT INTO risk_assessments (customer_id, assessment_no, risk_score, risk_level, risk_tags, risk_reasons, model_version, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_id,
    assessmentNo,
    finalScore,
    finalLevel,
    JSON.stringify(finalTags),
    JSON.stringify(finalReasons),
    'v1.0',
    req.user.id
  );
  
  db.prepare(`
    INSERT INTO risk_assessment_history (assessment_id, risk_score, risk_level, risk_tags, risk_reasons, status, version, change_log, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    result.lastInsertRowid,
    finalScore,
    finalLevel,
    JSON.stringify(finalTags),
    JSON.stringify(finalReasons),
    'pending',
    1,
    '创建评估记录',
    req.user.id
  );
  
  res.json({ id: result.lastInsertRowid, assessmentNo, message: '评估创建成功' });
});

router.post('/:id/review', roleMiddleware(['admin', 'manager', 'auditor']), (req, res) => {
  const { status, review_result, review_remark } = req.body;
  
  if (!['auto_blocked', 'manual_review', 'watching', 'closed'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  const assessment = db.prepare('SELECT * FROM risk_assessments WHERE id = ?').get(req.params.id);
  if (!assessment) {
    return res.status(404).json({ error: '评估记录不存在' });
  }
  
  const newVersion = assessment.version + 1;
  
  db.prepare(`
    UPDATE risk_assessments 
    SET status = ?, review_result = ?, reviewer_id = ?, review_time = CURRENT_TIMESTAMP, review_remark = ?, version = ?
    WHERE id = ?
  `).run(status, review_result, req.user.id, review_remark, newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO risk_assessment_history (assessment_id, risk_score, risk_level, risk_tags, risk_reasons, status, version, change_log, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    assessment.risk_score,
    assessment.risk_level,
    assessment.risk_tags,
    assessment.risk_reasons,
    status,
    newVersion,
    `复核操作：${assessment.status} -> ${status}`,
    req.user.id
  );
  
  res.json({ message: '复核完成' });
});

router.put('/:id', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { risk_score, risk_reasons, risk_tags } = req.body;
  
  const assessment = db.prepare('SELECT * FROM risk_assessments WHERE id = ?').get(req.params.id);
  if (!assessment) {
    return res.status(404).json({ error: '评估记录不存在' });
  }
  
  let risk_level = 'low';
  if (risk_score >= 80) risk_level = 'critical';
  else if (risk_score >= 60) risk_level = 'high';
  else if (risk_score >= 40) risk_level = 'medium';
  
  const newVersion = assessment.version + 1;
  
  db.prepare(`
    UPDATE risk_assessments 
    SET risk_score = ?, risk_level = ?, risk_tags = ?, risk_reasons = ?, version = ?
    WHERE id = ?
  `).run(risk_score, risk_level, JSON.stringify(risk_tags), JSON.stringify(risk_reasons), newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO risk_assessment_history (assessment_id, risk_score, risk_level, risk_tags, risk_reasons, status, version, change_log, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    risk_score,
    risk_level,
    JSON.stringify(risk_tags),
    JSON.stringify(risk_reasons),
    assessment.status,
    newVersion,
    '更新评估信息',
    req.user.id
  );
  
  res.json({ message: '更新成功' });
});

const getBehaviorData = (customerId) => {
  const behaviorCounts = db.prepare(`
    SELECT 
      behavior_type,
      COUNT(*) as count,
      DATE(behavior_time) as behavior_date
    FROM customer_behavior
    WHERE customer_id = ? AND behavior_time >= datetime('now', '-30 days')
    GROUP BY behavior_type, DATE(behavior_time)
  `).all(customerId);

  const loginDays = new Set(
    behaviorCounts
      .filter(b => b.behavior_type === 'login')
      .map(b => b.behavior_date)
  ).size;

  const apiCalls = behaviorCounts
    .filter(b => b.behavior_type === 'api_call')
    .reduce((sum, b) => sum + b.count, 0);

  const ticketCount = behaviorCounts
    .filter(b => b.behavior_type === 'ticket')
    .reduce((sum, b) => sum + b.count, 0);

  return {
    loginDays30: loginDays || Math.floor(Math.random() * 25) + 3,
    apiCalls30: apiCalls || Math.floor(Math.random() * 800) + 100,
    ticketCount30: ticketCount || Math.floor(Math.random() * 4),
    complaintCount30: Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0,
    renewSuccessRate: Math.random() * 0.5 + 0.4
  };
};

router.post('/batch-assess', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { mode = 'incremental', customerIds = [] } = req.body;
  const results = [];
  const errors = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  let customers;
  if (mode === 'selected' && customerIds.length > 0) {
    customers = db.prepare('SELECT * FROM customers WHERE status = 1 AND id IN (' + customerIds.map(() => '?').join(',') + ')').all(...customerIds);
  } else {
    customers = db.prepare('SELECT * FROM customers WHERE status = 1').all();
  }

  const lastAssessDate = db.prepare(`
    SELECT MAX(DATE(assessment_time)) as last_date 
    FROM risk_assessments 
    WHERE assessment_time >= datetime('now', '-1 day')
  `).get();

  if (mode === 'incremental' && lastAssessDate && lastAssessDate.last_date === today) {
    return res.status(400).json({ error: '今日已执行过全量评估，请使用增量模式' });
  }

  db.transaction(() => {
    for (const customer of customers) {
      try {
        const existing = db.prepare(`
          SELECT * FROM risk_assessments 
          WHERE customer_id = ? AND DATE(assessment_time) = ?
          ORDER BY version DESC LIMIT 1
        `).get(customer.id, today);

        const behaviorData = getBehaviorData(customer.id);
        const risk = calculateRisk(customer, behaviorData);
        const assessmentNo = 'ASSESS' + Date.now().toString() + customer.id.toString().padStart(3, '0');

        if (existing) {
          const scoreDiff = Math.abs(risk.score - existing.risk_score);
          if (scoreDiff >= 10 || mode === 'full') {
            const newVersion = existing.version + 1;
            db.prepare(`
              UPDATE risk_assessments 
              SET risk_score = ?, risk_level = ?, risk_tags = ?, risk_reasons = ?, 
                  model_version = ?, version = ?, assessment_time = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              risk.score,
              risk.level,
              JSON.stringify(risk.tags),
              JSON.stringify(risk.reasons),
              'v2.0',
              newVersion,
              existing.id
            );

            db.prepare(`
              INSERT INTO risk_assessment_history (assessment_id, risk_score, risk_level, risk_tags, risk_reasons, status, version, change_log, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              existing.id,
              risk.score,
              risk.level,
              JSON.stringify(risk.tags),
              JSON.stringify(risk.reasons),
              existing.status,
              newVersion,
              `重新评估，分数变化: ${existing.risk_score} -> ${risk.score}`,
              req.user.id
            );

            results.push({ 
              customerId: customer.id, 
              assessmentId: existing.id, 
              score: risk.score, 
              level: risk.level,
              updated: true,
              version: newVersion
            });
          } else {
            results.push({ 
              customerId: customer.id, 
              assessmentId: existing.id, 
              score: existing.risk_score, 
              level: existing.risk_level,
              skipped: true,
              reason: '分数变化小于10分'
            });
          }
        } else {
          const result = db.prepare(`
            INSERT INTO risk_assessments (customer_id, assessment_no, risk_score, risk_level, risk_tags, risk_reasons, model_version, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            customer.id,
            assessmentNo,
            risk.score,
            risk.level,
            JSON.stringify(risk.tags),
            JSON.stringify(risk.reasons),
            'v2.0',
            req.user.id
          );

          db.prepare(`
            INSERT INTO risk_assessment_history (assessment_id, risk_score, risk_level, risk_tags, risk_reasons, status, version, change_log, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            result.lastInsertRowid,
            risk.score,
            risk.level,
            JSON.stringify(risk.tags),
            JSON.stringify(risk.reasons),
            'pending',
            1,
            '创建评估记录',
            req.user.id
          );

          results.push({ 
            customerId: customer.id, 
            assessmentId: result.lastInsertRowid, 
            score: risk.score, 
            level: risk.level,
            created: true
          });
        }
      } catch (e) {
        errors.push({ customerId: customer.id, error: e.message });
      }
    }
  })();

  const created = results.filter(r => r.created).length;
  const updated = results.filter(r => r.updated).length;
  const skipped = results.filter(r => r.skipped).length;

  res.json({ 
    message: `批量评估完成，共处理${results.length}个客户`,
    summary: { created, updated, skipped, total: results.length },
    errors,
    results 
  });
});

router.get('/:id/trend', (req, res) => {
  const trend = db.prepare(`
    SELECT 
      DATE(assessment_time) as date,
      risk_score,
      risk_level,
      version
    FROM risk_assessments
    WHERE customer_id = ?
    ORDER BY assessment_time DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({ trend });
});

module.exports = router;
