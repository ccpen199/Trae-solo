import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || '';
    const model = req.query.model || '';
    const userId = req.query.userId || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND o.activation_status = ?';
      params.push(status);
    }
    if (model) {
      where += ' AND o.model = ?';
      params.push(model);
    }
    if (userId) {
      where += ' AND o.user_id = ?';
      params.push(userId);
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM obu_devices o ${where}`).get(...params).count;
    const list = db.prepare(`
      SELECT o.*,
        u.real_name AS user_name, u.username AS user_username,
        COALESCE(o.last_upgrade_status, 'none') AS upgrade_status,
        COALESCE(o.last_upgrade_result, '') AS upgrade_result,
        COALESCE(o.apply_review_status, 'approved') AS apply_status,
        CASE
          WHEN o.activation_status = 'inactive' AND o.apply_review_status = 'pending' THEN '待审核'
          WHEN o.activation_status = 'inactive' AND o.apply_review_status = 'rejected' THEN '已拒绝'
          WHEN o.activation_status = 'inactive' THEN '待激活'
          WHEN o.activation_status = 'active' THEN '已激活'
          WHEN o.activation_status = 'suspended' THEN '已停用'
          WHEN o.activation_status = 'deactivated' THEN '已注销'
          ELSE o.activation_status
        END AS lifecycle_status
      FROM obu_devices o
      LEFT JOIN users u ON o.user_id = u.id
      ${where}
      ORDER BY o.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { device_sn, model, firmware_version, batch_no } = req.body;

    if (!device_sn || !model) {
      return res.status(400).json({ error: '设备序列号和型号不能为空' });
    }

    const existing = db.prepare('SELECT id FROM obu_devices WHERE device_sn = ?').get(device_sn);
    if (existing) {
      return res.status(409).json({ error: '设备序列号已存在' });
    }

    const result = db.prepare(`
      INSERT INTO obu_devices (device_sn, model, firmware_version, batch_no)
      VALUES (?, ?, ?, ?)
    `).run(device_sn, model, firmware_version || null, batch_no || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_obu', 'obu_device', result.lastInsertRowid, JSON.stringify({ device_sn, model }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '设备创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    const { model, firmware_version, activation_status, user_id, batch_no } = req.body;
    db.prepare(`
      UPDATE obu_devices SET model = ?, firmware_version = ?, activation_status = ?, user_id = ?, batch_no = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      model !== undefined ? model : device.model,
      firmware_version !== undefined ? firmware_version : device.firmware_version,
      activation_status !== undefined ? activation_status : device.activation_status,
      user_id !== undefined ? user_id : device.user_id,
      batch_no !== undefined ? batch_no : device.batch_no,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_obu', 'obu_device', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '设备更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch-activate', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { device_ids } = req.body;

    if (!Array.isArray(device_ids) || device_ids.length === 0) {
      return res.status(400).json({ error: '请提供设备ID列表' });
    }

    const placeholders = device_ids.map(() => '?').join(',');
    const devices = db.prepare(`SELECT id, device_sn, activation_status FROM obu_devices WHERE id IN (${placeholders})`).all(...device_ids);

    const ineligible = devices.filter(d => d.activation_status !== 'inactive');
    const eligibleIds = devices.filter(d => d.activation_status === 'inactive').map(d => d.id);

    const updateStmt = db.prepare(`
      UPDATE obu_devices SET activation_status = 'active', activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, batch_activate_progress = '100%'
      WHERE id = ? AND activation_status = 'inactive'
    `);

    let activated = 0;
    const transaction = db.transaction(() => {
      for (const id of eligibleIds) {
        const result = updateStmt.run(id);
        activated += result.changes;
      }
    });
    transaction();

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'batch_activate_obu', 'obu_device', 0,
        JSON.stringify({ device_ids, activated, ineligible, total: device_ids.length, progress: '100%' }), req.ip);

    res.json({
      message: `批量激活完成：成功 ${activated} 台，跳过 ${ineligible.length} 台（状态不符）`,
      activated,
      ineligible_count: ineligible.length,
      total: device_ids.length,
      progress: '100%',
      ineligible_devices: ineligible
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/upgrade', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { firmware_version } = req.body;

    if (!firmware_version) {
      return res.status(400).json({ error: '固件版本不能为空' });
    }

    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.activation_status !== 'active') {
      return res.status(400).json({ error: '设备未激活，无法升级' });
    }

    if (device.firmware_version === firmware_version) {
      return res.status(400).json({ error: '设备已是当前版本，无需升级' });
    }

    const success = Math.random() > 0.1;
    const upgradeStatus = success ? 'success' : 'failed';
    const upgradeResult = success
      ? `固件升级成功：${device.firmware_version} → ${firmware_version}`
      : `固件升级失败：设备响应超时，请稍后重试`;

    db.prepare(`
      UPDATE obu_devices SET
        firmware_version = ?,
        last_upgrade_status = ?,
        last_upgrade_result = ?,
        last_upgrade_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      success ? firmware_version : device.firmware_version,
      upgradeStatus,
      upgradeResult,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'upgrade_obu', 'obu_device', parseInt(req.params.id),
        JSON.stringify({
          old_version: device.firmware_version,
          new_version: firmware_version,
          status: upgradeStatus,
          result: upgradeResult
        }), req.ip);

    res.json({
      message: upgradeResult,
      status: upgradeStatus,
      old_version: device.firmware_version,
      new_version: success ? firmware_version : device.firmware_version
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/apply', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { device_sn, model, owner_name, owner_phone, vehicle_plate, reason } = req.body;

    if (!device_sn || !model) {
      return res.status(400).json({ error: '设备序列号和型号不能为空' });
    }

    const existing = db.prepare('SELECT id, activation_status, apply_review_status FROM obu_devices WHERE device_sn = ?').get(device_sn);
    if (!existing) {
      return res.status(404).json({ error: '设备不存在，请检查序列号' });
    }

    if (existing.apply_review_status === 'pending') {
      return res.status(400).json({ error: '该设备已有审核中的申领，请耐心等待' });
    }

    if (existing.activation_status !== 'inactive') {
      return res.status(400).json({ error: '设备不可申请，当前状态: ' + existing.activation_status });
    }

    db.prepare(`
      UPDATE obu_devices SET
        user_id = ?,
        apply_review_status = 'pending',
        apply_reason = ?,
        apply_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, reason || '用户自助申领', existing.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'apply_obu', 'obu_device', existing.id,
        JSON.stringify({ device_sn, model, owner_name, owner_phone, vehicle_plate, reason, status: 'pending' }), req.ip);

    res.json({
      message: 'OBU申领已提交，运营审核通过后将自动激活',
      status: 'pending',
      device_id: existing.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/review-apply', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status, reject_reason } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '审核状态无效' });
    }

    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.apply_review_status !== 'pending') {
      return res.status(400).json({ error: '设备未处于待审核状态' });
    }

    if (status === 'approved') {
      db.prepare(`
        UPDATE obu_devices SET
          activation_status = 'active',
          apply_review_status = 'approved',
          activated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.params.id);
    } else {
      db.prepare(`
        UPDATE obu_devices SET
          apply_review_status = 'rejected',
          reject_reason = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reject_reason || '未通过审核', req.params.id);
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'review_obu_apply', 'obu_device', parseInt(req.params.id),
        JSON.stringify({ device_sn: device.device_sn, status, reject_reason }), req.ip);

    res.json({
      message: status === 'approved' ? '审核通过，设备已激活' : '审核已驳回',
      status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
