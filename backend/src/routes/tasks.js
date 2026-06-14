const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
  const { pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, distance_km, item_name, item_category, safety_level_id, features, special_requirements, pickup_time, delivery_deadline } = req.body;

  if (!pickup_address || !delivery_address) {
    return res.status(400).json({ error: '取货地址和收货地址不能为空' });
  }

  const basePrice = 10 + (distance_km || 1) * 3;
  let dynamicMultiplier = 1.0;
  const db = getDb();

  db.get('SELECT * FROM item_safety_levels WHERE id = ?', [safety_level_id], (err, safetyLevel) => {
    if (err) {
      db.close();
      console.error('查询安全等级错误:', err);
      return res.status(500).json({ error: '创建任务失败' });
    }

    if (safetyLevel) {
      dynamicMultiplier *= safetyLevel.risk_factor;
    }

    const currentHour = new Date().getHours();
    db.get('SELECT * FROM time_pricing WHERE time_start <= ? AND time_end > ?', [`${String(currentHour).padStart(2, '0')}:00`, `${String(currentHour).padStart(2, '0')}:00`], (err, timePricing) => {
      if (err) {
        db.close();
        console.error('查询时间定价错误:', err);
        return res.status(500).json({ error: '创建任务失败' });
      }

      if (timePricing) {
        dynamicMultiplier *= timePricing.price_multiplier;
      }

      const dynamicPrice = basePrice * dynamicMultiplier;
      const finalPrice = Math.round(dynamicPrice * 100) / 100;

      db.run(`
        INSERT INTO tasks (client_id, pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, distance_km, safety_level_id, base_price, dynamic_price, final_price, pickup_time, delivery_deadline, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        req.user.id,
        pickup_address,
        pickup_lat || null,
        pickup_lng || null,
        delivery_address,
        delivery_lat || null,
        delivery_lng || null,
        distance_km || null,
        safety_level_id || null,
        basePrice,
        dynamicPrice,
        finalPrice,
        pickup_time || null,
        delivery_deadline || null
      ], function(err) {
        if (err) {
          db.close();
          console.error('创建任务错误:', err);
          return res.status(500).json({ error: '创建任务失败' });
        }

        const taskId = this.lastID;
        const policyNumber = `INS${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        let coverageAmount = finalPrice * 2;
        if (safety_level_id === 1) coverageAmount = finalPrice * 5;
        if (safety_level_id === 2) coverageAmount = finalPrice * 3;

        db.run(`
          INSERT INTO items (task_id, name, category, safety_level_id, features, feature_code, special_requirements)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          taskId,
          item_name || '未分类物品',
          item_category || '其他',
          safety_level_id || null,
          features || null,
          uuidv4(),
          special_requirements || null
        ], function(err) {
          if (err) {
            db.close();
            console.error('创建物品错误:', err);
            return res.status(500).json({ error: '创建任务失败' });
          }

          const itemId = this.lastID;

          db.run(`
            INSERT INTO insurance_policies (task_id, policy_number, coverage_type, premium, coverage_amount)
            VALUES (?, ?, ?, ?, ?)
          `, [
            taskId,
            policyNumber,
            safety_level_id === 1 ? '活体运输险' : safety_level_id === 2 ? '易碎品险' : '标准险',
            finalPrice * 0.05,
            coverageAmount
          ], function(err) {
            if (err) {
              db.close();
              console.error('创建保险单错误:', err);
              return res.status(500).json({ error: '创建任务失败' });
            }

            const insuranceId = this.lastID;

            db.run('UPDATE tasks SET insurance_id = ? WHERE id = ?', [insuranceId, taskId], (err) => {
              if (err) {
                db.close();
                console.error('更新任务保险ID错误:', err);
                return res.status(500).json({ error: '创建任务失败' });
              }

              db.run(`
                INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note)
                VALUES (?, 'pending', ?, 'client', '任务创建')
              `, [taskId, req.user.id], (err) => {
                if (err) {
                  db.close();
                  console.error('创建状态历史错误:', err);
                  return res.status(500).json({ error: '创建任务失败' });
                }

                db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
                  if (err) {
                    db.close();
                    console.error('查询任务错误:', err);
                    return res.status(500).json({ error: '创建任务失败' });
                  }

                  db.get('SELECT * FROM insurance_policies WHERE id = ?', [insuranceId], (err, insurance) => {
                    if (err) {
                      db.close();
                      console.error('查询保险单错误:', err);
                      return res.status(500).json({ error: '创建任务失败' });
                    }

                    db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
                      db.close();
                      if (err) {
                        console.error('查询物品错误:', err);
                        return res.status(500).json({ error: '创建任务失败' });
                      }

                      res.json({
                        success: true,
                        task: {
                          ...task,
                          item,
                          insurance
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (req.user.type === 'client') {
    query = 'SELECT * FROM tasks WHERE client_id = ? ORDER BY created_at DESC';
    params.push(req.user.id);
  } else if (req.user.type === 'courier') {
    query = 'SELECT * FROM tasks WHERE courier_id = ? ORDER BY created_at DESC';
    params.push(req.user.id);
  }

  db.all(query, params, (err, tasks) => {
    if (err) {
      db.close();
      console.error('获取任务列表错误:', err);
      return res.status(500).json({ error: '获取任务列表失败' });
    }

    const tasksWithDetails = [];
    let completed = 0;

    if (tasks.length === 0) {
      db.close();
      return res.json({ success: true, tasks: [] });
    }

    tasks.forEach((task, index) => {
      const taskDb = getDb();
      taskDb.get('SELECT * FROM items WHERE task_id = ?', [task.id], (err, item) => {
        if (err) {
          taskDb.close();
          console.error('查询物品错误:', err);
          return res.status(500).json({ error: '获取任务列表失败' });
        }

        taskDb.get('SELECT * FROM insurance_policies WHERE id = ?', [task.insurance_id], (err, insurance) => {
          taskDb.close();
          if (err) {
            console.error('查询保险单错误:', err);
            return res.status(500).json({ error: '获取任务列表失败' });
          }

          tasksWithDetails[index] = { ...task, item, insurance };
          completed++;

          if (completed === tasks.length) {
            db.close();
            res.json({ success: true, tasks: tasksWithDetails });
          }
        });
      });
    });
  });
});

router.get('/available', authenticate, (req, res) => {
  const db = getDb();

  db.all("SELECT * FROM tasks WHERE status = 'pending' AND courier_id IS NULL ORDER BY created_at DESC", [], (err, tasks) => {
    if (err) {
      db.close();
      console.error('获取可用任务错误:', err);
      return res.status(500).json({ error: '获取可用任务失败' });
    }

    const tasksWithDetails = [];
    let completed = 0;

    if (tasks.length === 0) {
      db.close();
      return res.json({ success: true, tasks: [] });
    }

    tasks.forEach((task, index) => {
      const taskDb = getDb();
      taskDb.get('SELECT * FROM items WHERE task_id = ?', [task.id], (err, item) => {
        if (err) {
          taskDb.close();
          console.error('查询物品错误:', err);
          return res.status(500).json({ error: '获取可用任务失败' });
        }

        taskDb.get('SELECT id, phone, name FROM users WHERE id = ?', [task.client_id], (err, client) => {
          taskDb.close();
          if (err) {
            console.error('查询客户错误:', err);
            return res.status(500).json({ error: '获取可用任务失败' });
          }

          tasksWithDetails[index] = { ...task, item, client };
          completed++;

          if (completed === tasks.length) {
            db.close();
            res.json({ success: true, tasks: tasksWithDetails });
          }
        });
      });
    });
  });
});

router.get('/:id', authenticate, (req, res) => {
  const db = getDb();

  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) {
      db.close();
      console.error('获取任务详情错误:', err);
      return res.status(500).json({ error: '获取任务详情失败' });
    }

    if (!task) {
      db.close();
      return res.status(404).json({ error: '任务不存在' });
    }

    db.get('SELECT * FROM items WHERE task_id = ?', [task.id], (err, item) => {
      if (err) {
        db.close();
        console.error('查询物品错误:', err);
        return res.status(500).json({ error: '获取任务详情失败' });
      }

      db.get('SELECT * FROM insurance_policies WHERE id = ?', [task.insurance_id], (err, insurance) => {
        if (err) {
          db.close();
          console.error('查询保险单错误:', err);
          return res.status(500).json({ error: '获取任务详情失败' });
        }

        db.all('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY created_at ASC', [task.id], (err, history) => {
          if (err) {
            db.close();
            console.error('查询状态历史错误:', err);
            return res.status(500).json({ error: '获取任务详情失败' });
          }

          db.all('SELECT * FROM gps_tracking WHERE task_id = ? ORDER BY timestamp ASC', [task.id], (err, gpsTracks) => {
            if (err) {
              db.close();
              console.error('查询GPS轨迹错误:', err);
              return res.status(500).json({ error: '获取任务详情失败' });
            }

            let courier = null;
            const finish = () => {
              db.close();
              res.json({
                success: true,
                task: { ...task, item, insurance, history, gpsTracks, courier }
              });
            };

            if (task.courier_id) {
              db.get('SELECT id, phone, name, credit_score FROM couriers WHERE id = ?', [task.courier_id], (err, courierData) => {
                if (err) {
                  console.error('查询骑手错误:', err);
                }
                courier = courierData;
                finish();
              });
            } else {
              finish();
            }
          });
        });
      });
    });
  });
});

router.put('/:id/status', authenticate, (req, res) => {
  const { status, note, gps_location, photo, signature } = req.body;
  const db = getDb();

  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) {
      db.close();
      console.error('查询任务错误:', err);
      return res.status(500).json({ error: '更新任务状态失败' });
    }

    if (!task) {
      db.close();
      return res.status(404).json({ error: '任务不存在' });
    }

    db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id], (err) => {
      if (err) {
        db.close();
        console.error('更新任务状态错误:', err);
        return res.status(500).json({ error: '更新任务状态失败' });
      }

      db.run(`
        INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note, gps_location, photo, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.params.id, status, req.user.id, req.user.type, note || '', gps_location || null, photo || null, signature || null], (err) => {
        if (err) {
          db.close();
          console.error('创建状态历史错误:', err);
          return res.status(500).json({ error: '更新任务状态失败' });
        }

        if (status === 'timeout' || status === 'cancelled' || status === 'failed') {
          db.run(`
            INSERT INTO exception_tickets (task_id, type, description, status)
            VALUES (?, ?, ?, 'open')
          `, [req.params.id, status, `任务状态异常: ${status}`], (err) => {
            if (err) {
              db.close();
              console.error('创建异常工单错误:', err);
              return res.status(500).json({ error: '更新任务状态失败' });
            }

            finish();
          });
        } else {
          finish();
        }

        function finish() {
          db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, updatedTask) => {
            if (err) {
              db.close();
              console.error('查询更新后任务错误:', err);
              return res.status(500).json({ error: '更新任务状态失败' });
            }

            db.all('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY created_at ASC', [req.params.id], (err, history) => {
              db.close();
              if (err) {
                console.error('查询状态历史错误:', err);
                return res.status(500).json({ error: '更新任务状态失败' });
              }

              res.json({ success: true, task: updatedTask, history });
            });
          });
        }
      });
    });
  });
});

