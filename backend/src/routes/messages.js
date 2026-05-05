import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取留言分类列表（前台公开）
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, sort_order 
       FROM message_categories 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取留言分类错误:', err);
    res.status(500).json({ success: false, message: '获取留言分类失败' });
  }
});

// 前台：提交留言（游客也可以提交）
router.post('/', async (req, res) => {
  try {
    const { 
      category_id, product_id, name, phone, email, 
      company, content 
    } = req.body;

    if (!name || !phone || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名、电话和留言内容不能为空' 
      });
    }

    const result = await query(
      `INSERT INTO messages (
        category_id, product_id, name, phone, email, 
        company, content, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) 
      RETURNING *`,
      [category_id, product_id, name, phone, email, company, content]
    );

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: '留言提交成功，请等待回复' 
    });
  } catch (err) {
    console.error('提交留言错误:', err);
    res.status(500).json({ success: false, message: '提交留言失败' });
  }
});

// 后台：获取留言列表
router.get('/list', authMiddleware, permissionMiddleware('manage_messages'), async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 20, 
      status, 
      category_id 
    } = req.query;

    let sql = `SELECT m.*, c.name as category_name, p.title as product_title
               FROM messages m 
               LEFT JOIN message_categories c ON m.category_id = c.id 
               LEFT JOIN products p ON m.product_id = p.id 
               WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (status !== undefined && status !== '') {
      sql += ` AND m.status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND m.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    const countSql = sql.replace('SELECT m.*, c.name as category_name, p.title as product_title', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY m.created_at DESC';
    
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
    console.error('获取留言列表错误:', err);
    res.status(500).json({ success: false, message: '获取留言列表失败' });
  }
});

// 后台：获取留言详情
router.get('/:id', authMiddleware, permissionMiddleware('manage_messages'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT m.*, c.name as category_name, p.title as product_title
       FROM messages m 
       LEFT JOIN message_categories c ON m.category_id = c.id 
       LEFT JOIN products p ON m.product_id = p.id 
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('获取留言详情错误:', err);
    res.status(500).json({ success: false, message: '获取留言详情失败' });
  }
});

// 后台：回复留言
router.put('/:id/reply', authMiddleware, permissionMiddleware('manage_messages'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, is_public } = req.body;

    if (!reply) {
      return res.status(400).json({ success: false, message: '回复内容不能为空' });
    }

    const result = await query(
      `UPDATE messages 
       SET reply = $1, is_public = $2, status = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [reply, is_public || false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '回复成功' });
  } catch (err) {
    console.error('回复留言错误:', err);
    res.status(500).json({ success: false, message: '回复留言失败' });
  }
});

// 后台：更新留言状态
router.put('/:id/status', authMiddleware, permissionMiddleware('manage_messages'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE messages 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    res.json({ success: true, data: result.rows[0], message: '状态更新成功' });
  } catch (err) {
    console.error('更新留言状态错误:', err);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

// 后台：删除留言
router.delete('/:id', authMiddleware, permissionMiddleware('manage_messages'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }

    res.json({ success: true, message: '留言删除成功' });
  } catch (err) {
    console.error('删除留言错误:', err);
    res.status(500).json({ success: false, message: '删除留言失败' });
  }
});

export default router;
