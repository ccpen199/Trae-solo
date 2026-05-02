import { db } from '../database/init.js';

const RULE_CATEGORIES = {
  PRE_APPROVAL: 'pre_approval',
  CREDIT_LIMIT: 'credit_limit',
  FRAUD_DETECTION: 'fraud_detection',
  APPROVAL_FLOW: 'approval_flow'
};

const executeRuleTree = async (context) => {
  const { application, borrower, creditLimits } = context;
  const results = {
    passed: true,
    failedRules: [],
    warnings: [],
    approvalSuggestion: null,
    executionPath: []
  };

  const activeRules = db.prepare(`
    SELECT * FROM rule_engine_rules 
    WHERE is_active = 1 
    ORDER BY priority DESC
  `).all();

  for (const rule of activeRules) {
    const ruleResult = await evaluateRule(rule, context);
    results.executionPath.push({
      ruleName: rule.rule_name,
      ruleCategory: rule.rule_category,
      passed: ruleResult.passed,
      message: ruleResult.message
    });

    if (!ruleResult.passed) {
      results.passed = false;
      results.failedRules.push({
        ruleName: rule.rule_name,
        category: rule.rule_category,
        reason: ruleResult.message
      });
    } else if (ruleResult.warning) {
      results.warnings.push({
        ruleName: rule.rule_name,
        warning: ruleResult.message
      });
    }
  }

  results.approvalSuggestion = generateSuggestion(results, context);
  
  return results;
};

const evaluateRule = async (rule, context) => {
  const { application, borrower, creditLimits } = context;
  const params = rule.rule_parameters ? JSON.parse(rule.rule_parameters) : {};

  switch (rule.rule_category) {
    case 'limit':
      return evaluateLimitRules(rule, application, creditLimits, params);
    case 'credit':
      return evaluateCreditRules(rule, borrower, params);
    case 'fraud':
      return evaluateFraudRules(rule, application, params);
    default:
      return { passed: true, message: '规则执行通过' };
  }
};

const evaluateLimitRules = (rule, application, creditLimits, params) => {
  const loanAmount = parseFloat(application.loan_amount) || 0;
  const maxAmount = parseFloat(params.max_amount) || 500000;
  const maxSingleLoan = creditLimits?.max_single_loan || 100000;
  const availableLimit = creditLimits?.available_limit || 0;

  if (loanAmount > maxAmount) {
    return {
      passed: false,
      message: `贷款金额 ${loanAmount.toLocaleString()} 元超过单户上限 ${maxAmount.toLocaleString()} 元`
    };
  }

  if (loanAmount > maxSingleLoan) {
    return {
      passed: false,
      message: `贷款金额 ${loanAmount.toLocaleString()} 元超过单笔上限 ${maxSingleLoan.toLocaleString()} 元`
    };
  }

  if (loanAmount > availableLimit) {
    return {
      passed: false,
      message: `贷款金额 ${loanAmount.toLocaleString()} 元超过可用额度 ${availableLimit.toLocaleString()} 元`
    };
  }

  if (params.min_term && params.max_term) {
    const term = application.loan_term;
    if (term < params.min_term || term > params.max_term) {
      return {
        passed: false,
        message: `贷款期限 ${term} 个月不在允许范围 [${params.min_term}, ${params.max_term}] 内`
      };
    }
  }

  return { passed: true, message: '额度规则验证通过' };
};

const evaluateCreditRules = (rule, borrower, params) => {
  const creditScore = borrower?.credit_score || 0;
  const minScore = params.min_score || 500;

  if (creditScore < minScore) {
    return {
      passed: false,
      message: `信用评分 ${creditScore} 分低于最低要求 ${minScore} 分`
    };
  }

  return { passed: true, message: `信用评分 ${creditScore} 分符合要求` };
};

const evaluateFraudRules = (rule, application, params) => {
  const riskLevel = application.fraud_risk_level || 'low';

  if (riskLevel === 'critical') {
    return {
      passed: false,
      message: '欺诈风险等级为 Critical，触发拒贷规则',
      warning: true
    };
  }

  if (riskLevel === 'high') {
    return {
      passed: true,
      message: '欺诈风险等级为 High，建议人工复核',
      warning: true
    };
  }

  return { passed: true, message: '欺诈风险检查通过' };
};

const generateSuggestion = (results, context) => {
  const { application } = context;
  const creditScore = application.credit_score || 60;
  const fraudLevel = application.fraud_risk_level || 'low';

  if (!results.passed) {
    const failedLimit = results.failedRules.some(r => r.category === 'limit');
    const failedCredit = results.failedRules.some(r => r.category === 'credit');
    const failedFraud = results.failedRules.some(r => r.category === 'fraud');

    if (failedFraud || failedCredit) {
      return {
        action: 'reject',
        message: '规则引擎建议拒贷',
        reasons: results.failedRules.map(r => r.reason)
      };
    }

    if (failedLimit) {
      return {
        action: 'return',
        message: '额度超限，建议退回调整',
        reasons: results.failedRules.map(r => r.reason)
      };
    }
  }

  if (fraudLevel === 'high') {
    return {
      action: 'escalate',
      message: '高风险预警，建议升级审批',
      warnings: results.warnings.map(w => w.warning)
    };
  }

  if (creditScore >= 85) {
    return {
      action: 'auto_approve',
      message: '优质客户，建议自动审批'
    };
  }

  return {
    action: 'normal_approve',
    message: '建议按正常流程审批'
  };
};

const getApprovalFlowConfig = (application) => {
  const amount = parseFloat(application.loan_amount) || 0;
  const creditScore = application.credit_score || 60;

  if (amount <= 50000 && creditScore >= 80) {
    return {
      flowType: 'auto',
      requiredSigners: [],
      description: '小额优质自动审批'
    };
  } else if (amount <= 200000) {
    return {
      flowType: 'single_level',
      requiredSigners: [
        { role: 'manager', level: 1 },
        { role: 'risk_expert', level: 1 }
      ],
      description: '标准二级审批'
    };
  } else if (amount <= 500000) {
    return {
      flowType: 'multi_sign',
      requiredSigners: [
        { role: 'manager', level: 1 },
        { role: 'risk_expert', level: 1 },
        { role: 'approval_director', level: 1 }
      ],
      description: '大额三级会签'
    };
  } else {
    return {
      flowType: 'special_approval',
      requiredSigners: [
        { role: 'manager', level: 2 },
        { role: 'risk_expert', level: 2 },
        { role: 'approval_director', level: 2 }
      ],
      description: '超大额特别审批'
    };
  }
};

export { executeRuleTree, getApprovalFlowConfig, RULE_CATEGORIES };
