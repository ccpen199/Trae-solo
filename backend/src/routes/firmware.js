const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();
    const firmware = db.prepare(
      'SELECT * FROM firmware ORDER BY created_at DESC'
    ).all();

    res.json({ firmware });
  } catch (err) {
    res.status(500).json({ error: '获取固件列表失败' });
  }
});

router.post('/', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const { device_type, version, file_url, file_size, changelog, status } = req.body;
    if (!device_type || !version) {
      return res.status(400).json({ error: '设备类型和版本号必填' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO firmware (id, device_type, version, file_url, file_size, changelog, 
       status, is_gray, gray_percentage, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`
    ).run(id, device_type, version, file_url || null, file_size || 0, changelog || null,
         status || 'testing', now);

    res.status(201).json({
      firmware_id: id,
      message: '固件上传成功'
    });
  } catch (err) {
    res.status(500).json({ error: '上传失败' });
  }
});

router.put('/:id/gray', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const { percentage } = req.body;
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: '灰度百分比必须在0-100之间' });
    }

    const db = getDb();
    const result = db.prepare(
      'UPDATE firmware SET is_gray = 1, gray_percentage = ?, status = ? WHERE id = ?'
    ).run(percentage, 'gray', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '固件不存在' });
    }

    res.json({ message: `灰度发布已启动，覆盖${percentage}%用户` });
  } catch (err) {
    res.status(500).json({ error: '设置失败' });
  }
});

router.put('/:id/publish', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(
      "UPDATE firmware SET is_gray = 0, gray_percentage = 0, status = 'published' WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '固件不存在' });
    }

    res.json({ message: '固件已全量发布' });
  } catch (err) {
    res.status(500).json({ error: '发布失败' });
  }
});

router.put('/:id/withdraw', auth, roleAuth(ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(
      "UPDATE firmware SET status = 'withdrawn' WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '固件不存在' });
    }

    res.json({ message: '固件已撤回' });
  } catch (err) {
    res.status(500).json({ error: '撤回失败' });
  }
});

router.get('/updates', auth, (req, res) => {
  try {
    const db = getDb();
    const { device_type, current_version } = req.query;

    if (!device_type) {
      return res.status(400).json({ error: '设备类型必填' });
    }

    let firmware = db.prepare(
      "SELECT * FROM firmware WHERE device_type = ? AND status = 'published' ORDER BY created_at DESC LIMIT 1"
    ).get(device_type);

    if (!firmware) {
      return res.json({ has_update: false, message: '暂无可用更新' });
    }

    const hasUpdate = !current_version || current_version !== firmware.version;

    const isInGray = firmware.is_gray && Math.random() * 100 < firmware.gray_percentage;
    const canUpdate = hasUpdate && (firmware.status === 'published' || isInGray);

    res.json({
      has_update: canUpdate,
      is_gray_release: isInGray && firmware.status === 'gray',
      firmware: canUpdate ? {
        id: firmware.id,
        version: firmware.version,
        file_size: firmware.file_size,
        changelog: firmware.changelog,
        file_url: firmware.file_url
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: '检查更新失败' });
  }
});

module.exports = router;
