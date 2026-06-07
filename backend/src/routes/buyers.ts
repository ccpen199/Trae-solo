import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    const total = (db.prepare('SELECT COUNT(*) as cnt FROM buyers').get() as any).cnt;
    const rows = db.prepare('SELECT * FROM buyers ORDER BY id DESC LIMIT ? OFFSET ?').all(sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const buyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(req.params.id) as any;
    if (!buyer) { res.json({ code: -1, message: '买家不存在' }); return; }
    res.json({ code: 0, data: buyer, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const b = req.body;
    const result = db.prepare(`
      INSERT INTO buyers (name, phone, id_card, has_local_hukou, social_insurance_years, existing_properties, marital_status, budget_min, budget_max, preferred_districts, preferred_rooms, mortgage_pre_approved, preference_tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(b.name, b.phone, b.id_card, b.has_local_hukou || 0, b.social_insurance_years || 0, b.existing_properties || 0, b.marital_status, b.budget_min, b.budget_max, b.preferred_districts ? JSON.stringify(b.preferred_districts) : null, b.preferred_rooms, b.mortgage_pre_approved || 0, b.preference_tags ? JSON.stringify(b.preference_tags) : null);

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE buyers SET name=COALESCE(?,name), phone=COALESCE(?,phone), id_card=COALESCE(?,id_card),
        has_local_hukou=COALESCE(?,has_local_hukou), social_insurance_years=COALESCE(?,social_insurance_years),
        existing_properties=COALESCE(?,existing_properties), marital_status=COALESCE(?,marital_status),
        budget_min=COALESCE(?,budget_min), budget_max=COALESCE(?,budget_max),
        preferred_districts=COALESCE(?,preferred_districts), preferred_rooms=COALESCE(?,preferred_rooms),
        mortgage_pre_approved=COALESCE(?,mortgage_pre_approved), preference_tags=COALESCE(?,preference_tags),
        updated_at=datetime('now','localtime')
      WHERE id = ?
    `).run(b.name, b.phone, b.id_card, b.has_local_hukou, b.social_insurance_years, b.existing_properties, b.marital_status, b.budget_min, b.budget_max, b.preferred_districts ? JSON.stringify(b.preferred_districts) : undefined, b.preferred_rooms, b.mortgage_pre_approved, b.preference_tags ? JSON.stringify(b.preference_tags) : undefined, req.params.id);

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
