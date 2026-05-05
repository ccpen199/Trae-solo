const pool = require('../config/database');
const redis = require('../config/redis');

const CACHE_KEY = 'categories:tree';

const categoryController = {
  async getCategoryTree(req, res) {
    try {
      const cached = await redis.getCache(CACHE_KEY);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

      const result = await pool.query(`
        SELECT id, parent_id, name, type, sort_order, is_active, created_at, updated_at
        FROM categories
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at ASC
      `);

      const categories = result.rows;
      const tree = buildTree(categories, null);
      
      await redis.setCache(CACHE_KEY, tree, 300);
      
      res.json({ success: true, data: tree });
    } catch (error) {
      console.error('Get category tree error:', error);
      res.status(500).json({ success: false, message: '获取类别树失败' });
    }
  },

  async createCategory(req, res) {
    try {
      const { parent_id, name, type = 'category', sort_order = 0 } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: '类别名称不能为空' });
      }

      const result = await pool.query(`
        INSERT INTO categories (parent_id, name, type, sort_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [parent_id || null, name.trim(), type, sort_order]);

      await redis.deleteCache(CACHE_KEY);
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ success: false, message: '创建类别失败' });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, parent_id, sort_order, is_active } = req.body;

      if (name === '' || (name && !name.trim())) {
        return res.status(400).json({ success: false, message: '类别名称不能为空' });
      }

      const result = await pool.query(`
        UPDATE categories 
        SET name = COALESCE($1, name),
            parent_id = COALESCE($2, parent_id),
            sort_order = COALESCE($3, sort_order),
            is_active = COALESCE($4, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [name ? name.trim() : null, parent_id, sort_order, is_active, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '类别不存在' });
      }

      await redis.deleteCache(CACHE_KEY);
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ success: false, message: '更新类别失败' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const childCheck = await pool.query(`
        SELECT COUNT(*) FROM categories WHERE parent_id = $1
      `, [id]);

      if (parseInt(childCheck.rows[0].count) > 0) {
        return res.status(400).json({ success: false, message: '请先删除子类别' });
      }

      const newsCheck = await pool.query(`
        SELECT COUNT(*) FROM news_categories WHERE category_id = $1
      `, [id]);

      if (parseInt(newsCheck.rows[0].count) > 0) {
        return res.status(400).json({ success: false, message: '该类别下存在新闻，无法删除' });
      }

      const result = await pool.query(`
        DELETE FROM categories WHERE id = $1 RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '类别不存在' });
      }

      await redis.deleteCache(CACHE_KEY);
      
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ success: false, message: '删除类别失败' });
    }
  },

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT * FROM categories WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '类别不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get category by id error:', error);
      res.status(500).json({ success: false, message: '获取类别信息失败' });
    }
  }
};

function buildTree(categories, parentId) {
  const tree = [];
  for (const category of categories) {
    const currentParentId = category.parent_id;
    if ((parentId === null && currentParentId === null) || 
        (currentParentId !== null && currentParentId === parentId)) {
      const children = buildTree(categories, category.id);
      if (children.length > 0) {
        category.children = children;
      }
      tree.push(category);
    }
  }
  return tree;
}

module.exports = categoryController;
