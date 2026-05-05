import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取栏目列表
router.get('/categories', async (req, res) => {
  try {
    const { module } = req.query;
    let sql = `SELECT id, name, parent_id, module, sort_order, seo_title, seo_keywords, seo_description 
               FROM categories WHERE status = 1`;
    let params = [];

    if (module) {
      sql += ' AND module = $1';
      params.push(module);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取栏目列表错误:', err);
    res.status(500).json({ success: false, message: '获取栏目列表失败' });
  }
});

// 获取企业信息
router.get('/company-info', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM company_info LIMIT 1`
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    console.error('获取企业信息错误:', err);
    res.status(500).json({ success: false, message: '获取企业信息失败' });
  }
});

// 获取友情链接
router.get('/links', async (req, res) => {
  try {
    const { link_type = 'cooperation' } = req.query;
    
    const result = await query(
      `SELECT id, name, url, logo, description, link_type 
       FROM links 
       WHERE status = 1 AND link_type = $1 
       ORDER BY sort_order ASC, id ASC`,
      [link_type]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取友情链接错误:', err);
    res.status(500).json({ success: false, message: '获取友情链接失败' });
  }
});

// 获取站点配置
router.get('/settings', async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value, description FROM site_settings`
    );
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('获取站点配置错误:', err);
    res.status(500).json({ success: false, message: '获取站点配置失败' });
  }
});

// 获取下载中心分类
router.get('/download-categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, sort_order 
       FROM download_categories 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取下载分类错误:', err);
    res.status(500).json({ success: false, message: '获取下载分类失败' });
  }
});

// 获取下载资源列表
router.get('/downloads', async (req, res) => {
  try {
    const { page = 1, page_size = 12, category_id } = req.query;

    let sql = `SELECT d.*, c.name as category_name 
               FROM downloads d 
               LEFT JOIN download_categories c ON d.category_id = c.id 
               WHERE d.status = 1`;
    let params = [];
    let paramIndex = 1;

    if (category_id) {
      sql += ` AND d.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    const countSql = sql.replace('SELECT d.*, c.name as category_name', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY d.sort_order ASC, d.created_at DESC';
    
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
    console.error('获取下载列表错误:', err);
    res.status(500).json({ success: false, message: '获取下载列表失败' });
  }
});

// 获取营销中心分类
router.get('/marketing-categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, sort_order 
       FROM marketing_categories 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取营销分类错误:', err);
    res.status(500).json({ success: false, message: '获取营销分类失败' });
  }
});

// 获取营销中心内容
router.get('/marketing-content', async (req, res) => {
  try {
    const { category_id } = req.query;

    let sql = `SELECT mc.*, c.name as category_name 
               FROM marketing_content mc 
               LEFT JOIN marketing_categories c ON mc.category_id = c.id 
               WHERE mc.status = 1`;
    let params = [];

    if (category_id) {
      sql += ' AND mc.category_id = $1';
      params.push(category_id);
    }
    sql += ' ORDER BY mc.sort_order ASC, mc.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取营销内容错误:', err);
    res.status(500).json({ success: false, message: '获取营销内容失败' });
  }
});

// 获取组织结构
router.get('/org-structure', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, parent_id, manager, phone, description, sort_order 
       FROM org_structure 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取组织结构错误:', err);
    res.status(500).json({ success: false, message: '获取组织结构失败' });
  }
});

// 获取信誉认证
router.get('/certifications', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, image, description, cert_number, issue_date, expiry_date 
       FROM certifications 
       WHERE status = 1 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取信誉认证错误:', err);
    res.status(500).json({ success: false, message: '获取信誉认证失败' });
  }
});

// 后台：更新企业信息
router.put('/company-info', authMiddleware, permissionMiddleware('manage_settings'), async (req, res) => {
  try {
    const { 
      name, logo, introduction, history, culture, vision,
      address, phone, fax, email, qq, wechat, wechat_qrcode,
      work_time, map_location
    } = req.body;

    const existing = await query('SELECT id FROM company_info LIMIT 1');

    let result;
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE company_info SET 
          name = $1, logo = $2, introduction = $3, history = $4, 
          culture = $5, vision = $6, address = $7, phone = $8, 
          fax = $9, email = $10, qq = $11, wechat = $12, 
          wechat_qrcode = $13, work_time = $14, map_location = $15,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $16 RETURNING *`,
        [
          name, logo, introduction, history, culture, vision,
          address, phone, fax, email, qq, wechat, wechat_qrcode,
          work_time, map_location, existing.rows[0].id
        ]
      );
    } else {
      result = await query(
        `INSERT INTO company_info (
          name, logo, introduction, history, culture, vision,
          address, phone, fax, email, qq, wechat, wechat_qrcode,
          work_time, map_location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
        RETURNING *`,
        [
          name, logo, introduction, history, culture, vision,
          address, phone, fax, email, qq, wechat, wechat_qrcode,
          work_time, map_location
        ]
      );
    }

    res.json({ success: true, data: result.rows[0], message: '企业信息更新成功' });
  } catch (err) {
    console.error('更新企业信息错误:', err);
    res.status(500).json({ success: false, message: '更新企业信息失败' });
  }
});

export default router;
