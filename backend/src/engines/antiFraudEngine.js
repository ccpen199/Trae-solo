import { db } from '../database/init.js';

const FRAUD_RULES = [
  {
    id: 'FR001',
    name: '黑名单身份证',
    type: 'identity',
    check: (borrower) => {
      const blacklistCards = ['110101199001019999', '440101198001018888'];
      return blacklistCards.includes(borrower.id_card);
    },
    riskLevel: 'critical',
    tag: 'blacklist_identity'
  },
  {
    id: 'FR002',
    name: '多头借贷检测',
    type: 'behavior',
    check: (borrower, recentApps) => {
      const recentCount = recentApps?.length || 0;
      return recentCount >= 3;
    },
    riskLevel: 'high',
    tag: 'multiple_loan_applications'
  },
  {
    id: 'FR003',
    name: '异常工作信息',
    type: 'information',
    check: (application) => {
      const suspiciousCompanies = ['空壳公司', '虚假企业', '不存在公司'];
      return false;
    },
    riskLevel: 'medium',
    tag: 'suspicious_company'
  },
  {
    id: 'FR004',
    name: '设备指纹异常',
    type: 'device',
    check: (application) => {
      return false;
    },
    riskLevel: 'medium',
    tag: 'device_abnormality'
  },
  {
    id: 'FR005',
    name: '联系人黑名单',
    type: 'contact',
    check: (application) => {
      return false;
    },
    riskLevel: 'high',
    tag: 'blacklist_contact'
  }
];

const runFraudCheck = async (applicationId, borrower, recentApplications = []) => {
  const hitRules = [];
  let overallRiskLevel = 'low';
  const riskTags = [];

  for (const rule of FRAUD_RULES) {
    try {
      const isHit = rule.check(borrower, recentApplications, {});
      
      if (isHit) {
        hitRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          risk_type: rule.type,
          risk_level: rule.riskLevel,
          hit_details: JSON.stringify({ rule_triggered: rule.name }),
          suggestion: getSuggestion(rule.riskLevel)
        });

        riskTags.push(rule.tag);
        
        const levelPriority = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        if (levelPriority[rule.riskLevel] > levelPriority[overallRiskLevel]) {
          overallRiskLevel = rule.riskLevel;
        }
      }
    } catch (error) {
      console.error(`Rule ${rule.id} execution error:`, error);
    }
  }

  const insertRiskHit = db.prepare(`
    INSERT INTO risk_hits (application_id, risk_type, risk_level, rule_name, rule_id, hit_details, suggestion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const hit of hitRules) {
    insertRiskHit.run(
      applicationId,
      hit.risk_type,
      hit.risk_level,
      hit.rule_name,
      hit.rule_id,
      hit.hit_details,
      hit.suggestion
    );
  }

  db.prepare(`
    UPDATE loan_applications 
    SET fraud_risk_level = ?, fraud_tags = ?
    WHERE id = ?
  `).run(overallRiskLevel, JSON.stringify(riskTags), applicationId);

  return {
    riskLevel: overallRiskLevel,
    riskTags: riskTags,
    hitCount: hitRules.length,
    hits: hitRules
  };
};

const getSuggestion = (riskLevel) => {
  switch (riskLevel) {
    case 'critical':
      return '强烈建议拒贷，存在严重欺诈风险';
    case 'high':
      return '建议重点审核，需要补充更多验证材料';
    case 'medium':
      return '建议关注，可进入人工复核环节';
    case 'low':
    default:
      return '风险较低，可继续正常审批流程';
  }
};

const getRecentApplications = (borrowerId, days = 30) => {
  return db.prepare(`
    SELECT * FROM loan_applications 
    WHERE borrower_id = ? 
    AND created_at >= datetime('now', '-' || ? || ' days')
    AND status != 'draft'
    ORDER BY created_at DESC
  `).all(borrowerId, days);
};

export { runFraudCheck, getRecentApplications };
