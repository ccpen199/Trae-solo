import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取新闻分类列表（前台公开）
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, sort_order 
       FROM news_categories 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取新闻分类错误:', err);
    res.status(500).json({ success: false, message: '获取新闻分类失败' });
  }
});

// 获取新闻列表（前台公开，带搜索和排序）
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 10, 
      keyword = '', 
      category_id,
      is_recommended,
      is_top,
      sort_by = 'publish_date'
    } = req.query;

    let sql = `SELECT n.*, c.name as category_name 
               FROM news n 
               LEFT JOIN news_categories c ON n.category_id = c.id 
               WHERE n.status = 1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (n.title LIKE $${paramIndex} OR n.summary LIKE $${paramIndex} OR n.keywords LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND n.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (is_recommended === 'true') {
      sql += ` AND n.is_recommended = true`;
    }

    if (is_top === 'true') {
      sql += ` AND n.is_top = true`;
    }

    const countSql = sql.replace('SELECT n.*, c.name as category_name', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY n.is_top DESC, ';
    switch (sort_by) {
      case 'views':
        sql += 'n.view_count DESC, ';
        break;
      case 'publish_date':
      default:
        sql += 'n.publish_date DESC, ';
        break;
    }
    sql += 'n.sort_order ASC';
    
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
    console.error('获取新闻列表错误:', err);
    res.status(500).json({ success: false, message: '获取新闻列表失败' });
  }
});

// 获取新闻详情（前台公开）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT n.*, c.name as category_name 
       FROM news n 
       LEFT JOIN news_categories c ON n.category_id = c.id 
       WHERE n.id = $1 AND n.status = 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }

    await query(
      'UPDATE news SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('获取新闻详情错误:', err);
    res.status(500).json({ success: false, message: '获取新闻详情失败' });
  }
});

// 后台：创建新闻分类
router.post('/categories', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    
    const result = await query(
      `INSERT INTO news_categories (name, sort_order, status)
       VALUES ($1, $2, 1) RETURNING *`,
      [name, sort_order || 0]
    );

    res.json({ success: true, data: result.rows[0], message: '新闻分类创建成功' });
  } catch (err) {
    console.error('创建新闻分类错误:', err);
    res.status(500).json({ success: false, message: '创建新闻分类失败' });
  }
});

// 后台：更新新闻分类
router.put('/categories/:id', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order, status } = req.body;
    
    const result = await query(
      `UPDATE news_categories 
       SET name = $1, sort_order = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [name, sort_order || 0, status ?? 1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '新闻分类不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '新闻分类更新成功' });
  } catch (err) {
    console.error('更新新闻分类错误:', err);
    res.status(500).json({ success: false, message: '更新新闻分类失败' });
  }
});

// 后台：删除新闻分类
router.delete('/categories/:id', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const newsCheck = await query(
      'SELECT COUNT(*) FROM news WHERE category_id = $1',
      [id]
    );

    if (parseInt(newsCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有新闻，无法删除' });
    }

    await query('DELETE FROM news_categories WHERE id = $1', [id]);
    res.json({ success: true, message: '新闻分类删除成功' });
  } catch (err) {
    console.error('删除新闻分类错误:', err);
    res.status(500).json({ success: false, message: '删除新闻分类失败' });
  }
});

// 后台：获取新闻列表（带管理）
router.get('/admin/list', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { page = 1, page_size = 20, keyword = '', status } = req.query;

    let sql = `SELECT n.*, c.name as category_name 
               FROM news n 
               LEFT JOIN news_categories c ON n.category_id = c.id 
               WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (n.title LIKE $${paramIndex} OR n.summary LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      sql += ` AND n.status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    const countSql = sql.replace('SELECT n.*, c.name as category_name', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY n.is_top DESC, n.publish_date DESC, n.sort_order ASC';
    
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
    console.error('获取后台新闻列表错误:', err);
    res.status(500).json({ success: false, message: '获取新闻列表失败' });
  }
});

// 后台：创建新闻
router.post('/', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { 
      title, category_id, source, author, thumbnail, summary, 
      content, keywords, is_recommended, is_top, sort_order, publish_date 
    } = req.body;
    
    const result = await query(
      `INSERT INTO news (
        title, category_id, source, author, thumbnail, summary,
        content, keywords, is_recommended, is_top, sort_order, status, publish_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12) 
      RETURNING *`,
      [
        title, category_id, source, author, thumbnail, summary,
        content, keywords, is_recommended || false, is_top || false, 
        sort_order || 0, publish_date || null
      ]
    );

    res.json({ success: true, data: result.rows[0], message: '新闻创建成功' });
  } catch (err) {
    console.error('创建新闻错误:', err);
    res.status(500).json({ success: false, message: '创建新闻失败' });
  }
});

// 后台：更新新闻
router.put('/:id', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, category_id, source, author, thumbnail, summary, 
      content, keywords, is_recommended, is_top, sort_order, status, publish_date 
    } = req.body;
    
    const result = await query(
      `UPDATE news SET 
        title = $1, category_id = $2, source = $3, author = $4, 
        thumbnail = $5, summary = $6, content = $7, keywords = $8, 
        is_recommended = $9, is_top = $10, sort_order = $11, 
        status = $12, publish_date = $13, updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [
        title, category_id, source, author, thumbnail, summary,
        content, keywords, is_recommended, is_top, sort_order || 0, 
        status ?? 1, publish_date, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '新闻更新成功' });
  } catch (err) {
    console.error('更新新闻错误:', err);
    res.status(500).json({ success: false, message: '更新新闻失败' });
  }
});

// 后台：删除新闻
router.delete('/:id', authMiddleware, permissionMiddleware('manage_news'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }

    res.json({ success: true, message: '新闻删除成功' });
  } catch (err) {
    console.error('删除新闻错误:', err);
    res.status(500).json({ success: false, message: '删除新闻失败' });
  }
});

export default router;
