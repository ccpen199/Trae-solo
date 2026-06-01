const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin, requireAdminLevel } = require('../middleware/auth');
const { generateHeatmapData, checkSensitiveWords } = require('../utils/validators');

router.get('/dashboard', authenticateAdmin, (req, res) => {
  const regionFilter = req.admin.region_code ? `WHERE region_code = '${req.admin.region_code}'` : '';
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    total_jobs: db.prepare(`SELECT COUNT(*) as count FROM jobs ${regionFilter ? `WHERE region_code = '${req.admin.region_code}'` : ''}`).get().count,
    total_properties: db.prepare(`SELECT COUNT(*) as count FROM properties ${regionFilter ? `WHERE region_code = '${req.admin.region_code}'` : ''}`).get().count,
    total_cars: db.prepare(`SELECT COUNT(*) as count FROM used_cars ${regionFilter ? `WHERE region_code = '${req.admin.region_code}'` : ''}`).get().count,
    total_news: db.prepare(`SELECT COUNT(*) as count FROM news ${regionFilter ? `WHERE region_code = '${req.admin.region_code}'` : ''}`).get().count,
    pending_news: db.prepare(`SELECT COUNT(*) as count FROM news WHERE status = 0 ${regionFilter ? `AND region_code = '${req.admin.region_code}'` : ''}`).get().count,
    pending_jobs: db.prepare(`SELECT COUNT(*) as count FROM jobs WHERE status = 0 ${regionFilter ? `AND region_code = '${req.admin.region_code}'` : ''}`).get().count,
  };
  res.json({ stats });
});

router.get('/sensitive-words', authenticateAdmin, (req, res) => {
  const { category, keyword } = req.query;
  let sql = 'SELECT * FROM sensitive_words WHERE 1=1';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    sql += ' AND word LIKE ?';
    params.push(`%${keyword}%`);
  }
  sql += ' ORDER BY severity DESC, created_at DESC';
  const words = db.prepare(sql).all(...params);
  res.json({ words });
});

router.post('/sensitive-words', authenticateAdmin, requireAdminLevel(2), (req, res) => {
  const { word, category, severity } = req.body;
  if (!word) {
    return res.status(400).json({ error: '敏感词不能为空' });
  }
  try {
    const result = db.prepare('INSERT INTO sensitive_words (word, category, severity) VALUES (?, ?, ?)').run(word, category || 'general', severity || 1);
    res.json({ message: '添加成功', id: result.lastInsertRowid });
  } catch (err) {
    return res.status(400).json({ error: '该敏感词已存在' });
  }
});

router.delete('/sensitive-words/:id', authenticateAdmin, requireAdminLevel(2), (req, res) => {
  db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/validation-records', authenticateAdmin, (req, res) => {
  const { content_type, verified, page = 1, page_size = 20 } = req.query;
  let sql = 'SELECT * FROM cross_validation_records WHERE 1=1';
  const params = [];
  if (content_type) {
    sql += ' AND content_type = ?';
    params.push(content_type);
  }
  if (verified !== undefined) {
    sql += ' AND verified = ?';
    params.push(parseInt(verified));
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  const records = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as total FROM cross_validation_records').get().total;
  res.json({ records, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/heatmap', authenticateAdmin, (req, res) => {
  const { data_type, region_code } = req.query;
  const today = new Date().toISOString().split('T')[0];
  if (region_code && data_type) {
    generateHeatmapData(region_code, data_type);
  }
  let sql = `SELECT h.*, r.name as region_name FROM heatmap_data h
    LEFT JOIN admin_regions r ON h.region_code = r.code
    WHERE h.record_date = ?`;
  const params = [today];
  if (data_type) {
    sql += ' AND h.data_type = ?';
    params.push(data_type);
  }
  if (region_code) {
    sql += ' AND h.region_code = ?';
    params.push(region_code);
  }
  sql += ' ORDER BY h.match_score DESC';
  const data = db.prepare(sql).all(...params);
  const regions = db.prepare('SELECT code, name, lat, lng, poi_density FROM admin_regions WHERE level = 3').all();
  const heatmapPoints = regions.map(r => {
    const regionData = data.find(d => d.region_code === r.code);
    return {
      code: r.code,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      poi_density: r.poi_density,
      job: regionData?.data_type === 'job' ? regionData : null,
      rent: regionData?.data_type === 'rent' ? regionData : null,
      used_car: regionData?.data_type === 'used_car' ? regionData : null,
    };
  });
  res.json({ heatmapData: data, heatmapPoints });
});

router.get('/content-review', authenticateAdmin, (req, res) => {
  const { type, status } = req.query;
  const typeMap = {
    job: { table: 'jobs', title: 'title' },
    property: { table: 'properties', title: 'title' },
    used_car: { table: 'used_cars', title: 'title' },
  };
  if (!typeMap[type]) {
    return res.status(400).json({ error: '无效的内容类型' });
  }
  const table = typeMap[type].table;
  const titleField = typeMap[type].title;
  const filter = status !== undefined ? `AND status = ${parseInt(status)}` : '';
  const items = db.prepare(`SELECT * FROM ${table} WHERE 1=1 ${filter} ORDER BY created_at DESC LIMIT 50`).all();
  const validations = db.prepare(`SELECT * FROM cross_validation_records WHERE content_type = ? ORDER BY created_at DESC`).all(type);
  res.json({ items, validations });
});

router.post('/content/:type/:id/audit', authenticateAdmin, (req, res) => {
  const { status, comment } = req.body;
  const { type, id } = req.params;
  const typeMap = {
    job: { table: 'jobs' },
    property: { table: 'properties' },
    used_car: { table: 'used_cars' },
  };
  if (!typeMap[type]) {
    return res.status(400).json({ error: '无效的内容类型' });
  }
  const table = typeMap[type].table;
  db.prepare(`UPDATE ${table} SET status = ?, verified = ? WHERE id = ?`).run(
    parseInt(status), parseInt(status) === 1 ? 1 : 0, parseInt(id)
  );
  db.prepare(`UPDATE cross_validation_records SET verified = ?, check_result = ? WHERE content_type = ? AND content_id = ?`).run(
    parseInt(status) === 1 ? 1 : 0, JSON.stringify({ comment, admin: req.admin.username }), type, parseInt(id)
  );
  res.json({ message: '审核完成' });
});

router.post('/check-sensitive', authenticateAdmin, (req, res) => {
  const { text } = req.body;
  const result = checkSensitiveWords(text);
  res.json(result);
});

module.exports = router;
