const pool = require('../config/database');

const getProducts = async (req, res) => {
  try {
    const { keyword, categoryId, page = 1, pageSize = 12 } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.status = 'on_sale'
    `;
    let params = [];

    if (keyword) {
      query += ` AND p.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(parseInt(categoryId));
    }

    const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as count');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || countResult.rows[0]?.['COUNT(*)'] || 0);

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY id'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, imageUrl, status } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: '商品名称和价格不能为空' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, parseFloat(price), parseInt(stock) || 0, parseInt(categoryId) || null, imageUrl, status || 'on_sale']
    );

    const newProduct = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [result.lastInsertRowid]
    );

    res.status(201).json({
      success: true,
      message: '商品创建成功',
      data: newProduct.rows[0]
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId, imageUrl, status } = req.body;

    const existingProduct = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    await pool.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, stock = ?, 
           category_id = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, description, parseFloat(price), parseInt(stock) || 0, parseInt(categoryId) || null, imageUrl, status, id]
    );

    const updatedProduct = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '商品更新成功',
      data: updatedProduct.rows[0]
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    await pool.query(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    const newCategory = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastInsertRowid]
    );

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: newCategory.rows[0]
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, id]
    );

    const updatedCategory = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '分类更新成功',
      data: updatedCategory.rows[0]
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const productCount = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    const count = parseInt(productCount.rows[0]?.count || productCount.rows[0]?.['COUNT(*)'] || 0);
    if (count > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有商品，无法删除' });
    }

    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const { keyword, categoryId, status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    let params = [];

    if (keyword) {
      query += ` AND p.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(parseInt(categoryId));
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as count');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || countResult.rows[0]?.['COUNT(*)'] || 0);

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取管理员商品列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProductsAdmin
};
