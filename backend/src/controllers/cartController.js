const pool = require('../config/database');

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT c.*, p.name, p.price, p.image_url, p.stock, p.status
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    let totalPrice = 0;
    let totalQuantity = 0;
    result.rows.forEach(item => {
      totalPrice += item.price * item.quantity;
      totalQuantity += item.quantity;
    });

    res.json({
      success: true,
      data: {
        items: result.rows,
        totalPrice,
        totalQuantity
      }
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: '商品ID不能为空' });
    }

    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    const product = productResult.rows[0];
    if (product.status !== 'on_sale') {
      return res.status(400).json({ success: false, message: '该商品已下架' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: '商品库存不足' });
    }

    const existingCartItem = await pool.query(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingCartItem.rows.length > 0) {
      const newQuantity = existingCartItem.rows[0].quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ success: false, message: '商品库存不足' });
      }

      await pool.query(
        'UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?',
        [newQuantity, userId, productId]
      );

      const updatedItem = await pool.query(
        'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      res.json({
        success: true,
        message: '已添加到购物车',
        data: updatedItem.rows[0]
      });
    } else {
      const result = await pool.query(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );

      const newItem = await pool.query(
        'SELECT * FROM carts WHERE id = ?',
        [result.lastInsertRowid]
      );

      res.status(201).json({
        success: true,
        message: '已添加到购物车',
        data: newItem.rows[0]
      });
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: '数量必须大于0' });
    }

    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    if (productResult.rows[0].stock < quantity) {
      return res.status(400).json({ success: false, message: '商品库存不足' });
    }

    const existingItem = await pool.query(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({ success: false, message: '购物车中不存在该商品' });
    }

    await pool.query(
      'UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );

    const updatedItem = await pool.query(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({
      success: true,
      message: '购物车已更新',
      data: updatedItem.rows[0]
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const existingItem = await pool.query(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({ success: false, message: '购物车中不存在该商品' });
    }

    await pool.query(
      'DELETE FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({
      success: true,
      message: '已从购物车移除'
    });
  } catch (error) {
    console.error('移除购物车商品失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM carts WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '购物车已清空'
    });
  } catch (error) {
    console.error('清空购物车失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const checkout = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartResult = await pool.query(
      `SELECT c.*, p.name, p.price, p.stock, p.status
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: '购物车为空' });
    }

    for (const item of cartResult.rows) {
      if (item.status !== 'on_sale') {
        return res.status(400).json({ 
          success: false, 
          message: `商品"${item.name}"已下架` 
        });
      }
      if (item.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `商品"${item.name}"库存不足` 
        });
      }
    }

    let totalPrice = 0;
    cartResult.rows.forEach(item => {
      totalPrice += item.price * item.quantity;
    });

    res.json({
      success: true,
      message: '结算预览成功',
      data: {
        items: cartResult.rows,
        totalPrice,
        message: '确认购买后将创建订单并扣除库存（本版本暂不实现订单和库存扣减，仅模拟流程）'
      }
    });
  } catch (error) {
    console.error('结算失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const confirmPurchase = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartResult = await pool.query(
      `SELECT c.*, p.name, p.price, p.stock, p.status
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: '购物车为空' });
    }

    for (const item of cartResult.rows) {
      if (item.status !== 'on_sale') {
        return res.status(400).json({ 
          success: false, 
          message: `商品"${item.name}"已下架` 
        });
      }
      if (item.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `商品"${item.name}"库存不足` 
        });
      }
    }

    await pool.query('DELETE FROM carts WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: '购买成功！订单已创建（本版本仅模拟购买流程，实际订单和库存扣减需后续扩展）'
    });
  } catch (error) {
    console.error('确认购买失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkout,
  confirmPurchase
};
