const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env'), override: false, quiet: true });

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'fastrust_jwt_secret_key_2024';
const getDb = () => new sqlite3.Database(dbPath);
const parseLimit = (value, fallback = 30, max = 50) => {
  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(limit, 1), max);
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的令牌' });
  }
};

router.get('/zones', (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM city_zones ORDER BY created_at DESC', [], (err, zones) => {
    db.close();
    if (err) {
      console.error('获取运营区错误:', err);
      return res.status(500).json({ error: '获取运营区失败' });
    }
    res.json({ success: true, zones });
  });
});

router.post('/zones', (req, res) => {
  const { city_name, district_name, geofence } = req.body;

  if (!city_name) {
    return res.status(400).json({ error: '城市名称不能为空' });
  }

  const db = getDb();

  db.run(`
    INSERT INTO city_zones (city_name, district_name, geofence)
    VALUES (?, ?, ?)
  `, [city_name, district_name || '', JSON.stringify(geofence || [])], function(err) {
    if (err) {
      db.close();
      console.error('创建运营区错误:', err);
      return res.status(500).json({ error: '创建运营区失败' });
    }

    const zoneId = this.lastID;

    db.get('SELECT * FROM city_zones WHERE id = ?', [zoneId], (err, zone) => {
      db.close();
      if (err) {
        console.error('查询运营区错误:', err);
        return res.status(500).json({ error: '创建运营区失败' });
      }

      res.json({ success: true, zone });
    });
  });
});

router.put('/zones/:id', (req, res) => {
  const { city_name, district_name, geofence, is_active } = req.body;
  const db = getDb();

  db.get('SELECT * FROM city_zones WHERE id = ?', [req.params.id], (err, zone) => {
    if (err) {
      db.close();
      console.error('查询运营区错误:', err);
      return res.status(500).json({ error: '更新运营区失败' });
    }

    if (!zone) {
      db.close();
      return res.status(404).json({ error: '运营区不存在' });
    }

    db.run(`
      UPDATE city_zones SET city_name = ?, district_name = ?, geofence = ?, is_active = ? WHERE id = ?
    `, [
      city_name || zone.city_name,
      district_name || zone.district_name,
      geofence ? JSON.stringify(geofence) : zone.geofence,
      is_active !== undefined ? is_active : zone.is_active,
      req.params.id
    ], function(err) {
      if (err) {
        db.close();
        console.error('更新运营区错误:', err);
        return res.status(500).json({ error: '更新运营区失败' });
      }

      db.get('SELECT * FROM city_zones WHERE id = ?', [req.params.id], (err, updatedZone) => {
        db.close();
        if (err) {
          console.error('查询更新后运营区错误:', err);
          return res.status(500).json({ error: '更新运营区失败' });
        }

        res.json({ success: true, zone: updatedZone });
      });
    });
  });
});

router.delete('/zones/:id', (req, res) => {
  const db = getDb();

  db.run('DELETE FROM city_zones WHERE id = ?', [req.params.id], function(err) {
    db.close();
    if (err) {
      console.error('删除运营区错误:', err);
      return res.status(500).json({ error: '删除运营区失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '运营区不存在' });
    }

    res.json({ success: true, message: '运营区已删除' });
  });
});

router.get('/restricted-items', (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM restricted_items ORDER BY created_at DESC', [], (err, items) => {
    db.close();
    if (err) {
      console.error('获取禁运词错误:', err);
      return res.status(500).json({ error: '获取禁运词失败' });
    }
    res.json({ success: true, items });
  });
});

router.post('/restricted-items', (req, res) => {
  const { keyword, category, severity } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: '关键词不能为空' });
  }

  const db = getDb();

  db.run(`
    INSERT INTO restricted_items (keyword, category, severity)
    VALUES (?, ?, ?)
  `, [keyword, category || '其他', severity || 'warning'], function(err) {
    if (err) {
      db.close();
      console.error('添加禁运词错误:', err);
      return res.status(500).json({ error: '添加禁运词失败' });
    }

    const itemId = this.lastID;

    db.get('SELECT * FROM restricted_items WHERE id = ?', [itemId], (err, item) => {
      db.close();
      if (err) {
        console.error('查询禁运词错误:', err);
        return res.status(500).json({ error: '添加禁运词失败' });
      }

      res.json({ success: true, item });
    });
  });
});

