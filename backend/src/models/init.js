const db = require('./db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover TEXT,
    publisher TEXT,
    publish_date TEXT,
    price REAL NOT NULL,
    original_price REAL,
    description TEXT,
    condition TEXT DEFAULT '良好',
    stock INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS review_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(review_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE(user_id, book_id)
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
`)

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, avatar) VALUES (?, ?)')
insertUser.run('读书人', 'https://picsum.photos/seed/user1/100/100')
insertUser.run('书虫', 'https://picsum.photos/seed/user2/100/100')
insertUser.run('爱书人', 'https://picsum.photos/seed/user3/100/100')

const insertBook = db.prepare(`
  INSERT OR IGNORE INTO books (title, author, cover, publisher, publish_date, price, original_price, description, condition, stock)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const books = [
  ['活着', '余华', 'https://picsum.photos/seed/book1/200/280', '作家出版社', '2012-08-01', 28.00, 39.00, '《活着》是余华的代表作，讲述了农村人福贵悲惨的人生遭遇。', '良好', 5],
  ['三体', '刘慈欣', 'https://picsum.photos/seed/book2/200/280', '重庆出版社', '2008-01-01', 45.00, 68.00, '《三体》是刘慈欣创作的系列长篇科幻小说，是中国科幻文学的里程碑之作。', '全新', 3],
  ['百年孤独', '加西亚·马尔克斯', 'https://picsum.photos/seed/book3/200/280', '南海出版公司', '2017-08-01', 39.80, 55.00, '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。', '良好', 2],
  ['小王子', '圣埃克苏佩里', 'https://picsum.photos/seed/book4/200/280', '人民文学出版社', '2018-03-01', 22.00, 32.00, '《小王子》是法国作家安托万·德·圣·埃克苏佩里于1942年写成的著名儿童文学短篇小说。', '九成新', 4],
  ['追风筝的人', '卡勒德·胡赛尼', 'https://picsum.photos/seed/book5/200/280', '上海人民出版社', '2006-05-01', 29.00, 45.00, '《追风筝的人》是美籍阿富汗作家卡勒德·胡赛尼的第一部长篇小说。', '良好', 3]
]

books.forEach(book => insertBook.run(...book))

const insertReview = db.prepare(`
  INSERT INTO reviews (book_id, user_id, rating, content)
  VALUES (?, ?, ?, ?)
`)

const reviews = [
  [1, 2, 5, '余华的笔力真的太强大了，读完整个人都被震撼了。福贵的一生虽然悲惨，但那种活着的韧性让人动容。'],
  [1, 3, 4, '第二次读这本书，每次感受都不一样。真正的好作品就是这样，常读常新。'],
  [2, 1, 5, '中国科幻的巅峰之作！三体的世界观太宏大了，读完让人对宇宙有了全新的认识。'],
  [2, 3, 5, '黑暗森林法则让人印象深刻，刘慈欣的想象力真的是天马行空。强烈推荐给所有科幻爱好者。'],
  [4, 2, 5, '每个大人都应该读一读小王子。它让我们想起那些被遗忘的童真和纯粹。'],
  [5, 1, 4, '关于友情、背叛和救赎的故事。追风筝的场景描写太美了，为你，千千万万遍！']
]

reviews.forEach(review => insertReview.run(...review))

console.log('数据库初始化完成！')
