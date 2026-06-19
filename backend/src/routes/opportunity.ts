import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, requireVerifiedEnterprise, type AuthRequest } from '../middleware.js';

const router = express.Router();

const OpportunitySchema = z.object({
  type: z.enum(['supply', 'demand']),
  category: z.enum(['废金属', '二手设备', '废塑料']),
  sub_category: z.string().min(1),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  quantity: z.number().positive(),
  unit: z.string().default('吨'),
  min_price: z.number().nonnegative(),
  max_price: z.number().nonnegative(),
  price_unit: z.string().default('元/吨'),
  region: z.string().min(2),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  quality_grade: z.string().optional(),
  available_date: z.string(),
  expiry_date: z.string()
});

router.post('/', authMiddleware, requireVerifiedEnterprise, (req: AuthRequest, res) => {
  try {
    const data = OpportunitySchema.parse(req.body);
    if (data.min_price > data.max_price) {
      res.status(400).json({ error: '最低价不能大于最高价' });
      return;
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO business_opportunities (
        id, publisher_id, publisher_enterprise_id, type, category, sub_category,
        title, description, quantity, unit, min_price, max_price, price_unit,
        region, latitude, longitude, quality_grade, available_date, expiry_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.id, req.userEnterprise!.id,
      data.type, data.category, data.sub_category,
      data.title, data.description, data.quantity, data.unit,
      data.min_price, data.max_price, data.price_unit,
      data.region, data.latitude || null, data.longitude || null,
      data.quality_grade || null, data.available_date, data.expiry_date
    );

    const activeSubscriptions = db.prepare(`
      SELECT s.*, u.email, u.phone
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = 1
    `).all() as any[];

    for (const sub of activeSubscriptions) {
      const categories = JSON.parse(sub.categories || '[]');
      const regions = JSON.parse(sub.regions || '[]');
      
      const categoryMatch = categories.length === 0 || categories.includes(data.category);
      const regionMatch = regions.length === 0 || regions.some((r: string) => data.region.includes(r));
      const quantityMatch = (!sub.min_quantity || data.quantity >= sub.min_quantity) && 
                           (!sub.max_quantity || data.quantity <= sub.max_quantity);
      const priceMatch = (!sub.min_price || data.max_price >= sub.min_price) && 
                        (!sub.max_price || data.min_price <= sub.max_price);

      if (categoryMatch && regionMatch && quantityMatch && priceMatch && sub.user_id !== req.user!.id) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, content, related_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), sub.user_id, 'opportunity',
          data.type === 'supply' ? '新供应商机匹配' : '新需求商机匹配',
          `【${data.category}/${data.sub_category}】${data.title}，${data.quantity}${data.unit}，价格区间${data.min_price}-${data.max_price}${data.price_unit}`,
          id
        );
      }
    }

    const regions = ['北京', '上海', '广州', '深圳', '江苏', '浙江', '山东', '河北'];
    const regionIdx = Math.floor(Math.random() * regions.length);
    const latitudes = [39.9, 31.2, 23.1, 22.5, 32.0, 30.3, 36.6, 38.0];
    const longitudes = [116.4, 121.5, 113.3, 114.1, 118.8, 120.2, 117.0, 114.5];

    const existingHeatmap = db.prepare(`
      SELECT id FROM heatmap_data 
      WHERE category = ? AND sub_category = ? AND region = ? AND record_date = date('now')
    `).get(data.category, data.sub_category, data.region) as any;

    if (!existingHeatmap) {
      db.prepare(`
        INSERT INTO heatmap_data (
          id, region, province, city, latitude, longitude, category, sub_category,
          supply_volume, demand_volume, avg_price, price_change_pct, record_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
      `).run(
        uuidv4(), data.region, data.region, data.region,
        latitudes[regionIdx], longitudes[regionIdx],
        data.category, data.sub_category,
        data.type === 'supply' ? data.quantity : 0,
        data.type === 'demand' ? data.quantity : 0,
        Math.round((data.min_price + data.max_price) / 2),
        (Math.random() * 10 - 5).toFixed(2)
      );
    } else {
      db.prepare(`
        UPDATE heatmap_data SET
          supply_volume = supply_volume + ?,
          demand_volume = demand_volume + ?,
          avg_price = ROUND((avg_price + ?) / 2, 2)
        WHERE id = ?
      `).run(
        data.type === 'supply' ? data.quantity : 0,
        data.type === 'demand' ? data.quantity : 0,
        Math.round((data.min_price + data.max_price) / 2),
        existingHeatmap.id
      );
    }

    res.status(201).json({ id, message: '商机发布成功' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: '数据验证失败', details: err.errors });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { 
    type, category, sub_category, region, 
    min_price, max_price, min_quantity, max_quantity,
    status, page = '1', pageSize = '20', sort = 'created_at_desc'
  } = req.query;

  const where: string[] = [];
  const params: any[] = [];

  if (type) { where.push('type = ?'); params.push(type); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (sub_category) { where.push('sub_category LIKE ?'); params.push(`%${sub_category}%`); }
  if (region) { where.push('region LIKE ?'); params.push(`%${region}%`); }
  if (min_price) { where.push('max_price >= ?'); params.push(parseFloat(min_price as string)); }
  if (max_price) { where.push('min_price <= ?'); params.push(parseFloat(max_price as string)); }
  if (min_quantity) { where.push('quantity >= ?'); params.push(parseFloat(min_quantity as string)); }
  if (max_quantity) { where.push('quantity <= ?'); params.push(parseFloat(max_quantity as string)); }
  if (status) { where.push('status = ?'); params.push(status); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  let orderBy = 'created_at DESC';
  if (sort === 'price_asc') orderBy = 'min_price ASC';
  else if (sort === 'price_desc') orderBy = 'max_price DESC';
  else if (sort === 'quantity_desc') orderBy = 'quantity DESC';

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  const opportunities = db.prepare(`
    SELECT bo.*, e.company_name as publisher_name, e.credit_score, e.credit_rating,
           u.username, u.role
    FROM business_opportunities bo
    JOIN enterprises e ON bo.publisher_enterprise_id = e.id
    JOIN users u ON bo.publisher_id = u.id
    ${whereClause}
    ORDER BY bo.${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize as string), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM business_opportunities bo ${whereClause}
  `).get(...params) as any;

  res.json({
    opportunities,
    total: total.count,
    page: parseInt(page as string),
    pageSize: parseInt(pageSize as string)
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const opp = db.prepare(`
    SELECT bo.*, e.company_name as publisher_name, e.credit_score, e.credit_rating, e.region as company_region,
           u.username, u.role
    FROM business_opportunities bo
    JOIN enterprises e ON bo.publisher_enterprise_id = e.id
    JOIN users u ON bo.publisher_id = u.id
    WHERE bo.id = ?
  `).get(req.params.id) as any;

  if (!opp) {
    res.status(404).json({ error: '商机不存在' });
    return;
  }

  db.prepare('UPDATE business_opportunities SET views_count = views_count + 1 WHERE id = ?').run(req.params.id);
  opp.views_count += 1;

  res.json(opp);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const opp = db.prepare('SELECT * FROM business_opportunities WHERE id = ?').get(req.params.id) as any;
  if (!opp) {
    res.status(404).json({ error: '商机不存在' });
    return;
  }
  if (opp.publisher_id !== req.user!.id) {
    res.status(403).json({ error: '无权修改此商机' });
    return;
  }

  const { title, description, quantity, min_price, max_price, expiry_date, status } = req.body;
  db.prepare(`
    UPDATE business_opportunities SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      quantity = COALESCE(?, quantity),
      min_price = COALESCE(?, min_price),
      max_price = COALESCE(?, max_price),
      expiry_date = COALESCE(?, expiry_date),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title || null, description || null, quantity || null, min_price || null, max_price || null, expiry_date || null, status || null, req.params.id);

  res.json({ message: '商机更新成功' });
});

router.post('/subscriptions', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { categories, regions, min_quantity, max_quantity, min_price, max_price } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, categories, regions, min_quantity, max_quantity, min_price, max_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.id,
      JSON.stringify(categories || []),
      JSON.stringify(regions || []),
      min_quantity || null, max_quantity || null,
      min_price || null, max_price || null
    );

    res.status(201).json({ id, message: '订阅创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscriptions/my', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const subscriptions = db.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user!.id) as any[];

  res.json(subscriptions.map(s => ({
    ...s,
    categories: JSON.parse(s.categories || '[]'),
    regions: JSON.parse(s.regions || '[]')
  })));
});

router.put('/subscriptions/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id) as any;
  if (!sub || sub.user_id !== req.user!.id) {
    res.status(403).json({ error: '无权操作此订阅' });
    return;
  }

  const { categories, regions, min_quantity, max_quantity, min_price, max_price, is_active } = req.body;
  db.prepare(`
    UPDATE subscriptions SET
      categories = COALESCE(?, categories),
      regions = COALESCE(?, regions),
      min_quantity = COALESCE(?, min_quantity),
      max_quantity = COALESCE(?, max_quantity),
      min_price = COALESCE(?, min_price),
      max_price = COALESCE(?, max_price),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    categories ? JSON.stringify(categories) : null,
    regions ? JSON.stringify(regions) : null,
    min_quantity || null, max_quantity || null,
    min_price || null, max_price || null,
    is_active !== undefined ? is_active : null,
    req.params.id
  );

  res.json({ message: '订阅更新成功' });
});

router.delete('/subscriptions/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id) as any;
  if (!sub || sub.user_id !== req.user!.id) {
    res.status(403).json({ error: '无权删除此订阅' });
    return;
  }
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
  res.json({ message: '订阅已删除' });
});

export default router;
