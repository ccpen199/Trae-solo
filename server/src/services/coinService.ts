import { getDB } from '../models/database';
import { config } from '../config';

export function addCoins(userId: number, amount: number, type: string, bizId?: number, bizType?: string, description?: string) {
  const db = getDB();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('用户不存在');

  const newBalance = user.coins + amount;

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET coins = ?, total_earned_coins = total_earned_coins + ? WHERE id = ?')
      .run(newBalance, Math.max(0, amount), userId);

    db.prepare(`
      INSERT INTO coin_records (user_id, change, balance_after, type, biz_id, biz_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, amount, newBalance, type, bizId || null, bizType || null, description || '');
  });

  tx();

  return newBalance;
}

export function deductCoins(userId: number, amount: number, type: string, bizId?: number, description?: string) {
  const db = getDB();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('用户不存在');
  if (user.coins < amount) throw new Error('金币不足');

  const newBalance = user.coins - amount;

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newBalance, userId);

    db.prepare(`
      INSERT INTO coin_records (user_id, change, balance_after, type, biz_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, -amount, newBalance, type, bizId || null, description || '');
  });

  tx();

  return newBalance;
}

export function getCoinRecords(userId: number, page: number = 1, pageSize: number = 20) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const records = db.prepare(`
    SELECT * FROM coin_records WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(userId, pageSize, offset);

  const total = (db.prepare('SELECT COUNT(*) as count FROM coin_records WHERE user_id = ?').get(userId) as any).count;

  return { list: records, total, page, pageSize };
}

export function exchangeCoinsToCash(userId: number, coinAmount: number) {
  const db = getDB();
  const rate = config.coinExchangeRate;

  if (coinAmount < rate) {
    throw new Error(`最少需要${rate}金币才能兑换`);
  }

  const cashAmount = coinAmount / rate;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (user.coins < coinAmount) {
    throw new Error('金币余额不足');
  }

  const tx = db.transaction(() => {
    deductCoins(userId, coinAmount, 'exchange', undefined, '金币兑换现金');

    const newCashBalance = user.cash_balance + cashAmount;
    db.prepare('UPDATE users SET cash_balance = ? WHERE id = ?').run(newCashBalance, userId);

    db.prepare(`
      INSERT INTO cash_records (user_id, change, balance_after, type, description)
      VALUES (?, ?, ?, 'exchange', ?)
    `).run(userId, cashAmount, newCashBalance, `${coinAmount}金币兑换${cashAmount}元`);
  });

  tx();

  return { coinAmount, cashAmount };
}

export function getExchangeRate() {
  return {
    rate: config.coinExchangeRate,
    tiers: [
      { coins: 10000, cash: 1, rate: 10000 },
      { coins: 30000, cash: 3.2, rate: 9375 },
      { coins: 100000, cash: 11, rate: 9090 },
      { coins: 500000, cash: 58, rate: 8620 },
    ],
  };
}
