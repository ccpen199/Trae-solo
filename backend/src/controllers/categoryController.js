const db = require('../models/database');

exports.getCategories = (req, res) => {
  const { parent_id = 0 } = req.query;
  
  const categories = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM listings WHERE category_id = c.id AND status = 'active') as listing_count
    FROM categories c
    WHERE c.parent_id = ? AND c.is_active = 1
    ORDER BY c.sort_order ASC, c.id ASC
  `).all(parent_id);

  res.json({ categories });
};

exports.getAllCategories = (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
  `).all();

  const tree = buildCategoryTree(categories, 0);
  res.json({ categories: tree });
};

function buildCategoryTree(categories, parentId) {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id)
    }));
}

exports.getCategoryByCode = (req, res) => {
  const { code } = req.params;
  const category = db.prepare('SELECT * FROM categories WHERE code = ?').get(code);
  
  if (!category) {
    return res.status(404).json({ error: '分类不存在' });
  }

  res.json({ category });
};
