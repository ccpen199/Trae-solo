const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, layout_type, style, budget_range, min_area, max_area, keyword, sort = 'newest' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (layout_type) { where.push('layout_type = ?'); params.push(layout_type); }
  if (style) { where.push('style = ?'); params.push(style); }
  if (budget_range) { where.push('budget_range = ?'); params.push(budget_range); }
  if (min_area) { where.push('area >= ?'); params.push(min_area); }
  if (max_area) { where.push('area <= ?'); params.push(max_area); }
  if (keyword) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  let orderBy = 'created_at DESC';
  if (sort === 'popular') orderBy = 'view_count DESC, like_count DESC';
  if (sort === 'price_asc') orderBy = 'total_cost ASC';
  if (sort === 'price_desc') orderBy = 'total_cost DESC';
  
  const list = db.prepare(`
    SELECT c.*, u.name as owner_name, co.name as company_name, d.name as designer_name
    FROM cases c
    LEFT JOIN users u ON c.owner_id = u.id
    LEFT JOIN companies co ON c.company_id = co.id
    LEFT JOIN users d ON c.designer_id = d.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases c ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.get('/filters/options', (req, res) => {
  const layouts = db.prepare('SELECT DISTINCT layout_type as label, layout_type as value FROM cases WHERE layout_type IS NOT NULL').all();
  const styles = db.prepare('SELECT DISTINCT style as label, style as value FROM cases WHERE style IS NOT NULL').all();
  const budgets = db.prepare('SELECT DISTINCT budget_range as label, budget_range as value FROM cases WHERE budget_range IS NOT NULL').all();
  const areas = [
    { label: '60㎡以下', min: 0, max: 60 },
    { label: '60-90㎡', min: 60, max: 90 },
    { label: '90-120㎡', min: 90, max: 120 },
    { label: '120-150㎡', min: 120, max: 150 },
    { label: '150-200㎡', min: 150, max: 200 },
    { label: '200㎡以上', min: 200, max: 9999 }
  ];
  
  res.json({ code: 200, data: { layouts, styles, budgets, areas } });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE cases SET view_count = view_count + 1 WHERE id = ?').run(id);
  
  const caseItem = db.prepare(`
    SELECT c.*, u.name as owner_name, co.name as company_name, d.name as designer_name,
           u.phone as owner_phone, co.contact_phone as company_phone
    FROM cases c
    LEFT JOIN users u ON c.owner_id = u.id
    LEFT JOIN companies co ON c.company_id = co.id
    LEFT JOIN users d ON c.designer_id = d.id
    WHERE c.id = ?
  `).get(id);
  
  if (!caseItem) {
    return res.json({ code: 404, message: '案例不存在' });
  }
  
  const images = db.prepare('SELECT * FROM case_images WHERE case_id = ? ORDER BY sort_order').all(id);
  
  res.json({ code: 200, data: { ...caseItem, images } });
});

router.post('/:id/like', auth, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE cases SET like_count = like_count + 1 WHERE id = ?').run(id);
  const caseItem = db.prepare('SELECT like_count FROM cases WHERE id = ?').get(id);
  res.json({ code: 200, data: caseItem });
});

router.post('/migrate-style', auth, (req, res) => {
  const { case_id, target_styles, area } = req.body;
  
  const styles = target_styles || ['北欧', '新中式', '轻奢'];
  const mockResults = styles.map(style => ({
    style,
    image_url: `https://images.unsplash.com/photo-${1600000000000 + Math.floor(Math.random() * 100000000)}?w=800&h=600&fit=crop`
  }));
  
  res.json({ 
    code: 200, 
    message: 'AI风格迁移已完成',
    data: {
      case_id,
      results: mockResults
    }
  });
});

router.post('/migrate/style', auth, (req, res) => {
  const { floor_plan_url, style } = req.body;
  
  const result = db.prepare(`
    INSERT INTO style_migrations (user_id, floor_plan_url, style, status)
    VALUES (?, ?, ?, 'completed')
  `).run(req.user.id, floor_plan_url, style);
  
  const mockResults = [
    `https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop`
  ];
  
  setTimeout(() => {
    db.prepare(`
      UPDATE style_migrations SET result_image_url = ? WHERE id = ?
    `).run(mockResults.join(','), result.lastInsertRowid);
  }, 100);
  
  res.json({ 
    code: 200, 
    message: 'AI风格迁移已完成',
    data: {
      id: result.lastInsertRowid,
      results: mockResults.map(url => ({ style, image_url: url }))
    }
  });
});

router.post('/', auth, (req, res) => {
  const { title, description, layout_type, style, budget_range, area, city, community, main_image, total_cost } = req.body;
  
  const result = db.prepare(`
    INSERT INTO cases (title, description, owner_id, company_id, designer_id, layout_type, style, budget_range, area, city, community, main_image, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, description, req.user.id, req.user.company_id,
    req.user.role === 'designer' ? req.user.id : null,
    layout_type, style, budget_range, area, city, community, main_image, total_cost
  );
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

module.exports = router;
