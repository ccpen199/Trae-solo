/**
 * Lease service
 */
import db from '../db.js';

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function mockZhimaCredit(userId: number): number {
  const user = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as any;
  const base = user?.credit_score || 650;
  const variance = Math.floor(Math.random() * 41) - 20;
  return Math.max(350, Math.min(950, base + variance));
}

export function listLeases(status: string | undefined, page = 1, limit = 20) {
  const where = status ? 'WHERE l.status = ?' : '';
  const args: any[] = [];
  if (status) args.push(status);
  const count = (db.prepare(`SELECT COUNT(*) as c FROM leases l ${where}`).get(...args) as any).c;
  const offset = (page - 1) * limit;
  const list = db.prepare(`
    SELECT l.*,
           p.name as property_name, p.address as property_address,
           t.name as tenant_name, t.phone as tenant_phone,
           t.credit_score,
           a.name as agent_name,
           (SELECT COUNT(*) FROM rent_payments rp WHERE rp.lease_id = l.id AND rp.status = 'paid') as payment_history,
           (SELECT COUNT(*) FROM rent_payments rp WHERE rp.lease_id = l.id AND rp.status = 'overdue') as overdue_count,
           (SELECT MIN(due_date) FROM rent_payments rp WHERE rp.lease_id = l.id AND rp.status = 'pending' ORDER BY due_date LIMIT 1) as next_payment_date
    FROM leases l
    LEFT JOIN properties p ON l.property_id = p.id
    LEFT JOIN users t ON l.tenant_id = t.id
    LEFT JOIN users a ON l.agent_id = a.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);
  return { list, total: count, page, limit };
}

export function getLeaseDetail(id: number) {
  const lease = db.prepare(`
    SELECT l.*,
           p.name as property_name, p.address as property_address, p.area as property_area,
           t.name as tenant_name, t.phone as tenant_phone, t.credit_score as tenant_credit_score,
           a.name as agent_name, a.phone as agent_phone
    FROM leases l
    LEFT JOIN properties p ON l.property_id = p.id
    LEFT JOIN users t ON l.tenant_id = t.id
    LEFT JOIN users a ON l.agent_id = a.id
    WHERE l.id = ?
  `).get(id) as any;
  if (!lease) return null;
  const payments = db.prepare('SELECT * FROM rent_payments WHERE lease_id = ? ORDER BY due_date').all(id);
  const zhimaScore = mockZhimaCredit(lease.tenant_id);
  return {
    lease,
    payments,
    deposit: {
      amount: lease.deposit,
      status: lease.deposit_status,
      heldAt: lease.created_at
    },
    creditScore: {
      internal: lease.tenant_credit_score,
      zhima: zhimaScore,
      level: zhimaScore >= 700 ? '极好' : zhimaScore >= 650 ? '优秀' : zhimaScore >= 600 ? '中等' : '较低'
    }
  };
}

export function createLease(data: any) {
  const info = db.prepare(`
    INSERT INTO leases (property_id, tenant_id, agent_id, start_date, end_date, monthly_rent, deposit, deposit_status, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'held', 'auto', 'active')
  `).run(data.propertyId, data.tenantId, data.agentId, data.startDate, data.endDate, data.monthlyRent, data.deposit);
  const leaseId = Number(info.lastInsertRowid);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const insertPayment = db.prepare(`INSERT INTO rent_payments (lease_id, amount, due_date, status) VALUES (?, ?, ?, 'pending')`);
  for (let i = 0; i < months; i++) {
    const due = addMonths(data.startDate, i);
    insertPayment.run(leaseId, data.monthlyRent, due);
  }

  db.prepare(`UPDATE properties SET status = 'rented', updated_at = datetime('now') WHERE id = ?`).run(data.propertyId);
  return { id: leaseId, paymentCount: months };
}

export function deductPayment(leaseId: number) {
  const pending = db.prepare(`SELECT * FROM rent_payments WHERE lease_id = ? AND status = 'pending' ORDER BY due_date LIMIT 1`).get(leaseId) as any;
  if (!pending) throw new Error('没有待支付的租金');
  const paidDate = new Date().toISOString().slice(0, 10);
  const due = new Date(pending.due_date);
  const today = new Date(paidDate);
  const isOverdue = today > due;

  db.prepare(`UPDATE rent_payments SET status = ?, paid_date = ? WHERE id = ?`)
    .run(isOverdue ? 'overdue' : 'paid', paidDate, pending.id);

  const bonusSetting = db.prepare("SELECT value FROM settings WHERE key = 'credit_score_on_time_bonus'").get() as any;
  const penaltySetting = db.prepare("SELECT value FROM settings WHERE key = 'credit_score_overdue_penalty'").get() as any;
  const bonus = bonusSetting ? parseInt(bonusSetting.value) : 5;
  const penalty = penaltySetting ? parseInt(penaltySetting.value) : 10;
  const lease = db.prepare('SELECT tenant_id FROM leases WHERE id = ?').get(leaseId) as any;
  if (lease) {
    const delta = isOverdue ? -penalty : bonus;
    db.prepare(`UPDATE users SET credit_score = MAX(350, MIN(950, credit_score + ?)) WHERE id = ?`).run(delta, lease.tenant_id);
  }

  return { paymentId: pending.id, status: isOverdue ? 'overdue' : 'paid', paidDate, creditDelta: isOverdue ? -penalty : bonus };
}

export function terminateLease(id: number, reason: string) {
  db.prepare(`UPDATE leases SET status = 'terminated', updated_at = datetime('now') WHERE id = ?`).run(id);
  const lease = db.prepare('SELECT property_id FROM leases WHERE id = ?').get(id) as any;
  if (lease) {
    db.prepare(`UPDATE properties SET status = 'active', updated_at = datetime('now') WHERE id = ?`).run(lease.property_id);
  }
  return { success: true, reason };
}

export function updateLease(id: number, data: any) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE leases SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...data, id });
  return { updated: true };
}
