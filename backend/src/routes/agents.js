const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { status, team } = req.query;

  let query = `
    SELECT 
      a.*,
      COUNT(DISTINCT p.id) as policy_count,
      COUNT(DISTINCT rt.id) as task_count,
      SUM(CASE WHEN rt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
    FROM agents a
    LEFT JOIN policies p ON a.id = p.agent_id
    LEFT JOIN renewal_tasks rt ON a.id = rt.agent_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }
  if (team) {
    query += ` AND a.team = ?`;
    params.push(team);
  }

  query += ` GROUP BY a.id ORDER BY a.name`;

  try {
    const agents = db.prepare(query).all(...params);
    res.json({ data: agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: '代理人不存在' });
    }

    const policies = db.prepare(`
      SELECT p.*, c.name as customer_name
      FROM policies p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.agent_id = ?
      ORDER BY p.expiry_date ASC
    `).all(req.params.id);

    const tasks = db.prepare(`
      SELECT rt.*, p.policy_no, c.name as customer_name
      FROM renewal_tasks rt
      LEFT JOIN policies p ON rt.policy_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE rt.agent_id = ?
      ORDER BY rt.created_at DESC
    `).all(req.params.id);

    res.json({
      ...agent,
      policies,
      tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
