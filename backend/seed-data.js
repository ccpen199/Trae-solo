const db = require('./src/database');

const categoryIcons = {
  clothing: '/images/categories/clothing.svg',
  electronics: '/images/categories/electronics.svg',
  beauty: '/images/categories/beauty.svg',
  food: '/images/categories/food.svg',
  home: '/images/categories/home.svg',
  sports: '/images/categories/sports.svg'
};

const productPlaceholders = {
  dress: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff1f0"/><path d="M70 40 L130 40 L135 80 L150 180 L50 180 L65 80 Z" fill="#ff4d4f" opacity="0.8"/><circle cx="100" cy="25" r="12" fill="#ff4d4f" opacity="0.6"/><text x="100" y="100" text-anchor="middle" fill="#ff4d4f" font-size="12" font-weight="bold">连衣裙</text></svg>`,
  tshirt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f5ff"/><path d="M60 50 L140 50 L140 70 L170 70 L170 100 L150 100 L150 180 L50 180 L50 100 L30 100 L30 70 L60 70 Z" fill="#1890ff" opacity="0.8"/><text x="100" y="120" text-anchor="middle" fill="#1890ff" font-size="12" font-weight="bold">T恤</text></svg>`,
  earphone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f6ffed"/><ellipse cx="60" cy="100" rx="25" ry="35" fill="#52c41a" opacity="0.8"/><ellipse cx="140" cy="100" rx="25" ry="35" fill="#52c41a" opacity="0.8"/><path d="M60 65 Q100 20 140 65" stroke="#52c41a" stroke-width="8" fill="none"/><text x="100" y="160" text-anchor="middle" fill="#52c41a" font-size="12" font-weight="bold">耳机</text></svg>`,
  skincare: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fffbe6"/><rect x="70" y="50" width="60" height="100" rx="10" fill="#faad14" opacity="0.8"/><rect x="75" y="30" width="50" height="25" rx="5" fill="#d48806" opacity="0.8"/><rect x="80" y="80" width="40" height="30" rx="3" fill="white"/><text x="100" y="175" text-anchor="middle" fill="#d48806" font-size="10" font-weight="bold">护肤套装</text></svg>`,
  nuts: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff0f6"/><ellipse cx="100" cy="100" rx="50" ry="40" fill="#eb2f96" opacity="0.2"/><ellipse cx="70" cy="85" rx="20" ry="15" fill="#eb2f96" opacity="0.6"/><ellipse cx="130" cy="85" rx="18" ry="14" fill="#c41d7f" opacity="0.6"/><ellipse cx="100" cy="110" rx="22" ry="16" fill="#eb2f96" opacity="0.5"/><text x="100" y="160" text-anchor="middle" fill="#c41d7f" font-size="12" font-weight="bold">坚果礼包</text></svg>`,
  watch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e6f7ff"/><circle cx="100" cy="100" r="35" fill="#1890ff" opacity="0.8"/><circle cx="100" cy="100" r="25" fill="white"/><circle cx="100" cy="100" r="3" fill="#1890ff"/><line x1="100" y1="100" x2="100" y2="85" stroke="#1890ff" stroke-width="2"/><line x1="100" y1="100" x2="115" y2="105" stroke="#1890ff" stroke-width="2"/><rect x="95" y="50" width="10" height="20" fill="#1890ff" opacity="0.6"/><rect x="95" y="130" width="10" height="20" fill="#1890ff" opacity="0.6"/><text x="100" y="175" text-anchor="middle" fill="#1890ff" font-size="12" font-weight="bold">运动手表</text></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f9f0ff"/><rect x="65" y="30" width="70" height="140" rx="10" fill="#722ed1" opacity="0.8"/><rect x="70" y="40" width="60" height="120" rx="5" fill="white"/><rect x="90" y="160" width="20" height="5" rx="2" fill="#722ed1" opacity="0.6"/><text x="100" y="110" text-anchor="middle" fill="#722ed1" font-size="10" font-weight="bold">手机</text></svg>`,
  laptop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f5f5f5"/><rect x="40" y="30" width="120" height="80" rx="5" fill="#666" opacity="0.9"/><rect x="45" y="35" width="110" height="70" rx="3" fill="#1890ff" opacity="0.3"/><rect x="30" y="110" width="140" height="15" rx="3" fill="#666" opacity="0.8"/><text x="100" y="75" text-anchor="middle" fill="#1890ff" font-size="12" font-weight="bold">笔记本</text></svg>`,
  lipstick: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff1f0"/><rect x="80" y="60" width="40" height="100" rx="5" fill="#ff4d4f" opacity="0.8"/><rect x="85" y="40" width="30" height="25" rx="3" fill="#ff85c0" opacity="0.9"/><rect x="85" y="110" width="30" height="45" rx="3" fill="#d9d9d9" opacity="0.9"/><text x="100" y="180" text-anchor="middle" fill="#ff4d4f" font-size="10" font-weight="bold">口红</text></svg>`,
  jeans: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e6f4ff"/><path d="M60 40 L140 40 L150 70 L140 180 L95 180 L100 90 L95 180 L60 180 Z" fill="#1890ff" opacity="0.7"/><path d="M70 60 L130 60 L135 170 L98 170 L102 80 L98 170 L65 170 Z" fill="#096dd9" opacity="0.5"/><text x="100" y="120" text-anchor="middle" fill="#096dd9" font-size="12" font-weight="bold">牛仔裤</text></svg>`
};

