import { Router, Response } from 'express';
import { getOne, getAll, runQuery } from '../database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.get('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await getAll('SELECT * FROM categories ORDER BY sort_order, id');
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/accounts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await getAll('SELECT * FROM accounts WHERE user_id = ? ORDER BY is_default DESC, id', [req.user!.id]);
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contact_id, category_id, account_id, amount, type, name, remark, transaction_date } = req.body;

    if (!category_id || !account_id || !amount || !type || !transaction_date) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    const result = await runQuery(
      `INSERT INTO transactions (user_id, contact_id, category_id, account_id, amount, type, name, remark, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, contact_id || null, category_id, account_id, amount, type, name || '', remark || '', transaction_date]
    );

    const account = await getOne('SELECT balance FROM accounts WHERE id = ?', [account_id]);
    const newBalance = type === 'income' 
      ? (account?.balance || 0) + amount 
      : (account?.balance || 0) - amount;

    await runQuery('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account_id]);

    const transaction = await getOne('SELECT * FROM transactions WHERE id = ?', [result.lastID]);

    res.json({ success: true, message: '记账成功', data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, type, page = 1, page_size = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(page_size);

    let sql = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name, ct.name as contact_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN contacts ct ON t.contact_id = ct.id
      WHERE t.user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (start_date) {
      sql += ' AND t.transaction_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND t.transaction_date <= ?';
      params.push(end_date);
    }
    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), offset);

    const transactions = await getAll(sql, params);

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/statistics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    let incomeSql = `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'`;
    let expenseSql = `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'`;
    const params: any[] = [req.user!.id];

    if (start_date) {
      incomeSql += ' AND transaction_date >= ?';
      expenseSql += ' AND transaction_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      incomeSql += ' AND transaction_date <= ?';
      expenseSql += ' AND transaction_date <= ?';
      params.push(end_date);
    }

    const [incomeResult, expenseResult] = await Promise.all([
      getOne(incomeSql, params),
      getOne(expenseSql, params)
    ]);

    res.json({
      success: true,
      data: {
        total_income: incomeResult?.total || 0,
        total_expense: expenseResult?.total || 0,
        balance: (incomeResult?.total || 0) - (expenseResult?.total || 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;