const express = require('express');
const { getDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/news', (req, res) => {
  const { category, limit = 10 } = req.query;
  const db = getDb();
  
  let sql = 'SELECT * FROM policy_news WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  sql += ' ORDER BY is_top DESC, publish_date DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const news = db.prepare(sql).all(...params);
  res.json(news);
});

router.get('/news/:id', (req, res) => {
  const db = getDb();
  
  db.prepare('UPDATE policy_news SET views = views + 1 WHERE id = ?').run(req.params.id);
  
  const news = db.prepare('SELECT * FROM policy_news WHERE id = ?').get(req.params.id);
  
  if (!news) {
    return res.status(404).json({ error: '新闻不存在' });
  }
  
  res.json(news);
});

router.post('/calculator/social-subsidy', authMiddleware, (req, res) => {
  const { salary, months, familyMembers, isLowIncome } = req.body;
  
  const baseSubsidy = 500;
  const salaryFactor = Math.max(0, 1 - salary / 10000);
  const memberFactor = Math.min(familyMembers * 0.1, 0.5);
  const lowIncomeBonus = isLowIncome ? 300 : 0;
  
  const monthlySubsidy = Math.round(baseSubsidy * salaryFactor * (1 + memberFactor) + lowIncomeBonus);
  const totalSubsidy = monthlySubsidy * months;
  
  res.json({
    monthlySubsidy,
    totalSubsidy,
    breakdown: {
      baseSubsidy,
      salaryAdjustment: Math.round(baseSubsidy * salaryFactor),
      memberBonus: Math.round(baseSubsidy * salaryFactor * memberFactor),
      lowIncomeBonus
    },
    eligibility: salary < 8000,
    advice: salary >= 8000 ? '您的收入水平可能不符合补贴条件，建议咨询当地社保部门' : '您可以准备相关材料进行申请'
  });
});

router.post('/calculator/tax', authMiddleware, (req, res) => {
  const { income, deductions, socialInsurance, housingFund } = req.body;
  
  const threshold = 5000;
  const specialDeductions = deductions || 0;
  const totalDeductions = threshold + specialDeductions + socialInsurance + housingFund;
  
  const taxableIncome = Math.max(0, income - totalDeductions);
  
  let tax = 0;
  if (taxableIncome <= 3000) {
    tax = taxableIncome * 0.03;
  } else if (taxableIncome <= 12000) {
    tax = taxableIncome * 0.1 - 210;
  } else if (taxableIncome <= 25000) {
    tax = taxableIncome * 0.2 - 1410;
  } else if (taxableIncome <= 35000) {
    tax = taxableIncome * 0.25 - 2660;
  } else if (taxableIncome <= 55000) {
    tax = taxableIncome * 0.3 - 4410;
  } else if (taxableIncome <= 80000) {
    tax = taxableIncome * 0.35 - 7160;
  } else {
    tax = taxableIncome * 0.45 - 15160;
  }
  
  res.json({
    income,
    taxableIncome: Math.round(taxableIncome),
    tax: Math.round(tax),
    netIncome: Math.round(income - tax - socialInsurance - housingFund),
    deductions: {
      threshold,
      specialDeductions,
      socialInsurance,
      housingFund,
      total: totalDeductions
    }
  });
});

module.exports = router;
