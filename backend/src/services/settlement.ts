import { db } from '../database';
import { generateId, now } from '../utils';

interface SettlementResult {
  id: string;
  supplierId: string;
  period: string;
  totalOrders: number;
  totalAmount: number;
  settlementAmount: number;
  status: string;
}

interface InvoiceData {
  type: string;
  title: string;
  taxNo: string;
  amount: number;
  content: string;
}

class SettlementService {
  generateMonthlySettlements(year?: number, month?: number) {
    const date = new Date();
    const y = year || date.getFullYear();
    const m = month || date.getMonth();
    const period = `${y}${String(m + 1).padStart(2, '0')}`;

    const startOfMonth = Math.floor(new Date(y, m, 1).getTime() / 1000);
    const endOfMonth = Math.floor(new Date(y, m + 1, 1).getTime() / 1000);

    const existing: any[] = db.prepare('SELECT supplier_id FROM settlements WHERE period = ?').all(period);
    const existingIds = new Set(existing.map(e => e.supplier_id));

    const suppliers: any[] = db.prepare('SELECT * FROM suppliers WHERE status = 1').all();
    const results: SettlementResult[] = [];

    const tx = db.transaction(() => {
      for (const supplier of suppliers) {
        if (existingIds.has(supplier.id)) continue;

        const orders: any[] = db.prepare(`
          SELECT * FROM orders
          WHERE supplier_id = ? AND status = 'completed'
          AND finish_time >= ? AND finish_time < ?
        `).all(supplier.id, startOfMonth, endOfMonth);

        if (orders.length === 0) continue;

        const totalAmount = orders.reduce((sum: number, o: any) => sum + (o.final_amount || 0), 0);
        const settlementAmount = Math.round(totalAmount * supplier.settlement_ratio * 100) / 100;

        const settlementId = generateId();
        db.prepare(`
          INSERT INTO settlements (id, supplier_id, period, total_orders, total_amount, settlement_amount, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `).run(settlementId, supplier.id, period, orders.length, totalAmount, settlementAmount, now(), now());

        const itemStmt = db.prepare(`
          INSERT INTO settlement_items (id, settlement_id, order_id, amount, cost_amount)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const order of orders) {
          itemStmt.run(generateId(), settlementId, order.id, order.final_amount, order.cost_price || order.final_amount * 0.8);
        }

        results.push({
          id: settlementId,
          supplierId: supplier.id,
          period,
          totalOrders: orders.length,
          totalAmount,
          settlementAmount,
          status: 'pending'
        });
      }
    });

    try {
      tx();
    } catch (e) {
      console.error('生成结算单失败', e);
    }

    return results;
  }

  getSettlementList(supplierId?: string, status?: string, page: number = 1, pageSize: number = 20): { list: any[]; total: number } {
    const wheres: string[] = [];
    const params: any[] = [];

    if (supplierId) { wheres.push('s.supplier_id = ?'); params.push(supplierId); }
    if (status) { wheres.push('s.status = ?'); params.push(status); }

    const whereSql = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM settlements s ${whereSql}`).get(...params);
    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);

    const list = db.prepare(`
      SELECT s.*, sup.name as supplier_name, sup.code as supplier_code
      FROM settlements s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      ${whereSql}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    return { list, total: totalRow.cnt };
  }

  getSettlementDetail(settlementId: string): any {
    const settlement: any = db.prepare(`
      SELECT s.*, sup.name as supplier_name, sup.code as supplier_code
      FROM settlements s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.id = ?
    `).get(settlementId);

    if (!settlement) return null;

    const items = db.prepare(`
      SELECT si.*, o.order_no, o.product_name, o.user_id, o.finish_time
      FROM settlement_items si
      JOIN orders o ON si.order_id = o.id
      WHERE si.settlement_id = ?
    `).all(settlementId);

    return { ...settlement, items };
  }

  confirmSettlement(settlementId: string): boolean {
    const result = db.prepare(`
      UPDATE settlements SET status = 'confirmed', updated_at = ? WHERE id = ? AND status = 'pending'
    `).run(now(), settlementId);
    return result.changes > 0;
  }

  markPaid(settlementId: string): boolean {
    const result = db.prepare(`
      UPDATE settlements SET status = 'paid', paid_at = ?, updated_at = ? WHERE id = ? AND status = 'confirmed'
    `).run(now(), now(), settlementId);
    return result.changes > 0;
  }

  createInvoice(settlementId: string, invoice: InvoiceData): boolean {
    const invoiceNo = `INV${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const result = db.prepare(`
      UPDATE settlements
      SET invoice_no = ?, invoice_status = 'issued', updated_at = ?
      WHERE id = ?
    `).run(invoiceNo, now(), settlementId);
    return result.changes > 0;
  }

  updateSettlementRatio(supplierId: string, ratio: number): boolean {
    if (ratio < 0 || ratio > 1) return false;
    const result = db.prepare('UPDATE suppliers SET settlement_ratio = ? WHERE id = ?').run(ratio, supplierId);
    return result.changes > 0;
  }

  getSupplierSummary(supplierId: string): {
    pendingAmount: number;
    confirmedAmount: number;
    paidAmount: number;
    totalSettled: number;
    currentMonthEstimate: number;
  } {
    const statuses = ['pending', 'confirmed', 'paid'];
    const amounts: Record<string, number> = { pending: 0, confirmed: 0, paid: 0 };

    const rows: any[] = db.prepare(`
      SELECT status, SUM(settlement_amount) as amount
      FROM settlements
      WHERE supplier_id = ? AND status IN ('pending', 'confirmed', 'paid')
      GROUP BY status
    `).all(supplierId);

    rows.forEach(r => { amounts[r.status] = r.amount || 0; });

    const date = new Date();
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);

    const currentMonth: any = db.prepare(`
      SELECT COALESCE(SUM(final_amount), 0) as total
      FROM orders
      WHERE supplier_id = ? AND status = 'completed' AND finish_time >= ?
    `).get(supplierId, startOfMonth);

    const supplier: any = db.prepare('SELECT settlement_ratio FROM suppliers WHERE id = ?').get(supplierId);
    const ratio = supplier?.settlement_ratio || 0.9;

    return {
      pendingAmount: amounts.pending,
      confirmedAmount: amounts.confirmed,
      paidAmount: amounts.paid,
      totalSettled: amounts.pending + amounts.confirmed + amounts.paid,
      currentMonthEstimate: Math.round(currentMonth.total * ratio * 100) / 100
    };
  }
}

export const settlementService = new SettlementService();
