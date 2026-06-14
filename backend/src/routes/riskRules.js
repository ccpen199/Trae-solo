const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

router.get('/', (req, res) => {
  const { userId, isEnabled, enterpriseId } = req.query;
  
  let sql = `
    SELECT r.*, e.name as enterprise_name, e.unified_social_credit
    FROM risk_rules r
    LEFT JOIN enterprises e ON r.enterprise_id = e.id
    WHERE 1=1
  `;
  let params = [];
  
  if (userId) {
    sql += ` AND r.user_id = ?`;
    params.push(userId);
  }
  
  if (enterpriseId) {
    sql += ` AND r.enterprise_id = ?`;
    params.push(enterpriseId);
  }
  
  if (isEnabled !== undefined) {
    sql += ` AND r.is_enabled = ?`;
    params.push(isEnabled === 'true' ? 1 : 0);
  }
  
  sql += ` ORDER BY r.created_at DESC`;
  
  const rules = db.prepare(sql).all(...params);
  
  res.json(rules.map(rule => ({
    ...rule,
    rule_condition: JSON.parse(rule.rule_condition),
    rule_action: JSON.parse(rule.rule_action),
    is_enabled: rule.is_enabled === 1
  })));
});

router.post('/', (req, res) => {
  const { userId, enterpriseId, ruleName, ruleCondition, ruleAction, ruleLevel, isEnabled } = req.body;
  
  if (!ruleName || !ruleCondition || !ruleAction) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO risk_rules (user_id, enterprise_id, rule_name, rule_condition, rule_action,
                            rule_level, is_enabled, hit_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  
  const result = stmt.run(
    userId || 1,
    enterpriseId || null,
    ruleName,
    typeof ruleCondition === 'string' ? ruleCondition : JSON.stringify(ruleCondition),
    typeof ruleAction === 'string' ? ruleAction : JSON.stringify(ruleAction),
    ruleLevel || 'medium',
    isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1,
    now,
    now
  );
  
  res.json({
    success: true,
    id: result.lastInsertRowid,
    message: '风控规则创建成功'
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { ruleName, ruleCondition, ruleAction, ruleLevel, isEnabled, enterpriseId } = req.body;
  
  const rule = db.prepare(`SELECT * FROM risk_rules WHERE id = ?`).get(id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  const now = new Date().toISOString();
  
  const updates = [];
  const params = [];
  
  if (ruleName !== undefined) {
    updates.push('rule_name = ?');
    params.push(ruleName);
  }
  if (ruleCondition !== undefined) {
    updates.push('rule_condition = ?');
    params.push(typeof ruleCondition === 'string' ? ruleCondition : JSON.stringify(ruleCondition));
  }
  if (ruleAction !== undefined) {
    updates.push('rule_action = ?');
    params.push(typeof ruleAction === 'string' ? ruleAction : JSON.stringify(ruleAction));
  }
  if (ruleLevel !== undefined) {
    updates.push('rule_level = ?');
    params.push(ruleLevel);
  }
  if (isEnabled !== undefined) {
    updates.push('is_enabled = ?');
    params.push(isEnabled ? 1 : 0);
  }
  if (enterpriseId !== undefined) {
    updates.push('enterprise_id = ?');
    params.push(enterpriseId || null);
  }
  
  updates.push('updated_at = ?');
  params.push(now, id);
  
  const sql = `UPDATE risk_rules SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...params);
  
  res.json({
    success: true,
    message: '风控规则更新成功'
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const rule = db.prepare(`SELECT * FROM risk_rules WHERE id = ?`).get(id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  db.prepare(`DELETE FROM risk_rules WHERE id = ?`).run(id);
  
  res.json({
    success: true,
    message: '风控规则删除成功'
  });
});

router.post('/evaluate/:enterpriseId', (req, res) => {
  const { enterpriseId } = req.params;
  const { ruleIds } = req.body;
  
  const enterprise = db.prepare(`SELECT * FROM enterprises WHERE id = ?`).get(enterpriseId);
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  let rulesSql = `SELECT * FROM risk_rules WHERE is_enabled = 1`;
  let rulesParams = [];
  
  if (Array.isArray(ruleIds) && ruleIds.length > 0) {
    const placeholders = ruleIds.map(() => '?').join(',');
    rulesSql += ` AND id IN (${placeholders})`;
    rulesParams = ruleIds;
  }
  
  const rules = db.prepare(rulesSql).all(...rulesParams);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const judicialCount = db.prepare(`
    SELECT COUNT(*) as count FROM judicial_records 
    WHERE enterprise_id = ? AND filing_date >= ?
  `).get(enterpriseId, sixMonthsAgo.toISOString().split('T')[0]).count;
  
  const creditRecords = db.prepare(`
    SELECT * FROM credit_records WHERE enterprise_id = ? AND status = '有效'
  `).all(enterpriseId);
  
  const hasShixin = creditRecords.some(c => c.credit_type === '失信被执行人');
  
  const riggingRecords = db.prepare(`
    SELECT * FROM bid_rigging_suspects 
    WHERE enterprise_id = ? AND status != '已排除'
  `).all(enterpriseId);
  
  const abnormalRecords = db.prepare(`
    SELECT * FROM business_abnormalities 
    WHERE enterprise_id = ? AND status = '未移除'
  `).all(enterpriseId);
  
  const qualifications = db.prepare(`
    SELECT * FROM qualifications 
    WHERE enterprise_id = ? AND status = '有效'
  `).all(enterpriseId);
  
  const results = rules.map(rule => {
    const condition = JSON.parse(rule.rule_condition);
    const action = JSON.parse(rule.rule_action);
    let triggered = false;
    let reason = '';
    
    switch (condition.type) {
      case 'judicial':
        if (judicialCount >= condition.count) {
          triggered = true;
          reason = `近${condition.period}天内诉讼记录${judicialCount}条，超过阈值${condition.count}条`;
        }
        break;
      case 'credit':
        if (hasShixin && condition.typeValue === '失信被执行人') {
          triggered = true;
          reason = '企业被列为失信被执行人';
        }
        break;
      case 'bidRigging':
        const highRiskRigging = riggingRecords.filter(r => r.risk_level === condition.riskLevel);
        if (highRiskRigging.length > 0) {
          triggered = true;
          reason = `存在${highRiskRigging.length}条${condition.riskLevel}围标串标嫌疑记录`;
        }
        break;
      case 'abnormal':
        if (abnormalRecords.length > 0) {
          triggered = true;
          reason = `存在${abnormalRecords.length}条经营异常记录未移除`;
        }
        break;
      case 'qualification':
        const now = new Date();
        const expiringSoon = qualifications.filter(q => {
          const expiry = new Date(q.expiry_date);
          const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          return diffDays <= condition.expiryDays && diffDays > 0;
        });
        if (expiringSoon.length > 0) {
          triggered = true;
          reason = `有${expiringSoon.length}项资质将在${condition.expiryDays}天内过期`;
        }
        break;
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.rule_name,
      ruleLevel: rule.rule_level,
      triggered,
      reason,
      action: triggered ? action : null
    };
  });
  
  const triggeredRules = results.filter(r => r.triggered);
  const now = new Date().toISOString();
  
  // 业务回写结果
  const actionResults = [];
  
  // 更新触发规则的命中次数和最后命中时间，并插入审计记录
  if (triggeredRules.length > 0) {
    const updateHit = db.prepare(`
      UPDATE risk_rules 
      SET hit_count = COALESCE(hit_count, 0) + 1, last_hit_at = ?, updated_at = ? 
      WHERE id = ?
    `);
    
    const insertAudit = db.prepare(`
      INSERT INTO rule_hit_records 
      (rule_id, enterprise_id, rule_name, rule_level, trigger_reason, action_type, 
      processing_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, '待处理', ?)
    `);
    
    const updateScore = db.prepare(`
      UPDATE health_scores 
      SET total_score = CASE 
        WHEN total_score - ? > 10 THEN total_score - ? ELSE 10
        END,
        personnel_score = CASE WHEN personnel_score - 1 > 5 THEN personnel_score - 1 ELSE personnel_score END,
        credit_score = CASE WHEN credit_score - 1 > 5 THEN credit_score - 1 ELSE credit_score END,
        risk_level = CASE 
          WHEN total_score - ? <= 50 THEN '高风险'
          WHEN total_score - ? <= 70 THEN '中风险'
          ELSE '低风险'
        END,
        calculated_at = ?
      WHERE enterprise_id = ?
    `);
    
    try {
      const tx = db.transaction((txn => {
        triggeredRules.forEach(r => {
          if (r.ruleId) {
            // 更新规则命中次数
            updateHit.run(now, now, r.ruleId);
            
            // 插入审计记录
            const action = r.action?.action || 'warn';
            insertAudit.run(
              r.ruleId,
              parseInt(enterpriseId),
              r.ruleName,
              r.ruleLevel,
              r.reason,
              action,
              now
            );
            
            // 业务回写：自动降级
            if (action === 'downgrade') {
              const deduction = r.ruleLevel === 'high' ? 10 : r.ruleLevel === 'medium' ? 5 : 2;
              updateScore.run(deduction, deduction, deduction, deduction, now, parseInt(enterpriseId));
              
              actionResults.push({
                ruleId: r.ruleId,
                ruleName: r.ruleName,
                action: '自动降级',
                deduction,
                status: 'success'
              });
            } else if (action === 'blacklist') {
              // 业务回写：加入黑名单
              const checkBlacklist = db.prepare(`SELECT id FROM subcontractor_blacklist WHERE enterprise_id = ? AND status = '黑名单中'`);
              const existing = checkBlacklist.get(parseInt(enterpriseId));
              
              if (!existing) {
                db.prepare(`
                  INSERT INTO subcontractor_blacklist
                  (enterprise_id, reason, inclusion_date, risk_level, status,
                  data_source, data_updated_at, source_url, processing_status,
                  display_deadline, countdown_days, expiry_status, credit_repair_available)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  parseInt(enterpriseId),
                  `风控规则触发：${r.ruleName}`,
                  new Date().toISOString().split('T')[0],
                  r.ruleLevel === 'high' ? '高风险' : '中风险',
                  '黑名单中',
                  '风控系统自动检测',
                  now,
                  '系统自动生成',
                  '待处理',
                  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  365,
                  '公示中',
                  1
                );
                
                actionResults.push({
                  ruleId: r.ruleId,
                  ruleName: r.ruleName,
                  action: '加入黑名单',
                  status: 'success'
                });
              } else {
                actionResults.push({
                  ruleId: r.ruleId,
                  ruleName: r.ruleName,
                  action: '加入黑名单',
                  status: 'skipped',
                  reason: '已在黑名单中'
                });
              }
            } else if (action === 'warn') {
              // 业务回写：风险预警 - 更新经营异常处理状态
              db.prepare(`
                UPDATE business_abnormalities
                SET processing_status = '需重点关注', processing_time = ?
                WHERE enterprise_id = ? AND status = '未移除'
              `).run(now, parseInt(enterpriseId));
              
              actionResults.push({
                ruleId: r.ruleId,
                ruleName: r.ruleName,
                action: '风险预警',
                status: 'success'
              });
            } else {
              actionResults.push({
                ruleId: r.ruleId,
                ruleName: r.ruleName,
                action: action,
                status: 'success'
              });
            }
            
            console.log(`[RuleHit] Rule ${r.ruleId} (${r.ruleName}) hit recorded with action: ${action}`);
          }
        });
      });
      
      tx();
    } catch (e) {
      console.error('Rule evaluation and action execution failed:', e.message, e.stack);
    }
  }
  
  res.json({
    enterpriseId,
    enterpriseName: enterprise.name,
    evaluatedAt: now,
    totalRules: rules.length,
    triggeredCount: triggeredRules.length,
    results,
    actionResults,
    summary: {
      highRisk: triggeredRules.filter(r => r.ruleLevel === 'high').length,
      mediumRisk: triggeredRules.filter(r => r.ruleLevel === 'medium').length,
      lowRisk: triggeredRules.filter(r => r.ruleLevel === 'low').length
    }
  });
});

module.exports = router;
