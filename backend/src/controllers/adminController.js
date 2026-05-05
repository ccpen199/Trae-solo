const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, username, email, phone, nickname, avatar, role, status, created_at, updated_at 
      FROM users WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (keyword) {
      sql += ` AND (LOWER(username) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(nickname) LIKE LOWER($${paramIndex}))`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countSql += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (keyword) {
      countSql += ` AND (LOWER(username) LIKE LOWER($${countParamIndex}) OR LOWER(email) LIKE LOWER($${countParamIndex}) OR LOWER(nickname) LIKE LOWER($${countParamIndex}))`;
      countParams.push(`%${keyword}%`);
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (userId == req.user.id) {
      return res.status(400).json({ message: '不能修改自己的状态' });
    }

    await query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, userId]
    );

    const result = await query(
      'SELECT id, username, status FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      message: '用户状态更新成功',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (userId == req.user.id) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }

    await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [role, userId]
    );

    const result = await query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      message: '用户角色更新成功',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name as category_name, 
             u.username as seller_name, u.nickname as seller_nickname
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (keyword) {
      sql += ` AND (LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countSql += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (keyword) {
      countSql += ` AND (LOWER(title) LIKE LOWER($${countParamIndex}) OR LOWER(description) LIKE LOWER($${countParamIndex}))`;
      countParams.push(`%${keyword}%`);
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);

    const products = result.rows.map(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch {
          p.images = [];
        }
      }
      return p;
    });

    res.json({
      products,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const { status } = req.body;

    await query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, productId]
    );

    const result = await query('SELECT * FROM products WHERE id = $1', [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    const product = result.rows[0];
    if (product.images) {
      try {
        product.images = JSON.parse(product.images);
      } catch {
        product.images = [];
      }
    }

    res.json({
      message: '商品状态更新成功',
      product
    });
  } catch (error) {
    console.error('更新商品状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT o.*, 
             p.title as product_title, p.images as product_images,
             u_buyer.username as buyer_username, u_buyer.nickname as buyer_nickname,
             u_seller.username as seller_username, u_seller.nickname as seller_nickname
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
      LEFT JOIN users u_seller ON o.seller_id = u_seller.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (keyword) {
      sql += ` AND (LOWER(o.order_no) LIKE LOWER($${paramIndex}) OR LOWER(p.title) LIKE LOWER($${paramIndex}))`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countSql += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);

    const orders = result.rows.map(o => {
      if (o.product_images) {
        try {
          o.product_images = JSON.parse(o.product_images);
        } catch {
          o.product_images = [];
        }
      }
      return o;
    });

    res.json({
      orders,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getStatistics = async (req, res) => {
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const productCount = await query("SELECT COUNT(*) as count FROM products WHERE status = 'active'");
    const orderCount = await query('SELECT COUNT(*) as count FROM orders');
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = await query(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?",
      [today]
    );

    const recentOrders = await query(
      `SELECT o.*, p.title as product_title, 
              u_buyer.username as buyer_username, u_seller.username as seller_username
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
       LEFT JOIN users u_seller ON o.seller_id = u_seller.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    const hotProducts = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'active'
       ORDER BY p.view_count DESC, p.favorite_count DESC LIMIT 10`
    );

    const hotProductsWithImages = hotProducts.rows.map(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch {
          p.images = [];
        }
      }
      return p;
    });

    res.json({
      statistics: {
        userCount: parseInt(userCount.rows[0]?.count || 0),
        productCount: parseInt(productCount.rows[0]?.count || 0),
        orderCount: parseInt(orderCount.rows[0]?.count || 0),
        todayOrders: parseInt(todayOrders.rows[0]?.count || 0)
      },
      recentOrders: recentOrders.rows,
      hotProducts: hotProductsWithImages
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAllProducts,
  updateProductStatus,
  getAllOrders,
  getStatistics
};
