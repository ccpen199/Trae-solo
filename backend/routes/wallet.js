import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/card/:audience_id', (req, res) => {
  try {
    const cards = db.prepare('SELECT * FROM wallet_cards WHERE audience_id = ?').all(req.params.audience_id);
    if (cards.length === 0) return res.status(404).json({ error: 'No wallet card found' });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions/:card_id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM wallet_cards WHERE id = ?').get(req.params.card_id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE card_id = ? ORDER BY created_at DESC').all(req.params.card_id);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recharge', (req, res) => {
  try {
    const { card_id, amount } = req.body;
    if (!card_id || !amount || amount <= 0) return res.status(400).json({ error: 'card_id and positive amount are required' });

    const card = db.prepare('SELECT * FROM wallet_cards WHERE id = ?').get(card_id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.status !== 'active') return res.status(400).json({ error: 'Card is not active' });

    const newBalance = card.balance + amount;
    db.prepare("UPDATE wallet_cards SET balance = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newBalance, card_id);
    db.prepare(
      'INSERT INTO wallet_transactions (card_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)'
    ).run(card_id, 'recharge', amount, newBalance, 'Recharge');

    res.json({ card_id, new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/consume', (req, res) => {
  try {
    const { card_id, amount, order_id, remark } = req.body;
    if (!card_id || !amount || amount <= 0) return res.status(400).json({ error: 'card_id and positive amount are required' });

    const card = db.prepare('SELECT * FROM wallet_cards WHERE id = ?').get(card_id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.status !== 'active') return res.status(400).json({ error: 'Card is not active' });
    if (card.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const newBalance = card.balance - amount;
    db.prepare("UPDATE wallet_cards SET balance = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newBalance, card_id);
    db.prepare(
      'INSERT INTO wallet_transactions (card_id, type, amount, balance_after, order_id, remark) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(card_id, 'consume', amount, newBalance, order_id || null, remark || 'Consume');

    res.json({ card_id, new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enterprise-grant', (req, res) => {
  try {
    const { card_id, amount, enterprise_id, remark } = req.body;
    if (!card_id || !amount || amount <= 0) return res.status(400).json({ error: 'card_id and positive amount are required' });

    const card = db.prepare('SELECT * FROM wallet_cards WHERE id = ?').get(card_id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.card_type !== 'enterprise') return res.status(400).json({ error: 'Only enterprise cards support grants' });
    if (card.status !== 'active') return res.status(400).json({ error: 'Card is not active' });

    const newBalance = card.balance + amount;
    db.prepare("UPDATE wallet_cards SET balance = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newBalance, card_id);
    db.prepare(
      'INSERT INTO wallet_transactions (card_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)'
    ).run(card_id, 'enterprise_grant', amount, newBalance, remark || `Enterprise grant from ${enterprise_id || 'enterprise'}`);

    res.json({ card_id, new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
