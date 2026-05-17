const { run, get, all } = require('../models/database');

async function getProductList(req, res) {
  try {
    const { page = 1, pageSize = 20, keyword, categoryId, sort = 'new', minPrice, maxPrice } = req.query;
    const offset = (page - 1) * pageSize;

    let whereConditions = ['p.status = 1'];
    let params = [];

    if (keyword) {
      whereConditions.push('p.name LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (minPrice) {
      whereConditions.push('p.price >= ?');
      params.push(minPrice);
    }

    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      params.push(maxPrice);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'sales') {
      orderBy = 'p.sales_count DESC';
    } else if (sort === 'price_asc') {
      orderBy = 'p.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.price DESC';
    }

    params.push(parseInt(pageSize), offset);

    const products = await all(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN product_categories c ON p.category_id = c.id 
       ${whereClause} 
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      params
    );

    const countParams = params.slice(0, -2);
    const totalResult = await get(
      `SELECT COUNT(*) as count FROM products p ${whereClause}`,
      countParams
    );

    products.forEach(product => {
      product.images = product.images ? JSON.parse(product.images) : [];
    });

    res.json({
      success: true,
      data: {
        list: products,
        total: totalResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getProductDetail(req, res) {
  try {
    const { productId } = req.params;

    const product = await get(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN product_categories c ON p.category_id = c.id 
       WHERE p.id = ? AND p.status = 1`,
      [productId]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    product.images = product.images ? JSON.parse(product.images) : [];

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await all(
      'SELECT * FROM product_categories WHERE parent_id IS NULL ORDER BY id ASC'
    );

    for (const category of categories) {
      const children = await all(
        'SELECT * FROM product_categories WHERE parent_id = ? ORDER BY id ASC',
        [category.id]
      );
      category.children = children;
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    try {
      await run(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, productId, quantity]
      );
    } catch (e) {
      await run(
        'UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?',
        [quantity, req.user.id, productId]
      );
    }

    res.json({ success: true, message: '已加入购物车' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getCart(req, res) {
  try {
    const cartItems = await all(
      `SELECT ci.*, p.name, p.price, p.images 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ? 
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );

    cartItems.forEach(item => {
      item.images = item.images ? JSON.parse(item.images) : [];
    });

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      data: {
        list: cartItems,
        totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateCartItem(req, res) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const item = await get('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [itemId, req.user.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: '购物车项不存在' });
    }

    if (quantity <= 0) {
      await run('DELETE FROM cart_items WHERE id = ?', [itemId]);
      res.json({ success: true, message: '已移除' });
    } else {
      await run(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, itemId]
      );
      res.json({ success: true, message: '更新成功' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function removeCartItem(req, res) {
  try {
    const { itemId } = req.params;

    await run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [itemId, req.user.id]);

    res.json({ success: true, message: '已移除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createOrder(req, res) {
  try {
    const { items, address, phone, receiver } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: '请选择商品' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await get('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        return res.status(404).json({ success: false, message: '商品不存在' });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productImage: product.images ? JSON.parse(product.images)[0] : null,
        price: product.price,
        quantity: item.quantity
      });
    }

    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const result = await run(
      'INSERT INTO orders (user_id, order_no, total_amount, address, phone, receiver) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, orderNo, totalAmount, address, phone, receiver]
    );

    for (const item of orderItems) {
      await run(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [result.id, item.productId, item.productName, item.productImage, item.price, item.quantity]
      );
      await run('UPDATE products SET sales_count = sales_count + ? WHERE id = ?', [item.quantity, item.productId]);
    }

    for (const item of items) {
      await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, item.productId]);
    }

    res.json({ success: true, message: '下单成功', data: { orderId: result.id, orderNo } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getOrders(req, res) {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'user_id = ?';
    let params = [req.user.id];

    if (status !== undefined) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    params.push(parseInt(pageSize), offset);

    const orders = await all(
      `SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );

    const countParams = params.slice(0, -2);
    const totalResult = await get(
      `SELECT COUNT(*) as count FROM orders WHERE user_id = ? ${status !== undefined ? 'AND status = ?' : ''}`,
      countParams
    );

    for (const order of orders) {
      const items = await all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      data: {
        list: orders,
        total: totalResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getOrderDetail(req, res) {
  try {
    const { orderId } = req.params;

    const order = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const items = await all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    order.items = items;

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getProductList,
  getProductDetail,
  getCategories,
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  createOrder,
  getOrders,
  getOrderDetail
};
