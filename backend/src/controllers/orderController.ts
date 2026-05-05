import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getRedisClient } from '../config/redis';
import { ApiResponse, Order, OrderItem, PaginatedResponse } from '../types';

const generateOrderNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BS${year}${month}${day}${random}`;
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const userId = (req as any).user.userId;
    const { addressId, remark } = req.body;

    const cartResult = await client.query(
      `SELECT ci.*, b.title, b.author, b.price, b.discount_price, b.stock, b.status 
       FROM cart_items ci 
       JOIN books b ON ci.book_id = b.id 
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: '购物车为空'
      } as ApiResponse);
      return;
    }

    const cartItems = cartResult.rows;
    const outOfStockItems: string[] = [];
    
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        outOfStockItems.push(item.title);
      }
      if (item.status !== 'active') {
        outOfStockItems.push(item.title);
      }
    }

    if (outOfStockItems.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: `以下图书库存不足或已下架: ${outOfStockItems.join(', ')}`
      } as ApiResponse);
      return;
    }

    let address: any;
    if (addressId) {
      const addressResult = await client.query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
        [addressId, userId]
      );
      if (addressResult.rows.length > 0) {
        address = addressResult.rows[0];
      }
    }

    if (!address) {
      const defaultAddressResult = await client.query(
        'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC LIMIT 1',
        [userId]
      );
      if (defaultAddressResult.rows.length > 0) {
        address = defaultAddressResult.rows[0];
      }
    }

    if (!address) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: '请先添加收货地址'
      } as ApiResponse);
      return;
    }

    let totalAmount = 0;
    let discountAmount = 0;

    for (const item of cartItems) {
      const originalPrice = parseFloat(item.price);
      const discountPrice = item.discount_price ? parseFloat(item.discount_price) : null;
      const actualPrice = discountPrice || originalPrice;
      
      totalAmount += originalPrice * item.quantity;
      if (discountPrice) {
        discountAmount += (originalPrice - discountPrice) * item.quantity;
      }
    }

    const actualAmount = totalAmount - discountAmount;
    const orderNo = generateOrderNo();
    const orderId = uuidv4();

    const fullAddress = `${address.province || ''}${address.city || ''}${address.district || ''}${address.address}`;

    const orderResult = await client.query(
      `INSERT INTO orders (
        id, order_no, user_id, total_amount, discount_amount, actual_amount, 
        status, receiver_name, receiver_phone, receiver_address, remark
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        orderId, orderNo, userId, totalAmount, discountAmount, actualAmount,
        'pending', address.name, address.phone, fullAddress, remark
      ]
    );

    const order = orderResult.rows[0];

    for (const item of cartItems) {
      const itemId = uuidv4();
      const originalPrice = parseFloat(item.price);
      const discountPrice = item.discount_price ? parseFloat(item.discount_price) : null;
      const actualPrice = discountPrice || originalPrice;
      const subtotal = actualPrice * item.quantity;

      await client.query(
        `INSERT INTO order_items (
          id, order_id, book_id, book_title, book_author, book_price, quantity, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          itemId, orderId, item.book_id, item.title, item.author,
          actualPrice, item.quantity, subtotal
        ]
      );

      await client.query(
        `UPDATE books SET stock = stock - $1, sales_count = sales_count + $1 WHERE id = $2`,
        [item.quantity, item.book_id]
      );
    }

    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [userId]
    );

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.del(`cart:${userId}`);
      } catch (redisErr) {
        console.warn('Redis clear cart error:', redisErr);
      }
    }

    await client.query('COMMIT');

    const orderItemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    res.status(201).json({
      success: true,
      data: {
        ...order,
        total_amount: parseFloat(order.total_amount),
        discount_amount: parseFloat(order.discount_amount),
        actual_amount: parseFloat(order.actual_amount),
        items: orderItemsResult.rows.map((i: any) => ({
          ...i,
          book_price: parseFloat(i.book_price),
          subtotal: parseFloat(i.subtotal)
        }))
      },
      message: '订单创建成功'
    } as ApiResponse);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    let query = `
      SELECT * FROM orders 
      WHERE user_id = $1
    `;
    const values: any[] = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

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
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const orderId = req.params.id;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
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
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const userId = (req as any).user.userId;
    const orderId = req.params.id;

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        message: '订单不存在'
      } as ApiResponse);
      return;
    }

    const order = orderResult.rows[0];
    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: '只有待付款的订单可以取消'
      } as ApiResponse);
      return;
    }

    const itemsResult = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE books SET stock = stock + $1, sales_count = sales_count - $1 WHERE id = $2`,
        [item.quantity, item.book_id]
      );
    }

    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '订单已取消'
    } as ApiResponse);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  } finally {
    client.release();
  }
};
