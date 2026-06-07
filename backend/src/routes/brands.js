const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const dataCollector = require('../engines/dataCollector');

router.get('/', (req, res) => {
  const { industry, region, first_letter, level, search, page = 1, limit = 20 } = req.query;
  
  let query = 'SELECT * FROM brands WHERE status = ?';
  const params = ['active'];

  if (industry) {
    query += ' AND industry = ?';
    params.push(industry);
  }
  if (region) {
    query += ' AND region = ?';
    params.push(region);
  }
  if (first_letter) {
    query += ' AND first_letter = ?';
    params.push(first_letter);
  }
  if (level) {
    query += ' AND level = ?';
    params.push(level);
  }
  if (search) {
    query += ' AND (name LIKE ? OR english_name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQuery).get(...params).count;

  query += ' ORDER BY overall_score DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const brands = db.prepare(query).all(...params);
  
  brands.forEach(b => {
    if (b.vote_count && b.sales_volume && b.reputation_score) {
      b.overall_score = (b.reputation_score * 0.4 + (b.sales_volume / 100) * 0.3 + (b.vote_count / 100) * 0.3).toFixed(1);
    }
  });

  res.json({
    data: brands,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

router.get('/filters', (req, res) => {
  const industries = db.prepare('SELECT DISTINCT industry FROM brands WHERE status = ? ORDER BY industry').all('active');
  const regions = db.prepare('SELECT DISTINCT region FROM brands WHERE status = ? ORDER BY region').all('active');
  const levels = db.prepare('SELECT DISTINCT level FROM brands WHERE status = ? ORDER BY level').all('active');
  const letters = db.prepare('SELECT DISTINCT first_letter FROM brands WHERE status = ? ORDER BY first_letter').all('active');

  res.json({
    industries: industries.map(i => i.industry),
    regions: regions.map(r => r.region),
    levels: levels.map(l => l.level),
    first_letters: letters.map(l => l.first_letter)
  });
});

router.get('/:id', (req, res) => {
  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  const shops = db.prepare('SELECT * FROM brand_online_shops WHERE brand_id = ? ORDER BY monthly_sales DESC').all(req.params.id);
  const sentiments = db.prepare('SELECT * FROM brand_sentiments WHERE brand_id = ? ORDER BY published_at DESC LIMIT 20').all(req.params.id);

  brand.shops = shops;
  brand.sentiments = sentiments;

  res.json(brand);
});

router.post('/:id/vote', (req, res) => {
  const { score = 1 } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  
  const existing = db.prepare('SELECT id FROM votes WHERE brand_id = ? AND ip_address = ?').get(req.params.id, ip);
  if (existing) {
    return res.status(400).json({ error: 'Already voted from this IP' });
  }

  db.prepare('INSERT INTO votes (brand_id, ip_address, score) VALUES (?, ?, ?)')
    .run(req.params.id, ip, score);
  
  db.prepare('UPDATE brands SET vote_count = vote_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ success: true, message: 'Vote recorded' });
});

router.post('/', requireAdmin, (req, res) => {
  const { name, english_name, industry, category, region, description, level } = req.body;
  
  const info = db.prepare(`
    INSERT INTO brands (name, english_name, industry, category, region, description, level, first_letter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, english_name, industry, category, region, description, level || 'C',
    name.charAt(0).toUpperCase()
  );

  res.json({ id: info.lastInsertRowid, success: true });
});

router.put('/:id', requireAdmin, (req, res) => {
  const fields = ['name', 'english_name', 'industry', 'category', 'region', 'description', 'level'];
  const updates = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ success: true });
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE brands SET status = ? WHERE id = ?').run('inactive', req.params.id);
  res.json({ success: true });
});

router.post('/:id/collect', requireAdmin, async (req, res) => {
  try {
    const result = await dataCollector.collectBrandData(parseInt(req.params.id));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/traceability', (req, res) => {
  const trace = dataCollector.getDataTraceability('brand', parseInt(req.params.id));
  res.json(trace);
});

module.exports = router;
