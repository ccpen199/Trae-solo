import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取产品系列列表（前台公开）
router.get('/series', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, image, sort_order 
       FROM product_series 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取产品系列错误:', err);
    res.status(500).json({ success: false, message: '获取产品系列失败' });
  }
});

// 获取产品分类列表（多级，前台公开）
router.get('/categories', async (req, res) => {
  try {
    const { parent_id = 0, series_id } = req.query;
    let sql = `SELECT id, name, parent_id, series_id, sort_order 
                FROM product_categories 
                WHERE status = 1 AND parent_id = $1`;
    let params = [parent_id];

    if (series_id) {
      sql += ' AND series_id = $2';
      params.push(series_id);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取产品分类错误:', err);
    res.status(500).json({ success: false, message: '获取产品分类失败' });
  }
});

// 获取产品列表（前台公开，带搜索）
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 12, 
      keyword = '', 
      series_id, 
      category_id,
      is_recommended,
      is_top 
    } = req.query;

    let sql = `SELECT p.*, s.name as series_name, c.name as category_name 
               FROM products p 
               LEFT JOIN product_series s ON p.series_id = s.id 
               LEFT JOIN product_categories c ON p.category_id = c.id 
               WHERE p.status = 1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (p.title LIKE $${paramIndex} OR p.subtitle LIKE $${paramIndex} OR p.keywords LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (series_id) {
      sql += ` AND p.series_id = $${paramIndex}`;
      params.push(series_id);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (is_recommended === 'true') {
      sql += ` AND p.is_recommended = true`;
    }

    if (is_top === 'true') {
      sql += ` AND p.is_top = true`;
    }

    const countSql = sql.replace('SELECT p.*, s.name as series_name, c.name as category_name', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY p.is_top DESC, p.sort_order ASC, p.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size))
        }
      }
    });
  } catch (err) {
    console.error('获取产品列表错误:', err);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

// 获取产品详情（前台公开）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT p.*, s.name as series_name, c.name as category_name 
       FROM products p 
       LEFT JOIN product_series s ON p.series_id = s.id 
       LEFT JOIN product_categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.status = 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    await query(
      'UPDATE products SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('获取产品详情错误:', err);
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

// 后台：创建产品系列
router.post('/series', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { name, description, image, sort_order } = req.body;
    
    const result = await query(
      `INSERT INTO product_series (name, description, image, sort_order, status)
       VALUES ($1, $2, $3, $4, 1) RETURNING *`,
      [name, description, image, sort_order || 0]
    );

    res.json({ success: true, data: result.rows[0], message: '产品系列创建成功' });
  } catch (err) {
    console.error('创建产品系列错误:', err);
    res.status(500).json({ success: false, message: '创建产品系列失败' });
  }
});

// 后台：更新产品系列
router.put('/series/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, sort_order, status } = req.body;
    
    const result = await query(
      `UPDATE product_series 
       SET name = $1, description = $2, image = $3, sort_order = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, description, image, sort_order || 0, status ?? 1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品系列不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '产品系列更新成功' });
  } catch (err) {
    console.error('更新产品系列错误:', err);
    res.status(500).json({ success: false, message: '更新产品系列失败' });
  }
});

// 后台：删除产品系列
router.delete('/series/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const productCheck = await query(
      'SELECT COUNT(*) FROM products WHERE series_id = $1',
      [id]
    );

    if (parseInt(productCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: '该系列下还有产品，无法删除' });
    }

    await query('DELETE FROM product_series WHERE id = $1', [id]);
    res.json({ success: true, message: '产品系列删除成功' });
  } catch (err) {
    console.error('删除产品系列错误:', err);
    res.status(500).json({ success: false, message: '删除产品系列失败' });
  }
});

// 后台：创建产品分类
router.post('/categories', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { name, parent_id, series_id, sort_order } = req.body;
    
    const result = await query(
      `INSERT INTO product_categories (name, parent_id, series_id, sort_order, status)
       VALUES ($1, $2, $3, $4, 1) RETURNING *`,
      [name, parent_id || 0, series_id, sort_order || 0]
    );

    res.json({ success: true, data: result.rows[0], message: '产品分类创建成功' });
  } catch (err) {
    console.error('创建产品分类错误:', err);
    res.status(500).json({ success: false, message: '创建产品分类失败' });
  }
});