router.post('/:id/accept', authenticate, (req, res) => {
  if (req.user.type !== 'courier') {
    return res.status(403).json({ error: '只有接单人才能接单' });
  }

  const db = getDb();

  db.get('SELECT * FROM couriers WHERE id = ?', [req.user.id], (err, courier) => {
    if (err) {
      db.close();
      console.error('查询骑手错误:', err);
      return res.status(500).json({ error: '接单失败' });
    }

    if (!courier || courier.status !== 'approved') {
      db.close();
      return res.status(403).json({ error: '您的账号尚未通过审核或人脸识别' });
    }

    db.get('SELECT * FROM tasks WHERE id = ? AND status = ?', [req.params.id, 'pending'], (err, task) => {
      if (err) {
        db.close();
        console.error('查询任务错误:', err);
        return res.status(500).json({ error: '接单失败' });
      }

      if (!task) {
        db.close();
        return res.status(404).json({ error: '任务不存在或已被接单' });
      }

      db.run('UPDATE tasks SET courier_id = ?, status = ? WHERE id = ?', [req.user.id, 'accepted', req.params.id], (err) => {
        if (err) {
          db.close();
          console.error('更新任务接单错误:', err);
          return res.status(500).json({ error: '接单失败' });
        }

        db.run(`
          INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note)
          VALUES (?, 'accepted', ?, 'courier', '接单人已接单')
        `, [req.params.id, req.user.id], (err) => {
          if (err) {
            db.close();
            console.error('创建状态历史错误:', err);
            return res.status(500).json({ error: '接单失败' });
          }

          db.run('INSERT INTO courier_audit_logs (courier_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)', [req.user.id, 'accept_task', `接单任务ID:${req.params.id}`, req.ip], (err) => {
            if (err) {
              db.close();
              console.error('创建审计日志错误:', err);
              return res.status(500).json({ error: '接单失败' });
            }

            db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, updatedTask) => {
              if (err) {
                db.close();
                console.error('查询更新后任务错误:', err);
                return res.status(500).json({ error: '接单失败' });
              }

              db.all('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY created_at ASC', [req.params.id], (err, history) => {
                db.close();
                if (err) {
                  console.error('查询状态历史错误:', err);
                  return res.status(500).json({ error: '接单失败' });
                }

                res.json({ success: true, task: updatedTask, history });
              });
            });
          });
        });
      });
    });
  });
});

