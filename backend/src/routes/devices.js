const express = require('express');
const Joi = require('joi');
const { allAsync, getAsync, runAsync, db } = require('../utils/db');

const router = express.Router();

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  return value;
};

const deviceSchema = Joi.object({
  device_id: Joi.string().required(),
  username: Joi.string().allow('', null),
  token: Joi.string().allow('', null),
  device_type: Joi.string().valid('ios', 'android', 'web').required(),
  os_version: Joi.string().allow('', null),
  app_version: Joi.string().allow('', null),
  is_logged_in: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1)),
  has_notification_permission: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1)),
  is_online: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1)),
  app_entry_enabled: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1)),
  version_supported: Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1)),
});

const calculatePushStatus = (device) => {
  const is_logged_in = toBoolean(device.is_logged_in);
  const has_notification_permission = toBoolean(device.has_notification_permission);
  const version_supported = toBoolean(device.version_supported);
  const app_entry_enabled = toBoolean(device.app_entry_enabled);
  const device_type = device.device_type;

  if (!is_logged_in) return 0;
  if (!has_notification_permission) return 0;
  if (!version_supported) return 0;
  if (device_type === 'android' && !app_entry_enabled) return 0;

  return 1;
};

const isInvalidSearchValue = (value) => {
  if (!value) return true;
  const strValue = String(value).trim().toLowerCase();
  return strValue === '' || strValue === 'undefined' || strValue === 'null' || strValue === 'none';
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, device_type, push_status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (!isInvalidSearchValue(keyword)) {
      whereClause += ' AND (username LIKE ? OR device_id LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (device_type && !isInvalidSearchValue(device_type)) {
      whereClause += ' AND device_type = ?';
      params.push(device_type);
    }

    if (push_status !== undefined && push_status !== '' && !isInvalidSearchValue(push_status)) {
      whereClause += ' AND push_status = ?';
      params.push(Number(push_status));
    }

    const devices = await allAsync(
      `SELECT * FROM devices ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const totalResult = await getAsync(
      `SELECT COUNT(*) as total FROM devices ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: devices,
        total: totalResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取设备列表失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const device = await getAsync('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '设备不存在'
      });
    }

    const tags = await allAsync(`
      SELECT t.* FROM tags t
      INNER JOIN device_tags dt ON t.tag_id = dt.tag_id
      WHERE dt.device_id = ?
    `, [device.device_id]);

    res.json({
      success: true,
      data: { ...device, tags },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取设备详情失败'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const push_status = calculatePushStatus(value);

    const result = await runAsync(`
      INSERT INTO devices (
        device_id, username, token, device_type, os_version, app_version,
        is_logged_in, has_notification_permission, is_online, app_entry_enabled,
        version_supported, push_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      value.device_id, value.username, value.token, value.device_type,
      value.os_version, value.app_version,
      toBoolean(value.is_logged_in ?? 0),
      toBoolean(value.has_notification_permission ?? 1),
      toBoolean(value.is_online ?? 0),
      toBoolean(value.app_entry_enabled ?? 1),
      toBoolean(value.version_supported ?? 1),
      push_status
    ]);

    res.json({
      success: true,
      data: { id: result.lastID },
      message: '创建设备成功'
    });
  } catch (error) {
    console.error('创建设备失败:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '设备ID已存在'
      });
    }
    res.status(500).json({
      success: false,
      data: null,
      message: '创建设备失败'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const existing = await getAsync('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '设备不存在'
      });
    }

    const push_status = calculatePushStatus(value);

    await runAsync(`
      UPDATE devices SET
        device_id = ?, username = ?, token = ?, device_type = ?,
        os_version = ?, app_version = ?, is_logged_in = ?,
        has_notification_permission = ?, is_online = ?,
        app_entry_enabled = ?, version_supported = ?, push_status = ?,
        update_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      value.device_id, value.username, value.token, value.device_type,
      value.os_version, value.app_version,
      toBoolean(value.is_logged_in ?? existing.is_logged_in),
      toBoolean(value.has_notification_permission ?? existing.has_notification_permission),
      toBoolean(value.is_online ?? existing.is_online),
      toBoolean(value.app_entry_enabled ?? existing.app_entry_enabled),
      toBoolean(value.version_supported ?? existing.version_supported),
      push_status,
      req.params.id
    ]);

    res.json({
      success: true,
      data: null,
      message: '更新设备成功'
    });
  } catch (error) {
    console.error('更新设备失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '更新设备失败'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '设备不存在'
      });
    }

    await runAsync('DELETE FROM devices WHERE id = ?', [req.params.id]);
    await runAsync('DELETE FROM device_tags WHERE device_id = ?', [existing.device_id]);

    res.json({
      success: true,
      data: null,
      message: '删除设备成功'
    });
  } catch (error) {
    console.error('删除设备失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '删除设备失败'
    });
  }
});

router.post('/:id/tags', async (req, res) => {
  try {
    const { tag_ids } = req.body;
    const device = await getAsync('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '设备不存在'
      });
    }

    await runAsync('DELETE FROM device_tags WHERE device_id = ?', [device.device_id]);

    if (tag_ids && tag_ids.length > 0) {
      const stmt = db.prepare('INSERT OR IGNORE INTO device_tags (device_id, tag_id) VALUES (?, ?)');
      for (const tag_id of tag_ids) {
        stmt.run(device.device_id, tag_id);
      }
      stmt.finalize();
    }

    res.json({
      success: true,
      data: null,
      message: '更新标签成功'
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '更新标签失败'
    });
  }
});

module.exports = router;