router.put('/restricted-items/:id', (req, res) => {
  const { keyword, category, severity, is_active } = req.body;
  const db = getDb();

  db.get('SELECT * FROM restricted_items WHERE id = ?', [req.params.id], (err, item) => {
    if (err) {
      db.close();
      console.error('查询禁运词错误:', err);
      return res.status(500).json({ error: '更新禁运词失败' });
    }

    if (!item) {
      db.close();
      return res.status(404).json({ error: '禁运词不存在' });
    }

    db.run(`
      UPDATE restricted_items SET keyword = ?, category = ?, severity = ?, is_active = ? WHERE id = ?
    `, [
      keyword || item.keyword,
      category || item.category,
      severity || item.severity,
      is_active !== undefined ? is_active : item.is_active,
      req.params.id
    ], function(err) {
      if (err) {
        db.close();
        console.error('更新禁运词错误:', err);
        return res.status(500).json({ error: '更新禁运词失败' });
      }

      db.get('SELECT * FROM restricted_items WHERE id = ?', [req.params.id], (err, updatedItem) => {
        db.close();
        if (err) {
          console.error('查询更新后禁运词错误:', err);
          return res.status(500).json({ error: '更新禁运词失败' });
        }

        res.json({ success: true, item: updatedItem });
      });
    });
  });
});

