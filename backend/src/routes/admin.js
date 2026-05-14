const express = require('express');
const db = require('../database');
const { authenticate, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, adminAuth, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  
  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE date(created_at) = date('now')
  `).get();
  
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(pay_amount), 0) as total 
    FROM orders 
    WHERE date(paid_at) = date('now') AND status IN ('paid', 'shipped', 'completed')
  `).get();
  
  res.json({
    stats: {
      total_users: totalUsers.count,
      total_orders: totalOrders.count,
      total_products: totalProducts.count,
      total_posts: totalPosts.count,
      today_orders: todayOrders.count,
      today_revenue: todayRevenue.total
    }
  });
});

router.get('/orders', authenticate, adminAuth, (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const countResult = db.prepare(`SELECT COUNT(*) as total FROM orders ${whereClause}`).get(...params);
  
  const orders = db.prepare(`
    SELECT o.*, u.nickname, u.phone
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(page_size), offset);
  
  res.json({
    orders,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.post('/orders/:id/ship', authenticate, adminAuth, (req, res) => {
  db.prepare(`
    UPDATE orders 
    SET status = 'shipped', shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true });
});

router.post('/orders/:id/complete', authenticate, adminAuth, (req, res) => {
  db.prepare(`
    UPDATE orders 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true });
});

router.get('/after-sales', authenticate, adminAuth, (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const countResult = db.prepare(`SELECT COUNT(*) as total FROM after_sales ${whereClause}`).get(...params);
  
  const afterSales = db.prepare(`
    SELECT a.*, u.nickname, u.phone, o.order_no, o.total_amount
    FROM after_sales a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN orders o ON a.order_id = o.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(page_size), offset);
  
  res.json({
    after_sales: afterSales,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.post('/after-sales/:id/process', authenticate, adminAuth, (req, res) => {
  const { approve, reason } = req.body;
  
  const afterSale = db.prepare('SELECT * FROM after_sales WHERE id = ?').get(req.params.id);
  if (!afterSale) {
    return res.status(404).json({ error: 'After sale request not found' });
  }
  
  db.prepare(`
    UPDATE after_sales 
    SET status = ?, processed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(approve ? 'approved' : 'rejected', req.params.id);
  
  if (approve) {
    db.prepare(`
      UPDATE orders 
      SET status = 'refunded', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(afterSale.order_id);
  }
  
  res.json({ success: true });
});

router.post('/seed-data', authenticate, adminAuth, (req, res) => {
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT OR IGNORE INTO users (phone, nickname, role, is_shop_owner, password)
      VALUES ('13800000001', '管理员', 'admin', 1, NULL),
             ('13800000002', '店主小王', 'user', 1, NULL),
             ('13800000003', '用户小李', 'user', 0, NULL)
    `).run();
    
    const categories = [
      { name: '服装', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clothing%20icon&image_size=square' },
      { name: '数码', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electronics%20icon&image_size=square' },
      { name: '美妆', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20cosmetics%20icon&image_size=square' },
      { name: '食品', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20grocery%20icon&image_size=square' },
      { name: '家居', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20furniture%20icon&image_size=square' },
      { name: '运动', parent_id: 0, icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20fitness%20icon&image_size=square' }
    ];
    
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, parent_id, icon, sort_order) VALUES (?, ?, ?, ?)');
    categories.forEach((cat, idx) => {
      insertCategory.run(cat.name, cat.parent_id, cat.icon, idx);
    });
    
    const cat1Children = ['男装', '女装', '童装', '内衣', '鞋靴'];
    const cat2Children = ['手机', '电脑', '耳机', '相机', '配件'];
    cat1Children.forEach((name, idx) => insertCategory.run(name, 1, null, idx));
    cat2Children.forEach((name, idx) => insertCategory.run(name, 2, null, idx));
    
    const products = [
      {
        name: '2024春季新款女士连衣裙',
        description: '精选优质面料，舒适透气，时尚百搭，多色可选',
        category_id: 2,
        price: 199.00,
        original_price: 399.00,
        stock: 500,
        sales: 1256,
        is_hot: 1,
        is_recommend: 1
      },
      {
        name: '无线蓝牙耳机 Pro',
        description: '主动降噪，40小时续航，HIFI音质，IPX5防水',
        category_id: 9,
        price: 299.00,
        original_price: 499.00,
        stock: 300,
        sales: 2341,
        is_hot: 1,
        is_recommend: 1
      },
      {
        name: '保湿护肤套装礼盒',
        description: '深层补水，修复肌肤，适合所有肤质',
        category_id: 3,
        price: 158.00,
        original_price: 298.00,
        stock: 800,
        sales: 987,
        is_hot: 0,
        is_recommend: 1
      },
      {
        name: '进口坚果零食大礼包',
        description: '6种坚果组合，每日坚果，营养美味',
        category_id: 4,
        price: 99.00,
        original_price: 168.00,
        stock: 1000,
        sales: 3456,
        is_hot: 1,
        is_recommend: 0
      },
      {
        name: '智能运动手表',
        description: '心率监测，GPS定位，50米防水，14天续航',
        category_id: 2,
        price: 599.00,
        original_price: 999.00,
        stock: 200,
        sales: 567,
        is_hot: 0,
        is_recommend: 1
      },
      {
        name: '纯棉休闲T恤男款',
        description: '100%纯棉，透气吸汗，简约百搭',
        category_id: 1,
        price: 79.00,
        original_price: 129.00,
        stock: 1500,
        sales: 4521,
        is_hot: 1,
        is_recommend: 0
      },
      {
        name: '高端口红礼盒套装',
        description: '6色经典色号，丝绒质地，持久不脱色',
        category_id: 3,
        price: 299.00,
        original_price: 499.00,
        stock: 400,
        sales: 876,
        is_hot: 0,
        is_recommend: 1
      },
      {
        name: '便携蓝牙音箱',
        description: '360度环绕立体声，IPX7防水，20小时续航',
        category_id: 9,
        price: 199.00,
        original_price: 349.00,
        stock: 600,
        sales: 1890,
        is_hot: 1,
        is_recommend: 0
      }
    ];
    
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (name, description, category_id, price, original_price, stock, sales, images, detail_images, is_hot, is_recommend, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    products.forEach((product, idx) => {
      const images = [
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(product.name)}&image_size=square_hd`
      ];
      const detailImages = [
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(product.name + ' detail')}&image_size=portrait_4_3`
      ];
      
      insertProduct.run(
        product.name,
        product.description,
        product.category_id,
        product.price,
        product.original_price,
        product.stock,
        product.sales,
        JSON.stringify(images),
        JSON.stringify(detailImages),
        product.is_hot,
        product.is_recommend
      );
    });
    
    const posts = [
      {
        user_id: 2,
        title: '春季穿搭分享',
        content: '这款连衣裙真的太好看了！面料超级舒服，穿上显得身材很好，推荐给大家！',
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20dress%20outfit&image_size=square_hd'],
        product_id: 1,
        likes_count: 156,
        comments_count: 23
      },
      {
        user_id: 2,
        title: '耳机评测推荐',
        content: '用了一周这款蓝牙耳机，降噪效果真的很棒，音质也超出预期！性价比很高！',
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20earphones%20review&image_size=square_hd'],
        product_id: 2,
        likes_count: 234,
        comments_count: 45
      },
      {
        user_id: 3,
        title: '护肤品真实体验',
        content: '用了一个月这个护肤套装，皮肤状态改善了很多！保湿效果超棒！',
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20routine&image_size=square_hd'],
        product_id: 3,
        likes_count: 89,
        comments_count: 12
      }
    ];
    
    const insertPost = db.prepare(`
      INSERT OR IGNORE INTO posts (user_id, title, content, images, product_id, likes_count, comments_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    posts.forEach(post => {
      insertPost.run(
        post.user_id,
        post.title,
        post.content,
        JSON.stringify(post.images),
        post.product_id,
        post.likes_count,
        post.comments_count
      );
    });
    
    const reviews = [
      { product_id: 1, user_id: 3, rating: 5, content: '质量很好，穿着舒适，颜色和图片一样！' },
      { product_id: 1, user_id: 2, rating: 4, content: '整体不错，就是物流有点慢。' },
      { product_id: 2, user_id: 3, rating: 5, content: '音质很棒，降噪效果超出预期！' },
      { product_id: 2, user_id: 2, rating: 5, content: '续航能力很强，推荐！' }
    ];
    
    const insertReview = db.prepare(`
      INSERT OR IGNORE INTO reviews (product_id, user_id, rating, content)
      VALUES (?, ?, ?, ?)
    `);
    
    reviews.forEach(review => {
      insertReview.run(review.product_id, review.user_id, review.rating, review.content);
    });
  });
  
  try {
    tx();
    res.json({ success: true, message: 'Seed data inserted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
