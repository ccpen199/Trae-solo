const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/library.db');
const dataDir = path.join(__dirname, '../../data');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const db = new Database(dbPath);

      db.exec(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'reader')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.exec(`CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.exec(`CREATE TABLE IF NOT EXISTS readers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT,
        birth_date DATE,
        email TEXT,
        phone TEXT,
        address TEXT,
        id_card TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.exec(`CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        isbn TEXT,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        publish_date DATE,
        category TEXT,
        description TEXT,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        location TEXT,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.exec(`CREATE TABLE IF NOT EXISTS borrow_records (
        id TEXT PRIMARY KEY,
        reader_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        borrow_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        status TEXT DEFAULT 'borrowed' CHECK(status IN ('borrowed', 'returned', 'overdue')),
        fine_amount REAL DEFAULT 0,
        fine_paid REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reader_id) REFERENCES readers(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
      )`);

      db.exec(`CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        reader_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        reservation_date DATE NOT NULL,
        expire_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reader_id) REFERENCES readers(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
      )`);

      const userCount = db.prepare(`SELECT COUNT(*) as count FROM users`).get();

      if (userCount.count === 0) {
        const adminId = 'admin-001';
        const adminUserId = 'user-admin-001';
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        db.prepare(`INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`).run(adminUserId, 'admin', hashedPassword, 'admin');

        db.prepare(`INSERT INTO admins (id, user_id, name, email, phone) VALUES (?, ?, ?, ?, ?)`).run(adminId, adminUserId, '系统管理员', 'admin@library.com', '13800138000');

        const sampleBooks = [
          { id: 'book-001', isbn: '978-7-111-12345-6', title: 'JavaScript高级程序设计', author: 'Nicholas C. Zakas', publisher: '机械工业出版社', publish_date: '2020-01-15', category: '计算机编程', description: 'JavaScript权威指南，适合从入门到精通的开发者。', total_copies: 5, available_copies: 3, location: 'A区-01架', price: 129.00 },
          { id: 'book-002', isbn: '978-7-121-23456-7', title: '深入浅出Node.js', author: '朴灵', publisher: '电子工业出版社', publish_date: '2018-05-20', category: '计算机编程', description: '深入理解Node.js核心机制，适合后端开发者。', total_copies: 3, available_copies: 2, location: 'A区-01架', price: 89.00 },
          { id: 'book-003', isbn: '978-7-302-34567-8', title: '数据结构与算法分析', author: 'Mark Allen Weiss', publisher: '清华大学出版社', publish_date: '2019-09-10', category: '计算机科学', description: '经典的数据结构与算法教材，适合计算机专业学生。', total_copies: 8, available_copies: 6, location: 'A区-02架', price: 68.00 },
          { id: 'book-004', isbn: '978-7-5641-45678-9', title: '红楼梦', author: '曹雪芹', publisher: '人民文学出版社', publish_date: '2015-01-01', category: '文学小说', description: '中国古典四大名著之一，描写贾、史、王、薛四大家族的兴衰。', total_copies: 10, available_copies: 8, location: 'B区-01架', price: 49.80 },
          { id: 'book-005', isbn: '978-7-5442-56789-0', title: '百年孤独', author: '加西亚·马尔克斯', publisher: '南海出版公司', publish_date: '2017-06-15', category: '文学小说', description: '魔幻现实主义的巅峰之作，讲述布恩迪亚家族七代人的传奇故事。', total_copies: 6, available_copies: 4, location: 'B区-01架', price: 55.00 }
        ];

        const insertBook = db.prepare(`INSERT INTO books (id, isbn, title, author, publisher, publish_date, category, description, total_copies, available_copies, location, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        sampleBooks.forEach(book => {
          insertBook.run(book.id, book.isbn, book.title, book.author, book.publisher, book.publish_date, book.category, book.description, book.total_copies, book.available_copies, book.location, book.price);
        });

        const readerId = 'reader-001';
        const readerUserId = 'user-reader-001';
        const hashedReaderPassword = bcrypt.hashSync('reader123', 10);

        db.prepare(`INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`).run(readerUserId, 'reader', hashedReaderPassword, 'reader');

        db.prepare(`INSERT INTO readers (id, user_id, name, gender, birth_date, email, phone, address, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(readerId, readerUserId, '张三', '男', '1990-01-15', 'zhangsan@example.com', '13900139001', '北京市朝阳区', '110101199001151234', 'active');

        console.log('默认数据已初始化');
        console.log('管理员账号: admin / admin123');
        console.log('读者账号: reader / reader123');
      }

      db.close();
      console.log('数据库初始化完成');
      resolve();
    } catch (error) {
      console.error('启动服务器失败:', error);
      reject(error);
    }
  });
};

module.exports = initDatabase;
