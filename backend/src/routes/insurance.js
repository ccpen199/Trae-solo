const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const getDb = () => new sqlite3.Database(dbPath);

router.post('/create', (req, res) => {
  try {
    const { task_id, coverage_type, coverage_amount } = req.body;
    const db = getDb();

    db.get('SELECT * FROM tasks WHERE id = ?', [task_id], (err, task) => {
      if (err) {
        db.close();
        console.error('查询任务错误:', err);
        return res.status(500).json({ error: '创建保险单失败' });
      }

      if (!task) {
        db.close();
        return res.status(404).json({ error: '任务不存在' });
      }

      const policyNumber = `INS${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const premium = task.final_price * 0.05;
      const coverage = coverage_amount || task.final_price * 2;

      db.run(`
        INSERT INTO insurance_policies (task_id, policy_number, coverage_type, premium, coverage_amount)
        VALUES (?, ?, ?, ?, ?)
      `, [task_id, policyNumber, coverage_type || '标准险', premium, coverage], function(err) {
        if (err) {
          db.close();
          console.error('创建保险单错误:', err);
          return res.status(500).json({ error: '创建保险单失败' });
        }

        const policyId = this.lastID;

        db.get('SELECT * FROM insurance_policies WHERE id = ?', [policyId], (err, policy) => {
          db.close();
          if (err) {
            console.error('查询保险单错误:', err);
            return res.status(500).json({ error: '创建保险单失败' });
          }

          res.json({ success: true, policy });
        });
      });
    });
  } catch (error) {
    console.error('创建保险单错误:', error);
    res.status(500).json({ error: '创建保险单失败' });
  }
});

router.get('/:id', (req, res) => {
  const db = getDb();

  db.get('SELECT * FROM insurance_policies WHERE id = ?', [req.params.id], (err, policy) => {
    if (err) {
      db.close();
      console.error('查询保险单错误:', err);
      return res.status(500).json({ error: '获取保险单失败' });
    }

    if (!policy) {
      db.close();
      return res.status(404).json({ error: '保险单不存在' });
    }

    db.get('SELECT * FROM tasks WHERE id = ?', [policy.task_id], (err, task) => {
      db.close();
      if (err) {
        console.error('查询任务错误:', err);
        return res.status(500).json({ error: '获取保险单失败' });
      }

      res.json({ success: true, policy, task });
    });
  });
});

router.get('/task/:taskId', (req, res) => {
  const db = getDb();

  db.get('SELECT * FROM insurance_policies WHERE task_id = ?', [req.params.taskId], (err, policy) => {
    db.close();
    if (err) {
      console.error('查询保险单错误:', err);
      return res.status(500).json({ error: '获取保险单失败' });
    }

    if (!policy) {
      return res.status(404).json({ error: '保险单不存在' });
    }

    res.json({ success: true, policy });
  });
});

module.exports = router;
