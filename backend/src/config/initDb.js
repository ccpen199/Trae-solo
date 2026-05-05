const pool = require('./database');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  try {
    console.log('正在创建数据表...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        category_id INT,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'on_sale',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INT,
        product_id INT,
        quantity INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    console.log('数据表创建成功');

    const categoryResult = await pool.query(`SELECT * FROM categories LIMIT 1`);
    if (categoryResult.rows.length === 0) {
      console.log('正在初始化分类数据...');
      await pool.query(`
        INSERT INTO categories (name, description) VALUES
        ('电子产品', '手机、电脑、平板等电子设备'),
        ('服装服饰', '男装、女装、童装等服饰'),
        ('食品饮料', '零食、饮料、生鲜等食品'),
        ('家居用品', '家具、家纺、厨具等家居用品'),
        ('图书文具', '书籍、文具、办公用品等')
      `);
      console.log('分类数据初始化成功');
    }

    const adminResult = await pool.query(`SELECT * FROM users WHERE username = 'admin'`);
    if (adminResult.rows.length === 0) {
      console.log('正在初始化管理员账号...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        ['admin', hashedPassword, 'admin']
      );
      console.log('管理员账号初始化成功，用户名: admin，密码: admin123');
    }

    const testUserResult = await pool.query(`SELECT * FROM users WHERE username = 'test'`);
    if (testUserResult.rows.length === 0) {
      console.log('正在初始化测试用户账号...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      await pool.query(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        ['test', hashedPassword, 'user']
      );
      console.log('测试用户账号初始化成功，用户名: test，密码: 123456');
    }

    const productResult = await pool.query(`SELECT * FROM products LIMIT 1`);
    if (productResult.rows.length === 0) {
      console.log('正在初始化商品数据...');
      const products = [
        { name: '苹果 iPhone 15 Pro', description: '最新款苹果手机，A17 Pro芯片，钛金属边框', price: 7999.00, stock: 100, category_id: 1, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Apple%20iPhone%2015%20Pro%20smartphone%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '华为 Mate 60 Pro', description: '华为最新旗舰手机，麒麟9000S芯片', price: 6999.00, stock: 50, category_id: 1, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Huawei%20Mate%2060%20Pro%20smartphone%20product%20photo&image_size=square', status: 'on_sale' },
        { name: 'MacBook Pro 14英寸', description: '苹果笔记本电脑，M3 Pro芯片', price: 14999.00, stock: 30, category_id: 1, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Pro%2014%20inch%20laptop%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '时尚休闲夹克', description: '秋季新款男士休闲夹克，百搭舒适', price: 299.00, stock: 200, category_id: 2, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20casual%20jacket%20men%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '优雅连衣裙', description: '女士春夏新款优雅连衣裙，修身显瘦', price: 199.00, stock: 150, category_id: 2, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20women%20dress%20fashion%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '进口牛奶礼盒', description: '澳洲进口纯牛奶，营养健康', price: 128.00, stock: 300, category_id: 3, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=imported%20milk%20gift%20box%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '有机坚果礼盒', description: '精选有机坚果，健康零食', price: 88.00, stock: 250, category_id: 3, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20nuts%20gift%20box%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '北欧风格台灯', description: '简约北欧风格LED台灯，护眼设计', price: 159.00, stock: 80, category_id: 4, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nordic%20style%20table%20lamp%20LED%20product%20photo&image_size=square', status: 'on_sale' },
        { name: 'JavaScript高级程序设计', description: '前端开发经典书籍，第4版', price: 129.00, stock: 100, category_id: 5, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=JavaScript%20programming%20book%20product%20photo&image_size=square', status: 'on_sale' },
        { name: '精美笔记本礼盒', description: '高档商务笔记本礼盒套装', price: 59.00, stock: 180, category_id: 5, image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20notebook%20gift%20box%20product%20photo&image_size=square', status: 'on_sale' }
      ];

      for (const product of products) {
        await pool.query(
          `INSERT INTO products (name, description, price, stock, category_id, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [product.name, product.description, product.price, product.stock, product.category_id, product.image_url, product.status]
        );
      }
      console.log('商品数据初始化成功');
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

module.exports = createTables;
