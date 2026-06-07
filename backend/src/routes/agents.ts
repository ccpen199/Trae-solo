import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', search, specialty, status } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) { where += ' AND (name LIKE ? OR agency LIKE ? OR license_no LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (specialty) { where += ' AND specialties LIKE ?'; params.push(`%${specialty}%`); }
    if (status) { where += ' AND status = ?'; params.push(status); }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM agents ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`SELECT * FROM agents ${where} ORDER BY rating DESC, deal_count DESC LIMIT ? OFFSET ?`).all(...params, sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as any;
    if (!agent) { res.json({ code: -1, message: '经纪人不存在' }); return; }

    const listings = db.prepare('SELECT id, title, type, price, area, rooms, status FROM listings WHERE agent_id = ? ORDER BY updated_at DESC LIMIT 10').all(req.params.id);
    const appointments = db.prepare('SELECT a.*, l.title as listing_title, b.name as buyer_name FROM appointments a LEFT JOIN listings l ON a.listing_id = l.id LEFT JOIN buyers b ON a.buyer_id = b.id WHERE a.agent_id = ? ORDER BY a.appointment_time DESC LIMIT 10').all(req.params.id);

    res.json({ code: 0, data: { ...agent, listings, appointments }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const a = req.body;
    const result = db.prepare(`
      INSERT INTO agents (name, phone, avatar, license_no, agency, rating, showing_count, deal_count, commission_total, specialties, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.name, a.phone, a.avatar, a.license_no, a.agency, a.rating || 0, a.showing_count || 0, a.deal_count || 0, a.commission_total || 0, a.specialties ? JSON.stringify(a.specialties) : null, a.status || '在岗');

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const a = req.body;
    db.prepare(`
      UPDATE agents SET name=COALESCE(?,name), phone=COALESCE(?,phone), avatar=COALESCE(?,avatar),
        license_no=COALESCE(?,license_no), agency=COALESCE(?,agency), rating=COALESCE(?,rating),
        showing_count=COALESCE(?,showing_count), deal_count=COALESCE(?,deal_count),
        commission_total=COALESCE(?,commission_total), specialties=COALESCE(?,specialties),
        status=COALESCE(?,status), updated_at=datetime('now','localtime')
      WHERE id = ?
    `).run(a.name, a.phone, a.avatar, a.license_no, a.agency, a.rating, a.showing_count, a.deal_count, a.commission_total, a.specialties ? JSON.stringify(a.specialties) : undefined, a.status, req.params.id);

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
