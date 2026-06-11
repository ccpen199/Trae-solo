import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, type, page = 1, pageSize = 10 } = req.query;

  let sql = `
    SELECT
      b.*,
      c.order_no,
      c.cargo_name,
      w.waybill_no,
      u.username as owner_name
    FROM bills b
    LEFT JOIN cargo c ON b.order_id = c.id
    LEFT JOIN waybills w ON b.waybill_id = w.id
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND b.type = ?';
    params.push(type);
  }

  const countSql = sql.replace('SELECT b.*, c.order_no, c.cargo_name, w.waybill_no, u.username as owner_name', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    billNo: row.bill_no,
    orderId: row.order_id,
    orderNo: row.order_no,
    cargoName: row.cargo_name,
    waybillId: row.waybill_id,
    waybillNo: row.waybill_no,
    ownerName: row.owner_name,
    amount: row.amount,
    type: row.type,
    status: row.status,
    invoiceStatus: row.invoice_status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const row = db.prepare(`
    SELECT
      b.*,
      c.order_no,
      c.cargo_name,
      c.start_city,
      c.end_city,
      w.waybill_no,
      u.username as owner_name,
      u.company_name as owner_company,
      u.phone as owner_phone
    FROM bills b
    LEFT JOIN cargo c ON b.order_id = c.id
    LEFT JOIN waybills w ON b.waybill_id = w.id
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!row) {
    return res.error('账单不存在', 404);
  }

  const invoiceRow = db.prepare('SELECT * FROM invoices WHERE bill_id = ?').get(id) as any;

  const bill = {
    id: row.id,
    billNo: row.bill_no,
    order: {
      id: row.order_id,
      orderNo: row.order_no,
      cargoName: row.cargo_name,
      startCity: row.start_city,
      endCity: row.end_city,
    },
    waybill: {
      id: row.waybill_id,
      waybillNo: row.waybill_no,
    },
    owner: {
      name: row.owner_name,
      company: row.owner_company,
      phone: row.owner_phone,
    },
    amount: row.amount,
    type: row.type,
    status: row.status,
    invoiceStatus: row.invoice_status,
    invoice: invoiceRow ? {
      id: invoiceRow.id,
      invoiceNo: invoiceRow.invoice_no,
      type: invoiceRow.type,
      amount: invoiceRow.amount,
      taxAmount: invoiceRow.tax_amount,
      totalAmount: invoiceRow.total_amount,
      buyerInfo: JSON.parse(invoiceRow.buyer_info),
      status: invoiceRow.status,
      issuedAt: invoiceRow.issued_at,
      pdfUrl: invoiceRow.pdf_url,
    } : null,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };

  res.success(bill, '获取成功');
});

router.post('/:id/invoice', authMiddleware, roleMiddleware(['owner', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, buyerInfo } = req.body;

  if (!type || !buyerInfo) {
    return res.error('请填写完整的发票信息', 400);
  }

  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as any;
  if (!bill) {
    return res.error('账单不存在', 404);
  }

  if (bill.invoice_status === 'invoiced') {
    return res.error('该账单已开票', 400);
  }

  const invoiceId = uuidv4();
  const invoiceNo = `INV${Date.now()}`;
  const taxRate = 0.09;
  const amount = bill.amount / (1 + taxRate);
  const taxAmount = bill.amount - amount;

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO invoices (
        id, invoice_no, bill_id, type, amount, tax_amount, total_amount, buyer_info, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      invoiceId,
      invoiceNo,
      id,
      type,
      Math.round(amount * 100) / 100,
      Math.round(taxAmount * 100) / 100,
      bill.amount,
      JSON.stringify(buyerInfo)
    );

    db.prepare('UPDATE bills SET invoice_status = ? WHERE id = ?').run('applied', id);
  });

  transaction();

  res.success({
    id: invoiceId,
    invoiceNo,
    status: 'draft',
  }, '发票申请提交成功');
});

export default router;
