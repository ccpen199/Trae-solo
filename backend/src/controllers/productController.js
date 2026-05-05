const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');

const getProductTypes = async (req, res) => {
  try {
    const { page = 1, page_size = 10, type_name } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT pt.*, u.username as created_by_name 
                      FROM product_types pt 
                      LEFT JOIN users u ON pt.created_by = u.id 
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (type_name) {
      queryText += ` AND pt.type_name LIKE $${paramIndex}`;
      queryParams.push(`%${type_name}%`);
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace(
        'SELECT pt.*, u.username as created_by_name',
        'SELECT COUNT(*)'
      ),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY pt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get product types error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取商品类型列表失败' 
    });
  }
};

const getAllProductTypes = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type_name, description FROM product_types ORDER BY type_name'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all product types error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取商品类型列表失败' 
    });
  }
};

const createProductType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { type_name, description } = req.body;
    const createdBy = req.user.id;

    const existingType = await query(
      'SELECT id FROM product_types WHERE type_name = $1',
      [type_name]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '商品类型名称已存在' 
      });
    }

    const result = await query(
      `INSERT INTO product_types (type_name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [type_name, description, createdBy]
    );

    res.status(201).json({
      success: true,
      message: '商品类型添加成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create product type error:', error);
    res.status(500).json({ 
      success: false, 
      message: '添加商品类型失败' 
    });
  }
};

const deleteProductType = async (req, res) => {
  try {
    const typeId = parseInt(req.params.id);

    const productCount = await query(
      'SELECT COUNT(*) FROM products WHERE type_id = $1',
      [typeId]
    );

    if (parseInt(productCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '该类型下存在关联的商品，无法删除' 
      });
    }

    const typeResult = await query(
      'SELECT * FROM product_types WHERE id = $1',
      [typeId]
    );

    if (typeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '商品类型不存在' 
      });
    }

    await query('DELETE FROM product_types WHERE id = $1', [typeId]);

    res.json({
      success: true,
      message: '商品类型删除成功'
    });
  } catch (error) {
    console.error('Delete product type error:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除商品类型失败' 
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword, type_id, product_code } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT p.*, pt.type_name, u.username as created_by_name, i.quantity as stock_quantity
                      FROM products p 
                      LEFT JOIN product_types pt ON p.type_id = pt.id 
                      LEFT JOIN users u ON p.created_by = u.id 
                      LEFT JOIN inventory i ON p.id = i.product_id
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (p.product_name LIKE $${paramIndex} OR p.product_code LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (type_id) {
      queryText += ` AND p.type_id = $${paramIndex}`;
      queryParams.push(parseInt(type_id));
      paramIndex++;
    }

    if (product_code) {
      queryText += ` AND p.product_code = $${paramIndex}`;
      queryParams.push(product_code);
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace(
        'SELECT p.*, pt.type_name, u.username as created_by_name, i.quantity as stock_quantity',
        'SELECT COUNT(*)'
      ),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取商品列表失败' 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const result = await query(
      `SELECT p.*, pt.type_name, u.username as created_by_name, i.quantity as stock_quantity
       FROM products p 
       LEFT JOIN product_types pt ON p.type_id = pt.id 
       LEFT JOIN users u ON p.created_by = u.id 
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取商品信息失败' 
    });
  }
};

const createProduct = async (req, res) => {
  const client = await getClient();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { 
      product_code, product_name, type_id, unit, specification, 
      purchase_price, sale_price, min_stock, max_stock, remark 
    } = req.body;
    const createdBy = req.user.id;

    await client.query('BEGIN');

    const existingProduct = await client.query(
      'SELECT id FROM products WHERE product_code = $1',
      [product_code]
    );

    if (existingProduct.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '商品编码已存在' 
      });
    }

    const productResult = await client.query(
      `INSERT INTO products 
       (product_code, product_name, type_id, unit, specification, 
        purchase_price, sale_price, min_stock, max_stock, remark, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [product_code, product_name, type_id, unit, specification, 
       purchase_price, sale_price, min_stock, max_stock, remark, createdBy]
    );

    const product = productResult.rows[0];

    await client.query(
      `INSERT INTO inventory (product_id, quantity, total_in, total_out)
       VALUES ($1, 0, 0, 0)`,
      [product.id]
    );

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      success: true,
      message: '商品添加成功',
      data: product
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: '添加商品失败' 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const productId = parseInt(req.params.id);
    const { 
      product_name, type_id, unit, specification, 
      purchase_price, sale_price, min_stock, max_stock, remark 
    } = req.body;

    const productResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    const result = await query(
      `UPDATE products 
       SET product_name = $1, type_id = $2, unit = $3, specification = $4, 
           purchase_price = $5, sale_price = $6, min_stock = $7, max_stock = $8, 
           remark = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [product_name, type_id, unit, specification, 
       purchase_price, sale_price, min_stock, max_stock, remark, productId]
    );

    res.json({
      success: true,
      message: '商品信息更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新商品信息失败' 
    });
  }
};

const deleteProduct = async (req, res) => {
  const client = await getClient();
  
  try {
    const productId = parseInt(req.params.id);

    await client.query('BEGIN');

    const inventoryResult = await client.query(
      'SELECT quantity FROM inventory WHERE product_id = $1',
      [productId]
    );

    if (inventoryResult.rows.length > 0 && inventoryResult.rows[0].quantity > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该商品存在库存，无法删除' 
      });
    }

    const stockInCount = await client.query(
      'SELECT COUNT(*) FROM stock_in_items WHERE product_id = $1',
      [productId]
    );

    const stockOutCount = await client.query(
      'SELECT COUNT(*) FROM stock_out_items WHERE product_id = $1',
      [productId]
    );

    if (parseInt(stockInCount.rows[0].count) > 0 || parseInt(stockOutCount.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该商品存在出入库记录，无法删除' 
      });
    }

    await client.query('DELETE FROM inventory WHERE product_id = $1', [productId]);

    await client.query('DELETE FROM products WHERE id = $1', [productId]);

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除商品失败' 
    });
  }
};

module.exports = {
  getProductTypes,
  getAllProductTypes,
  createProductType,
  deleteProductType,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};