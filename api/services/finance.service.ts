import db from '../db/database.js';
import { Wallet, Transaction, ApiResponse, UserRole, EscrowRequest, ReleaseRequest, WithdrawRequest } from '../../shared/types.js';
import { parseTask } from './task.service.js';

function parseWallet(row: Record<string, unknown>): Wallet {
  return {
    userId: row.user_id as number,
    balance: row.balance as number,
    frozenBalance: row.frozen_balance as number,
    totalIncome: row.total_income as number,
    totalExpense: row.total_expense as number,
    updatedAt: row.updated_at as string,
  };
}

function parseTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    balance: row.balance as number,
    taskId: (row.task_id as number) || null,
    description: (row.description as string) || '',
    status: row.status as Transaction['status'],
    createdAt: row.created_at as string,
  };
}

export class FinanceService {
  async getWallet(userId: number): Promise<ApiResponse<Wallet>> {
    const row = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(userId) as Record<string, unknown> | undefined;

    if (!row) {
      db.prepare(`
        INSERT INTO wallets (user_id, balance, frozen_balance)
        VALUES (?, 0, 0)
      `).run(userId);

      const newRow = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(userId) as Record<string, unknown>;
      return { success: true, data: parseWallet(newRow) };
    }

    return { success: true, data: parseWallet(row) };
  }

