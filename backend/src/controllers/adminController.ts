import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { generateToken } from '../middleware/auth';
import { ApiResponse, PaginatedResponse, JwtPayload } from '../types';

export const adminValidationRules = {
  login: [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
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
      'SELECT * FROM admins WHERE username = $1 AND status = $2',
      [username, 'active']
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      } as ApiResponse);
      return;
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      } as ApiResponse);
      return;
    }

    await pool.query(
      'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    const payload: JwtPayload = {
      userId: admin.id,
      username: admin.username,
      role: 'admin'
    };
    const token = generateToken(payload);

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          real_name: admin.real_name,
          role_id: admin.role_id
        },
        token
      },
      message: '登录成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAllBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, categoryId, status, page = 1, pageSize = 10 } = req.query;

    let query = `
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      query += ` AND (b.title ILIKE $${paramIndex} OR b.author ILIKE $${paramIndex} OR b.publisher ILIKE $${paramIndex})`;
      values.push(`%${keyword}%`);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND b.category_id = $${paramIndex}`;
      values.push(categoryId);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY b.created_at DESC`;

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * size;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(size, offset);

    const result = await pool.query(query, values);

    const books = result.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
      actual_price: parseFloat(row.discount_price || row.price)
    }));

    const response: PaginatedResponse<any> = {
      items: books,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse);
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, author, publisher, publish_date, isbn, price, discount_price,
      cover_image, description, stock, category_id, is_new, status
    } = req.body;

    const bookId = uuidv4();
    const result = await pool.query(
      `INSERT INTO books (
        id, title, author, publisher, publish_date, isbn, price, discount_price,
        cover_image, description, stock, category_id, is_new, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        bookId, title, author, publisher, publish_date, isbn, price, discount_price,
        cover_image, description, stock || 0, category_id, is_new || false, status || 'active'
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '图书创建成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: '创建图书失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id;
    const {
      title, author, publisher, publish_date, isbn, price, discount_price,
      cover_image, description, stock, category_id, is_new, status
    } = req.body;

    const result = await pool.query(
      `UPDATE books SET 
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        publisher = COALESCE($3, publisher),
        publish_date = COALESCE($4, publish_date),
        isbn = COALESCE($5, isbn),
        price = COALESCE($6, price),
        discount_price = $7,
        cover_image = COALESCE($8, cover_image),
        description = COALESCE($9, description),
        stock = COALESCE($10, stock),
        category_id = COALESCE($11, category_id),
        is_new = COALESCE($12, is_new),
        status = COALESCE($13, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 
      RETURNING *`,
      [
        title, author, publisher, publish_date, isbn, price, discount_price,
        cover_image, description, stock, category_id, is_new, status, bookId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '图书不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '图书更新成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: '更新图书失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNo, status, userId, startDate, endDate, page = 1, pageSize = 10 } = req.query;

    let query = `
      SELECT o.*, u.username, u.email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (orderNo) {
      query += ` AND o.order_no ILIKE $${paramIndex}`;
      values.push(`%${orderNo}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND o.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (userId) {
      query += ` AND o.user_id = $${paramIndex}`;
      values.push(userId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND o.created_at >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND o.created_at <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY o.created_at DESC`;

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * size;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(size, offset);

    const result = await pool.query(query, values);

    const orders = result.rows.map((row: any) => ({
      ...row,
      total_amount: parseFloat(row.total_amount),
      discount_amount: parseFloat(row.discount_amount),
      actual_amount: parseFloat(row.actual_amount)
    }));

    const response: PaginatedResponse<any> = {
      items: orders,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id;

    const orderResult = await pool.query(
      `SELECT o.*, u.username, u.email 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '订单不存在'
      } as ApiResponse);
      return;
    }

    const order = orderResult.rows[0];
    
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    res.json({
      success: true,
      data: {
        ...order,
        total_amount: parseFloat(order.total_amount),
        discount_amount: parseFloat(order.discount_amount),
        actual_amount: parseFloat(order.actual_amount),
        items: itemsResult.rows.map((i: any) => ({
          ...i,
          book_price: parseFloat(i.book_price),
          subtotal: parseFloat(i.subtotal)
        }))
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: '无效的订单状态'
      } as ApiResponse);
      return;
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '订单不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '订单状态更新成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;

    let query = `
      SELECT id, username, email, phone, role, created_at, updated_at 
      FROM users 
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${keyword}%`);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY created_at DESC`;

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * size;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(size, offset);

    const result = await pool.query(query, values);

    const response: PaginatedResponse<any> = {
      items: result.rows,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const orders = result.rows.map((row: any) => ({
      ...row,
      total_amount: parseFloat(row.total_amount),
      discount_amount: parseFloat(row.discount_amount),
      actual_amount: parseFloat(row.actual_amount)
    }));

    res.json({
      success: true,
      data: orders
    } as ApiResponse);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户订单失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parent_id, level, sort_order } = req.body;

    const categoryId = uuidv4();
    const result = await pool.query(
      `INSERT INTO categories (id, name, parent_id, level, sort_order) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [categoryId, name, parent_id || null, level || 1, sort_order || 0]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '分类创建成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.id;
    const { name, parent_id, level, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE categories SET 
        name = COALESCE($1, name),
        parent_id = $2,
        level = COALESCE($3, level),
        sort_order = COALESCE($4, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING *`,
      [name, parent_id, level, sort_order, categoryId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '分类不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '分类更新成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.id;

    const booksCount = await pool.query(
      'SELECT COUNT(*) FROM books WHERE category_id = $1',
      [categoryId]
    );

    if (parseInt(booksCount.rows[0].count) > 0) {
      res.status(400).json({
        success: false,
        message: '该分类下还有图书，无法删除'
      } as ApiResponse);
      return;
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [categoryId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '分类不存在'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: '分类删除成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
