import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { Merchant, Product, Coupon, Order } from '../../../shared/types.js';

export async function getMerchants(req: Request, res: Response) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM merchants';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY rating DESC, created_at DESC';

    const merchants = db.prepare(query).all(...params) as Merchant[];
    res.json({ success: true, data: merchants });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ success: false, error: '获取商户列表失败' });
  }
}

export async function getMerchantDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id) as Merchant | undefined;

    if (!merchant) {
      return res.status(404).json({ success: false, error: '商户不存在' });
    }

    const products = db.prepare('SELECT * FROM products WHERE merchant_id = ? AND status = ? ORDER BY created_at DESC').all(id, 'active') as Product[];

    const coupons = db.prepare(`
      SELECT * FROM coupons 
      WHERE merchant_id = ? AND valid_from <= CURRENT_TIMESTAMP AND valid_to >= CURRENT_TIMESTAMP
      AND used_quantity < total_quantity
      ORDER BY created_at DESC
    `).all(id) as Coupon[];

    res.json({ success: true, data: { merchant, products, coupons } });
  } catch (error) {
    console.error('Get merchant detail error:', error);
    res.status(500).json({ success: false, error: '获取商户详情失败' });
  }
}

export async function getProducts(req: Request, res: Response) {
  try {
    const { merchantId, category, keyword } = req.query;
    let query = 'SELECT p.*, m.name as merchant_name, m.logo_url as merchant_logo FROM products p';
    query += ' LEFT JOIN merchants m ON p.merchant_id = m.id';
    query += ' WHERE p.status = ?';

    const params: any[] = ['active'];

    if (merchantId) {
      query += ' AND p.merchant_id = ?';
      params.push(merchantId);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (keyword) {
      query += ' AND (p.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const products = db.prepare(query).all(...params) as (Product & { merchant_name: string; merchant_logo: string })[];
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: '获取商品列表失败' });
  }
}

export async function getCoupons(req: Request & { user?: any }, res: Response) {
  try {
    const { available } = req.query;
    let query = `
      SELECT c.*, m.name as merchant_name, m.logo_url as merchant_logo
      FROM coupons c
      LEFT JOIN merchants m ON c.merchant_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (available === 'true') {
      query += ' AND c.valid_from <= CURRENT_TIMESTAMP AND c.valid_to >= CURRENT_TIMESTAMP AND c.used_quantity < c.total_quantity';
    }

    query += ' ORDER BY c.created_at DESC';

    const coupons = db.prepare(query).all(...params) as (Coupon & { merchant_name: string; merchant_logo: string })[];
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, error: '获取优惠券失败' });
  }
}

export async function getOrders(req: Request & { user?: any }, res: Response) {
  try {
    const { status } = req.query;
    const isMerchant = req.user.role === 'merchant';

    let query = `
      SELECT o.*, m.name as merchant_name, m.logo_url as merchant_logo,
             u.name as user_name
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.id
      LEFT JOIN users u ON o.user_id = u.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (isMerchant) {
      whereClauses.push('o.merchant_id = (SELECT id FROM merchants WHERE user_id = ?)');
      params.push(req.user.id);
    } else {
      whereClauses.push('o.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      whereClauses.push('o.status = ?');
      params.push(status);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params) as (Order & { merchant_name: string; merchant_logo: string; user_name: string })[];

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
}

export async function createOrder(req: Request & { user?: any }, res: Response) {
  try {
    const { merchantId, productId, quantity, couponId } = req.body;

    if (!merchantId || !productId || !quantity) {
      return res.status(400).json({ success: false, error: '请填写完整的订单信息' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(productId, 'active') as Product | undefined;

    if (!product) {
      return res.status(404).json({ success: false, error: '商品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, error: '库存不足' });
    }

    let discountAmount = 0;
    let coupon = null;

    if (couponId) {
      coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId) as Coupon | undefined;
      if (!coupon) {
        return res.status(404).json({ success: false, error: '优惠券不存在' });
      }

      const now = new Date();
      if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_to)) {
        return res.status(400).json({ success: false, error: '优惠券不在有效期内' });
      }
    }

    const totalAmount = product.price * quantity;

    if (coupon && totalAmount >= coupon.min_amount) {
      if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      } else {
        discountAmount = totalAmount * (coupon.discount_value / 100);
      }
    }

    const payAmount = totalAmount - discountAmount;

    const result = db.prepare(`
      INSERT INTO orders (user_id, merchant_id, coupon_id, total_amount, discount_amount, pay_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      merchantId,
      couponId || null,
      totalAmount,
      discountAmount,
      payAmount,
      'paid'
    );

    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);

    if (coupon) {
      db.prepare('UPDATE coupons SET used_quantity = used_quantity + 1 WHERE id = ?').run(couponId);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: order, message: '订单创建成功' });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: '创建订单失败' });
  }
}

export async function redeemCoupon(req: Request & { user?: any }, res: Response) {
  try {
    const { couponId } = req.params;

    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId) as Coupon | undefined;

    if (!coupon) {
      return res.status(404).json({ success: false, error: '优惠券不存在' });
    }

    if (coupon.used_quantity >= coupon.total_quantity) {
      return res.status(400).json({ success: false, error: '优惠券已领完' });
    }

    res.json({ success: true, message: '领取成功' });
  } catch (error) {
    console.error('Redeem coupon error:', error);
    res.status(500).json({ success: false, error: '领取失败' });
  }
}

export default { getMerchants, getMerchantDetail, getProducts, getCoupons, getOrders, createOrder, redeemCoupon };