  async getTransactions(userId: number, query: { page?: number; pageSize?: number; type?: string }): Promise<ApiResponse<Transaction[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (query.type) {
      conditions.push('type = ?');
      params.push(query.type);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT * FROM transactions WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const transactions = rows.map(row => {
      const tx = parseTransaction(row);
      if (tx.taskId) {
        const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(tx.taskId) as Record<string, unknown> | undefined;
        if (taskRow) {
          tx.task = parseTask(taskRow);
        }
      }
      return tx;
    });

    return {
      success: true,
      data: transactions,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async escrowFunds(data: EscrowRequest, employerId: number): Promise<ApiResponse<Transaction>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(data.taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (task.employerId !== employerId) {
      return { success: false, message: '无权操作此任务' };
    }

    const walletRow = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(employerId) as Record<string, unknown> | undefined;
    if (!walletRow) {
      return { success: false, message: '钱包不存在' };
    }
    const wallet = parseWallet(walletRow);

    if (wallet.balance < data.amount) {
      return { success: false, message: '余额不足' };
    }

    const newBalance = wallet.balance - data.amount;
    const newFrozen = wallet.frozenBalance + data.amount;

    db.prepare(`
      UPDATE wallets
      SET balance = ?, frozen_balance = ?, total_expense = total_expense + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newBalance, newFrozen, data.amount, employerId);

    const txResult = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance, task_id, description, status)
      VALUES (?, 'escrow', ?, ?, ?, ?, 'completed')
    `).run(employerId, data.amount, newBalance, data.taskId, `任务托管金：${task.title}`);

    db.prepare(`
      UPDATE tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.taskId);

    const txRow = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(txResult.lastInsertRowid) as Record<string, unknown>;
    const transaction = parseTransaction(txRow);
    transaction.task = task;

    return { success: true, message: '资金托管成功', data: transaction };
  }

  async releaseFunds(data: ReleaseRequest, employerId: number): Promise<ApiResponse<Transaction[]>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(data.taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (task.employerId !== employerId) {
      return { success: false, message: '无权操作此任务' };
    }

    if (!task.providerId) {
      return { success: false, message: '任务未分配服务商' };
    }

    const employerWalletRow = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(employerId) as Record<string, unknown> | undefined;
    if (!employerWalletRow) {
      return { success: false, message: '雇主编号不存在' };
    }
    const employerWallet = parseWallet(employerWalletRow);

    if (employerWallet.frozenBalance < data.amount) {
      return { success: false, message: '冻结资金不足' };
    }

    const platformFee = data.amount * 0.05;
    const providerAmount = data.amount - platformFee;

    const newEmployerFrozen = employerWallet.frozenBalance - data.amount;
    db.prepare(`
      UPDATE wallets
      SET frozen_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newEmployerFrozen, employerId);

    const providerWalletRow = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(task.providerId) as Record<string, unknown> | undefined;
    if (!providerWalletRow) {
      db.prepare(`INSERT INTO wallets (user_id, balance, frozen_balance) VALUES (?, 0, 0)`).run(task.providerId);
    }

    const providerWallet = providerWalletRow ? parseWallet(providerWalletRow) : { balance: 0, frozenBalance: 0, totalIncome: 0, totalExpense: 0, userId: task.providerId, updatedAt: '' };
    const newProviderBalance = providerWallet.balance + providerAmount;
    const newProviderIncome = providerWallet.totalIncome + providerAmount;

    db.prepare(`
      UPDATE wallets
      SET balance = ?, total_income = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newProviderBalance, newProviderIncome, task.providerId);

    const transactions: Transaction[] = [];

    const employerTxResult = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance, task_id, description, status)
      VALUES (?, 'release', ?, ?, ?, ?, 'completed')
    `).run(employerId, -data.amount, employerWallet.balance, data.taskId, `任务打款：${task.title}`);

    const employerTxRow = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(employerTxResult.lastInsertRowid) as Record<string, unknown>;
    transactions.push(parseTransaction(employerTxRow));

    const providerTxResult = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance, task_id, description, status)
      VALUES (?, 'release', ?, ?, ?, ?, 'completed')
    `).run(task.providerId, providerAmount, newProviderBalance, data.taskId, `任务收款：${task.title}`);

    const providerTxRow = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(providerTxResult.lastInsertRowid) as Record<string, unknown>;
    const providerTx = parseTransaction(providerTxRow);
    providerTx.task = task;
    transactions.push(providerTx);

    const feeTxResult = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance, task_id, description, status)
      VALUES (?, 'fee', ?, 0, ?, ?, 'completed')
    `).run(1, platformFee, data.taskId, `平台服务费：${task.title}`);

    const feeTxRow = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(feeTxResult.lastInsertRowid) as Record<string, unknown>;
    transactions.push(parseTransaction(feeTxRow));

    db.prepare(`
      UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.taskId);

    const talentRow = db.prepare(`SELECT * FROM talents WHERE user_id = ?`).get(task.providerId) as Record<string, unknown> | undefined;
    if (talentRow) {
      db.prepare(`
        UPDATE talents
        SET completed_projects = completed_projects + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(task.providerId);
    }

    return { success: true, message: '打款成功', data: transactions };
  }

  async requestWithdraw(data: WithdrawRequest, userId: number): Promise<ApiResponse<Transaction>> {
    const walletRow = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(userId) as Record<string, unknown> | undefined;
    if (!walletRow) {
      return { success: false, message: '钱包不存在' };
    }
    const wallet = parseWallet(walletRow);

    if (wallet.balance < data.amount) {
      return { success: false, message: '余额不足' };
    }

    if (data.amount < 100) {
      return { success: false, message: '最低提现金额为100元' };
    }

    const newBalance = wallet.balance - data.amount;

    db.prepare(`
      UPDATE wallets
      SET balance = ?, total_expense = total_expense + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newBalance, data.amount, userId);

    const txResult = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance, description, status)
      VALUES (?, 'withdraw', ?, ?, ?, 'pending')
    `).run(userId, data.amount, newBalance, `提现到 ${data.bankName} ${data.bankAccount.slice(-4)}`);

    const txRow = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(txResult.lastInsertRowid) as Record<string, unknown>;

    return { success: true, message: '提现申请已提交，预计1-3个工作日到账', data: parseTransaction(txRow) };
  }

  async getDashboardStats(role: UserRole, userId: number): Promise<ApiResponse<Record<string, number>>> {
    let totalTasks = 0;
    let activeTasks = 0;
    let completedTasks = 0;
    let totalAmount = 0;

    if (role === 'employer') {
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('published', 'bidding', 'selected', 'in_progress', 'submitted', 'reviewing', 'revising') THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          COALESCE(SUM(final_budget), 0) as amount
        FROM tasks WHERE employer_id = ?
      `).get(userId) as { total: number; active: number; completed: number; amount: number };
      totalTasks = taskStats.total;
      activeTasks = taskStats.active;
      completedTasks = taskStats.completed;
      totalAmount = taskStats.amount;
    } else if (role === 'provider') {
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('in_progress', 'submitted', 'reviewing', 'revising') THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          COALESCE(SUM(final_budget), 0) as amount
        FROM tasks WHERE provider_id = ?
      `).get(userId) as { total: number; active: number; completed: number; amount: number };
      totalTasks = taskStats.total;
      activeTasks = taskStats.active;
      completedTasks = taskStats.completed;
      totalAmount = taskStats.amount;
    } else {
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('published', 'bidding', 'selected', 'in_progress', 'submitted', 'reviewing', 'revising') THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          COALESCE(SUM(final_budget), 0) as amount
        FROM tasks
      `).get() as { total: number; active: number; completed: number; amount: number };
      totalTasks = taskStats.total;
      activeTasks = taskStats.active;
      completedTasks = taskStats.completed;
      totalAmount = taskStats.amount;
    }

    const pendingReviews = role === 'employer' || role === 'admin'
      ? db.prepare(`SELECT COUNT(*) as count FROM tasks t JOIN submissions s ON t.id = s.task_id WHERE t.employer_id = ? AND s.status = 'submitted'`).get(userId) as { count: number }
      : { count: 0 };

    const pendingDisputes = role === 'admin'
      ? db.prepare(`SELECT COUNT(*) as count FROM disputes WHERE status IN ('pending', 'reviewing')`).get() as { count: number }
      : { count: 0 };

    const newTalents = role === 'admin'
      ? db.prepare(`SELECT COUNT(*) as count FROM talents WHERE verified = 0`).get() as { count: number }
      : { count: 0 };

    return {
      success: true,
      data: {
        totalTasks,
        activeTasks,
        completedTasks,
        totalAmount,
        pendingReviews: pendingReviews.count,
        pendingDisputes: pendingDisputes.count,
        newTalents: newTalents.count,
        monthlyGrowth: 12.5,
      },
    };
  }
}

export default new FinanceService();
