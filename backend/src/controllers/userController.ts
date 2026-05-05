import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { generateToken } from '../middleware/auth';
import { User, ApiResponse, JwtPayload, UserAddress } from '../types';

export const userValidationRules = {
  register: [
    body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度需在3-50个字符之间'),
    body('email').isEmail().withMessage('邮箱格式无效'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  ],
  login: [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '数据验证失败',
        error: errors.array()[0].msg
      } as ApiResponse);
      return;
    }

    const { username, email, password, phone } = req.body;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      } as ApiResponse);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await pool.query(
      `INSERT INTO users (id, username, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5, 'user') 
       RETURNING id, username, email, phone, role, created_at`,
      [userId, username, email, hashedPassword, phone]
    );

    const user = result.rows[0] as User;
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      },
      message: '注册成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '数据验证失败',
        error: errors.array()[0].msg
      } as ApiResponse);
      return;
    }

    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      } as ApiResponse);
      return;
    }

    const user = result.rows[0] as User;
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      } as ApiResponse);
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    const token = generateToken(payload);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      },
      message: '登录成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      'SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      } as ApiResponse);
      return;
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: user
    } as ApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { email, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email), 
           phone = COALESCE($2, phone), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, username, email, phone, role`,
      [email, phone, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '个人信息更新成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新个人信息失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      } as ApiResponse);
      return;
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: '原密码错误'
      } as ApiResponse);
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT * FROM user_addresses 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: '获取地址列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const addAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { name, phone, province, city, district, address, is_default } = req.body;

    if (is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const addressId = uuidv4();
    const result = await pool.query(
      `INSERT INTO user_addresses (id, user_id, name, phone, province, city, district, address, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [addressId, userId, name, phone, province, city, district, address, is_default || false]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '地址添加成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: '添加地址失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const addressId = req.params.id;
    const { name, phone, province, city, district, address, is_default } = req.body;

    const existingResult = await pool.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );

    if (existingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '地址不存在'
      } as ApiResponse);
      return;
    }

    if (is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await pool.query(
      `UPDATE user_addresses 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           province = COALESCE($3, province), 
           city = COALESCE($4, city), 
           district = COALESCE($5, district), 
           address = COALESCE($6, address), 
           is_default = COALESCE($7, is_default) 
       WHERE id = $8 AND user_id = $9 
       RETURNING *`,
      [name, phone, province, city, district, address, is_default, addressId, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '地址更新成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: '更新地址失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const addressId = req.params.id;

    const result = await pool.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING *',
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '地址不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: '地址删除成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: '删除地址失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
