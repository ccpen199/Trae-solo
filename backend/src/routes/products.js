const express = require('express');
const db = require('../database');
const { optionalAuth, authMiddleware } = require('../middleware/auth');

const router = express.Router();

const generateImageUrl = (id) => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20food%20vegetable%20fruit%20meat%20supermarket%20product&id=${id}&image_size=square_hd`;
};

const ensureSampleProducts = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count.count > 0) return;

  const categories = db.prepare('SELECT id FROM categories ORDER BY sort').all();
  
  const sampleProducts = [
    { name: '有机西红柿', description: '新鲜采摘，自然成熟', price: 12.8, member_price: 9.9, unit: '斤', is_hot: 1, category_index: 0 },
    { name: '有机黄瓜', description: '顶花带刺，清脆爽口', price: 8.9, member_price: 6.9, unit: '斤', is_hot: 1, category_index: 0 },
    { name: '云南小油菜', description: '鲜嫩翠绿，营养丰富', price: 5.9, member_price: 4.5, unit: '份', is_new: 1, category_index: 0 },
    { name: '红富士苹果', description: '脆甜多汁，新鲜直达', price: 15.8, member_price: 12.8, unit: '斤', is_hot: 1, category_index: 1 },
    { name: '进口香蕉', description: '香甜软糯，营养丰富', price: 9.9, member_price: 7.9, unit: '斤', category_index: 1 },
    { name: '丹东草莓', description: '个大味甜，新鲜采摘', price: 38.8, member_price: 32.8, unit: '盒', is_new: 1, category_index: 1 },
    { name: '土猪五花肉', description: '散养土猪，肥瘦相间', price: 28.8, member_price: 25.8, unit: '斤', is_hot: 1, category_index: 2 },
    { name: '柴鸡蛋', description: '农家散养，营养丰富', price: 18.8, member_price: 15.8, unit: '10枚', category_index: 2 },
    { name: '冰鲜鸡胸肉', description: '低脂高蛋白，健身首选', price: 16.8, member_price: 13.8, unit: '斤', is_member_only: 0, category_index: 2 },
    { name: '鲜活基围虾', description: '肉质紧实，鲜美无比', price: 68.8, member_price: 58.8, unit: '斤', is_hot: 1, category_index: 3 },
    { name: '阳澄湖大闸蟹', description: '膏满黄肥，鲜活直达', price: 188.0, member_price: 168.0, unit: '只', is_member_only: 1, category_index: 3 },
    { name: '冰鲜三文鱼', description: '挪威进口，新鲜切片', price: 88.8, member_price: 78.8, unit: '份', category_index: 3 },
    { name: '金龙鱼调和油', description: '非转基因，健康之选', price: 68.8, member_price: 59.9, unit: '桶', category_index: 4 },
    { name: '东北五常大米', description: '香糯可口，正宗五常', price: 48.8, member_price: 42.8, unit: '袋', category_index: 4 },
    { name: '海天酱油', description: '特级金标，提鲜增香', price: 15.8, member_price: 12.8, unit: '瓶', category_index: 4 },
    { name: '安慕希酸奶', description: '希腊风味，营养美味', price: 12.8, member_price: 9.9, unit: '盒', category_index: 5 },
    { name: '思念水饺', description: '手工包制，美味可口', price: 18.8, member_price: 15.8, unit: '袋', category_index: 5 },
    { name: '八喜冰淇淋', description: '口感细腻，香浓醇厚', price: 28.8, member_price: 24.8, unit: '盒', category_index: 5 },
    { name: '德州扒鸡', description: '软烂脱骨，香而不腻', price: 38.8, member_price: 32.8, unit: '只', category_index: 6 },
    { name: '周黑鸭鸭脖', description: '麻辣鲜香，回味无穷', price: 25.8, member_price: 21.8, unit: '盒', category_index: 6 },
    { name: '紫燕百味鸡', description: '皮脆肉嫩，鲜香可口', price: 32.8, member_price: 28.8, unit: '只', category_index: 6 },
    { name: '向日葵鲜花', description: '阳光明媚，温馨美好', price: 68.8, member_price: 58.8, unit: '束', category_index: 7 },
    { name: '玫瑰鲜花', description: '浪漫甜蜜，表达爱意', price: 98.8, member_price: 88.8, unit: '束', category_index: 7 },
    { name: '绿萝盆栽', description: '净化空气，美化环境', price: 28.8, member_price: 24.8, unit: '盆', category_index: 7 },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, member_price, stock, sales, category_id, image, unit, is_hot, is_new, is_member_only)
    VALUES (?, ?, ?, ?, 100, 0, ?, ?, ?, ?, ?, ?)
  `);

  sampleProducts.forEach((product, index) => {
    const categoryIndex = product.category_index || (index % categories.length);
    const categoryId = categories[categoryIndex]?.id || 1;
    const image = generateImageUrl(index + 1);
    
    insertProduct.run(
      product.name,
      product.description,
      product.price,
      product.member_price,
      categoryId,
      image,
      product.unit,
      product.is_hot || 0,
      product.is_new || 0,
      product.is_member_only || 0
    );
  });

  const products = db.prepare('SELECT id FROM products LIMIT 5').all();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const insertFlashSale = db.prepare(`
    INSERT INTO flash_sales (product_id, flash_price, start_time, end_time, stock)
    VALUES (?, ?, ?, ?, 50)
  `);

  products.forEach((product, index) => {
    const baseProduct = db.prepare('SELECT price FROM products WHERE id = ?').get(product.id);
    const flashPrice = Math.floor((baseProduct.price * 0.7) * 100) / 100;
    
    insertFlashSale.run(
      product.id,
      flashPrice,
      now.toISOString(),
      tomorrow.toISOString()
    );
  });
};

