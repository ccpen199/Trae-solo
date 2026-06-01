const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE status = ? ORDER BY sort_order').all('active');
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.json({ success: false, message: '获取轮播图失败' });
  }
});

router.get('/list', (req, res) => {
  try {
    const { status = 'funding', page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const projects = db.prepare(`
      SELECT * FROM projects 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(status, parseInt(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get(status).count;

    res.json({
      success: true,
      data: {
        list: projects,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.json({ success: false, message: '获取项目列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.json({ success: false, message: '项目不存在' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project error:', error);
    res.json({ success: false, message: '获取项目详情失败' });
  }
});

router.post('/invest', authenticateToken, (req, res) => {
  try {
    const { projectId, amount } = req.body;
    const userId = req.user.id;

    if (!projectId || !amount) {
      return res.json({ success: false, message: '参数错误' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.json({ success: false, message: '项目不存在' });
    }

    if (project.status !== 'funding') {
      return res.json({ success: false, message: '项目不可投资' });
    }

    if (amount < project.min_invest) {
      return res.json({ success: false, message: `投资金额不能低于${project.min_invest}元` });
    }

    if (project.max_invest && amount > project.max_invest) {
      return res.json({ success: false, message: `投资金额不能高于${project.max_invest}元` });
    }

    if (amount > project.remaining_amount) {
      return res.json({ success: false, message: '项目剩余金额不足' });
    }

    if (amount > req.user.balance) {
      return res.json({ success: false, message: '账户余额不足，请先充值' });
    }

    const termDays = project.term_unit === 'day' ? project.term : project.term * 30;
    const expectedEarnings = amount * (project.interest_rate / 100) * (termDays / 365);
    const maturityTime = new Date(Date.now() + termDays * 24 * 60 * 60 * 1000);

    const updateUserStmt = db.prepare('UPDATE users SET balance = balance - ?, total_invest = total_invest + ? WHERE id = ?');
    updateUserStmt.run(amount, amount, userId);

    const updateProjectStmt = db.prepare('UPDATE projects SET remaining_amount = remaining_amount - ? WHERE id = ?');
    updateProjectStmt.run(amount, projectId);

    const insertInvestmentStmt = db.prepare(`
      INSERT INTO investments (user_id, project_id, amount, expected_earnings, maturity_time)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertInvestmentStmt.run(userId, projectId, amount, expectedEarnings, maturityTime.toISOString());

    const investmentId = result.lastInsertRowid;

    const insertTransactionStmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, related_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTransactionStmt.run(userId, 'invest', amount, `投资${project.title}`, investmentId);

    const plans = [];
    const months = project.term_unit === 'month' ? project.term : Math.ceil(project.term / 30);
    const principalPerMonth = amount / months;
    const interestPerMonth = expectedEarnings / months;

    for (let i = 1; i <= months; i++) {
      const planDate = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000);
      plans.push({
        investmentId,
        userId,
        principal: principalPerMonth,
        interest: interestPerMonth,
        total: principalPerMonth + interestPerMonth,
        planDate: planDate.toISOString().split('T')[0]
      });
    }

    const insertPlanStmt = db.prepare(`
      INSERT INTO repayment_plans (investment_id, user_id, amount, interest, total, plan_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const plan of plans) {
      insertPlanStmt.run(plan.investmentId, plan.userId, plan.principal, plan.interest, plan.total, plan.planDate);
    }

    const updatedProject = db.prepare('SELECT remaining_amount FROM projects WHERE id = ?').get(projectId);
    if (updatedProject.remaining_amount <= 0) {
      db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('funded', projectId);
    }

    res.json({
      success: true,
      message: '投资成功',
      data: {
        investmentId,
        expectedEarnings,
        maturityTime
      }
    });
  } catch (error) {
    console.error('Invest error:', error);
    res.json({ success: false, message: '投资失败' });
  }
});

module.exports = router;
