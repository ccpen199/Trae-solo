import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'library.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      nickname TEXT,
      bio TEXT,
      is_vip INTEGER DEFAULT 0,
      vip_expire_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      cover TEXT,
      description TEXT,
      category_id INTEGER,
      publisher TEXT,
      isbn TEXT,
      pages INTEGER,
      is_featured INTEGER DEFAULT 0,
      total_copies INTEGER DEFAULT 10,
      available_copies INTEGER DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      borrow_date TEXT DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      return_date TEXT,
      status TEXT DEFAULT 'borrowed',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      book_id TEXT,
      content TEXT NOT NULL,
      share_reason TEXT,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      content TEXT NOT NULL,
      page INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS vip_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      description TEXT,
      book_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    const categories = [
      ['文学小说', '📚', 1],
      ['历史传记', '📜', 2],
      ['科技科普', '🔬', 3],
      ['经济管理', '💼', 4],
      ['心理成长', '🧠', 5],
      ['艺术设计', '🎨', 6],
      ['生活休闲', '☕', 7],
      ['儿童读物', '👶', 8]
    ];
    categories.forEach(cat => insertCategory.run(cat[0], cat[1], cat[2]));
  }

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get();
  if (bookCount.count === 0) {
    const insertBook = db.prepare('INSERT INTO books (id, title, author, cover, description, category_id, is_featured, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const books = [
      ['1', '百年孤独', '加西亚·马尔克斯', 'https://picsum.photos/seed/book1/200/280', '魔幻现实主义文学代表作，讲述布恩迪亚家族七代人的传奇故事。', 1, 1, 10, 10],
      ['2', '活着', '余华', 'https://picsum.photos/seed/book2/200/280', '讲述了农村人福贵悲惨的人生遭遇。', 1, 1, 10, 10],
      ['3', '三体', '刘慈欣', 'https://picsum.photos/seed/book3/200/280', '中国科幻文学的里程碑之作。', 3, 1, 10, 10],
      ['4', '人类简史', '尤瓦尔·赫拉利', 'https://picsum.photos/seed/book4/200/280', '从认知革命到科学革命，探索人类演化的宏大历程。', 3, 1, 10, 10],
      ['5', '小王子', '圣埃克苏佩里', 'https://picsum.photos/seed/book5/200/280', '献给所有曾经是孩子的大人。', 8, 1, 10, 10],
      ['6', '红楼梦', '曹雪芹', 'https://picsum.photos/seed/book6/200/280', '中国古典小说的巅峰之作。', 1, 1, 10, 10],
      ['7', '明朝那些事儿', '当年明月', 'https://picsum.photos/seed/book7/200/280', '以史料为基础，对明朝十七帝和其他王公权贵和小人物的命运进行全景展示。', 2, 0, 10, 10],
      ['8', '思考，快与慢', '丹尼尔·卡尼曼', 'https://picsum.photos/seed/book8/200/280', '诺贝尔经济学奖得主的思维科学经典著作。', 5, 0, 10, 10],
      ['9', '被讨厌的勇气', '岸见一郎', 'https://picsum.photos/seed/book9/200/280', '自我启发之父阿德勒的哲学课。', 5, 0, 10, 10],
      ['10', '围城', '钱钟书', 'https://picsum.photos/seed/book10/200/280', '新儒林外史，讽刺知识分子的生活百态。', 1, 0, 10, 10],
      ['11', '原子习惯', '詹姆斯·克利尔', 'https://picsum.photos/seed/book11/200/280', '建立好习惯、打破坏习惯的实用指南。', 5, 0, 10, 10],
      ['12', '设计心理学', '唐纳德·诺曼', 'https://picsum.photos/seed/book12/200/280', '设计领域的经典之作，揭示日常物品设计背后的心理学原理。', 6, 0, 10, 10]
    ];
    books.forEach(book => insertBook.run(book[0], book[1], book[2], book[3], book[4], book[5], book[6], book[7], book[8]));
  }

  const vipCount = db.prepare('SELECT COUNT(*) as count FROM vip_plans').get();
  if (vipCount.count === 0) {
    const insertPlan = db.prepare('INSERT INTO vip_plans (name, price, duration_days, description, sort_order) VALUES (?, ?, ?, ?, ?)');
    const plans = [
      ['月度会员', 19.9, 30, '30天VIP权益', 1],
      ['季度会员', 49.9, 90, '90天VIP权益，立省10元', 2],
      ['年度会员', 168, 365, '365天VIP权益，超值之选', 3]
    ];
    plans.forEach(plan => insertPlan.run(plan[0], plan[1], plan[2], plan[3], plan[4]));
  }

  const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics').get();
  if (topicCount.count === 0) {
    const insertTopic = db.prepare('INSERT INTO topics (title, cover, description, book_count) VALUES (?, ?, ?, ?)');
    const topics = [
      ['夏日阅读清单', 'https://picsum.photos/seed/topic1/400/200', '炎炎夏日，读一本好书清凉一夏', 12],
      ['经典必读书单', 'https://picsum.photos/seed/topic2/400/200', '人生必读的100本经典', 50],
      ['职场进阶指南', 'https://picsum.photos/seed/topic3/400/200', '提升职场竞争力的书单', 25]
    ];
    topics.forEach(topic => insertTopic.run(topic[0], topic[1], topic[2], topic[3]));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, username, password, email, avatar, nickname, bio) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertUser.run(
      'demo-user-1',
      'demo',
      '$2a$10$CRWfET3uG8wMEQQmUWYKtOyXLGx/nQCNFKO4sYi85Y4w84.ONz71.',
      'demo@example.com',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      '书虫小明',
      '热爱阅读，分享好书'
    );
    insertUser.run(
      'demo-user-2',
      'reader',
      '$2a$10$YEnSSJE2CFyKcTOG2WyYeu34ptjR1yRG.530xVmFZmajS5h6TeJ1S',
      'reader@example.com',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=reader',
      '阅读达人',
      '每天读书一小时'
    );
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  if (postCount.count === 0) {
    const insertPost = db.prepare('INSERT INTO posts (id, user_id, book_id, content, share_reason, likes_count, comments_count) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const posts = [
      ['post-1', 'demo-user-1', '1', '《百年孤独》真是太震撼了！布恩迪亚家族的故事让人唏嘘不已。马尔克斯的魔幻现实主义写得太棒了。', '强烈推荐！', 5, 2],
      ['post-2', 'demo-user-2', '2', '余华的《活着》让我泪流满面，福贵的一生虽然悲惨，但那种坚韧的生命力让人感动。', '每个人都应该读', 8, 3],
      ['post-3', 'demo-user-1', '3', '三体刷新了我对科幻的认知！刘慈欣的想象力太惊人了，黑暗森林法则让人细思极恐。', '科幻迷必读', 12, 5]
    ];
    posts.forEach(post => insertPost.run(post[0], post[1], post[2], post[3], post[4], post[5], post[6]));
  }
};

