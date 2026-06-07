import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/appointments', (req: Request, res: Response) => {
  try {
    const { agent_id, buyer_id, status, page = '1', pageSize = '10' } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (agent_id) { where += ' AND a.agent_id = ?'; params.push(Number(agent_id)); }
    if (buyer_id) { where += ' AND a.buyer_id = ?'; params.push(Number(buyer_id)); }
    if (status) { where += ' AND a.status = ?'; params.push(status); }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM appointments a ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`
      SELECT a.*, l.title as listing_title, ag.name as agent_name, b.name as buyer_name
      FROM appointments a
      LEFT JOIN listings l ON a.listing_id = l.id
      LEFT JOIN agents ag ON a.agent_id = ag.id
      LEFT JOIN buyers b ON a.buyer_id = b.id
      ${where}
      ORDER BY a.appointment_time DESC LIMIT ? OFFSET ?
    `).all(...params, sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/appointments', (req: Request, res: Response) => {
  try {
    const a = req.body;
    const firstListing = db.prepare("SELECT id, agent_id FROM listings WHERE status = '在售' ORDER BY id LIMIT 1").get() as any;
    const firstAgent = db.prepare("SELECT id FROM agents WHERE status = '在岗' ORDER BY id LIMIT 1").get() as any;
    const firstBuyer = db.prepare('SELECT id FROM buyers ORDER BY id LIMIT 1').get() as any;
    const result = db.prepare(`
      INSERT INTO appointments (listing_id, agent_id, buyer_id, appointment_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      a.listing_id || firstListing?.id,
      a.agent_id || firstListing?.agent_id || firstAgent?.id,
      a.buyer_id || firstBuyer?.id,
      a.appointment_time || new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace('T', ' '),
      a.status || '待确认',
      a.notes || '线上提交带看预约'
    );

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/appointments/:id', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE appointments SET status = COALESCE(?, status) WHERE id = ?').run(status, req.params.id);

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/contracts', (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '10' } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND c.status = ?'; params.push(status); }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM contracts c ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`
      SELECT c.*, l.title as listing_title, ag.name as agent_name, b.name as buyer_name
      FROM contracts c
      LEFT JOIN listings l ON c.listing_id = l.id
      LEFT JOIN agents ag ON c.agent_id = ag.id
      LEFT JOIN buyers b ON c.buyer_id = b.id
      ${where}
      ORDER BY c.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/contracts', (req: Request, res: Response) => {
  try {
    const c = req.body;
    const firstListing = db.prepare("SELECT id, agent_id, price FROM listings WHERE status = '在售' ORDER BY id LIMIT 1").get() as any;
    const firstAgent = db.prepare("SELECT id FROM agents WHERE status = '在岗' ORDER BY id LIMIT 1").get() as any;
    const firstBuyer = db.prepare('SELECT id FROM buyers ORDER BY id LIMIT 1').get() as any;
    const result = db.prepare(`
      INSERT INTO contracts (listing_id, agent_id, buyer_id, contract_no, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      c.listing_id || firstListing?.id,
      c.agent_id || firstListing?.agent_id || firstAgent?.id,
      c.buyer_id || firstBuyer?.id,
      c.contract_no || `HT-${Date.now()}`,
      c.amount || Math.round((firstListing?.price || 100) * 10000),
      c.status || '起草中'
    );

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/contracts/:id', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status === '已签署') {
      db.prepare(`UPDATE contracts SET status = ?, signed_at = datetime('now','localtime') WHERE id = ?`).run(status, req.params.id);
    } else {
      db.prepare('UPDATE contracts SET status = COALESCE(?, status) WHERE id = ?').run(status, req.params.id);
    }

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