const seed = () => {
  db.exec('PRAGMA foreign_keys = OFF');
  
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM carts;
    DELETE FROM reviews;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM posts;
    DELETE FROM comments;
    DELETE FROM likes;
    DELETE FROM follows;
    DELETE FROM group_buy_members;
    DELETE FROM group_buys;
    DELETE FROM after_sales;
    DELETE FROM search_history;
    DELETE FROM users;
  `);
  
  db.exec(`
    INSERT INTO users (phone, nickname, role, is_shop_owner) VALUES ('13800000001', '管理员', 'admin', 1);
    INSERT INTO users (phone, nickname, role, is_shop_owner) VALUES ('13800000002', '店主小王', 'user', 1);
    INSERT INTO users (phone, nickname, role, is_shop_owner) VALUES ('13800000003', '用户小李', 'user', 0);
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, parent_id, icon, sort_order) VALUES (?, ?, ?, ?)
  `);

  const categories = [
    { key: 'clothing', name: '服装', icon: categoryIcons.clothing, sort_order: 1 },
    { key: 'electronics', name: '数码', icon: categoryIcons.electronics, sort_order: 2 },
    { key: 'beauty', name: '美妆', icon: categoryIcons.beauty, sort_order: 3 },
    { key: 'food', name: '食品', icon: categoryIcons.food, sort_order: 4 },
    { key: 'home', name: '家居', icon: categoryIcons.home, sort_order: 5 },
    { key: 'sports', name: '运动', icon: categoryIcons.sports, sort_order: 6 }
  ];

  const subCategories = {
    clothing: ['男装', '女装', '童装', '内衣', '鞋靴', '箱包'],
    electronics: ['手机', '电脑', '耳机', '相机', '平板', '配件'],
    beauty: ['护肤', '彩妆', '香水', '美发', '个护', '工具'],
    food: ['零食', '饮料', '生鲜', '粮油', '茶饮', '滋补'],
    home: ['家具', '床品', '厨具', '装饰', '收纳', '清洁'],
    sports: ['健身', '户外', '球类', '瑜伽', '跑步', '装备']
  };

  const categoryIdMap = {};
  
  categories.forEach(cat => {
    const result = insertCategory.run(cat.name, 0, cat.icon, cat.sort_order);
    const parentId = result.lastInsertRowid;
    categoryIdMap[cat.key] = parentId;
    
    const subs = subCategories[cat.key] || [];
    subs.forEach((subName, idx) => {
      insertCategory.run(subName, parentId, null, idx);
    });
  });

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, category_id, price, original_price, stock, sales, is_hot, is_recommend, images, detail_images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    { name: '2024春季新款女士连衣裙', desc: '精选优质面料，舒适透气，时尚百搭', catKey: 'clothing', price: 199, original: 399, stock: 500, sales: 1256, hot: 1, rec: 1, img: productPlaceholders.dress },
    { name: '纯棉休闲T恤男款', desc: '100%纯棉，透气吸汗，简约百搭', catKey: 'clothing', price: 79, original: 129, stock: 1500, sales: 4521, hot: 1, rec: 0, img: productPlaceholders.tshirt },
    { name: '修身牛仔裤女款', desc: '弹力面料，修身显瘦，经典版型', catKey: 'clothing', price: 159, original: 299, stock: 800, sales: 2345, hot: 1, rec: 1, img: productPlaceholders.jeans },
    
    { name: '无线蓝牙耳机 Pro', desc: '主动降噪，40小时续航，HIFI音质', catKey: 'electronics', price: 299, original: 499, stock: 300, sales: 2341, hot: 1, rec: 1, img: productPlaceholders.earphone },
    { name: '旗舰智能手机', desc: '旗舰级性能，超清摄像，超长续航', catKey: 'electronics', price: 3999, original: 4999, stock: 100, sales: 567, hot: 1, rec: 1, img: productPlaceholders.phone },
    { name: '轻薄笔记本电脑', desc: '超薄机身，高性能处理器，办公娱乐两不误', catKey: 'electronics', price: 4999, original: 5999, stock: 80, sales: 345, hot: 0, rec: 1, img: productPlaceholders.laptop },
    
    { name: '保湿护肤套装礼盒', desc: '深层补水，修复肌肤，适合所有肤质', catKey: 'beauty', price: 158, original: 298, stock: 800, sales: 987, hot: 0, rec: 1, img: productPlaceholders.skincare },
    { name: '丝绒哑光口红', desc: '持久不脱色，丝绒质地，多色可选', catKey: 'beauty', price: 129, original: 199, stock: 600, sales: 1876, hot: 1, rec: 1, img: productPlaceholders.lipstick },
    
    { name: '进口坚果零食大礼包', desc: '6种坚果组合，每日坚果，营养美味', catKey: 'food', price: 99, original: 168, stock: 1000, sales: 3456, hot: 1, rec: 0, img: productPlaceholders.nuts },
    
    { name: '智能运动手表', desc: '心率监测，GPS定位，50米防水', catKey: 'sports', price: 599, original: 999, stock: 200, sales: 567, hot: 0, rec: 1, img: productPlaceholders.watch }
  ];

  const productIdMap = [];
  
  products.forEach((p, idx) => {
    const images = JSON.stringify([`data:image/svg+xml;base64,${Buffer.from(p.img).toString('base64')}`]);
    const detailImages = JSON.stringify([`data:image/svg+xml;base64,${Buffer.from(p.img).toString('base64')}`]);
    const catId = categoryIdMap[p.catKey];
    const result = insertProduct.run(p.name, p.desc, catId, p.price, p.original, p.stock, p.sales, p.hot, p.rec, images, detailImages);
    productIdMap[idx] = result.lastInsertRowid;
  });

  const insertPost = db.prepare('INSERT INTO posts (user_id, title, content, likes_count, comments_count) VALUES (?, ?, ?, ?, ?)');
  insertPost.run(2, '春季穿搭分享', '这款连衣裙真的太好看了！面料超级舒服，穿上显得身材很好，推荐给大家！', 156, 23);
  insertPost.run(2, '耳机评测推荐', '用了一周这款蓝牙耳机，降噪效果真的很棒，音质也超出预期！性价比很高！', 234, 45);

  const insertReview = db.prepare('INSERT INTO reviews (product_id, user_id, rating, content) VALUES (?, ?, ?, ?)');
  insertReview.run(productIdMap[0], 3, 5, '质量很好，穿着舒适，颜色和图片一样！');
  insertReview.run(productIdMap[0], 2, 4, '整体不错，就是物流有点慢。');
  insertReview.run(productIdMap[3], 3, 5, '音质很棒，降噪效果超出预期！');
  insertReview.run(productIdMap[3], 2, 5, '续航能力很强，推荐！');

  db.exec('PRAGMA foreign_keys = ON');

  console.log('Data seeded successfully!');
  console.log('Users:', db.prepare('SELECT id, phone, nickname, role FROM users').all());
  console.log('Products count:', db.prepare('SELECT COUNT(*) as count FROM products').get().count);
  console.log('Categories count:', db.prepare('SELECT COUNT(*) as count FROM categories').get().count);
  console.log('Category IDs:', categoryIdMap);
  console.log('Product IDs:', productIdMap);
};

seed();