router.post('/:id/track', authenticate, (req, res) => {
  const { latitude, longitude, speed, heading } = req.body;
  const db = getDb();

  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) {
      db.close();
      console.error('查询任务错误:', err);
      return res.status(500).json({ error: '记录GPS轨迹失败' });
    }

    if (!task) {
      db.close();
      return res.status(404).json({ error: '任务不存在' });
    }

    db.run(`
      INSERT INTO gps_tracking (task_id, courier_id, latitude, longitude, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.params.id, req.user.id, latitude, longitude, speed || null, heading || null], (err) => {
      db.close();
      if (err) {
        console.error('记录GPS轨迹错误:', err);
        return res.status(500).json({ error: '记录GPS轨迹失败' });
      }

      res.json({ success: true, message: 'GPS轨迹已记录' });
    });
  });
});

router.post('/:id/verify', authenticate, (req, res) => {
  const { feature_code, id_card } = req.body;
  const db = getDb();

  db.get('SELECT * FROM items WHERE task_id = ?', [req.params.id], (err, item) => {
    if (err) {
      db.close();
      console.error('查询物品错误:', err);
      return res.status(500).json({ error: '验证失败' });
    }

    if (!item) {
      db.close();
      return res.status(404).json({ error: '物品不存在' });
    }

    if (item.feature_code !== feature_code) {
      db.close();
      return res.status(400).json({ error: '物品特征码不匹配' });
    }

    db.run('UPDATE tasks SET status = ? WHERE id = ?', ['picked_up', req.params.id], (err) => {
      if (err) {
        db.close();
        console.error('更新任务状态错误:', err);
        return res.status(500).json({ error: '验证失败' });
      }

      db.run(`
        INSERT INTO task_status_history (task_id, status, operator_id, operator_type, note)
        VALUES (?, 'picked_up', ?, 'courier', '物品特征码验证通过')
      `, [req.params.id, req.user.id], (err) => {
        db.close();
        if (err) {
          console.error('创建状态历史错误:', err);
          return res.status(500).json({ error: '验证失败' });
        }

        res.json({ success: true, message: '物品验证通过' });
      });
    });
  });
});

module.exports = router;
