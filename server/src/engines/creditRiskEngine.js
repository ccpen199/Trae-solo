const { get, run, transaction } = require('../database');

const RISK_FACTORS = {
  AMOUNT_THRESHOLD: {
    HIGH: 1000000,
    MEDIUM: 500000
  },
  MATURITY_DAYS: {
    HIGH: 180,
    MEDIUM: 90
  },
  COMPANY_RISK_WEIGHT: {
    'low': 0.1,
    'medium': 0.3,
    'high': 0.5
  }
};

const calculateRiskScore = async (bill) => {
  let score = 0;
  
  if (bill.amount >= RISK_FACTORS.AMOUNT_THRESHOLD.HIGH) {
    score += 40;
  } else if (bill.amount >= RISK_FACTORS.AMOUNT_THRESHOLD.MEDIUM) {
    score += 20;
  }

  const maturityDate = new Date(bill.maturity_date);
  const issueDate = new Date(bill.issue_date);
  const daysToMaturity = Math.ceil((maturityDate - issueDate) / (1000 * 60 * 60 * 24));

  if (daysToMaturity >= RISK_FACTORS.MATURITY_DAYS.HIGH) {
    score += 30;
  } else if (daysToMaturity >= RISK_FACTORS.MATURITY_DAYS.MEDIUM) {
    score += 15;
  }

  if (bill.bill_type === 'commercial_acceptance') {
    score += 20;
  }

  const creditLimit = await get(
    `SELECT risk_level FROM credit_limits WHERE company_name = ?`,
    [bill.drawer]
  );

  if (creditLimit) {
    score += 10 * RISK_FACTORS.COMPANY_RISK_WEIGHT[creditLimit.risk_level] * 10;
  }

  return Math.min(score, 100);
};

const getRiskLevel = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const checkCreditLimit = async (companyName, amount) => {
  const creditLimit = await get(
    `SELECT * FROM credit_limits WHERE company_name = ?`,
    [companyName]
  );

  if (!creditLimit) {
    return {
      available: false,
      reason: `未找到 ${companyName} 的授信额度配置`
    };
  }

  const newUsed = creditLimit.used_limit + amount;
  if (newUsed > creditLimit.total_limit) {
    return {
      available: false,
      reason: `授信额度不足。总额度: ${creditLimit.total_limit}, 已使用: ${creditLimit.used_limit}, 申请金额: ${amount}, 缺口: ${newUsed - creditLimit.total_limit}`
    };
  }

  return {
    available: true,
    totalLimit: creditLimit.total_limit,
    usedLimit: creditLimit.used_limit,
    newUsedLimit: newUsed,
    availableLimit: creditLimit.total_limit - newUsed
  };
};

const useCreditLimit = async (companyName, amount, billId) => {
  return transaction(async () => {
    const checkResult = await checkCreditLimit(companyName, amount);
    
    if (!checkResult.available) {
      throw new Error(checkResult.reason);
    }

    await run(`
      UPDATE credit_limits 
      SET used_limit = used_limit + ?, 
          available_limit = available_limit - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE company_name = ?
    `, [amount, amount, companyName]);

    await run(`
      UPDATE bills 
      SET credit_limit_used = credit_limit_used + ?
      WHERE id = ?
    `, [amount, billId]);

    return {
      success: true,
      companyName,
      amount,
      billId,
      remainingLimit: checkResult.availableLimit
    };
  });
};

const releaseCreditLimit = async (companyName, amount, billId) => {
  return transaction(async () => {
    const creditLimit = await get(
      `SELECT * FROM credit_limits WHERE company_name = ?`,
      [companyName]
    );

    if (!creditLimit) {
      throw new Error(`未找到 ${companyName} 的授信额度配置`);
    }

    const newUsed = Math.max(0, creditLimit.used_limit - amount);
    
    await run(`
      UPDATE credit_limits 
      SET used_limit = ?, 
          available_limit = total_limit - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE company_name = ?
    `, [newUsed, newUsed, companyName]);

    await run(`
      UPDATE bills 
      SET credit_limit_used = MAX(0, credit_limit_used - ?)
      WHERE id = ?
    `, [amount, billId]);

    return {
      success: true,
      companyName,
      amountReleased: amount,
      billId,
      newAvailableLimit: creditLimit.total_limit - newUsed
    };
  });
};

const evaluateAndUpdateRisk = async (billId) => {
  const bill = await get(`SELECT * FROM bills WHERE id = ?`, [billId]);
  
  if (!bill) {
    throw new Error(`票据 ID ${billId} 不存在`);
  }

  const riskScore = await calculateRiskScore(bill);
  const riskLevel = getRiskLevel(riskScore);

  await run(`
    UPDATE bills 
    SET risk_score = ?, 
        risk_level = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [riskScore, riskLevel, billId]);

  return {
    billId,
    riskScore,
    riskLevel
  };
};

module.exports = {
  calculateRiskScore,
  getRiskLevel,
  checkCreditLimit,
  useCreditLimit,
  releaseCreditLimit,
  evaluateAndUpdateRisk
};
