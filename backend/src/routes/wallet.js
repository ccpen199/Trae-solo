import express from 'express';
import db from '../database.js';

const router = express.Router();

function generateAccountNo() {
  return 'WAL' + Date.now() + Math.floor(Math.random() * 10000);
}

router.post('/open', (req, res) => {
  const { person_id, custodian } = req.body;

  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) {
    return res.json({ success: false, message: '参保人不存在' });
  }

  const existingWallet = db.prepare('SELECT * FROM wallet_accounts WHERE insured_person_id = ?').get(person_id);
  if (existingWallet) {
    return res.json({ success: false, message: '钱包已开立', data: existingWallet });
  }

  const accountNo = generateAccountNo();
  
  db.prepare(`
    INSERT INTO wallet_accounts 
    (insured_person_id, account_no, custodian)
    VALUES (?, ?, ?)
  `).run(person_id, accountNo, custodian || '中国建设银行');

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('wallet_open', 'wallet', `Account: ${accountNo}, Person: ${person_id}`);

  const wallet = db.prepare('SELECT * FROM wallet_accounts WHERE account_no = ?').get(accountNo);

  res.json({
    success: true,
    message: '钱包开立成功',
    data: wallet
  });
});

router.get('/:person_id', (req, res) => {
  const { person_id } = req.params;
  
  const wallet = db.prepare('SELECT * FROM wallet_accounts WHERE insured_person_id = ?').get(person_id);

  if (wallet) {
    res.json({ success: true, data: wallet });
  } else {
    res.json({ success: false, message: '钱包不存在' });
  }
});

router.post('/deposit', (req, res) => {
  const { wallet_id, amount, counterpart } = req.body;

  const wallet = db.prepare('SELECT * FROM wallet_accounts WHERE id = ?').get(wallet_id);
  if (!wallet) {
    return res.json({ success: false, message: '钱包不存在' });
  }

  const newBalance = wallet.balance + amount;

  db.prepare('UPDATE wallet_accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newBalance, wallet_id);

  db.prepare(`
    INSERT INTO wallet_transactions 
    (wallet_id, type, amount, balance_after, counterpart, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(wallet_id, 'deposit', amount, newBalance, counterpart || '银行转账', '充值');

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('wallet_deposit', 'wallet', `Wallet: ${wallet_id}, Amount: ${amount}`);

  res.json({
    success: true,
    message: '充值成功',
    balance: newBalance
  });
});

router.post('/withdraw', (req, res) => {
  const { wallet_id, amount, counterpart } = req.body;

  const wallet = db.prepare('SELECT * FROM wallet_accounts WHERE id = ?').get(wallet_id);
  if (!wallet) {
    return res.json({ success: false, message: '钱包不存在' });
  }

  if (wallet.balance < amount) {
    return res.json({ success: false, message: '余额不足' });
  }

  const t0Rule = JSON.parse(wallet.t0_redemption_rule);
  if (amount > t0Rule.dailyLimit) {
    return res.json({ success: false, message: `超出单日赎回限额${t0Rule.dailyLimit}元` });
  }

  const newBalance = wallet.balance - amount;

  db.prepare('UPDATE wallet_accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newBalance, wallet_id);

  db.prepare(`
    INSERT INTO wallet_transactions 
    (wallet_id, type, amount, balance_after, counterpart, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(wallet_id, 'withdraw', -amount, newBalance, counterpart || '本人银行卡', '赎回');

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('wallet_withdraw', 'wallet', `Wallet: ${wallet_id}, Amount: ${amount}`);

  res.json({
    success: true,
    message: '赎回成功(T+0到账)',
    balance: newBalance
  });
});

router.get('/transactions/:wallet_id', (req, res) => {
  const { wallet_id } = req.params;
  
  const transactions = db.prepare(`
    SELECT * FROM wallet_transactions 
    WHERE wallet_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all(wallet_id);

  res.json({ success: true, data: transactions });
});

router.get('/reconciliation/:date', (req, res) => {
  const { date } = req.params;
  
  const records = db.prepare(`
    SELECT * FROM reconciliation_records 
    WHERE record_date = ?
  `).all(date);

  if (records.length === 0) {
    const totalBalance = db.prepare('SELECT SUM(balance) as total FROM wallet_accounts').get().total || 0;
    const mockBankBalance = totalBalance + (Math.random() - 0.5) * 100;
    
    db.prepare(`
      INSERT INTO reconciliation_records 
      (record_date, custodian, system_balance, bank_balance, difference, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(date, '中国建设银行', totalBalance, mockBankBalance, mockBankBalance - totalBalance, 
          Math.abs(mockBankBalance - totalBalance) < 1 ? 'matched' : 'unmatched');
  }

  const finalRecords = db.prepare('SELECT * FROM reconciliation_records WHERE record_date = ?').all(date);

  res.json({ success: true, data: finalRecords });
});

export default router;