ensureSampleProducts();

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT id, name, icon, sort FROM categories ORDER BY sort').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

router.get('/list', optionalAuth, (req, res) => {
  try {
    const { category_id, keyword, page = 1, page_size = 20, sort = 'default' } = req.query;
    const offset = (page - 1) * page_size;
    
    let whereClause = 'WHERE status = 1';
    const params = [];
    
    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }
    
    if (keyword) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }
    
    let orderBy = 'ORDER BY id DESC';
    if (sort === 'sales') {
      orderBy = 'ORDER BY sales DESC';
    } else if (sort === 'price_asc') {
      orderBy = 'ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY price DESC';
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params);
    
    const query = `
      SELECT id, name, description, price, member_price, stock, sales, category_id, image, unit, is_hot, is_new, is_member_only
      FROM products ${whereClause} ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    const products = db.prepare(query).all(...params, parseInt(page_size), offset);
    
    const isMember = req.user?.is_member || 0;
    const processedProducts = products.map(p => ({
      ...p,
      show_price: isMember && p.member_price ? p.member_price : p.price
    }));
    
    res.json({
      success: true,
      data: {
        list: processedProducts,
        total: totalResult.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
});

router.get('/detail/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    
    const isMember = req.user?.is_member || 0;
    const productWithPrice = {
      ...product,
      show_price: isMember && product.member_price ? product.member_price : product.price
    };
    
    const relatedProducts = db.prepare(`
      SELECT id, name, price, member_price, image, unit
      FROM products
      WHERE category_id = ? AND id != ? AND status = 1
      ORDER BY sales DESC
      LIMIT 6
    `).all(product.category_id, id);
    
    res.json({
      success: true,
      data: {
        product: productWithPrice,
        related: relatedProducts
      }
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ success: false, message: '获取商品详情失败' });
  }
});

router.get('/hot', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = db.prepare(`
      SELECT id, name, price, member_price, sales, image, unit, is_hot
      FROM products
      WHERE is_hot = 1 AND status = 1
      ORDER BY sales DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('获取热销商品失败:', error);
    res.status(500).json({ success: false, message: '获取热销商品失败' });
  }
});

router.get('/new', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = db.prepare(`
      SELECT id, name, price, member_price, image, unit, is_new
      FROM products
      WHERE is_new = 1 AND status = 1
      ORDER BY created_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('获取新品失败:', error);
    res.status(500).json({ success: false, message: '获取新品失败' });
  }
});

router.get('/recommend', optionalAuth, (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const isMember = req.user?.is_member || 0;
    
    const products = db.prepare(`
      SELECT id, name, price, member_price, sales, image, unit, is_hot, is_new
      FROM products
      WHERE status = 1
      ORDER BY sales DESC, id DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    const processedProducts = products.map(p => ({
      ...p,
      show_price: isMember && p.member_price ? p.member_price : p.price
    }));
    
    res.json({ success: true, data: processedProducts });
  } catch (error) {
    console.error('获取推荐商品失败:', error);
    res.status(500).json({ success: false, message: '获取推荐商品失败' });
  }
});

router.get('/flash-sales', (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const flashSales = db.prepare(`
      SELECT fs.*, p.name, p.price, p.image, p.unit
      FROM flash_sales fs
      JOIN products p ON fs.product_id = p.id
      WHERE fs.status = 1 AND fs.start_time <= ? AND fs.end_time >= ?
      ORDER BY fs.id
    `).all(now, now);
    
    res.json({ success: true, data: flashSales });
  } catch (error) {
    console.error('获取限时抢购失败:', error);
    res.status(500).json({ success: false, message: '获取限时抢购失败' });
  }
});

router.get('/member-only', authMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    const countQuery = `SELECT COUNT(*) as total FROM products WHERE is_member_only = 1 AND status = 1`;
    const totalResult = db.prepare(countQuery).get();
    
    const products = db.prepare(`
      SELECT id, name, price, member_price, image, unit
      FROM products
      WHERE is_member_only = 1 AND status = 1
      ORDER BY sales DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(page_size), offset);
    
    const processedProducts = products.map(p => ({
      ...p,
      show_price: p.member_price || p.price
    }));
    
    res.json({
      success: true,
      data: {
        list: processedProducts,
        total: totalResult.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      }
    });
  } catch (error) {
    console.error('获取会员专区失败:', error);
    res.status(500).json({ success: false, message: '获取会员专区失败' });
  }
});

module.exports = router;
