const db = require('../config/database');

const initTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`BEGIN TRANSACTION`);

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password TEXT NOT NULL,
          avatar TEXT,
          nickname TEXT,
          bio TEXT,
          is_vip INTEGER DEFAULT 0,
          vip_expire_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT,
          cover TEXT,
          description TEXT,
          category_id INTEGER,
          isbn TEXT,
          pages INTEGER,
          publisher TEXT,
          publish_date DATE,
          total_copies INTEGER DEFAULT 100,
          available_copies INTEGER DEFAULT 100,
          content TEXT,
          is_featured INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS borrow_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          due_date DATETIME,
          return_date DATETIME,
          status TEXT DEFAULT 'borrowed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          book_id INTEGER,
          content TEXT NOT NULL,
          share_reason TEXT,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id),
          FOREIGN KEY (post_id) REFERENCES posts(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS wishlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, book_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          page INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS vip_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          duration_days INTEGER NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS topics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          cover TEXT,
          description TEXT,
          book_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS book_excerpts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (book_id) REFERENCES books(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          cover TEXT,
          description TEXT,
          price REAL DEFAULT 0,
          author TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`COMMIT`, (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const insertSeedData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const categories = [
        ['文学小说', '📚'],
        ['历史传记', '📜'],
        ['科技科普', '🔬'],
        ['经济管理', '💼'],
        ['心理成长', '🧠'],
        ['艺术设计', '🎨'],
        ['生活休闲', '☕'],
        ['儿童读物', '👶']
      ];

      const categoryStmt = db.prepare(`INSERT OR IGNORE INTO categories (name, icon, sort_order) VALUES (?, ?, ?)`);
      categories.forEach((cat, index) => {
        categoryStmt.run(cat[0], cat[1], index);
      });
      categoryStmt.finalize();

      const vipPlans = [
        ['月度会员', 19.9, 30, '30天VIP权益'],
        ['季度会员', 49.9, 90, '90天VIP权益，立省10元'],
        ['年度会员', 168, 365, '365天VIP权益，超值之选']
      ];

      const vipStmt = db.prepare(`INSERT OR IGNORE INTO vip_plans (name, price, duration_days, description, sort_order) VALUES (?, ?, ?, ?, ?)`);
      vipPlans.forEach((plan, index) => {
        vipStmt.run(plan[0], plan[1], plan[2], plan[3], index);
      });
      vipStmt.finalize();

      const books = [
        ['百年孤独', '加西亚·马尔克斯', 'https://picsum.photos/seed/book1/200/280', '魔幻现实主义文学代表作，讲述布恩迪亚家族七代人的传奇故事。', 1, 360, '南海出版公司', '2017-08-01'],
        ['活着', '余华', 'https://picsum.photos/seed/book2/200/280', '讲述了农村人福贵悲惨的人生遭遇。', 1, 191, '作家出版社', '2012-08-01'],
        ['三体', '刘慈欣', 'https://picsum.photos/seed/book3/200/280', '中国科幻文学的里程碑之作。', 3, 302, '重庆出版社', '2008-01-01'],
        ['人类简史', '尤瓦尔·赫拉利', 'https://picsum.photos/seed/book4/200/280', '从认知革命到科学革命，探索人类演化的宏大历程。', 3, 440, '中信出版社', '2017-02-01'],
        ['小王子', '圣埃克苏佩里', 'https://picsum.photos/seed/book5/200/280', '献给所有曾经是孩子的大人。', 8, 97, '人民文学出版社', '2018-03-01'],
        ['红楼梦', '曹雪芹', 'https://picsum.photos/seed/book6/200/280', '中国古典小说的巅峰之作。', 1, 1606, '人民文学出版社', '2008-07-01'],
        ['明朝那些事儿', '当年明月', 'https://picsum.photos/seed/book7/200/280', '以史料为基础，对明朝十七帝和其他王公权贵和小人物的命运进行全景展示。', 2, 2100, '浙江人民出版社', '2017-05-01'],
        ['思考，快与慢', '丹尼尔·卡尼曼', 'https://picsum.photos/seed/book8/200/280', '诺贝尔经济学奖得主的思维科学经典著作。', 5, 424, '中信出版社', '2012-07-01'],
        ['被讨厌的勇气', '岸见一郎', 'https://picsum.photos/seed/book9/200/280', '自我启发之父阿德勒的哲学课。', 5, 194, '机械工业出版社', '2015-03-01'],
        ['设计心理学', '唐纳德·诺曼', 'https://picsum.photos/seed/book10/200/280', '设计领域的经典之作，揭示日常物品设计背后的心理学原理。', 6, 280, '中信出版社', '2015-10-01'],
        ['原子习惯', '詹姆斯·克利尔', 'https://picsum.photos/seed/book11/200/280', '建立好习惯、打破坏习惯的实用指南。', 5, 320, '中信出版社', '2019-07-01'],
        ['围城', '钱钟书', 'https://picsum.photos/seed/book12/200/280', '新儒林外史，讽刺知识分子的生活百态。', 1, 359, '人民文学出版社', '1991-02-01']
      ];

      const bookStmt = db.prepare(`INSERT OR IGNORE INTO books (title, author, cover, description, category_id, pages, publisher, publish_date, total_copies, available_copies, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, 100, 1)`);
      books.forEach((book) => {
        bookStmt.run(book[0], book[1], book[2], book[3], book[4], book[5], book[6], book[7]);
      });
      bookStmt.finalize();

      const topics = [
        ['夏日阅读清单', 'https://picsum.photos/seed/topic1/400/200', '炎炎夏日，读一本好书清凉一夏', 12],
        ['经典必读书单', 'https://picsum.photos/seed/topic2/400/200', '人生必读的100本经典', 50],
        ['职场进阶指南', 'https://picsum.photos/seed/topic3/400/200', '提升职场竞争力的书单', 25]
      ];

      const topicStmt = db.prepare(`INSERT OR IGNORE INTO topics (title, cover, description, book_count) VALUES (?, ?, ?, ?)`);
      topics.forEach((topic) => {
        topicStmt.run(topic[0], topic[1], topic[2], topic[3]);
      });
      topicStmt.finalize();

      resolve();
    });
  });
};

const initDB = async () => {
  try {
    console.log('开始初始化数据库...');
    await initTables();
    console.log('表结构创建完成');
    await insertSeedData();
    console.log('种子数据插入完成');
    console.log('数据库初始化成功！');
    db.close();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    db.close();
    process.exit(1);
  }
};

initDB();
