import express from 'express';
import db from '../database.js';
import crypto from 'crypto';

const router = express.Router();

function generateCardNo() {
  return 'SC' + Date.now() + Math.floor(Math.random() * 10000);
}

function generateQRCode() {
  return crypto.randomBytes(16).toString('hex');
}

router.post('/apply', (req, res) => {
  const { person_id } = req.body;

  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) {
    return res.json({ success: false, message: '参保人不存在' });
  }

  const existingCard = db.prepare('SELECT * FROM electronic_cards WHERE insured_person_id = ? AND status = "active"').get(person_id);
  if (existingCard) {
    return res.json({ success: false, message: '已持有有效电子社保卡', data: existingCard });
  }

  const cardNo = generateCardNo();
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 10);

  db.prepare(`
    INSERT INTO electronic_cards 
    (insured_person_id, card_no, issue_date, valid_until, qr_code)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
  `).run(person_id, cardNo, validUntil.toISOString(), generateQRCode());

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('card_apply', 'card', `Card: ${cardNo}, Person: ${person_id}`);

  const card = db.prepare('SELECT * FROM electronic_cards WHERE card_no = ?').get(cardNo);

  res.json({
    success: true,
    message: '电子社保卡申领成功',
    data: card
  });
});

router.get('/:person_id', (req, res) => {
  const { person_id } = req.params;
  
  const card = db.prepare(`
    SELECT ec.*, ip.name, ip.id_card, ip.region 
    FROM electronic_cards ec
    JOIN insured_persons ip ON ec.insured_person_id = ip.id
    WHERE ec.insured_person_id = ? AND ec.status = 'active'
    ORDER BY ec.created_at DESC
    LIMIT 1
  `).get(person_id);

  if (card) {
    card.qr_code = generateQRCode();
    res.json({ success: true, data: card });
  } else {
    res.json({ success: false, message: '未查询到有效电子社保卡' });
  }
});

router.post('/refresh-qr/:card_id', (req, res) => {
  const { card_id } = req.params;

  const newQrCode = generateQRCode();
  db.prepare('UPDATE electronic_cards SET qr_code = ? WHERE id = ?').run(newQrCode, card_id);

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('qr_refresh', 'card', `Card: ${card_id}`);

  res.json({
    success: true,
    qr_code: newQrCode
  });
});

router.post('/report-loss/:card_id', (req, res) => {
  const { card_id } = req.params;

  db.prepare('UPDATE electronic_cards SET status = "lost" WHERE id = ?').run(card_id);

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('card_loss', 'card', `Card: ${card_id}`);

  res.json({
    success: true,
    message: '挂失成功'
  });
});

export default router;
