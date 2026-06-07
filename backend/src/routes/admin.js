import { Router } from 'express';
import { getDb } from '../db/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', auth, adminOnly, (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const totalRiders = db.prepare('SELECT COUNT(*) as cnt FROM riders WHERE role != ?').get('admin').cnt;
    const onlineRiders = db.prepare('SELECT COUNT(*) as cnt FROM rider_locations WHERE is_online = 1').get().cnt;
    const totalOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
    const todayOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE created_at >= ?').get(todayStart).cnt;
    const completedOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'completed'").get().cnt;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 10000) / 100 : 0;

    const avgResponse = db.prepare(`
      SELECT AVG(CAST((julianday(dl.created_at) - julianday(o.created_at)) * 24 * 60 AS REAL)) as avg_min
      FROM dispatch_logs dl
      JOIN orders o ON dl.order_id = o.id
      WHERE dl.status = 'dispatched' OR dl.status = 'accepted'
    `).get();
    const avgResponseTime = avgResponse.avg_min ? Math.round(avgResponse.avg_min * 10) / 10 : 0;

    res.json({
      code: 0,
      data: {
        total_riders: totalRiders,
        online_riders: onlineRiders,
        total_orders: totalOrders,
        today_orders: todayOrders,
        completion_rate: completionRate,
        avg_response_time: avgResponseTime,
      },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/risk-audits', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const total = db.prepare('SELECT COUNT(*) as cnt FROM risk_audits').get().cnt;
    const audits = db.prepare(`
      SELECT ra.*, r.name as rider_name FROM risk_audits ra
      LEFT JOIN riders r ON ra.rider_id = r.id
      ORDER BY ra.id DESC LIMIT ? OFFSET ?
    `).all(parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: audits, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/risk-audits', auth, adminOnly, (req, res) => {
  try {
    const { rider_id, order_id, audit_type, description, risk_level } = req.body;
    if (!rider_id || !audit_type) {
      return res.json({ code: 1, message: '缺少必要字段' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO risk_audits (rider_id, order_id, audit_type, description, reviewer_id, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(rider_id, order_id || null, audit_type, description || '', req.rider.id, risk_level || 'medium', now);

    res.json({ code: 0, data: null, message: '风控审计创建成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/risk-audits/:id', auth, adminOnly, (req, res) => {
  try {
    const { status, risk_level } = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    const updates = [];
    const values = [];

    if (status) { updates.push('status = ?'); values.push(status); }
    if (risk_level) { updates.push('risk_level = ?'); values.push(risk_level); }

    if (updates.length === 0) {
      return res.json({ code: 1, message: '没有可更新的字段' });
    }

    updates.push('resolved_at = ?');
    values.push(now);
    values.push(req.params.id);

    db.prepare(`UPDATE risk_audits SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ code: 0, data: null, message: '风控审计已处理' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/capacity', auth, adminOnly, (req, res) => {
  try {
    const db = getDb();
    const grids = db.prepare('SELECT * FROM area_grids ORDER BY id').all();

    const capacityData = grids.map((grid) => {
      const onlineCount = db.prepare(
        'SELECT COUNT(*) as cnt FROM rider_locations WHERE is_online = 1 AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?'
      ).get(
        grid.center_lat - grid.radius / 111,
        grid.center_lat + grid.radius / 111,
        grid.center_lng - grid.radius / 111,
        grid.center_lng + grid.radius / 111
      ).cnt;

      const pendingCount = db.prepare(
        "SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending' AND pickup_lat BETWEEN ? AND ? AND pickup_lng BETWEEN ? AND ?"
      ).get(
        grid.center_lat - grid.radius / 111,
        grid.center_lat + grid.radius / 111,
        grid.center_lng - grid.radius / 111,
        grid.center_lng + grid.radius / 111
      ).cnt;

      return {
        grid_id: grid.id,
        grid_code: grid.grid_code,
        grid_name: grid.grid_name,
        online_riders: onlineCount,
        pending_orders: pendingCount,
        demand_level: grid.demand_level,
        supply_level: grid.supply_level,
      };
    });

    res.json({ code: 0, data: capacityData, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/labor-contracts', auth, adminOnly, (req, res) => {
  try {
    const db = getDb();
    const contracts = db.prepare(`
      SELECT lc.*, r.name as rider_name FROM labor_contracts lc
      LEFT JOIN riders r ON lc.rider_id = r.id
      ORDER BY lc.id DESC
    `).all();
    res.json({ code: 0, data: contracts, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/labor-contracts', auth, adminOnly, (req, res) => {
  try {
    const { rider_id, content, template_version } = req.body;
    if (!rider_id) {
      return res.json({ code: 1, message: '骑手ID不能为空' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const contract_no = 'LC' + Date.now();

    db.prepare('INSERT INTO labor_contracts (rider_id, contract_no, content, template_version, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(rider_id, contract_no, content || '', template_version || '1.0', now);

    res.json({ code: 0, data: { contract_no }, message: '合同创建成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/labor-contracts/:id/sign', auth, adminOnly, (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE labor_contracts SET status = ?, signed_at = ? WHERE id = ?')
      .run('signed', now, req.params.id);
    res.json({ code: 0, data: null, message: '合同签署成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/system-configs', auth, adminOnly, (req, res) => {
  try {
    const db = getDb();
    const configs = db.prepare('SELECT * FROM system_configs ORDER BY id').all();
    res.json({ code: 0, data: configs, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/system-configs/:key', auth, adminOnly, (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.json({ code: 1, message: '配置值不能为空' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare('UPDATE system_configs SET value = ?, updated_at = ? WHERE key = ?')
      .run(String(value), now, req.params.key);

    if (result.changes === 0) {
      return res.json({ code: 1, message: '配置项不存在' });
    }

    res.json({ code: 0, data: null, message: '配置更新成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

export default router;
