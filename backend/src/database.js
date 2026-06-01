const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      username TEXT,
      avatar TEXT,
      password TEXT,
      is_vip INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      keyword TEXT,
      search_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shortcuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      icon TEXT,
      url TEXT,
      click_count INTEGER DEFAULT 0,
      category TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ai_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      icon TEXT,
      description TEXT,
      click_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      cover TEXT,
      category TEXT,
      type TEXT,
      rating REAL,
      is_vip INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_bookshelf (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      book_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS cloud_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      file_path TEXT,
      file_size INTEGER,
      file_type TEXT,
      parent_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scan_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      icon TEXT,
      description TEXT,
      tag TEXT
    );
  `);

  const shortcutCount = db.prepare('SELECT COUNT(*) as count FROM shortcuts').get();
  if (shortcutCount.count === 0) {
    const shortcuts = [
      { name: '天气', icon: '🌤️', url: '#', category: 'life', click_count: 1560 },
      { name: '快递', icon: '📦', url: '#', category: 'life', click_count: 1320 },
      { name: '健康码', icon: '💚', url: '#', category: 'life', click_count: 1100 },
      { name: '火车票', icon: '🚄', url: '#', category: 'travel', click_count: 980 },
      { name: '外卖', icon: '🍜', url: '#', category: 'life', click_count: 890 },
      { name: '打车', icon: '🚕', url: '#', category: 'travel', click_count: 756 },
      { name: '电影票', icon: '🎬', url: '#', category: 'entertainment', click_count: 650 },
      { name: '酒店', icon: '🏨', url: '#', category: 'travel', click_count: 580 }
    ];
    
    const insertShortcut = db.prepare('INSERT INTO shortcuts (name, icon, url, category, click_count) VALUES (?, ?, ?, ?, ?)');
    shortcuts.forEach(s => insertShortcut.run(s.name, s.icon, s.url, s.category, s.click_count));
  }

  const aiAppCount = db.prepare('SELECT COUNT(*) as count FROM ai_apps').get();
  if (aiAppCount.count === 0) {
    const aiApps = [
      { name: 'AI写作', icon: '✍️', description: '智能创作助手', click_count: 2300 },
      { name: 'AI翻译', icon: '🌐', description: '多语言翻译', click_count: 2100 },
      { name: 'AI问答', icon: '💬', description: '智能问答助手', click_count: 1900 },
      { name: 'AI绘图', icon: '🎨', description: '文字生成图片', click_count: 1600 }
    ];
    
    const insertAiApp = db.prepare('INSERT INTO ai_apps (name, icon, description, click_count) VALUES (?, ?, ?, ?)');
    aiApps.forEach(a => insertAiApp.run(a.name, a.icon, a.description, a.click_count));
  }

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get();
  if (bookCount.count === 0) {
    const books = [
      { title: '斗破苍穹', author: '天蚕土豆', cover: '📕', category: '玄幻', type: 'novel', rating: 4.8, is_vip: 0, click_count: 50000 },
      { title: '完美世界', author: '辰东', cover: '📗', category: '玄幻', type: 'novel', rating: 4.7, is_vip: 1, click_count: 45000 },
      { title: '海贼王', author: '尾田荣一郎', cover: '📘', category: '热血', type: 'comic', rating: 4.9, is_vip: 0, click_count: 80000 },
      { title: '火影忍者', author: '岸本齐史', cover: '📙', category: '热血', type: 'comic', rating: 4.8, is_vip: 1, click_count: 75000 },
      { title: '凡人修仙传', author: '忘语', cover: '📕', category: '仙侠', type: 'novel', rating: 4.6, is_vip: 0, click_count: 40000 },
      { title: '鬼灭之刃', author: '吾峠呼世晴', cover: '📗', category: '热血', type: 'comic', rating: 4.8, is_vip: 0, click_count: 60000 }
    ];
    
    const insertBook = db.prepare('INSERT INTO books (title, author, cover, category, type, rating, is_vip, click_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    books.forEach(b => insertBook.run(b.title, b.author, b.cover, b.category, b.type, b.rating, b.is_vip, b.click_count));
  }

  const scanToolCount = db.prepare('SELECT COUNT(*) as count FROM scan_tools').get();
  if (scanToolCount.count === 0) {
    const scanTools = [
      { name: '扫码', icon: '📷', description: '扫描二维码/条形码', tag: 'qrcode' },
      { name: '翻译', icon: '🌍', description: '拍照翻译', tag: 'translate' },
      { name: '试卷', icon: '📝', description: '扫描试卷', tag: 'exam' },
      { name: '题目', icon: '❓', description: '拍照搜题', tag: 'question' },
      { name: '识物', icon: '🔍', description: '识别万物', tag: 'object' },
      { name: '扫描文件', icon: '📄', description: '文档扫描', tag: 'document' },
      { name: '提取文字', icon: '📝', description: 'OCR文字提取', tag: 'ocr' },
      { name: '证件照', icon: '📸', description: '证件照制作', tag: 'idphoto' },
      { name: '药品', icon: '💊', description: '药品识别', tag: 'medicine' }
    ];
    
    const insertScanTool = db.prepare('INSERT INTO scan_tools (name, icon, description, tag) VALUES (?, ?, ?, ?)');
    scanTools.forEach(s => insertScanTool.run(s.name, s.icon, s.description, s.tag));
  }
};

initDatabase();

module.exports = db;