export const getUserByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
};

export const createUser = (username, password, email) => {
  const id = crypto.randomUUID();
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
  db.prepare('INSERT INTO users (id, username, password, email, avatar, nickname) VALUES (?, ?, ?, ?, ?, ?)').run(id, username, password, email || null, avatar, username);
  return id;
};

export const getUserById = (id) => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

export const getBooks = ({ category_id, search, is_featured, page = 1, limit = 20 } = {}) => {
  let query = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  if (category_id) {
    query += ' AND category_id = ?';
    params.push(category_id);
  }

  if (search) {
    query += ' AND (title LIKE ? OR author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (is_featured) {
    query += ' AND is_featured = 1';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  return db.prepare(query).all(...params);
};

export const getBookById = (id) => {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
};

export const borrowBook = (userId, bookId) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
  if (!book) return { success: false, message: '书籍不存在' };
  if (book.available_copies <= 0) return { success: false, message: '该书已被借完' };

  const existing = db.prepare('SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?').get(userId, bookId, 'borrowed');
  if (existing) return { success: false, message: '您已借阅过该书' };

  const id = crypto.randomUUID();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  db.prepare('INSERT INTO borrow_records (id, user_id, book_id, due_date) VALUES (?, ?, ?, ?)').run(id, userId, bookId, dueDate.toISOString());
  db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);

  return { success: true };
};

