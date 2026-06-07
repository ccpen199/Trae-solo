import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/data-quality', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND metric_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND metric_date <= ?';
      params.push(endDate);
    }

    const list = db.prepare(`SELECT * FROM data_quality_metrics ${where} ORDER BY metric_date DESC`).all(...params);
    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/data-quality', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { metric_date, missing_rate, latency_rate, alert_count, details } = req.body;

    if (!metric_date) {
      return res.status(400).json({ error: '指标日期不能为空' });
    }

    const existing = db.prepare('SELECT id FROM data_quality_metrics WHERE metric_date = ?').get(metric_date);
    if (existing) {
      db.prepare(`
        UPDATE data_quality_metrics SET missing_rate = ?, latency_rate = ?, alert_count = ?, details = ?
        WHERE metric_date = ?
      `).run(missing_rate || 0, latency_rate || 0, alert_count || 0, details || null, metric_date);

      db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, 'update_data_quality', 'data_quality_metric', existing.id, JSON.stringify({ metric_date }), req.ip);

      res.json({ message: '数据质量指标更新成功' });
    } else {
      const result = db.prepare(`
        INSERT INTO data_quality_metrics (metric_date, missing_rate, latency_rate, alert_count, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(metric_date, missing_rate || 0, latency_rate || 0, alert_count || 0, details || null);

      db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, 'create_data_quality', 'data_quality_metric', result.lastInsertRowid, JSON.stringify({ metric_date }), req.ip);

      res.status(201).json({ id: result.lastInsertRowid, message: '数据质量指标创建成功' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/blacklist', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const list = db.prepare('SELECT * FROM blacklist_vehicles ORDER BY id DESC').all();
    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blacklist', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { vehicle_plate, reason } = req.body;

    if (!vehicle_plate) {
      return res.status(400).json({ error: '车牌号不能为空' });
    }

    const existing = db.prepare('SELECT id FROM blacklist_vehicles WHERE vehicle_plate = ?').get(vehicle_plate);
    if (existing) {
      return res.status(409).json({ error: '该车辆已在黑名单中' });
    }

    const result = db.prepare('INSERT INTO blacklist_vehicles (vehicle_plate, reason) VALUES (?, ?)').run(vehicle_plate, reason || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'add_blacklist', 'blacklist_vehicle', result.lastInsertRowid, JSON.stringify({ vehicle_plate, reason }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '黑名单添加成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/blacklist/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const vehicle = db.prepare('SELECT * FROM blacklist_vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: '黑名单记录不存在' });
    }

    db.prepare('DELETE FROM blacklist_vehicles WHERE id = ?').run(req.params.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'remove_blacklist', 'blacklist_vehicle', parseInt(req.params.id), JSON.stringify({ vehicle_plate: vehicle.vehicle_plate }), req.ip);

    res.json({ message: '黑名单移除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/blacklist-configs', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const list = db.prepare('SELECT * FROM blacklist_configs ORDER BY id DESC').all();
    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blacklist-configs', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { name, strategy_type, conditions, is_active } = req.body;

    if (!name || !strategy_type) {
      return res.status(400).json({ error: '配置名称和策略类型不能为空' });
    }

    const result = db.prepare(`
      INSERT INTO blacklist_configs (name, strategy_type, conditions, is_active)
      VALUES (?, ?, ?, ?)
    `).run(name, strategy_type, conditions || null, is_active !== undefined ? is_active : 1);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_blacklist_config', 'blacklist_config', result.lastInsertRowid, JSON.stringify({ name, strategy_type }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '黑名单配置创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/blacklist-configs/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const config = db.prepare('SELECT * FROM blacklist_configs WHERE id = ?').get(req.params.id);
    if (!config) {
      return res.status(404).json({ error: '黑名单配置不存在' });
    }

    const { name, strategy_type, conditions, is_active } = req.body;
    db.prepare(`
      UPDATE blacklist_configs SET name = ?, strategy_type = ?, conditions = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name !== undefined ? name : config.name,
      strategy_type !== undefined ? strategy_type : config.strategy_type,
      conditions !== undefined ? conditions : config.conditions,
      is_active !== undefined ? is_active : config.is_active,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_blacklist_config', 'blacklist_config', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '黑名单配置更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settlements', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM settlements ${where}`).get(...params).count;
    const list = db.prepare(`SELECT * FROM settlements ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settlements', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { period_start, period_end, highway_group_amount, bank_amount, difference } = req.body;

    if (!period_start || !period_end) {
      return res.status(400).json({ error: '结算周期起止日期不能为空' });
    }

    const result = db.prepare(`
      INSERT INTO settlements (period_start, period_end, highway_group_amount, bank_amount, difference)
      VALUES (?, ?, ?, ?, ?)
    `).run(period_start, period_end, highway_group_amount || 0, bank_amount || 0, difference || 0);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_settlement', 'settlement', result.lastInsertRowid, JSON.stringify({ period_start, period_end }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '结算记录创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settlements/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    if (!settlement) {
      return res.status(404).json({ error: '结算记录不存在' });
    }

    const { status } = req.body;
    if (!['confirmed', 'disputed'].includes(status)) {
      return res.status(400).json({ error: '状态只能为 confirmed 或 disputed' });
    }

    db.prepare('UPDATE settlements SET status = ? WHERE id = ?').run(status, req.params.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_settlement', 'settlement', parseInt(req.params.id), JSON.stringify({ status }), req.ip);

    res.json({ message: status === 'confirmed' ? '结算已确认' : '结算已争议' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/value-added', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const list = db.prepare('SELECT * FROM value_added_services ORDER BY id DESC').all();
    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/value-added', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { service_name, service_type, api_endpoint, status, config } = req.body;

    if (!service_name || !service_type) {
      return res.status(400).json({ error: '服务名称和类型不能为空' });
    }

    const result = db.prepare(`
      INSERT INTO value_added_services (service_name, service_type, api_endpoint, status, config)
      VALUES (?, ?, ?, ?, ?)
    `).run(service_name, service_type, api_endpoint || null, status || 'active', config || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'register_service', 'value_added_service', result.lastInsertRowid, JSON.stringify({ service_name, service_type }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '增值服务注册成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/value-added/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const service = db.prepare('SELECT * FROM value_added_services WHERE id = ?').get(req.params.id);
    if (!service) {
      return res.status(404).json({ error: '增值服务不存在' });
    }

    const { service_name, service_type, api_endpoint, status, config } = req.body;
    db.prepare(`
      UPDATE value_added_services SET service_name = ?, service_type = ?, api_endpoint = ?, status = ?, config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      service_name !== undefined ? service_name : service.service_name,
      service_type !== undefined ? service_type : service.service_type,
      api_endpoint !== undefined ? api_endpoint : service.api_endpoint,
      status !== undefined ? status : service.status,
      config !== undefined ? config : service.config,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_service', 'value_added_service', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '增值服务更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
