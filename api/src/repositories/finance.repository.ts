import { db } from '../database/connection';
import type { DailyFinance, BankCard, WithdrawRecord, WithdrawStatus } from '../../../shared/types';
import crypto from 'crypto';

interface DailyFinanceRow {
  id: string;
  date: string;
  outlet_id: string;
  outlet_name: string;
  total_orders: number;
  total_weight: number;
  total_freight: number;
  waybill_cost: number;
  platform_fee: number;
  net_income: number;
  detail?: string;
}

interface BankCardRow {
  id: string;
  outlet_id: string;
  bank_name: string;
  bank_branch?: string;
  card_number: string;
  card_holder: string;
  phone: string;
  is_default: number;
  verified: number;
  created_at: string;
}

interface WithdrawRecordRow {
  id: string;
  outlet_id: string;
  bank_card_id: string;
  amount: number;
  bank_name: string;
  card_number: string;
  card_holder: string;
  status: string;
  auditor_id?: string;
  auditor_name?: string;
  audit_remark?: string;
  transfer_transaction_id?: string;
  applicant_id: string;
  applicant_name: string;
  created_at: string;
  audited_at?: string;
  transferred_at?: string;
}

function rowToDailyFinance(row: DailyFinanceRow): DailyFinance {
  return {
    date: row.date,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    totalOrders: row.total_orders,
    totalWeight: row.total_weight,
    totalFreight: row.total_freight,
    waybillCost: row.waybill_cost,
    platformFee: row.platform_fee,
    netIncome: row.net_income,
    detail: row.detail ? JSON.parse(row.detail) : [],
  };
}

function rowToBankCard(row: BankCardRow): BankCard {
  return {
    id: row.id,
    outletId: row.outlet_id,
    bankName: row.bank_name,
    bankBranch: row.bank_branch || '',
    cardNumber: row.card_number,
    cardHolder: row.card_holder,
    phone: row.phone,
    isDefault: row.is_default === 1,
    verified: row.verified === 1,
    createdAt: row.created_at,
  };
}

function rowToWithdrawRecord(row: WithdrawRecordRow): WithdrawRecord {
  return {
    id: row.id,
    outletId: row.outlet_id,
    amount: row.amount,
    bankCardId: row.bank_card_id,
    bankName: row.bank_name,
    cardNumber: row.card_number,
    cardHolder: row.card_holder,
    status: row.status as WithdrawStatus,
    auditorId: row.auditor_id,
    auditorName: row.auditor_name,
    auditRemark: row.audit_remark,
    transferTransactionId: row.transfer_transaction_id,
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    createdAt: row.created_at,
    auditedAt: row.audited_at,
    transferredAt: row.transferred_at,
  };
}

