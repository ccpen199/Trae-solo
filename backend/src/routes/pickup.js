const express = require('express');
const crypto = require('crypto');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { calculateBlockHash } = require('../utils/hash');

const router = express.Router();

function generatePickupCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/generate-code', authenticateToken, (req, res) => {
  try {
    const { parcel_id, locker_id, ttl_minutes = 30 } = req.body;

    if (!parcel_id) {
      return res.status(400).json({ error: '包裹ID不能为空' });
    }

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ? AND user_id = ?').get(parcel_id, req.user.id);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    db.prepare('UPDATE pickup_codes SET status = ? WHERE parcel_id = ? AND status = ?').run('expired', parcel_id, 'active');

    const code = generatePickupCode();
    const expiresAt = new Date(Date.now() + ttl_minutes * 60 * 1000).toISOString();

    const result = db.prepare(`
      INSERT INTO pickup_codes (parcel_id, code, locker_id, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(parcel_id, code, locker_id, expiresAt, 'active');

    const pickupCode = db.prepare('SELECT * FROM pickup_codes WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '取件码生成成功',
      data: pickupCode
    });
  } catch (err) {
    console.error('生成取件码错误:', err);
    res.status(500).json({ error: '生成取件码失败' });
  }
});

router.post('/verify', (req, res) => {
  try {
    const { code, tracking_number, biometric_data } = req.body;

    if (!code || !tracking_number) {
      return res.status(400).json({ error: '取件码和运单号不能为空' });
    }

    const parcel = db.prepare('SELECT * FROM parcels WHERE tracking_number = ?').get(tracking_number);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    const pickupCode = db.prepare(`
      SELECT * FROM pickup_codes 
      WHERE parcel_id = ? AND code = ? AND status = ?
    `).get(parcel.id, code, 'active');

    if (!pickupCode) {
      return res.status(400).json({ error: '取件码无效或已过期' });
    }

    if (new Date(pickupCode.expires_at) < new Date()) {
      db.prepare('UPDATE pickup_codes SET status = ? WHERE id = ?').run('expired', pickupCode.id);
      return res.status(400).json({ error: '取件码已过期' });
    }

    if (pickupCode.authorized_biometrics) {
      const authorized = JSON.parse(pickupCode.authorized_biometrics);
      if (biometric_data) {
        const isAuthorized = authorized.some(b => 
          b.fingerprint_hash === biometric_data.fingerprint_hash ||
          b.face_hash === biometric_data.face_hash
        );
        if (!isAuthorized) {
          return res.status(403).json({ error: '生物特征验证失败' });
        }
      } else {
        return res.status(400).json({ error: '需要生物特征验证' });
      }
    }

    db.prepare('UPDATE pickup_codes SET status = ? WHERE id = ?').run('used', pickupCode.id);
    db.prepare('UPDATE parcels SET status = ?, updated_at = ? WHERE id = ?').run('delivered', new Date().toISOString(), parcel.id);

    const lastEvent = db.prepare('SELECT hash FROM parcel_events WHERE parcel_id = ? ORDER BY id DESC LIMIT 1').get(parcel.id);
    const previousHash = lastEvent ? lastEvent.hash : null;
    const timestamp = new Date().toISOString();
    const hash = calculateBlockHash(parcel.id, '已签收', '智能柜', timestamp, previousHash);
    db.prepare(`
      INSERT INTO parcel_events (parcel_id, event_type, location, description, operator, timestamp, hash, previous_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(parcel.id, '已签收', '智能柜', '取件码验证通过，包裹已签收', '系统', timestamp, hash, previousHash);

    res.json({
      success: true,
      message: '取件验证成功',
      data: {
        parcel,
        pickup_time: timestamp
      }
    });
  } catch (err) {
    console.error('验证取件码错误:', err);
    res.status(500).json({ error: '验证取件码失败' });
  }
});

router.post('/authorize', authenticateToken, (req, res) => {
  try {
    const { parcel_id, authorized_persons } = req.body;

    if (!parcel_id || !authorized_persons || !Array.isArray(authorized_persons)) {
      return res.status(400).json({ error: '参数错误' });
    }

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ? AND user_id = ?').get(parcel_id, req.user.id);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    const pickupCode = db.prepare('SELECT * FROM pickup_codes WHERE parcel_id = ? AND status = ?').get(parcel_id, 'active');
    if (!pickupCode) {
      return res.status(400).json({ error: '没有有效的取件码，请先生成' });
    }

    const biometrics = authorized_persons.map(person => ({
      name: person.name,
      phone: person.phone,
      fingerprint_hash: person.fingerprint_hash || crypto.randomBytes(32).toString('hex'),
      face_hash: person.face_hash || crypto.randomBytes(32).toString('hex'),
      authorized_at: new Date().toISOString()
    }));

    db.prepare('UPDATE pickup_codes SET authorized_biometrics = ? WHERE id = ?').run(
      JSON.stringify(biometrics),
      pickupCode.id
    );

    const updatedCode = db.prepare('SELECT * FROM pickup_codes WHERE id = ?').get(pickupCode.id);

    res.json({
      success: true,
      message: '代取人授权成功',
      data: {
        ...updatedCode,
        authorized_biometrics: JSON.parse(updatedCode.authorized_biometrics)
      }
    });
  } catch (err) {
    console.error('授权错误:', err);
    res.status(500).json({ error: '授权失败' });
  }
});

router.post('/transfer-station', authenticateToken, (req, res) => {
  try {
    const { parcel_id, station_id, reason } = req.body;

    if (!parcel_id || !station_id) {
      return res.status(400).json({ error: '包裹ID和驿站ID不能为空' });
    }

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ? AND user_id = ?').get(parcel_id, req.user.id);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    const station = db.prepare('SELECT * FROM stations WHERE id = ? AND status = ?').get(station_id, 'active');
    if (!station) {
      return res.status(404).json({ error: '驿站不存在或未营业' });
    }

    db.prepare('UPDATE pickup_codes SET status = ? WHERE parcel_id = ? AND status = ?').run('transferred', parcel_id, 'active');

    const newCode = generatePickupCode();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO pickup_codes (parcel_id, code, locker_id, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(parcel_id, newCode, `STATION-${station_id}`, expiresAt, 'active');

    const lastEvent = db.prepare('SELECT hash FROM parcel_events WHERE parcel_id = ? ORDER BY id DESC LIMIT 1').get(parcel.id);
    const previousHash = lastEvent ? lastEvent.hash : null;
    const timestamp = new Date().toISOString();
    const hash = calculateBlockHash(parcel.id, '转驿站', station.name, timestamp, previousHash);
    db.prepare(`
      INSERT INTO parcel_events (parcel_id, event_type, location, description, operator, timestamp, hash, previous_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(parcel.id, '转驿站', station.name, reason || '超时未取，已转至就近驿站', '系统', timestamp, hash, previousHash);

    db.prepare('UPDATE anomalies SET status = ? WHERE parcel_id = ? AND type = ?').run('resolved', parcel_id, 'timeout');

    const newPickupCode = db.prepare('SELECT * FROM pickup_codes WHERE parcel_id = ? AND status = ?').get(parcel_id, 'active');

    res.json({
      success: true,
      message: '包裹已转至驿站',
      data: {
        station,
        pickup_code: newPickupCode,
        new_tracking: {
          tracking_number: parcel.tracking_number,
          new_location: station.name,
          new_address: station.address,
          contact: station.contact
        }
      }
    });
  } catch (err) {
    console.error('转驿站错误:', err);
    res.status(500).json({ error: '转驿站失败' });
  }
});

module.exports = router;
