import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const createTables = async (): Promise<void> => {
  const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createUserAddressTable = `
    CREATE TABLE IF NOT EXISTS user_addresses (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      province VARCHAR(50),
      city VARCHAR(50),
      district VARCHAR(50),
      address VARCHAR(255) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createCategoryTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(50) NOT NULL,
      parent_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
      level INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createBookTable = `
    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(200) NOT NULL,
      author VARCHAR(100) NOT NULL,
      publisher VARCHAR(100) NOT NULL,
      publish_date DATE,
      isbn VARCHAR(20),
      price DECIMAL(10, 2) NOT NULL,
      discount_price DECIMAL(10, 2),
      cover_image VARCHAR(500),
      description TEXT,
      stock INTEGER DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      category_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
      is_new BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createCartTable = `
    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id VARCHAR(36) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id)
    )
  `;

  const createOrderTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_no VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      actual_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      receiver_name VARCHAR(50) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      receiver_address VARCHAR(500) NOT NULL,
      remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createOrderItemTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      book_id VARCHAR(36) NOT NULL REFERENCES books(id) ON DELETE SET NULL,
      book_title VARCHAR(200) NOT NULL,
      book_author VARCHAR(100) NOT NULL,
      book_price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL
    )
  `;

  const createNewsTable = `
    CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'store',
      is_scroll BOOLEAN DEFAULT FALSE,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createReviewTable = `
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id VARCHAR(36) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      content TEXT,
      is_anonymous BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createAdminTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      real_name VARCHAR(50),
      role_id VARCHAR(36),
      status VARCHAR(20) DEFAULT 'active',
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createRoleTable = `
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher);
    CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
  `;

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await pool.query(createUserTable);
    await pool.query(createUserAddressTable);
    await pool.query(createCategoryTable);
    await pool.query(createBookTable);
    await pool.query(createCartTable);
    await pool.query(createOrderTable);
    await pool.query(createOrderItemTable);
    await pool.query(createNewsTable);
    await pool.query(createReviewTable);
    await pool.query(createAdminTable);
    await pool.query(createRoleTable);
    await pool.query(createIndexes);

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const seedData = async (): Promise<void> => {
  try {
    const adminRoleResult = await pool.query(
      "SELECT id FROM roles WHERE name = '超级管理员'"
    );
    
    let roleId: string;
    if (adminRoleResult.rows.length === 0) {
      const roleResult = await pool.query(
        `INSERT INTO roles (id, name, description, permissions) 
         VALUES ($1, '超级管理员', '拥有所有权限', $2) 
         RETURNING id`,
        [uuidv4(), ['*']]
      );
      roleId = roleResult.rows[0].id;
    } else {
      roleId = adminRoleResult.rows[0].id;
    }

    const adminResult = await pool.query(
      "SELECT id FROM admins WHERE username = 'admin'"
    );
    
    if (adminResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO admins (id, username, password, real_name, role_id, status) 
         VALUES ($1, 'admin', $2, '超级管理员', $3, 'active')`,
        [uuidv4(), hashedPassword, roleId]
      );
      console.log('Default admin created: admin / admin123');
    }

    const categoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesResult.rows[0].count) === 0) {
      const categories = [
        { id: uuidv4(), name: '文学小说', parent_id: null, level: 1, sort_order: 1 },
        { id: uuidv4(), name: '科技教育', parent_id: null, level: 1, sort_order: 2 },
        { id: uuidv4(), name: '经济管理', parent_id: null, level: 1, sort_order: 3 },
        { id: uuidv4(), name: '历史人文', parent_id: null, level: 1, sort_order: 4 },
      ];

      for (const cat of categories) {
        await pool.query(
          `INSERT INTO categories (id, name, parent_id, level, sort_order) 
           VALUES ($1, $2, $3, $4, $5)`,
          [cat.id, cat.name, cat.parent_id, cat.level, cat.sort_order]
        );
      }
      console.log('Default categories created');
    }

    const booksResult = await pool.query('SELECT COUNT(*) FROM books');
    if (parseInt(booksResult.rows[0].count) === 0) {
      const categories = await pool.query('SELECT id FROM categories');
      const categoryIds = categories.rows.map((r: any) => r.id);

      const sampleBooks = [
        {
          title: '活着',
          author: '余华',
          publisher: '作家出版社',
          price: 39.90,
          discount_price: 35.00,
          description: '《活着》是余华的代表作之一，讲述了一个人和他命运之间的友情，这是最为感人的友情，因为他们互相感激，同时也互相仇恨。',
          stock: 100,
          is_new: true,
          category_id: categoryIds[0]
        },
        {
          title: 'JavaScript高级程序设计',
          author: 'Matt Frisbie',
          publisher: '人民邮电出版社',
          price: 129.00,
          discount_price: 109.00,
          description: 'JavaScript圣经级读物，全面深入讲解JavaScript语言精髓，是前端开发者必读经典。',
          stock: 50,
          is_new: true,
          category_id: categoryIds[1]
        },
        {
          title: '经济学原理',
          author: '曼昆',
          publisher: '北京大学出版社',
          price: 88.00,
          discount_price: 78.00,
          description: '经济学入门经典教材，用通俗易懂的语言解释复杂的经济学原理。',
          stock: 80,
          is_new: false,
          category_id: categoryIds[2]
        },
        {
          title: '人类简史',
          author: '尤瓦尔·赫拉利',
          publisher: '中信出版社',
          price: 68.00,
          discount_price: 58.00,
          description: '从认知革命、农业革命到科学革命，讲述人类如何登上食物链顶端成为地球主宰。',
          stock: 120,
          is_new: true,
          category_id: categoryIds[3]
        },
      ];

      for (const book of sampleBooks) {
        await pool.query(
          `INSERT INTO books (id, title, author, publisher, price, discount_price, description, stock, category_id, is_new, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
          [
            uuidv4(),
            book.title,
            book.author,
            book.publisher,
            book.price,
            book.discount_price,
            book.description,
            book.stock,
            book.category_id,
            book.is_new
          ]
        );
      }
      console.log('Sample books created');
    }

    const newsResult = await pool.query('SELECT COUNT(*) FROM news');
    if (parseInt(newsResult.rows[0].count) === 0) {
      const news = [
        {
          title: '欢迎光临网上书店',
          content: '欢迎来到我们的网上书店，这里有海量图书供您选择。新用户注册即送10元优惠券！',
          type: 'home',
          is_scroll: true,
          sort_order: 1
        },
        {
          title: '新书上架：文学类精选',
          content: '本周新上架余华《活着》等多部文学经典，欢迎选购。',
          type: 'store',
          is_scroll: false,
          sort_order: 2
        }
      ];

      for (const item of news) {
        await pool.query(
          `INSERT INTO news (id, title, content, type, is_scroll, sort_order, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [uuidv4(), item.title, item.content, item.type, item.is_scroll, item.sort_order]
        );
      }
      console.log('Sample news created');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

export const initDatabase = async (): Promise<void> => {
  console.log('Initializing database...');
  await createTables();
  await seedData();
  console.log('Database initialization completed');
};
