import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 前台：会员注册
router.post('/register', async (req, res) => {
  try {
    const { 
      username, password, email, phone, 
      real_name, company_name, address 
    } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、密码和邮箱不能为空' 
      });
    }

    const usernameCheck = await query(
      'SELECT id FROM members WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    const emailCheck = await query(
      'SELECT id FROM members WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱已被注册' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO members (
        username, password, email, phone, real_name, 
        company_name, address, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) 
      RETURNING id, username, email, phone, real_name, company_name, address, status, created_at`,
      [username, hashedPassword, email, phone, real_name, company_name, address]
    );

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: '注册成功，请等待审核' 
    });
  } catch (err) {
    console.error('会员注册错误:', err);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 前台：会员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    const userResult = await query(
      `SELECT m.*, mt.name as member_type_name 
       FROM members m 
       LEFT JOIN member_types mt ON m.member_type_id = mt.id 
       WHERE m.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    if (user.status === 0) {
      return res.status(403).json({ 
        success: false, 
        message: '账户正在审核中，请等待' 
      });
    }

    if (user.status !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: '账户已被禁用' 
      });
    }

    await query(
      'UPDATE members SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        realName: user.real_name,
        companyName: user.company_name,
        memberTypeName: user.member_type_name
      },
      message: '登录成功'
    });
  } catch (err) {
    console.error('会员登录错误:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 前台：获取会员类型列表
router.get('/types', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description 
       FROM member_types 
       WHERE status = 1 
       ORDER BY id ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('获取会员类型错误:', err);
    res.status(500).json({ success: false, message: '获取会员类型失败' });
  }
});

// 后台：获取会员列表
router.get('/list', authMiddleware, permissionMiddleware('manage_members'), async (req, res) => {
  try {
    const { 
      page = 1, 
      page_size = 20, 
      keyword = '', 
      status, 
      member_type_id 
    } = req.query;

    let sql = `SELECT m.*, mt.name as member_type_name
               FROM members m 
               LEFT JOIN member_types mt ON m.member_type_id = mt.id 
               WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (m.username LIKE $${paramIndex} OR m.real_name LIKE $${paramIndex} OR m.email LIKE $${paramIndex} OR m.phone LIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      sql += ` AND m.status = $${paramIndex}`;
      params.push(parseInt(status));
      paramIndex++;
    }

    if (member_type_id) {
      sql += ` AND m.member_type_id = $${paramIndex}`;
      params.push(member_type_id);
      paramIndex++;
    }

    const countSql = sql.replace('SELECT m.*, mt.name as member_type_name', 'SELECT COUNT(*)');
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
    console.error('获取会员列表错误:', err);
    res.status(500).json({ success: false, message: '获取会员列表失败' });
  }
});

// 后台：获取会员详情
router.get('/:id', authMiddleware, permissionMiddleware('manage_members'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT m.*, mt.name as member_type_name
       FROM members m 
       LEFT JOIN member_types mt ON m.member_type_id = mt.id 
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    const { password, ...userWithoutPassword } = result.rows[0];
    res.json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error('获取会员详情错误:', err);
    res.status(500).json({ success: false, message: '获取会员详情失败' });
  }
});

// 后台：审核会员
router.put('/:id/audit', authMiddleware, permissionMiddleware('manage_members'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, member_type_id } = req.body;

    const result = await query(
      `UPDATE members 
       SET status = $1, member_type_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status ?? 1, member_type_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    res.json({ success: true, message: status === 1 ? '审核通过' : '审核不通过' });
  } catch (err) {
    console.error('审核会员错误:', err);
    res.status(500).json({ success: false, message: '审核失败' });
  }
});

// 后台：更新会员状态
router.put('/:id/status', authMiddleware, permissionMiddleware('manage_members'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE members 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    res.json({ success: true, message: '状态更新成功' });
  } catch (err) {
    console.error('更新会员状态错误:', err);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

export default router;
