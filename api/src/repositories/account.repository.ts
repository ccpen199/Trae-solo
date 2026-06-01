import type { Account, Valuation } from '@shared/types';
import { getDatabase } from '../config/database';

interface AccountRow {
  id: number;
  user_id: number;
  name: string;
  type: string;
  category: string;
  currency: string;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface ValuationRow {
  id: number;
  account_id: number;
  market_value: number;
  cost_value: number;
  exchange_rate: number;
  valuation_date: string;
  data_source: string;
  manual_adjust_reason: string | null;
  created_at: string;
}

export class AccountRepository {
  private db = getDatabase();

  findByUserId(userId: number): Account[] {
    const rows = this.db.prepare(`
      SELECT a.*, 
             (SELECT market_value FROM valuations v 
              WHERE v.account_id = a.id 
              ORDER BY v.valuation_date DESC, v.id DESC LIMIT 1) as current_value
      FROM accounts a
      WHERE a.user_id = ? AND a.is_active = 1
      ORDER BY a.category, a.type, a.name
    `).all(userId) as unknown as (AccountRow & { current_value?: number })[];
    
    return rows.map(row => this.mapToAccount(row));
  }

  findById(id: number, userId?: number): Account | null {
    const sql = userId 
      ? 'SELECT * FROM accounts WHERE id = ? AND user_id = ?'
      : 'SELECT * FROM accounts WHERE id = ?';
    
    const row = this.db.prepare(sql)
      .get(id, userId as any) as AccountRow | undefined;
    
    return row ? this.mapToAccount(row) : null;
  }

  create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const result = this.db.prepare(`
      INSERT INTO accounts (user_id, name, type, category, currency, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.userId,
      data.name,
      data.type,
      data.category,
      data.currency,
      data.description || null,
      data.isActive ? 1 : 0
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, userId: number, data: Partial<Account>): Account | null {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description || null); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    this.db.prepare(`
      UPDATE accounts SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    return this.findById(id, userId);
  }

  delete(id: number, userId: number): boolean {
    const result = this.db.prepare(`
      DELETE FROM accounts WHERE id = ? AND user_id = ?
    `).run(id, userId);
    
    return result.changes > 0;
  }

  findValuations(accountId: number, userId: number): Valuation[] {
    const account = this.findById(accountId, userId);
    if (!account) return [];

    const rows = this.db.prepare(`
      SELECT * FROM valuations 
      WHERE account_id = ? 
      ORDER BY valuation_date DESC, id DESC
      LIMIT 100
    `).all(accountId) as ValuationRow[];
    
    return rows.map(row => this.mapToValuation(row));
  }

  addValuation(data: Omit<Valuation, 'id' | 'createdAt'>): Valuation {
    const result = this.db.prepare(`
      INSERT INTO valuations (account_id, market_value, cost_value, exchange_rate, valuation_date, data_source, manual_adjust_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.accountId,
      data.marketValue,
      data.costValue,
      data.exchangeRate,
      data.valuationDate,
      data.dataSource,
      data.manualAdjustReason || null
    );

    const row = this.db.prepare(`
      SELECT * FROM valuations WHERE id = ?
    `).get(result.lastInsertRowid as number) as ValuationRow;
    
    return this.mapToValuation(row);
  }

  getCurrentValue(accountId: number): number {
    const result = this.db.prepare(`
      SELECT market_value FROM valuations 
      WHERE account_id = ? 
      ORDER BY valuation_date DESC, id DESC 
      LIMIT 1
    `).get(accountId) as { market_value: number } | undefined;
    
    return result?.market_value || 0;
  }

  private mapToAccount(row: AccountRow & { current_value?: number }): Account {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type as Account['type'],
      category: row.category as Account['category'],
      currency: row.currency,
      description: row.description || undefined,
      isActive: row.is_active === 1,
      currentValue: row.current_value || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToValuation(row: ValuationRow): Valuation {
    return {
      id: row.id,
      accountId: row.account_id,
      marketValue: row.market_value,
      costValue: row.cost_value,
      exchangeRate: row.exchange_rate,
      valuationDate: row.valuation_date,
      dataSource: row.data_source,
      manualAdjustReason: row.manual_adjust_reason || undefined,
      createdAt: row.created_at,
    };
  }
}
