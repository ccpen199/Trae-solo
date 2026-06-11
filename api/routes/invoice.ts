import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();

function mapInvoiceRow(row: any) {
  return {
    id: row.id,
    waybillId: row.waybill_id,
    waybillNo: row.waybill_no || '',
    invoiceNo: row.invoice_no,
    amount: row.amount,
    title: row.title,
    taxNo: row.tax_no,
    status: row.status,
    issuedAt: row.issued_at || undefined,
    downloadUrl: row.status === 'issued' ? `/api/invoice/${row.id}/download` : undefined,
    createdAt: row.created_at,
    failReason: row.fail_reason || undefined,
    ukeyStatus: row.ukey_status || 'connected',
    ukeyMessage: row.ukey_message || undefined,
  };
}

router.get('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { status } = req.query;
    let query = `SELECT inv.*, w.waybill_no FROM invoices inv LEFT JOIN waybills w ON inv.waybill_id = w.id`;
    const params: unknown[] = [];
    if (status) {
      query += ' WHERE inv.status = ?';
      params.push(status as string);
    }
    query += ' ORDER BY inv.created_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    res.json(rows.map(mapInvoiceRow));
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare(`SELECT inv.*, w.waybill_no FROM invoices inv LEFT JOIN waybills w ON inv.waybill_id = w.id WHERE inv.id = ?`).get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    const reviewLogs = [
      { time: row.created_at, operator: '用户', action: 'submit', note: '提交开票申请' },
      row.fail_reason
        ? { time: row.updated_at || row.created_at, operator: '开票系统', action: 'reject', note: `开票失败: ${row.fail_reason}` }
        : row.status === 'issued'
        ? { time: row.issued_at || row.created_at, operator: '开票系统', action: 'issue', note: '电子发票开具成功' }
        : { time: row.created_at, operator: '开票系统', action: 'approve', note: '审核中，等待UKey响应' },
    ];
    res.json({ ...mapInvoiceRow(row), reviewLogs });
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.get('/ukey/status', (req, res) => {
  try {
    const connected = Math.random() > 0.15;
    res.json({
      connected,
      deviceName: '航天信息 Aisino UKey',
      deviceNo: 'UK' + Date.now().toString().slice(-10),
      version: 'V2.0.33_ZS_2024',
      status: connected ? 'online' : 'disconnected',
      message: connected ? 'UKey已连接，可正常开票' : 'UKey未检测到，请检查USB连接',
      lastHeartbeat: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check UKey status' });
  }
});

router.post('/:id/retry', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    const success = Math.random() > 0.25;
    if (success) {
      const issuedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(`UPDATE invoices SET status = 'issued', issued_at = ?, fail_reason = NULL, updated_at = datetime('now') WHERE id = ?`).run(issuedAt, req.params.id);
    } else {
      const reasons = ['UKey设备繁忙', '税号格式校验失败', '网络连接税局超时', '发票号段已用尽'];
      db.prepare(`UPDATE invoices SET status = 'failed', fail_reason = ?, updated_at = datetime('now') WHERE id = ?`).run(reasons[Math.floor(Math.random() * reasons.length)], req.params.id);
    }
    const row = db.prepare(`SELECT inv.*, w.waybill_no FROM invoices inv LEFT JOIN waybills w ON inv.waybill_id = w.id WHERE inv.id = ?`).get(req.params.id) as any;
    res.json(mapInvoiceRow(row));
  } catch (error) {
    console.error('Failed to retry invoice:', error);
    res.status(500).json({ error: 'Failed to retry invoice' });
  }
});

router.get('/:id/review-logs', (req, res) => {
  try {
    res.json([
      { id: 'r1', time: '2025-06-10 09:15:23', operator: '张三', action: 'submit', note: '提交开票申请，金额¥248.00' },
      { id: 'r2', time: '2025-06-10 09:20:01', operator: '开票系统', action: 'approve', note: '系统初审通过，等待UKey开具' },
      { id: 'r3', time: '2025-06-10 09:20:45', operator: 'UKey服务', action: 'issue', note: '电子发票开具完成，已同步至税局' },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review logs' });
  }
});

router.post('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { waybillId, amount, title, taxNo } = req.body;
    if (!waybillId || !amount || !title || !taxNo) {
      res.status(400).json({ error: 'waybillId, amount, title, and taxNo are required' });
      return;
    }

    const id = `inv${Date.now()}`;
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    const invoiceNo = `INV${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${seq}`;

    db.prepare(
      `INSERT INTO invoices (id, waybill_id, invoice_no, amount, title, tax_no, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, waybillId, invoiceNo, amount, title, taxNo);

    const row = db.prepare(`SELECT inv.*, w.waybill_no FROM invoices inv LEFT JOIN waybills w ON inv.waybill_id = w.id WHERE inv.id = ?`).get(id) as any;
    res.status(201).json(mapInvoiceRow(row));
  } catch (error) {
    console.error('Failed to create invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.get('/:id/download', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare(`SELECT inv.*, w.waybill_no FROM invoices inv LEFT JOIN waybills w ON inv.waybill_id = w.id WHERE inv.id = ?`).get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    if (row.status !== 'issued') {
      res.status(400).json({ error: 'Invoice is not issued yet' });
      return;
    }

    res.json({
      success: true,
      downloadUrl: `https://invoice.example.com/download/${row.invoice_no}.pdf`,
      invoiceNo: row.invoice_no,
      fileName: `发票_${row.invoice_no}.pdf`,
    });
  } catch (error) {
    console.error('Failed to download invoice:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

export default router;
