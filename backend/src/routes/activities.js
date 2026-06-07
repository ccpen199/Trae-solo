import express from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/red-packets', (req, res) => {
  const redPackets = db.prepare(`
    SELECT rp.*, u.username as sponsor_name
    FROM red_packets rp
    LEFT JOIN users u ON rp.sponsor_id = u.id
    WHERE rp.status = 'active' AND rp.remaining_count > 0
    ORDER BY rp.created_at DESC
    LIMIT 20
  `).all();
  res.json(redPackets);
});

router.post('/red-packets', authMiddleware, (req, res) => {
  const { totalAmount, count, minAmount, maxAmount } = req.body;

  if (!totalAmount || !count || totalAmount < count * 0.01) {
    return res.status(400).json({ error: '红包参数无效' });
  }

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < totalAmount) {
    return res.status(400).json({ error: '余额不足' });
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalAmount, req.user.id);

    const result = db.prepare(`
      INSERT INTO red_packets (sponsor_id, total_amount, count, remaining_amount, remaining_count, min_amount, max_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(req.user.id, totalAmount, count, totalAmount, count, minAmount || 0.01, maxAmount || totalAmount);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, related_id, related_type, description)
      VALUES (?, 'red_packet', -?, ?, ?, ?, 'red_packet', '发红包')
    `).run(req.user.id, totalAmount, user.balance, user.balance - totalAmount, result.lastInsertRowid);
  })();

  res.json({ success: true });
});

router.post('/red-packets/:id/grab', authMiddleware, (req, res) => {
  const redPacketId = req.params.id;

  const redPacket = db.prepare('SELECT * FROM red_packets WHERE id = ?').get(redPacketId);
  if (!redPacket || redPacket.status !== 'active' || redPacket.remaining_count <= 0) {
    return res.status(400).json({ error: '红包已领完' });
  }

  const existing = db.prepare('SELECT id FROM red_packet_records WHERE red_packet_id = ? AND user_id = ?').get(redPacketId, req.user.id);
  if (existing) {
    return res.status(400).json({ error: '已领取过该红包' });
  }

  let amount;
  if (redPacket.remaining_count === 1) {
    amount = redPacket.remaining_amount;
  } else {
    const max = Math.min(redPacket.remaining_amount / redPacket.remaining_count * 2, redPacket.remaining_amount - (redPacket.remaining_count - 1) * 0.01);
    amount = Math.max(0.01, Math.random() * max);
  }
  amount = Math.round(amount * 100) / 100;

  db.transaction(() => {
    db.prepare(`
      INSERT INTO red_packet_records (red_packet_id, user_id, amount)
      VALUES (?, ?, ?)
    `).run(redPacketId, req.user.id, amount);

    db.prepare(`
      UPDATE red_packets 
      SET remaining_amount = remaining_amount - ?, remaining_count = remaining_count - 1
      WHERE id = ?
    `).run(amount, redPacketId);

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, related_id, related_type, description)
      VALUES (?, 'red_packet_reward', ?, ?, ?, ?, 'red_packet', '抢红包')
    `).run(req.user.id, amount, user.balance, user.balance + amount, redPacketId);
  })();

  res.json({ success: true, amount });
});

router.get('/ranking/tasks', (req, res) => {
  const ranking = db.prepare(`
    SELECT u.id, u.username, COUNT(ta.id) as completed_count, SUM(t.reward) as total_earning
    FROM task_accepts ta
    LEFT JOIN users u ON ta.worker_id = u.id
    LEFT JOIN tasks t ON ta.task_id = t.id
    WHERE ta.status = 'completed'
    GROUP BY ta.worker_id
    ORDER BY completed_count DESC
    LIMIT 20
  `).all();
  res.json(ranking);
});

router.get('/ranking/earning', (req, res) => {
  const ranking = db.prepare(`
    SELECT u.id, u.username, COUNT(ta.id) as completed_count, SUM(t.reward) as total_earning
    FROM task_accepts ta
    LEFT JOIN users u ON ta.worker_id = u.id
    LEFT JOIN tasks t ON ta.task_id = t.id
    WHERE ta.status = 'completed'
    GROUP BY ta.worker_id
    ORDER BY total_earning DESC
    LIMIT 20
  `).all();
  res.json(ranking);
});

export default router;
