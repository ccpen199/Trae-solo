import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
      COALESCE(bcnt.count, 0) AS booking_count,
      COALESCE(bcnt.total, 0) AS booking_value
    FROM photographers p
    LEFT JOIN (
      SELECT photographer_id, COUNT(*) AS count, COALESCE(SUM(budget), 0) AS total
      FROM bookings
      WHERE status NOT IN ('cancelled')
      GROUP BY photographer_id
    ) bcnt ON bcnt.photographer_id = p.id
    ORDER BY p.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  if (!photographer) {
    return res.status(404).json({ success: false, message: '摄影师不存在' });
  }
  const portfolio = db.prepare('SELECT * FROM photographer_portfolio WHERE photographer_id = ? ORDER BY sort_order ASC').all(id);
  const packages = db.prepare('SELECT * FROM photographer_packages WHERE photographer_id = ? ORDER BY price ASC').all(id);
  const schedule = db.prepare('SELECT * FROM photographer_schedule WHERE photographer_id = ? ORDER BY date ASC').all(id);
  res.json({ success: true, data: { ...photographer, portfolio, packages, schedule } });
});

router.post('/', (req, res) => {
  const { name, style, city, phone, bio, avatar, rating } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ success: false, message: '摄影师姓名不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO photographers (name, style, city, phone, bio, avatar, rating)
    VALUES (@name, @style, @city, @phone, @bio, @avatar, @rating)
  `).run({ name, style: style || null, city: city || null, phone: phone || null, bio: bio || null, avatar: avatar || null, rating: rating || 0 });
  const created = db.prepare('SELECT * FROM photographers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '摄影师不存在' });
  }
  const { name, style, city, phone, bio, avatar, rating } = req.body ?? {};
  db.prepare(`
    UPDATE photographers SET
      name = COALESCE(@name, name),
      style = COALESCE(@style, style),
      city = COALESCE(@city, city),
      phone = COALESCE(@phone, phone),
      bio = COALESCE(@bio, bio),
      avatar = COALESCE(@avatar, avatar),
      rating = COALESCE(@rating, rating)
    WHERE id = @id
  `).run({ id, name: name ?? null, style: style ?? null, city: city ?? null, phone: phone ?? null, bio: bio ?? null, avatar: avatar ?? null, rating: rating ?? null });
  const updated = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

router.get('/:id/packages', (req, res) => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM photographer_packages WHERE photographer_id = ? ORDER BY price ASC').all(id);
  res.json({ success: true, data: rows });
});

router.post('/:id/packages', (req, res) => {
  const { id } = req.params;
  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  if (!photographer) {
    return res.status(404).json({ success: false, message: '摄影师不存在' });
  }
  const { name, price, description, includes } = req.body ?? {};
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: '套餐名称和价格不能为空' });
  }
  const result = db.prepare(`
    INSERT INTO photographer_packages (photographer_id, name, price, description, includes)
    VALUES (@photographer_id, @name, @price, @description, @includes)
  `).run({ photographer_id: Number(id), name, price: Number(price), description: description || null, includes: includes || null });
  const created = db.prepare('SELECT * FROM photographer_packages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

router.get('/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { month } = req.query;
  let rows;
  if (month) {
    const prefix = String(month);
    rows = db.prepare('SELECT * FROM photographer_schedule WHERE photographer_id = ? AND date LIKE ? ORDER BY date ASC').all(id, `${prefix}%`);
  } else {
    rows = db.prepare('SELECT * FROM photographer_schedule WHERE photographer_id = ? ORDER BY date ASC').all(id);
  }
  res.json({ success: true, data: rows });
});

router.post('/:id/schedule', (req, res) => {
  const { id } = req.params;
  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  if (!photographer) {
    return res.status(404).json({ success: false, message: '摄影师不存在' });
  }
  const { date, status } = req.body ?? {};
  if (!date) {
    return res.status(400).json({ success: false, message: '日期不能为空' });
  }
  db.prepare(`
    INSERT INTO photographer_schedule (photographer_id, date, status)
    VALUES (@photographer_id, @date, @status)
    ON CONFLICT(photographer_id, date) DO UPDATE SET status = @status
  `).run({ photographer_id: Number(id), date, status: status || 'available' });
  const row = db.prepare('SELECT * FROM photographer_schedule WHERE photographer_id = ? AND date = ?').get(id, date);
  res.json({ success: true, data: row });
});

router.get('/:id/portfolio', (req, res) => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM photographer_portfolio WHERE photographer_id = ? ORDER BY sort_order ASC').all(id);
  res.json({ success: true, data: rows });
});

router.post('/:id/portfolio', (req, res) => {
  const { id } = req.params;
  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(id);
  if (!photographer) {
    return res.status(404).json({ success: false, message: '摄影师不存在' });
  }
  const { title, category, image_url, description, sort_order } = req.body ?? {};
  const result = db.prepare(`
    INSERT INTO photographer_portfolio (photographer_id, title, category, image_url, description, sort_order)
    VALUES (@photographer_id, @title, @category, @image_url, @description, @sort_order)
  `).run({ photographer_id: Number(id), title: title || null, category: category || null, image_url: image_url || null, description: description || null, sort_order: sort_order ?? 0 });
  const created = db.prepare('SELECT * FROM photographer_portfolio WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

export default router;
