const express = require('express');
const router = express.Router();
const { db } = require('../database');

const STATUS_FLOW = ['已签约', '材料审核中', '材料审核通过', '已提交异议', '机构受理中', '补件中', '机构驳回', '已更正', '已结案'];

router.post('/', (req, res) => {
  const { customer_id, status, remark } = req.body;
  
  const lastProgress = db.prepare('SELECT status FROM progress WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1').get(customer_id);
  
  if (lastProgress && lastProgress.status === status) {
    return res.status(400).json({ error: '状态未变更，无需重复提交' });
  }
  
  const currentIndex = lastProgress ? STATUS_FLOW.indexOf(lastProgress.status) : -1;
  const newIndex = STATUS_FLOW.indexOf(status);
  
  if (newIndex - currentIndex > 1) {
    return res.status(400).json({ error: `不能跳过中间步骤！当前状态是"${lastProgress.status}"，下一步应该是"${STATUS_FLOW[currentIndex + 1]}"` });
  }
  
  if (newIndex < currentIndex) {
    return res.status(400).json({ error: '不能回退到之前的状态！' });
  }
  
  db.prepare('INSERT INTO progress (customer_id, status, remark, operator_id) VALUES (?, ?, ?, ?)')
    .run(customer_id, status, remark, 1);
  
  if (status === '机构驳回') {
    db.prepare('INSERT INTO todo_items (customer_id, type, title, description, due_date) VALUES (?, ?, ?, ?, datetime("now", "+3 days"))')
      .run(customer_id, 'rejected', '异议驳回处理', '机构驳回异议，需要3天内处理并重新提交');
  }
  
  res.json({ success: true });
});

router.get('/stats', (req, res) => {
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM progress 
    WHERE id IN (SELECT MAX(id) FROM progress GROUP BY customer_id)
    GROUP BY status
  `).all();
  
  const overdueCount = db.prepare(`
    SELECT COUNT(DISTINCT p.customer_id) as count
    FROM progress p
    WHERE p.id IN (SELECT MAX(id) FROM progress GROUP BY customer_id)
    AND p.status IN ('已提交异议', '机构受理中')
    AND p.created_at < datetime('now', '-15 days')
  `).get();
  
  res.json({ statusStats, overdueCount: overdueCount.count });
});

router.get('/check-overdue', (req, res) => {
  const overdueProgress = db.prepare(`
    SELECT p.customer_id, c.name, c.customer_no, p.status, p.created_at
    FROM progress p
    JOIN customers c ON p.customer_id = c.id
    WHERE p.id IN (SELECT MAX(id) FROM progress GROUP BY customer_id)
    AND p.status IN ('已提交异议', '机构受理中')
    AND p.created_at < datetime('now', '-15 days')
    AND NOT EXISTS (
      SELECT 1 FROM todo_items t 
      WHERE t.customer_id = p.customer_id 
      AND t.type = 'followup' 
      AND t.status = 'pending'
    )
  `).all();
  
  const insertTodo = db.prepare('INSERT INTO todo_items (customer_id, type, title, description, due_date) VALUES (?, ?, ?, ?, datetime("now", "+1 day"))');
  
  overdueProgress.forEach(p => {
    insertTodo.run(p.customer_id, 'followup', '进度跟进', `${p.customer_no}(${p.name})提交异议超过15天未反馈，需要跟进`);
  });
  
  res.json({ processed: overdueProgress.length, items: overdueProgress });
});

module.exports = router;
