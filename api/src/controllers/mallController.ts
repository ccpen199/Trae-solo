import { Request, Response } from 'express';
import db from '@/db/index.js';
import { getSupplyChain as fetchSupplyChain } from '@/mock/externalServices.js';
import type {
  ProductListResponse,
  Product,
  SupplyChainResponse,
  SupplyChainStage,
} from '@shared/types';

export const getProducts = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { category, sortBy, keyword } = req.query;

    let sql = `
      SELECT p.id, p.name, p.price, p.original_price, p.image, p.category, p.stock,
             s.name as supplier, p.supply_base
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock > 0
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (keyword) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    if (sortBy === 'price_asc') {
      sql += ' ORDER BY p.price ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY p.price DESC';
    } else if (sortBy === 'discount') {
      sql += ' ORDER BY (p.original_price - p.price) / p.original_price DESC';
    } else {
      sql += ' ORDER BY p.created_at DESC';
    }

    const productsRaw = db.prepare(sql).all(...params) as any[];

    const products: Product[] = productsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: p.image || `https://picsum.photos/seed/product${p.id}/300/300`,
      category: p.category,
      supplier: p.supplier,
      supplyBase: p.supply_base,
      stock: p.stock,
    }));

    const data: ProductListResponse = { products };

    res.status(200).json({ success: true, data, message: '获取商品列表成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取商品列表失败，服务器错误' });
  }
};

export const getProductDetail = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const product = db
      .prepare(
        `SELECT p.*, s.name as supplier, s.contact_person, s.phone, s.address, s.base_location
         FROM products p
         JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.id = ?`
      )
      .get(productId) as any;

    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }

    const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);

    const data = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price,
      discount,
      image: product.image || `https://picsum.photos/seed/product${product.id}/600/600`,
      category: product.category,
      supplier: product.supplier,
      supplyBase: product.supply_base,
      stock: product.stock,
      description: `${product.name} 来自 ${product.supply_base} 优质产区，由 ${product.supplier} 直供，品质保证。`,
      supplierInfo: {
        name: product.supplier,
        contactPerson: product.contact_person,
        phone: product.phone,
        address: product.address,
        baseLocation: product.base_location,
      },
    };

    res.status(200).json({ success: true, data, message: '获取商品详情成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取商品详情失败，服务器错误' });
  }
};

export const getSupplyChain = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }

    const chainData = await fetchSupplyChain(parseInt(productId));

    const supplyChain: SupplyChainStage[] = chainData.map((stage) => ({
      stage: stage.stage,
      location: stage.location,
      operator: stage.operator,
      date: stage.date,
      description: stage.description,
    }));

    const data: SupplyChainResponse = {
      productId: parseInt(productId),
      supplyChain,
    };

    res.status(200).json({ success: true, data, message: '获取供应链信息成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取供应链信息失败，服务器错误' });
  }
};

export const getOrders = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { status } = req.query;

    let sql = `
      SELECT o.id, o.quantity, o.total_amount, o.status, o.tracking_number, o.created_at,
             p.name as product_name, p.price, p.image
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
    `;
    const params: any[] = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const ordersRaw = db.prepare(sql).all(...params) as any[];

    const orders = ordersRaw.map((o) => ({
      id: o.id,
      productName: o.product_name,
      productImage: o.image || `https://picsum.photos/seed/product${o.id}/100/100`,
      price: o.price,
      quantity: o.quantity,
      totalAmount: o.total_amount,
      status: o.status,
      trackingNumber: o.tracking_number,
      createDate: o.created_at,
    }));

    res.status(200).json({ success: true, data: { orders }, message: '获取订单列表成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单列表失败，服务器错误' });
  }
};

export const createOrder = (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400).json({ success: false, message: '请填写完整的订单信息' });
      return;
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;

    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ success: false, message: '库存不足' });
      return;
    }

    const totalAmount = product.price * quantity;

    const transaction = db.transaction(() => {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);

      const result = db.prepare(
        'INSERT INTO orders (user_id, product_id, quantity, total_amount, status) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, productId, quantity, totalAmount, 'pending');

      return result.lastInsertRowid;
    });

    const orderId = transaction();

    res.status(201).json({
      success: true,
      data: {
        orderId,
        totalAmount,
        status: 'pending',
      },
      message: '订单创建成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建订单失败，服务器错误' });
  }
};
