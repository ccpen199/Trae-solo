import { Router } from 'express';
import { getDb } from '../db/index.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/profile', auth, (req, res) => {
  try {
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.rider.id);
    if (!rider) {
      return res.json({ code: 1, message: '用户不存在' });
    }
    const { password_hash, ...safe } = rider;
    res.json({ code: 0, data: safe, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/profile', auth, (req, res) => {
  try {
    const { name, avatar } = req.body;
    const db = getDb();
    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      return res.json({ code: 1, message: '没有可更新的字段' });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(req.rider.id);

    db.prepare(`UPDATE riders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.rider.id);
    const { password_hash, ...safe } = rider;
    res.json({ code: 0, data: safe, message: '更新成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/verify-realname', auth, (req, res) => {
  try {
    const { id_card_number, name } = req.body;
    if (!id_card_number || !name) {
      return res.json({ code: 1, message: '身份证号和姓名不能为空' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE riders SET id_card_number = ?, name = ?, real_name_verified = 1, updated_at = ? WHERE id = ?')
      .run(id_card_number, name, now, req.rider.id);
    res.json({ code: 0, data: null, message: '实名认证已提交' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/verify-id-card', auth, (req, res) => {
  try {
    const { id_card_front_url, id_card_back_url } = req.body;
    if (!id_card_front_url || !id_card_back_url) {
      return res.json({ code: 1, message: '请上传身份证正反面照片' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE riders SET id_card_front_url = ?, id_card_back_url = ?, updated_at = ? WHERE id = ?')
      .run(id_card_front_url, id_card_back_url, now, req.rider.id);
    res.json({ code: 0, data: null, message: '身份证照片已提交' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/bind-insurance', auth, (req, res) => {
  try {
    const { insurance_id } = req.body;
    if (!insurance_id) {
      return res.json({ code: 1, message: '保险ID不能为空' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE riders SET insurance_id = ?, updated_at = ? WHERE id = ?')
      .run(insurance_id, now, req.rider.id);
    res.json({ code: 0, data: null, message: '保险绑定成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/credit', auth, (req, res) => {
  try {
    const db = getDb();
    const rider = db.prepare('SELECT credit_score FROM riders WHERE id = ?').get(req.rider.id);
    res.json({ code: 0, data: { credit_score: rider.credit_score }, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/location', auth, (req, res) => {
  try {
    const { lat, lng, is_online } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.json({ code: 1, message: '经纬度不能为空' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    const online = is_online !== undefined ? (is_online ? 1 : 0) : 1;

    const existing = db.prepare('SELECT id FROM rider_locations WHERE rider_id = ?').get(req.rider.id);
    if (existing) {
      db.prepare('UPDATE rider_locations SET lat = ?, lng = ?, is_online = ?, last_heartbeat = ? WHERE rider_id = ?')
        .run(lat, lng, online, now, req.rider.id);
    } else {
      db.prepare('INSERT INTO rider_locations (rider_id, lat, lng, is_online, last_heartbeat, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.rider.id, lat, lng, online, now, now);
    }
    res.json({ code: 0, data: null, message: '位置更新成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/online', auth, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM rider_locations WHERE is_online = 1').get();
    res.json({ code: 0, data: { online_count: result.count }, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = '';
    const params = [];
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM riders ${whereClause}`).get(...params).cnt;
    const riders = db.prepare(`SELECT * FROM riders ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const safe = riders.map(({ password_hash, ...rest }) => rest);
    res.json({
      code: 0,
      data: { list: safe, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/status', auth, adminOnly, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended', 'disabled'].includes(status)) {
      return res.json({ code: 1, message: '无效的状态值' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE riders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    res.json({ code: 0, data: null, message: '状态更新成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

export default router;
