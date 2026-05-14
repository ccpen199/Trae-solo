const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

module.exports = function(db) {
  router.get('/cart', verifyToken, (req, res) => {
    try {
      const cartItems = db.prepare(`
        SELECT c.*, p.title, p.price, p.original_price, p.cover_image, p.shop_name, p.stock, p.status
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `).all(req.user.id);
      
      const cartWithProduct = cartItems.map(item => ({
        ...item,
        canBuy: item.stock >= item.quantity && item.status === 1
      }));
      
      res.json({
        code: 200,
        message: '获取成功',
        data: cartWithProduct
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/cart', verifyToken, (req, res) => {
    try {
      const { productId, skuId, quantity = 1 } = req.body;
      
      if (!productId) {
        return res.status(400).json({
          code: 400,
          message: '商品ID不能为空',
          data: null
        });
      }
      
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!product) {
        return res.status(404).json({
          code: 404,
          message: '商品不存在',
          data: null
        });
      }
      
      if (product.stock < quantity) {
        return res.status(400).json({
          code: 400,
          message: '库存不足',
          data: null
        });
      }
      
      const existing = db.prepare(`
        SELECT * FROM carts 
        WHERE user_id = ? AND product_id = ? AND (sku_id = ? OR (sku_id IS NULL AND ? IS NULL))
      `).get(req.user.id, productId, skuId, skuId);
      
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (product.stock < newQuantity) {
          return res.status(400).json({
            code: 400,
            message: '库存不足',
            data: null
          });
        }
        db.prepare('UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQuantity, existing.id);
      } else {
        db.prepare(`
          INSERT INTO carts (user_id, product_id, sku_id, quantity)
          VALUES (?, ?, ?, ?)
        `).run(req.user.id, productId, skuId, quantity);
      }
      
      const cartCount = db.prepare('SELECT COUNT(*) as count FROM carts WHERE user_id = ?').get(req.user.id);
      
      res.json({
        code: 200,
        message: '添加成功',
        data: { cartCount: cartCount.count }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.put('/cart/:id', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, selected } = req.body;
      
      const cartItem = db.prepare('SELECT * FROM carts WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!cartItem) {
        return res.status(404).json({
          code: 404,
          message: '购物车商品不存在',
          data: null
        });
      }
      
      const updates = [];
      const values = [];
      
      if (quantity !== undefined) {
        const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(cartItem.product_id);
        if (product && product.stock < quantity) {
          return res.status(400).json({
            code: 400,
            message: '库存不足',
            data: null
          });
        }
        updates.push('quantity = ?');
        values.push(quantity);
      }
      
      if (selected !== undefined) {
        updates.push('selected = ?');
        values.push(selected ? 1 : 0);
      }
      
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        values.push(req.user.id);
        db.prepare(`UPDATE carts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
      }
      
      res.json({
        code: 200,
        message: '更新成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.delete('/cart/:id', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(id, req.user.id);
      
      res.json({
        code: 200,
        message: '删除成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/create', verifyToken, (req, res) => {
    try {
      const { items, address, phone, receiver, remark } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择商品',
          data: null
        });
      }
      
      if (!address || !phone || !receiver) {
        return res.status(400).json({
          code: 400,
          message: '请填写收货信息',
          data: null
        });
      }
      
      const tx = db.transaction(() => {
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of items) {
          const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(item.productId);
          if (!product) {
            throw new Error('商品不存在或已下架');
          }
          
          const quantity = item.quantity || 1;
          if (product.stock < quantity) {
            throw new Error(`${product.title} 库存不足`);
          }
          
          const itemTotal = product.price * quantity;
          totalAmount += itemTotal;
          
          orderItems.push({
            productId: item.productId,
            skuId: item.skuId,
            productTitle: product.title,
            productImage: product.cover_image,
            price: product.price,
            quantity,
            totalPrice: itemTotal
          });
          
          db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?').run(quantity, quantity, item.productId);
          
          if (item.cartId) {
            db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(item.cartId, req.user.id);
          }
        }
        
        const orderNo = Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase();
        const discountAmount = totalAmount * 0;
        const payAmount = totalAmount - discountAmount;
        
        const result = db.prepare(`
          INSERT INTO orders (order_no, user_id, total_amount, discount_amount, pay_amount, address, phone, receiver, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(orderNo, req.user.id, totalAmount, discountAmount, payAmount, address, phone, receiver, remark || '');
        
        const orderId = result.lastInsertRowid;
        
        const insertOrderItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, sku_id, product_title, product_image, price, quantity, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const item of orderItems) {
          insertOrderItem.run(orderId, item.productId, item.skuId, item.productTitle, item.productImage, item.price, item.quantity, item.totalPrice);
        }
        
        db.prepare(`
          INSERT INTO messages (user_id, type, title, content, order_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, 'order', '订单创建成功', `您的订单 ${orderNo} 已创建，请尽快支付`, orderId);
        
        return { orderId, orderNo, payAmount };
      });
      
      const result = tx();
      
      res.json({
        code: 200,
        message: '下单成功',
        data: result
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        code: 400,
        message: error.message || '下单失败',
        data: null
      });
    }
  });
  
  router.get('/list', verifyToken, (req, res) => {
    try {
      const { status, page = 1, pageSize = 10 } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE user_id = ?';
      const params = [req.user.id];
      
      if (status !== undefined && status !== '') {
        whereClause += ' AND status = ?';
        params.push(parseInt(status));
      }
      
      const orders = db.prepare(`
        SELECT * FROM orders 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parseInt(pageSize), offset);
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`).get(...params);
      
      const ordersWithItems = orders.map(order => {
        const items = db.prepare(`
          SELECT * FROM order_items WHERE order_id = ?
        `).all(order.id);
        
        return { ...order, items };
      });
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: ordersWithItems,
          total: total.count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/:id', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      const order = db.prepare(`
        SELECT * FROM orders WHERE id = ? AND user_id = ?
      `).get(id, req.user.id);
      
      if (!order) {
        return res.status(404).json({
          code: 404,
          message: '订单不存在',
          data: null
        });
      }
      
      const items = db.prepare(`
        SELECT * FROM order_items WHERE order_id = ?
      `).all(id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: { ...order, items }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/:id/pay', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!order) {
        return res.status(404).json({
          code: 404,
          message: '订单不存在',
          data: null
        });
      }
      
      if (order.status !== 0) {
        return res.status(400).json({
          code: 400,
          message: '订单状态异常',
          data: null
        });
      }
      
      db.prepare(`
        UPDATE orders 
        SET status = 1, pay_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);
      
      db.prepare(`
        INSERT INTO messages (user_id, type, title, content, order_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, 'order', '订单支付成功', `您的订单 ${order.order_no} 已支付成功`, id);
      
      res.json({
        code: 200,
        message: '支付成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/:id/confirm', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!order) {
        return res.status(404).json({
          code: 404,
          message: '订单不存在',
          data: null
        });
      }
      
      if (order.status !== 2) {
        return res.status(400).json({
          code: 400,
          message: '订单状态异常',
          data: null
        });
      }
      
      db.prepare(`
        UPDATE orders 
        SET status = 3, complete_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);
      
      res.json({
        code: 200,
        message: '确认收货成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/:id/cancel', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!order) {
        return res.status(404).json({
          code: 404,
          message: '订单不存在',
          data: null
        });
      }
      
      if (order.status !== 0) {
        return res.status(400).json({
          code: 400,
          message: '订单状态异常',
          data: null
        });
      }
      
      const tx = db.transaction(() => {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        
        for (const item of items) {
          db.prepare('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
        }
        
        db.prepare(`
          UPDATE orders 
          SET status = -1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(id);
      });
      
      tx();
      
      res.json({
        code: 200,
        message: '取消订单成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  return router;
};
