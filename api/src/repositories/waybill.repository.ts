import { db } from '../database/connection';
import type { WaybillAccount, RechargeRecord } from '../../../shared/types';
import crypto from 'crypto';

interface AccountRow {
  id: string;
  outlet_id: string;
  outlet_name: string;
  balance: number;
  frozen_balance: number;
  total_recharged: number;
  total_used: number;
  template_id?: string;
  template_name?: string;
  paper_size?: string;
  font_size?: string;
  show_logo: number;
  logo_url?: string;
  low_balance_threshold: number;
  created_at: string;
  updated_at: string;
}

interface RechargeRecordRow {
  id: string;
  account_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  status: string;
  operator_id?: string;
  operator_name?: string;
  remark?: string;
  created_at: string;
  completed_at?: string;
}

function rowToAccount(row: AccountRow): WaybillAccount {
  return {
    id: row.id,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    balance: row.balance,
    frozenBalance: row.frozen_balance,
    totalRecharged: row.total_recharged,
    totalUsed: row.total_used,
    templateConfig: {
      templateId: row.template_id || 'tpl001',
      templateName: row.template_name || '标准模板',
      paperSize: (row.paper_size as any) || '100x150',
      fontSize: (row.font_size as any) || 'medium',
      showLogo: row.show_logo === 1,
      logoUrl: row.logo_url || undefined,
    },
    lowBalanceThreshold: row.low_balance_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRechargeRecord(row: RechargeRecordRow): RechargeRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    status: row.status as RechargeRecord['status'],
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    remark: row.remark,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export const waybillRepository = {
  getAccount(outletId: string): WaybillAccount | null {
    const row = db.prepare(`
      SELECT * FROM waybill_accounts WHERE outlet_id = ?
    `).get(outletId) as AccountRow | undefined;

    return row ? rowToAccount(row) : null;
  },

  getAccountById(accountId: string): WaybillAccount | null {
    const row = db.prepare(`
      SELECT * FROM waybill_accounts WHERE id = ?
    `).get(accountId) as AccountRow | undefined;

    return row ? rowToAccount(row) : null;
  },

  recharge(accountId: string, amount: number, paymentMethod: string, operatorId?: string, operatorName?: string): RechargeRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO recharge_records (id, account_id, amount, payment_method, status, operator_id, operator_name, created_at, completed_at)
        VALUES (?, ?, ?, ?, 'success', ?, ?, ?, ?)
      `).run(id, accountId, amount, paymentMethod, operatorId || null, operatorName || null, now, now);

      db.prepare(`
        UPDATE waybill_accounts 
        SET balance = balance + ?, total_recharged = total_recharged + ?, updated_at = ?
        WHERE id = ?
      `).run(amount, amount, now, accountId);

      const record = db.prepare('SELECT * FROM recharge_records WHERE id = ?').get(id) as RechargeRecordRow;
      return rowToRechargeRecord(record);
    });

    return transaction();
  },

  getRechargeRecords(outletId: string, page: number = 1, pageSize: number = 10): { list: RechargeRecord[]; total: number } {
    const account = db.prepare('SELECT id FROM waybill_accounts WHERE outlet_id = ?').get(outletId) as { id: string } | undefined;
    if (!account) return { list: [], total: 0 };

    const offset = (page - 1) * pageSize;

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM recharge_records WHERE account_id = ?
    `).get(account.id) as { total: number };

    const rows = db.prepare(`
      SELECT * FROM recharge_records 
      WHERE account_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(account.id, pageSize, offset) as RechargeRecordRow[];

    return {
      list: rows.map(rowToRechargeRecord),
      total: countRow.total,
    };
  },

  updateTemplate(outletId: string, templateConfig: Partial<WaybillAccount['templateConfig']>): WaybillAccount | null {
    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      templateId: 'template_id',
      templateName: 'template_name',
      paperSize: 'paper_size',
      fontSize: 'font_size',
      showLogo: 'show_logo',
      logoUrl: 'logo_url',
    };

    Object.entries(templateConfig).forEach(([key, value]) => {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(key === 'showLogo' ? (value ? 1 : 0) : value);
      }
    });

    if (setClauses.length === 0) return waybillRepository.getAccount(outletId);

    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    params.push(outletId);

    db.prepare(`UPDATE waybill_accounts SET ${setClauses.join(', ')} WHERE outlet_id = ?`).run(...params);

    return waybillRepository.getAccount(outletId);
  },
};
