const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT r.*, pa.total_points, pa.available_points
    FROM residents r
    LEFT JOIN point_accounts pa ON r.id = pa.resident_id
    WHERE r.status = 1
  `;
  const params = [];

  if (keyword) {
    sql += ' AND (r.name LIKE ? OR r.phone LIKE ? OR r.id_card LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
  }

  sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const residents = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM residents WHERE status = 1';
  const countParams = [];
  if (keyword) {
    countSql += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    countParams.push(likeKeyword, likeKeyword, likeKeyword);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ data: residents, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const resident = db.prepare(`
    SELECT r.*, pa.total_points, pa.available_points, pa.frozen_points
    FROM residents r
    LEFT JOIN point_accounts pa ON r.id = pa.resident_id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!resident) {
    return res.status(404).json({ error: '居民不存在' });
  }

  res.json(resident);
});

router.post('/', (req, res) => {
  const { name, id_card, phone, building, unit, room_number, family_members, is_party_member, is_volunteer, privacy_authorized } = req.body;

  if (!name) {
    return res.status(400).json({ error: '姓名不能为空' });
  }

  const existing = id_card ? db.prepare('SELECT id FROM residents WHERE id_card = ? AND status = 1').get(id_card) : null;
  if (existing) {
    return res.status(400).json({ error: '该身份证号已存在' });
  }

  const insert = db.prepare(`
    INSERT INTO residents (name, id_card, phone, building, unit, room_number, family_members, is_party_member, is_volunteer, privacy_authorized)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    name, id_card || null, phone || null, building || null, unit || null, room_number || null,
    family_members ? JSON.stringify(family_members) : null,
    is_party_member ? 1 : 0,
    is_volunteer ? 1 : 0,
    privacy_authorized ? 1 : 0
  );

  const residentId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO point_accounts (resident_id, total_points, available_points, frozen_points)
    VALUES (?, 0, 0, 0)
  `).run(residentId);

  const resident = db.prepare(`
    SELECT r.*, pa.total_points, pa.available_points
    FROM residents r
    LEFT JOIN point_accounts pa ON r.id = pa.resident_id
    WHERE r.id = ?
  `).get(residentId);

  res.json(resident);
});

router.put('/:id', (req, res) => {
  const { name, id_card, phone, building, unit, room_number, family_members, is_party_member, is_volunteer, privacy_authorized } = req.body;

  const resident = db.prepare('SELECT id FROM residents WHERE id = ?').get(req.params.id);
  if (!resident) {
    return res.status(404).json({ error: '居民不存在' });
  }

  db.prepare(`
    UPDATE residents
    SET name = ?, id_card = ?, phone = ?, building = ?, unit = ?, room_number = ?,
        family_members = ?, is_party_member = ?, is_volunteer = ?, privacy_authorized = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, id_card || null, phone || null, building || null, unit || null, room_number || null,
    family_members ? JSON.stringify(family_members) : null,
    is_party_member ? 1 : 0,
    is_volunteer ? 1 : 0,
    privacy_authorized ? 1 : 0,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT r.*, pa.total_points, pa.available_points
    FROM residents r
    LEFT JOIN point_accounts pa ON r.id = pa.resident_id
    WHERE r.id = ?
  `).get(req.params.id);

  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE residents SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/merge', (req, res) => {
  const { targetId, sourceIds } = req.body;

  if (!targetId || !sourceIds || sourceIds.length === 0) {
    return res.status(400).json({ error: '参数错误' });
  }

  const target = db.prepare('SELECT id FROM residents WHERE id = ? AND status = 1').get(targetId);
  if (!target) {
    return res.status(404).json({ error: '目标居民不存在' });
  }

  const transaction = db.transaction(() => {
    sourceIds.forEach(sourceId => {
      if (parseInt(sourceId) === parseInt(targetId)) return;

      const sourceAccount = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(sourceId);
      if (sourceAccount) {
        db.prepare(`
          UPDATE point_accounts
          SET total_points = total_points + ?,
              available_points = available_points + ?,
              frozen_points = frozen_points + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE resident_id = ?
        `).run(sourceAccount.total_points, sourceAccount.available_points, sourceAccount.frozen_points, targetId);

        db.prepare(`
          UPDATE point_transactions
          SET resident_id = ?, account_id = (SELECT id FROM point_accounts WHERE resident_id = ?)
          WHERE resident_id = ?
        `).run(targetId, targetId, sourceId);
      }

      db.prepare('UPDATE activity_signups SET resident_id = ? WHERE resident_id = ?').run(targetId, sourceId);
      db.prepare('UPDATE exchanges SET resident_id = ? WHERE resident_id = ?').run(targetId, sourceId);
      db.prepare('UPDATE appeals SET resident_id = ? WHERE resident_id = ?').run(targetId, sourceId);

      db.prepare('UPDATE residents SET status = 0, merged_from = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetId, sourceId);
    });
  });

  transaction();

  res.json({ success: true });
});

router.get('/:id/transactions', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const transactions = db.prepare(`
    SELECT * FROM point_transactions
    WHERE resident_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(pageSize), offset);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM point_transactions WHERE resident_id = ?').get(req.params.id);

  res.json({ data: transactions, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

module.exports = router;