// 后台：更新产品分类
router.put('/categories/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, series_id, sort_order, status } = req.body;
    
    const result = await query(
      `UPDATE product_categories 
       SET name = $1, parent_id = $2, series_id = $3, sort_order = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, parent_id || 0, series_id, sort_order || 0, status ?? 1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品分类不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '产品分类更新成功' });
  } catch (err) {
    console.error('更新产品分类错误:', err);
    res.status(500).json({ success: false, message: '更新产品分类失败' });
  }
});

// 后台：删除产品分类
router.delete('/categories/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const childCheck = await query(
      'SELECT COUNT(*) FROM product_categories WHERE parent_id = $1',
      [id]
    );

    if (parseInt(childCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有子分类，无法删除' });
    }

    const productCheck = await query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有产品，无法删除' });
    }

    await query('DELETE FROM product_categories WHERE id = $1', [id]);
    res.json({ success: true, message: '产品分类删除成功' });
  } catch (err) {
    console.error('删除产品分类错误:', err);
    res.status(500).json({ success: false, message: '删除产品分类失败' });
  }
});

// 后台：获取产品列表（带管理）
router.get('/admin/list', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { page = 1, page_size = 20, keyword = '', status } = req.query;

    let sql = `SELECT p.*, s.name as series_name, c.name as category_name 
               FROM products p 
               LEFT JOIN product_series s ON p.series_id = s.id 
               LEFT JOIN product_categories c ON p.category_id = c.id 
               WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (p.title LIKE $${paramIndex} OR p.subtitle LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    const countSql = sql.replace('SELECT p.*, s.name as series_name, c.name as category_name', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY p.is_top DESC, p.sort_order ASC, p.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(page_size), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size))
        }
      }
    });
  } catch (err) {
    console.error('获取后台产品列表错误:', err);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

// 后台：创建产品
router.post('/', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { 
      title, subtitle, series_id, category_id, thumbnail, images, 
      description, content, price, specs, keywords, 
      is_recommended, is_top, sort_order 
    } = req.body;
    
    const result = await query(
      `INSERT INTO products (
        title, subtitle, series_id, category_id, thumbnail, images,
        description, content, price, specs, keywords,
        is_recommended, is_top, sort_order, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1) 
      RETURNING *`,
      [
        title, subtitle, series_id, category_id, thumbnail, images,
        description, content, price, specs, keywords,
        is_recommended || false, is_top || false, sort_order || 0
      ]
    );

    res.json({ success: true, data: result.rows[0], message: '产品创建成功' });
  } catch (err) {
    console.error('创建产品错误:', err);
    res.status(500).json({ success: false, message: '创建产品失败' });
  }
});

// 后台：更新产品
router.put('/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, subtitle, series_id, category_id, thumbnail, images, 
      description, content, price, specs, keywords, 
      is_recommended, is_top, sort_order, status 
    } = req.body;
    
    const result = await query(
      `UPDATE products SET 
        title = $1, subtitle = $2, series_id = $3, category_id = $4, 
        thumbnail = $5, images = $6, description = $7, content = $8, 
        price = $9, specs = $10, keywords = $11, is_recommended = $12, 
        is_top = $13, sort_order = $14, status = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 RETURNING *`,
      [
        title, subtitle, series_id, category_id, thumbnail, images,
        description, content, price, specs, keywords,
        is_recommended, is_top, sort_order || 0, status ?? 1, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '产品更新成功' });
  } catch (err) {
    console.error('更新产品错误:', err);
    res.status(500).json({ success: false, message: '更新产品失败' });
  }
});

// 后台：删除产品
router.delete('/:id', authMiddleware, permissionMiddleware('manage_products'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json({ success: true, message: '产品删除成功' });
  } catch (err) {
    console.error('删除产品错误:', err);
    res.status(500).json({ success: false, message: '删除产品失败' });
  }
});

export default router;
