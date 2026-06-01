import type { Transaction, Transfer, Category, Tag } from '@shared/types';
import { getDatabase } from '../config/database';

interface TransactionRow {
  id: number;
  account_id: number;
  user_id: number;
  type: string;
  amount: number;
  currency: string;
  category: string;
  tags: string | null;
  member: string | null;
  project: string | null;
  description: string | null;
  transaction_date: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
}

interface TransferRow {
  id: number;
  from_account_id: number;
  to_account_id: number;
  user_id: number;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  fee: number | null;
  description: string | null;
  transfer_date: string;
  created_at: string;
}

interface CategoryRow {
  id: number;
  name: string;
  type: string;
  parent_id: number | null;
  user_id: number | null;
  is_system: number;
}

interface TagRow {
  id: number;
  name: string;
  user_id: number;
  color: string | null;
}

export class TransactionRepository {
  private db = getDatabase();

  findTransactions(userId: number, filters: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    accountId?: number;
    page?: number;
    pageSize?: number;
  }): { items: Transaction[]; total: number } {
    const where: string[] = ['t.user_id = ?'];
    const params: unknown[] = [userId];

    if (filters.type) { where.push('t.type = ?'); params.push(filters.type); }
    if (filters.category) { where.push('t.category = ?'); params.push(filters.category); }
    if (filters.startDate) { where.push('t.transaction_date >= ?'); params.push(filters.startDate); }
    if (filters.endDate) { where.push('t.transaction_date <= ?'); params.push(filters.endDate); }
    if (filters.accountId) { where.push('t.account_id = ?'); params.push(filters.accountId); }

    const whereClause = where.join(' AND ');
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;

    const countResult = this.db.prepare<{ count: number }>(`
      SELECT COUNT(*) as count FROM transactions t WHERE ${whereClause}
    `).get(...params as any) as { count: number };

    const rows = this.db.prepare<TransactionRow>(`
      SELECT t.* FROM transactions t
      WHERE ${whereClause}
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT ? OFFSET ?
    `).all(...[...params, pageSize, offset] as any);

    return {
      items: rows.map(row => this.mapToTransaction(row)),
      total: countResult?.count || 0,
    };
  }

  createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const result = this.db.prepare(`
      INSERT INTO transactions (account_id, user_id, type, amount, currency, category, tags, member, project, description, transaction_date, attachment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.accountId,
      data.userId,
      data.type,
      data.amount,
      data.currency,
      data.category,
      data.tags.length > 0 ? JSON.stringify(data.tags) : null,
      data.member || null,
      data.project || null,
      data.description || null,
      data.transactionDate,
      data.attachment || null
    );

    return this.findTransactionById(result.lastInsertRowid as number, data.userId)!;
  }

  updateTransaction(id: number, userId: number, data: Partial<Transaction>): Transaction | null {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.accountId !== undefined) { fields.push('account_id = ?'); values.push(data.accountId); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.tags !== undefined) { fields.push('tags = ?'); values.push(data.tags.length > 0 ? JSON.stringify(data.tags) : null); }
    if (data.member !== undefined) { fields.push('member = ?'); values.push(data.member || null); }
    if (data.project !== undefined) { fields.push('project = ?'); values.push(data.project || null); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description || null); }
    if (data.transactionDate !== undefined) { fields.push('transaction_date = ?'); values.push(data.transactionDate); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    this.db.prepare(`
      UPDATE transactions SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    return this.findTransactionById(id, userId);
  }

  deleteTransaction(id: number, userId: number): boolean {
    const result = this.db.prepare(`
      DELETE FROM transactions WHERE id = ? AND user_id = ?
    `).run(id, userId);
    
    return result.changes > 0;
  }

  findTransactionById(id: number, userId: number): Transaction | null {
    const row = this.db.prepare<TransactionRow, [number, number]>(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `).get(id, userId);
    
    return row ? this.mapToTransaction(row) : null;
  }

  findTransfers(userId: number, filters: {
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): { items: Transfer[]; total: number } {
    const where: string[] = ['t.user_id = ?'];
    const params: unknown[] = [userId];

    if (filters.startDate) { where.push('t.transfer_date >= ?'); params.push(filters.startDate); }
    if (filters.endDate) { where.push('t.transfer_date <= ?'); params.push(filters.endDate); }

    const whereClause = where.join(' AND ');
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;

    const countResult = this.db.prepare<{ count: number }>(`
      SELECT COUNT(*) as count FROM transfers t WHERE ${whereClause}
    `).get(...params as any) as { count: number };

    const rows = this.db.prepare<TransferRow>(`
      SELECT t.* FROM transfers t
      WHERE ${whereClause}
      ORDER BY t.transfer_date DESC, t.id DESC
      LIMIT ? OFFSET ?
    `).all(...[...params, pageSize, offset] as any);

    return {
      items: rows.map(row => this.mapToTransfer(row)),
      total: countResult?.count || 0,
    };
  }

  createTransfer(data: Omit<Transfer, 'id' | 'createdAt'>): Transfer {
    const result = this.db.prepare(`
      INSERT INTO transfers (from_account_id, to_account_id, user_id, amount, currency, exchange_rate, fee, description, transfer_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.fromAccountId,
      data.toAccountId,
      data.userId,
      data.amount,
      data.currency,
      data.exchangeRate || null,
      data.fee || null,
      data.description || null,
      data.transferDate
    );

    const row = this.db.prepare<TransferRow, [number]>(`
      SELECT * FROM transfers WHERE id = ?
    `).get(result.lastInsertRowid as number)!;
    
    return this.mapToTransfer(row);
  }

  getCategories(type?: 'income' | 'expense'): Category[] {
    const sql = type 
      ? 'SELECT * FROM categories WHERE type = ? ORDER BY is_system DESC, name'
      : 'SELECT * FROM categories ORDER BY type, is_system DESC, name';
    
    const rows = this.db.prepare<CategoryRow, [string?]>(sql).all(type as any);
    return rows.map(row => this.mapToCategory(row));
  }

  getTags(userId: number): Tag[] {
    const rows = this.db.prepare<TagRow, [number]>(`
      SELECT * FROM tags WHERE user_id = ? ORDER BY name
    `).all(userId);
    
    return rows.map(row => this.mapToTag(row));
  }

  createTag(userId: number, name: string, color?: string): Tag {
    const result = this.db.prepare(`
      INSERT INTO tags (name, user_id, color)
      VALUES (?, ?, ?)
    `).run(name, userId, color || null);

    const row = this.db.prepare<TagRow, [number]>(`
      SELECT * FROM tags WHERE id = ?
    `).get(result.lastInsertRowid as number)!;
    
    return this.mapToTag(row);
  }

  getMonthlySummary(userId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const incomeResult = this.db.prepare<{ total: number }, [number, string, string]>(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?
    `).get(userId, startDate, endDate);

    const expenseResult = this.db.prepare<{ total: number }, [number, string, string]>(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?
    `).get(userId, startDate, endDate);

    const byCategory = this.db.prepare<{ category: string; type: string; total: number }, [number, string, string]>(`
      SELECT category, type, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
      GROUP BY category, type
      ORDER BY total DESC
    `).all(userId, startDate, endDate);

    return {
      totalIncome: incomeResult?.total || 0,
      totalExpense: expenseResult?.total || 0,
      byCategory,
    };
  }

  private mapToTransaction(row: TransactionRow): Transaction {
    return {
      id: row.id,
      accountId: row.account_id,
      userId: row.user_id,
      type: row.type as Transaction['type'],
      amount: row.amount,
      currency: row.currency,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      member: row.member || undefined,
      project: row.project || undefined,
      description: row.description || undefined,
      transactionDate: row.transaction_date,
      attachment: row.attachment || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToTransfer(row: TransferRow): Transfer {
    return {
      id: row.id,
      fromAccountId: row.from_account_id,
      toAccountId: row.to_account_id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      exchangeRate: row.exchange_rate || undefined,
      fee: row.fee || undefined,
      description: row.description || undefined,
      transferDate: row.transfer_date,
      createdAt: row.created_at,
    };
  }

  private mapToCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      type: row.type as Category['type'],
      parentId: row.parent_id || undefined,
      userId: row.user_id || undefined,
      isSystem: row.is_system === 1,
    };
  }

  private mapToTag(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      color: row.color || undefined,
    };
  }
}
