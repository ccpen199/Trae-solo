const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const getDb = () => new sqlite3.Database(dbPath);

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的令牌' });
  }
};

router.post('/', authenticate, (req, res) => {
  const { task_id, type, description } = req.body;

  if (!task_id || !type) {
    return res.status(400).json({ error: '任务ID和异常类型不能为空' });
  }

  const db = getDb();

  db.get('SELECT * FROM tasks WHERE id = ?', [task_id], (err, task) => {
    if (err) {
      db.close();
      console.error('查询任务错误:', err);
      return res.status(500).json({ error: '创建异常工单失败' });
    }

    if (!task) {
      db.close();
      return res.status(404).json({ error: '任务不存在' });
    }

    db.run(`
      INSERT INTO exception_tickets (task_id, type, description, status)
      VALUES (?, ?, ?, 'open')
    `, [task_id, type, description || ''], function(err) {
      if (err) {
        db.close();
        console.error('创建异常工单错误:', err);
        return res.status(500).json({ error: '创建异常工单失败' });
      }

      const ticketId = this.lastID;

      db.run('UPDATE tasks SET status = ? WHERE id = ?', ['exception', task_id], (err) => {
        if (err) {
          db.close();
          console.error('更新任务状态错误:', err);
          return res.status(500).json({ error: '创建异常工单失败' });
        }

        db.run(`
          INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note)
          VALUES (?, 'exception', ?, 'system', ?)
        `, [task_id, req.user.id, `异常工单已创建:${type}`], (err) => {
          if (err) {
            db.close();
            console.error('创建状态历史错误:', err);
            return res.status(500).json({ error: '创建异常工单失败' });
          }

          db.get('SELECT * FROM exception_tickets WHERE id = ?', [ticketId], (err, ticket) => {
            db.close();
            if (err) {
              console.error('查询异常工单错误:', err);
              return res.status(500).json({ error: '创建异常工单失败' });
            }

            res.json({ success: true, ticket });
          });
        });
      });
    });
  });
});

router.get('/', authenticate, (req, res) => {
  const { status, task_id } = req.query;

  let query = 'SELECT * FROM exception_tickets WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (task_id) {
    query += ' AND task_id = ?';
    params.push(task_id);
  }

  query += ' ORDER BY created_at DESC';

  const db = getDb();

  db.all(query, params, (err, tickets) => {
    if (err) {
      db.close();
      console.error('查询异常工单列表错误:', err);
      return res.status(500).json({ error: '获取异常工单列表失败' });
    }

    const ticketsWithDetails = [];
    let completed = 0;

    if (tickets.length === 0) {
      db.close();
      return res.json({ success: true, tickets: [] });
    }

    tickets.forEach((ticket, index) => {
      const ticketDb = getDb();

      ticketDb.get('SELECT * FROM tasks WHERE id = ?', [ticket.task_id], (err, task) => {
        ticketDb.close();
        if (err) {
          console.error('查询任务错误:', err);
          return res.status(500).json({ error: '获取异常工单列表失败' });
        }

        ticketsWithDetails[index] = { ...ticket, task };
        completed++;

        if (completed === tickets.length) {
          db.close();
          res.json({ success: true, tickets: ticketsWithDetails });
        }
      });
    });
  });
});

router.put('/:id', authenticate, (req, res) => {
  const { status, assigned_to, resolution } = req.body;
  const db = getDb();

  db.get('SELECT * FROM exception_tickets WHERE id = ?', [req.params.id], (err, ticket) => {
    if (err) {
      db.close();
      console.error('查询异常工单错误:', err);
      return res.status(500).json({ error: '更新异常工单失败' });
    }

    if (!ticket) {
      db.close();
      return res.status(404).json({ error: '工单不存在' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (assigned_to) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }

    if (resolution) {
      updates.push('resolution = ?');
      params.push(resolution);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.prepare(`UPDATE exception_tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params, function(err) {
      if (err) {
        db.close();
        console.error('更新异常工单错误:', err);
        return res.status(500).json({ error: '更新异常工单失败' });
      }

      if (status === 'resolved') {
        db.run('UPDATE tasks SET status = ? WHERE id = ?', ['cancelled', ticket.task_id], (err) => {
          if (err) {
            db.close();
            console.error('更新任务状态错误:', err);
            return res.status(500).json({ error: '更新异常工单失败' });
          }

          finish();
        });
      } else {
        finish();
      }

      function finish() {
        db.get('SELECT * FROM exception_tickets WHERE id = ?', [req.params.id], (err, updatedTicket) => {
          db.close();
          if (err) {
            console.error('查询更新后工单错误:', err);
            return res.status(500).json({ error: '更新异常工单失败' });
          }

          res.json({ success: true, ticket: updatedTicket });
        });
      }
    });
  });
});

module.exports = router;
