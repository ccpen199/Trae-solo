const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CF${year}${month}${day}${random}`;
};

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status = 'active' } = req.query;
  const db = getDb();

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM crowdfunding_projects 
    WHERE status = ?
  `).get(status).count;

  const projects = db.prepare(`
    SELECT * FROM crowdfunding_projects 
    WHERE status = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: projects.map(p => ({
      id: p.id,
      title: p.title,
      cover: p.cover,
      description: p.description,
      target_amount: p.target_amount,
      raised_amount: p.raised_amount,
      progress: Math.min(100, (p.raised_amount / p.target_amount) * 100),
      start_time: p.start_time,
      end_time: p.end_time,
      status: p.status,
      creator: p.creator,
      created_at: p.created_at
    })),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/:projectId', optionalAuth, (req, res) => {
  const { projectId } = req.params;
  const db = getDb();

  const project = db.prepare('SELECT * FROM crowdfunding_projects WHERE id = ?').get(projectId);

  if (!project) {
    return res.status(404).json({ error: '众筹项目不存在' });
  }

  const gears = db.prepare('SELECT * FROM crowdfunding_gears WHERE project_id = ? ORDER BY amount ASC').all(projectId);

  res.json({
    success: true,
    data: {
      id: project.id,
      title: project.title,
      cover: project.cover,
      description: project.description,
      target_amount: project.target_amount,
      raised_amount: project.raised_amount,
      progress: Math.min(100, (project.raised_amount / project.target_amount) * 100),
      start_time: project.start_time,
      end_time: project.end_time,
      status: project.status,
      creator: project.creator,
      created_at: project.created_at,
      gears: gears.map(g => ({
        id: g.id,
        name: g.name,
        amount: g.amount,
        description: g.description,
        limit_count: g.limit_count,
        claimed_count: g.claimed_count,
        remaining_count: g.limit_count ? g.limit_count - g.claimed_count : null,
        estimated_delivery: g.estimated_delivery
      }))
    }
  });
});

router.post('/:projectId/support', requireAuth, (req, res) => {
  const { projectId } = req.params;
  const { gearId, quantity = 1 } = req.body;
  const db = getDb();
  const userId = req.user.id;

  if (!gearId) {
    return res.status(400).json({ error: '请选择支持档位' });
  }

  const project = db.prepare('SELECT * FROM crowdfunding_projects WHERE id = ?').get(projectId);

  if (!project) {
    return res.status(404).json({ error: '众筹项目不存在' });
  }

  if (project.status !== 'active') {
    return res.status(400).json({ error: '该项目当前不支持参与' });
  }

  const gear = db.prepare('SELECT * FROM crowdfunding_gears WHERE id = ? AND project_id = ?').get(gearId, projectId);

  if (!gear) {
    return res.status(400).json({ error: '档位不存在' });
  }

  if (gear.limit_count && gear.claimed_count + quantity > gear.limit_count) {
    return res.status(400).json({ error: '该档位已达上限' });
  }

  const totalAmount = gear.amount * quantity;
  const orderNo = generateOrderNo();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO crowdfunding_orders (order_no, user_id, project_id, gear_id, amount, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderNo, userId, projectId, gearId, totalAmount, quantity);

    db.prepare(`
      UPDATE crowdfunding_gears 
      SET claimed_count = claimed_count + ? 
      WHERE id = ?
    `).run(quantity, gearId);

    db.prepare(`
      UPDATE crowdfunding_projects 
      SET raised_amount = raised_amount + ? 
      WHERE id = ?
    `).run(totalAmount, projectId);
  })();

  res.json({
    success: true,
    data: {
      order_no: orderNo,
      amount: totalAmount,
      message: '感谢您的支持！'
    }
  });
});

module.exports = router;
