const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      dynasty TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      tags TEXT,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_excerpt_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      categories TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      poem_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
      UNIQUE(user_id, poem_id)
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      UNIQUE(user_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      reward_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      UNIQUE(user_id, comment_id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS privacy_policy_agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      agreed_version TEXT NOT NULL,
      agreed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const poemCount = db.prepare('SELECT COUNT(*) as count FROM poems').get();
  if (poemCount.count === 0) {
    const insertPoem = db.prepare(`
      INSERT INTO poems (title, author, dynasty, content, excerpt, tags, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const poems = [
      ['静夜思', '李白', '唐', '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。', '床前明月光，疑是地上霜。', '月亮,思乡', '唐诗'],
      ['登鹳雀楼', '王之涣', '唐', '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。', '欲穷千里目，更上一层楼。', '励志,写景', '唐诗'],
      ['春晓', '孟浩然', '唐', '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。', '春眠不觉晓，处处闻啼鸟。', '春天,写景', '唐诗'],
      ['相思', '王维', '唐', '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。', '愿君多采撷，此物最相思。', '爱情,相思', '唐诗'],
      ['悯农', '李绅', '唐', '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。', '谁知盘中餐，粒粒皆辛苦。', '劳动,民生', '唐诗'],
      ['江雪', '柳宗元', '唐', '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。', '孤舟蓑笠翁，独钓寒江雪。', '冬天,写景', '唐诗'],
      ['游子吟', '孟郊', '唐', '慈母手中线，游子身上衣。\n临行密密缝，意恐迟迟归。\n谁言寸草心，报得三春晖。', '谁言寸草心，报得三春晖。', '母爱,亲情', '唐诗'],
      ['望庐山瀑布', '李白', '唐', '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。', '飞流直下三千尺，疑是银河落九天。', '写景,瀑布', '唐诗'],
      ['水调歌头·明月几时有', '苏轼', '宋', '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。\n转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。', '但愿人长久，千里共婵娟。', '中秋,月亮', '宋词'],
      ['念奴娇·赤壁怀古', '苏轼', '宋', '大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。', '大江东去，浪淘尽，千古风流人物。', '怀古,历史', '宋词'],
      ['声声慢·寻寻觅觅', '李清照', '宋', '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。三杯两盏淡酒，怎敌他、晚来风急？雁过也，正伤心，却是旧时相识。', '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。', '婉约,悲伤', '宋词'],
      ['虞美人·春花秋月何时了', '李煜', '五代', '春花秋月何时了？往事知多少。小楼昨夜又东风，故国不堪回首月明中。雕栏玉砌应犹在，只是朱颜改。问君能有几多愁？恰似一江春水向东流。', '问君能有几多愁？恰似一江春水向东流。', '亡国,愁绪', '宋词'],
      ['天净沙·秋思', '马致远', '元', '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。', '夕阳西下，断肠人在天涯。', '秋天,思乡', '元曲'],
      ['再别康桥', '徐志摩', '现代', '轻轻的我走了，正如我轻轻的来；我轻轻的招手，作别西天的云彩。', '轻轻的我走了，正如我轻轻的来；', '离别,现代', '现代诗'],
      ['一代人', '顾城', '现代', '黑夜给了我黑色的眼睛，我却用它寻找光明。', '黑夜给了我黑色的眼睛，我却用它寻找光明。', '哲理,现代', '现代诗']
    ];

    poems.forEach(poem => insertPoem.run(...poem));
  }

  const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get();
  if (channelCount.count === 0) {
    const insertChannel = db.prepare('INSERT INTO channels (name, description, sort_order) VALUES (?, ?, ?)');
    const channels = [
      ['诗词创作', '分享你的诗词作品', 1],
      ['散文随笔', '记录生活点滴', 2],
      ['书法绘画', '展示书画作品', 3],
      ['古琴雅韵', '古琴交流分享', 4],
      ['茶艺文化', '品茶论道', 5],
      ['汉服文化', '汉服交流展示', 6]
    ];
    channels.forEach(channel => insertChannel.run(...channel));
  }
};

initDatabase();

module.exports = db;
