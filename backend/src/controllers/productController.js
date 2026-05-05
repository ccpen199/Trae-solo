const { query, getLastInsertId } = require('../config/database');

const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, title, description, price, original_price, condition, contact_info, location, images } = req.body;

    if (!category_id || !title || !price) {
      return res.status(400).json({ message: '分类、标题和价格为必填项' });
    }

    const imageUrls = images || [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/${file.filename}`);
      });
    }

    const imagesJson = JSON.stringify(imageUrls);

    await query(
      `INSERT INTO products 
       (user_id, category_id, title, description, price, original_price, condition, contact_info, location, images, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, category_id, title, description, price, original_price || null, condition, contact_info, location, imagesJson]
    );

    const productId = await getLastInsertId('products');
    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    const product = result.rows[0];
    if (product.images) {
      product.images = JSON.parse(product.images);
    }

    res.status(201).json({
      message: '商品发布成功',
      product
    });
  } catch (error) {
    console.error('发布商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { category_id, title, description, price, original_price, condition, contact_info, location, images, status } = req.body;

    const productCheck = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或无权限修改' });
    }

    const currentProduct = productCheck.rows[0];
    let currentImages = currentProduct.images;
    if (typeof currentImages === 'string') {
      try {
        currentImages = JSON.parse(currentImages);
      } catch {
        currentImages = [];
      }
    }
    
    const newImages = images || currentImages || [];
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newImages.push(`/uploads/${file.filename}`);
      });
    }

    const imagesJson = JSON.stringify(newImages);

    await query(
      `UPDATE products 
       SET category_id = $1, title = $2, description = $3, price = $4, 
           original_price = $5, condition = $6, contact_info = $7, 
           location = $8, images = $9, status = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 AND user_id = $12`,
      [
        category_id || currentProduct.category_id,
        title || currentProduct.title,
        description || currentProduct.description,
        price || currentProduct.price,
        original_price || currentProduct.original_price,
        condition || currentProduct.condition,
        contact_info || currentProduct.contact_info,
        location || currentProduct.location,
        imagesJson,
        status || currentProduct.status,
        productId,
        userId
      ]
    );

    const result = await query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = result.rows[0];
    if (product.images) {
      product.images = JSON.parse(product.images);
    }

    res.json({
      message: '商品更新成功',
      product
    });
  } catch (error) {
    console.error('更新商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const productCheck = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或无权限删除' });
    }

    await query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['deleted', productId]
    );

    res.json({ message: '商品已删除' });
  } catch (error) {
    console.error('删除商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category_id, keyword, page = 1, limit = 20, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name as category_name, 
             u.username as seller_name, u.nickname as seller_nickname, u.avatar as seller_avatar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      sql += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (keyword) {
      sql += ` AND (LOWER(p.title) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    else if (sort === 'price_desc') orderBy = 'p.price DESC';
    else if (sort === 'view_count') orderBy = 'p.view_count DESC';
    else if (sort === 'favorite_count') orderBy = 'p.favorite_count DESC';

    sql += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM products p
      WHERE p.status = 'active'
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (category_id) {
      countSql += ` AND p.category_id = $${countParamIndex}`;
      countParams.push(category_id);
      countParamIndex++;
    }

    if (keyword) {
      countSql += ` AND (LOWER(p.title) LIKE LOWER($${countParamIndex}) OR LOWER(p.description) LIKE LOWER($${countParamIndex}))`;
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

const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    await query(
      'UPDATE products SET view_count = view_count + 1 WHERE id = $1',
      [productId]
    );

    const result = await query(
      `SELECT p.*, c.name as category_name, 
              u.username as seller_name, u.nickname as seller_nickname, u.avatar as seller_avatar,
              u.phone as seller_phone, u.email as seller_email
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [productId]
    );

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

    let isFavorite = false;
    if (req.user) {
      const favoriteCheck = await query(
        'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
        [req.user.id, productId]
      );
      isFavorite = favoriteCheck.rows.length > 0;
    }

    res.json({
      ...product,
      is_favorite: isFavorite
    });
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM products WHERE user_id = $1';
    const countParams = [userId];
    let countParamIndex = 2;

    if (status) {
      countSql += ` AND status = $${countParamIndex}`;
      countParams.push(status);
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
    console.error('获取我的商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
  getMyProducts
};