router.delete('/restricted-items/:id', (req, res) => {
  const db = getDb();

  db.run('DELETE FROM restricted_items WHERE id = ?', [req.params.id], function(err) {
    db.close();
    if (err) {
      console.error('删除禁运词错误:', err);
      return res.status(500).json({ error: '删除禁运词失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '禁运词不存在' });
    }

    res.json({ success: true, message: '禁运词已删除' });
  });
});

router.get('/disputes', (req, res) => {
  const { status } = req.query;

  let query = 'SELECT * FROM dispute_cases WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const db = getDb();

  db.all(query, params, (err, disputes) => {
    if (err) {
      db.close();
      console.error('查询纠纷列表错误:', err);
      return res.status(500).json({ error: '获取纠纷列表失败' });
    }

    const disputesWithDetails = [];
    let completed = 0;

    if (disputes.length === 0) {
      db.close();
      return res.json({ success: true, disputes: [] });
    }

    disputes.forEach((dispute, index) => {
      const disputeDb = getDb();

      disputeDb.get('SELECT * FROM tasks WHERE id = ?', [dispute.task_id], (err, task) => {
        if (err) {
          disputeDb.close();
          console.error('查询任务错误:', err);
          return res.status(500).json({ error: '获取纠纷列表失败' });
        }

        disputeDb.get('SELECT * FROM users WHERE id = ?', [dispute.complainant_id], (err, complainant) => {
          if (err) {
            disputeDb.close();
            console.error('查询投诉人错误:', err);
            return res.status(500).json({ error: '获取纠纷列表失败' });
          }

          let respondent = null;
          const finishRespondent = () => {
            disputeDb.close();
            disputesWithDetails[index] = { ...dispute, task, complainant, respondent };
            completed++;

            if (completed === disputes.length) {
              db.close();
              res.json({ success: true, disputes: disputesWithDetails });
            }
          };

          if (dispute.respondent_id) {
            disputeDb.get('SELECT * FROM couriers WHERE id = ?', [dispute.respondent_id], (err, respondentData) => {
              if (err) {
                console.error('查询被投诉人错误:', err);
              }
              respondent = respondentData;
              finishRespondent();
            });
          } else {
            finishRespondent();
          }
        });
      });
    });
  });
});

router.put('/disputes/:id', (req, res) => {
  const { status, arbitrator_id, decision } = req.body;
  const db = getDb();

  db.get('SELECT * FROM dispute_cases WHERE id = ?', [req.params.id], (err, dispute) => {
    if (err) {
      db.close();
      console.error('查询纠纷错误:', err);
      return res.status(500).json({ error: '更新纠纷失败' });
    }

    if (!dispute) {
      db.close();
      return res.status(404).json({ error: '纠纷不存在' });
    }

    db.run(`
      UPDATE dispute_cases SET status = ?, arbitrator_id = ?, decision = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [
      status || dispute.status,
      arbitrator_id || dispute.arbitrator_id,
      decision || dispute.decision,
      req.params.id
    ], function(err) {
      if (err) {
        db.close();
        console.error('更新纠纷错误:', err);
        return res.status(500).json({ error: '更新纠纷失败' });
      }

      db.get('SELECT * FROM dispute_cases WHERE id = ?', [req.params.id], (err, updatedDispute) => {
        db.close();
        if (err) {
          console.error('查询更新后纠纷错误:', err);
          return res.status(500).json({ error: '更新纠纷失败' });
        }

        res.json({ success: true, dispute: updatedDispute });
      });
    });
  });
});

router.get('/audit-logs', (req, res) => {
  const { courier_id, action_type, start_date, end_date } = req.query;
  const limit = parseLimit(req.query.limit);

  let query = 'SELECT * FROM courier_audit_logs WHERE 1=1';
  const params = [];

  if (courier_id) {
    query += ' AND courier_id = ?';
    params.push(courier_id);
  }

  if (action_type) {
    query += ' AND action_type = ?';
    params.push(action_type);
  }

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const db = getDb();

  db.all(query, params, (err, logs) => {
    if (err) {
      db.close();
      console.error('查询审计日志错误:', err);
      return res.status(500).json({ error: '获取审计日志失败' });
    }

    const logsWithCourier = [];
    let completed = 0;

    if (logs.length === 0) {
      db.close();
      return res.json({ success: true, logs: [] });
    }

    logs.forEach((log, index) => {
      const logDb = getDb();

      logDb.get('SELECT id, phone, name, credit_score FROM couriers WHERE id = ?', [log.courier_id], (err, courier) => {
        logDb.close();
        if (err) {
          console.error('查询骑手错误:', err);
          return res.status(500).json({ error: '获取审计日志失败' });
        }

        logsWithCourier[index] = { ...log, courier };
        completed++;

        if (completed === logs.length) {
          db.close();
          res.json({ success: true, logs: logsWithCourier });
        }
      });
    });
  });
});

router.get('/stats', (req, res) => {
  const db = getDb();

  const stats = {
    tasks: {},
    users: {},
    exceptions: {},
    disputes: {},
    today: {}
  };

  let completed = 0;
  const totalQueries = 10;
  let responded = false;

  const checkComplete = () => {
    completed++;
    if (!responded && completed >= totalQueries) {
      responded = true;
      db.close();
      res.json({
        success: true,
        stats
      });
    }
  };

  db.get('SELECT COUNT(*) as count FROM tasks', [], (err, result) => {
    if (err) {
      console.error('查询任务总数错误:', err);
      checkComplete();
      return;
    }
    stats.tasks.total = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'", [], (err, result) => {
    if (err) {
      console.error('查询待处理任务错误:', err);
      checkComplete();
      return;
    }
    stats.tasks.pending = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM tasks WHERE status IN ('accepted', 'picked_up', 'in_transit')", [], (err, result) => {
    if (err) {
      console.error('查询进行中任务错误:', err);
      checkComplete();
      return;
    }
    stats.tasks.active = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'", [], (err, result) => {
    if (err) {
      console.error('查询已完成任务错误:', err);
      checkComplete();
      return;
    }
    stats.tasks.completed = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'exception'", [], (err, result) => {
    if (err) {
      console.error('查询异常任务错误:', err);
      checkComplete();
      return;
    }
    stats.tasks.exception = result.count;
    checkComplete();
  });

  db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
    if (err) {
      console.error('查询用户总数错误:', err);
      checkComplete();
      return;
    }
    stats.users.total = result.count;
    checkComplete();
  });

  db.get('SELECT COUNT(*) as count FROM couriers', [], (err, result) => {
    if (err) {
      console.error('查询骑手总数错误:', err);
      checkComplete();
      return;
    }
    stats.users.couriers = stats.users.couriers || {};
    stats.users.couriers.total = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM couriers WHERE status = 'approved'", [], (err, result) => {
    if (err) {
      console.error('查询已批准骑手错误:', err);
      checkComplete();
      return;
    }
    stats.users.couriers = stats.users.couriers || {};
    stats.users.couriers.approved = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM exception_tickets WHERE status = 'open'", [], (err, result) => {
    if (err) {
      console.error('查询开放异常工单错误:', err);
      checkComplete();
      return;
    }
    stats.exceptions.open = result.count;
    checkComplete();
  });

  db.get("SELECT COUNT(*) as count FROM dispute_cases WHERE status = 'pending'", [], (err, result) => {
    if (err) {
      console.error('查询待处理纠纷错误:', err);
      checkComplete();
      return;
    }
    stats.disputes.pending = result.count;

    const today = new Date().toISOString().split('T')[0];

    db.get('SELECT COUNT(*) as count FROM tasks WHERE DATE(created_at) = ?', [today], (err, todayResult) => {
      if (err) {
        console.error('查询今日任务错误:', err);
        checkComplete();
        return;
      }
      stats.today.tasks = todayResult.count;

      db.get('SELECT SUM(final_price) as total FROM tasks WHERE DATE(created_at) = ? AND status = ?', [today, 'completed'], (err, revenueResult) => {
        if (err) {
          console.error('查询今日收入错误:', err);
          checkComplete();
          return;
        }
        stats.today.revenue = revenueResult.total || 0;
        checkComplete();
      });
    });
  });
});

router.get('/couriers', (req, res) => {
  const { status } = req.query;

  let query = 'SELECT id, phone, name, status, face_verified, license_types, credit_score, created_at FROM couriers WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const db = getDb();

  db.all(query, params, (err, couriers) => {
    db.close();
    if (err) {
      console.error('获取骑手列表错误:', err);
      return res.status(500).json({ error: '获取骑手列表失败' });
    }

    res.json({ success: true, couriers });
  });
});

router.put('/couriers/:id', (req, res) => {
  const { status, credit_score } = req.body;
  const db = getDb();

  db.get('SELECT * FROM couriers WHERE id = ?', [req.params.id], (err, courier) => {
    if (err) {
      db.close();
      console.error('查询骑手错误:', err);
      return res.status(500).json({ error: '更新骑手失败' });
    }

    if (!courier) {
      db.close();
      return res.status(404).json({ error: '骑手不存在' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (credit_score !== undefined) {
      updates.push('credit_score = ?');
      params.push(credit_score);
    }

    params.push(req.params.id);

    db.prepare(`UPDATE couriers SET ${updates.join(', ')} WHERE id = ?`).run(...params, function(err) {
      if (err) {
        db.close();
        console.error('更新骑手错误:', err);
        return res.status(500).json({ error: '更新骑手失败' });
      }

      db.run('INSERT INTO courier_audit_logs (courier_id, action_type, action_detail) VALUES (?, ?, ?)', [
        req.params.id,
        'admin_update',
        `管理员更新: status=${status || courier.status}, credit_score=${credit_score || courier.credit_score}`
      ], (err) => {
        if (err) {
          db.close();
          console.error('创建审计日志错误:', err);
          return res.status(500).json({ error: '更新骑手失败' });
        }

        db.get('SELECT id, phone, name, status, face_verified, license_types, credit_score, created_at FROM couriers WHERE id = ?', [req.params.id], (err, updatedCourier) => {
          db.close();
          if (err) {
            console.error('查询更新后骑手错误:', err);
            return res.status(500).json({ error: '更新骑手失败' });
          }

          res.json({ success: true, courier: updatedCourier });
        });
      });
    });
  });
});

module.exports = router;