export const financeRepository = {
  getDailyFinances(outletId: string, startDate?: string, endDate?: string, page: number = 1, pageSize: number = 30): { list: DailyFinance[]; total: number } {
    let whereSql = '';
    const params: any[] = [];

    if (outletId) {
      whereSql = 'WHERE outlet_id = ?';
      params.push(outletId);
    } else {
      whereSql = 'WHERE 1=1';
    }

    if (startDate) {
      whereSql += ' AND date >= date(?)';
      params.push(startDate);
    }
    if (endDate) {
      whereSql += ' AND date <= date(?)';
      params.push(endDate);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM daily_finances ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT * FROM daily_finances ${whereSql}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as DailyFinanceRow[];

    return {
      list: rows.map(rowToDailyFinance),
      total: countRow.total,
    };
  },

  getBankCards(outletId: string): BankCard[] {
    let sql = 'SELECT * FROM bank_cards ';
    const params: any[] = [];
    if (outletId) {
      sql += 'WHERE outlet_id = ? ';
      params.push(outletId);
    }
    sql += 'ORDER BY is_default DESC, created_at DESC';
    const rows = db.prepare(sql).all(...params) as BankCardRow[];
    return rows.map(rowToBankCard);
  },

  listBankCards(outletId: string): BankCard[] {
    return financeRepository.getBankCards(outletId);
  },

  addBankCard(cardData: Omit<BankCard, 'id' | 'createdAt' | 'isDefault' | 'verified'> & { outletId: string }): BankCard {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const existingCards = db.prepare('SELECT COUNT(*) as count FROM bank_cards WHERE outlet_id = ?').get(cardData.outletId) as { count: number };
    const isDefault = existingCards.count === 0 ? 1 : 0;

    db.prepare(`
      INSERT INTO bank_cards (id, outlet_id, bank_name, bank_branch, card_number, card_holder, phone, is_default, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      cardData.outletId,
      cardData.bankName,
      cardData.bankBranch || null,
      cardData.cardNumber,
      cardData.cardHolder,
      cardData.phone,
      isDefault,
      now
    );

    const row = db.prepare('SELECT * FROM bank_cards WHERE id = ?').get(id) as BankCardRow;
    return rowToBankCard(row);
  },

  setDefaultCard(outletId: string, cardId: string): boolean {
    const transaction = db.transaction(() => {
      db.prepare('UPDATE bank_cards SET is_default = 0 WHERE outlet_id = ?').run(outletId);
      const result = db.prepare('UPDATE bank_cards SET is_default = 1 WHERE id = ? AND outlet_id = ?').run(cardId, outletId);
      return result.changes > 0;
    });

    return transaction();
  },

  withdraw(outletId: string, amount: number, bankCardId: string, applicantId: string, applicantName: string): WithdrawRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const card = db.prepare('SELECT * FROM bank_cards WHERE id = ? AND outlet_id = ?').get(bankCardId, outletId) as BankCardRow | undefined;
    if (!card) throw new Error('银行卡不存在');

    db.prepare(`
      INSERT INTO withdraw_records (
        id, outlet_id, bank_card_id, amount, bank_name, card_number, card_holder,
        status, applicant_id, applicant_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      id, outletId, bankCardId, amount, card.bank_name, card.card_number, card.card_holder,
      applicantId, applicantName, now
    );

    const row = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(id) as WithdrawRecordRow;
    return rowToWithdrawRecord(row);
  },

  getWithdrawRecords(outletId: string, status?: WithdrawStatus, page: number = 1, pageSize: number = 10): { list: WithdrawRecord[]; total: number } {
    let whereSql = '';
    const params: any[] = [];

    if (outletId) {
      whereSql = 'WHERE outlet_id = ?';
      params.push(outletId);
    } else {
      whereSql = 'WHERE 1=1';
    }

    if (status) {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM withdraw_records ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT * FROM withdraw_records ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as WithdrawRecordRow[];

    return {
      list: rows.map(rowToWithdrawRecord),
      total: countRow.total,
    };
  },

  listWithdrawRecords(filters: { outletId?: string; status?: WithdrawStatus; page?: number; pageSize?: number }): { list: WithdrawRecord[]; total: number } {
    return financeRepository.getWithdrawRecords(
      filters.outletId || '',
      filters.status,
      filters.page || 1,
      filters.pageSize || 10
    );
  },

  auditWithdraw(recordId: string, status: 'approved' | 'rejected', auditorId: string, auditorName: string, remark?: string): WithdrawRecord | null {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updateParams: any[] = [status, auditorId, auditorName, remark || null, now, recordId];

    let transferredAtSql = '';
    if (status === 'approved') {
      transferredAtSql = ', transferred_at = ?';
      updateParams.splice(5, 0, now);
    }

    db.prepare(`
      UPDATE withdraw_records 
      SET status = ?, auditor_id = ?, auditor_name = ?, audit_remark = ?, audited_at = ?${transferredAtSql}
      WHERE id = ?
    `).run(...updateParams);

    const row = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(recordId) as WithdrawRecordRow | undefined;
    return row ? rowToWithdrawRecord(row) : null;
  },
};