export const returnBook = (userId, bookId) => {
  const record = db.prepare('SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?').get(userId, bookId, 'borrowed');
  if (!record) return { success: false, message: '未找到借阅记录' };

  db.prepare('UPDATE borrow_records SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?').run('returned', record.id);
  db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(bookId);

  return { success: true };
};

export const getBorrowRecords = (userId) => {
  return db.prepare(`
    SELECT br.*, b.title, b.author, b.cover
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.user_id = ? AND br.status = ?
    ORDER BY br.borrow_date DESC
  `).all(userId, 'borrowed');
};

export const getCategories = () => {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
};

export const addToWishlist = (userId, bookId) => {
  const existing = db.prepare('SELECT * FROM wishlist WHERE user_id = ? AND book_id = ?').get(userId, bookId);
  if (existing) return { success: false, message: '已在心愿单中' };

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO wishlist (id, user_id, book_id) VALUES (?, ?, ?)').run(id, userId, bookId);
  return { success: true, id };
};

export const getWishlist = (userId) => {
  return db.prepare(`
    SELECT w.*, b.title, b.author, b.cover
    FROM wishlist w
    JOIN books b ON w.book_id = b.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).all(userId);
};

export const removeFromWishlist = (userId, id) => {
  const result = db.prepare('DELETE FROM wishlist WHERE id = ? AND user_id = ?').run(id, userId);
  return { success: result.changes > 0 };
};

export const addNote = (userId, bookId, content, page) => {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO notes (id, user_id, book_id, content, page) VALUES (?, ?, ?, ?, ?)').run(id, userId, bookId, content, page || null);
  return id;
};

export const getNotes = (userId) => {
  return db.prepare(`
    SELECT n.*, b.title, b.cover
    FROM notes n
    JOIN books b ON n.book_id = b.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `).all(userId);
};

export const getUserStats = (userId) => {
  const borrowCount = db.prepare('SELECT COUNT(*) as count FROM borrow_records WHERE user_id = ?').get(userId).count;
  const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ?').get(userId).count;
  const wishlistCount = db.prepare('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?').get(userId).count;
  return { borrow_count: borrowCount, note_count: noteCount, wishlist_count: wishlistCount };
};

export const getVipPlans = () => {
  return db.prepare('SELECT * FROM vip_plans ORDER BY sort_order ASC').all();
};

export const subscribeVip = (userId, planId) => {
  const plan = db.prepare('SELECT * FROM vip_plans WHERE id = ?').get(planId);
  if (!plan) return { success: false, message: '套餐不存在' };

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  let newExpireDate;
  const now = new Date();
  const currentExpire = user.vip_expire_at ? new Date(user.vip_expire_at) : now;
  const startDate = currentExpire > now ? currentExpire : now;
  
  newExpireDate = new Date(startDate);
  newExpireDate.setDate(newExpireDate.getDate() + plan.duration_days);

  db.prepare('UPDATE users SET is_vip = 1, vip_expire_at = ? WHERE id = ?').run(newExpireDate.toISOString(), userId);
  return { success: true, vip_expire_at: newExpireDate.toISOString() };
};

export const getPosts = (limit = 20) => {
  return db.prepare(`
    SELECT p.*, u.avatar, u.nickname, b.title as book_title, b.cover as book_cover
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN books b ON p.book_id = b.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(limit);
};

export const getPostById = (id) => {
  return db.prepare(`
    SELECT p.*, u.avatar, u.nickname, b.title as book_title, b.cover as book_cover
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN books b ON p.book_id = b.id
    WHERE p.id = ?
  `).get(id);
};

export const createPost = (userId, bookId, content, shareReason) => {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO posts (id, user_id, book_id, content, share_reason) VALUES (?, ?, ?, ?, ?)').run(id, userId, bookId || null, content, shareReason || null);
  return id;
};

export const likePost = (userId, postId) => {
  const existing = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?').get(postId, userId);
  
  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
    return { liked: false };
  } else {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)').run(id, postId, userId);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
    return { liked: true };
  }
};

export const getComments = (postId) => {
  return db.prepare(`
    SELECT c.*, u.avatar, u.nickname
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(postId);
};

export const addComment = (postId, userId, content) => {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, postId, userId, content);
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);
  return id;
};

export default db;
