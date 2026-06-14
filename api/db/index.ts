import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      coins DECIMAL(10,2) DEFAULT 0,
      invite_code TEXT UNIQUE,
      inviter_id TEXT,
      is_verified BOOLEAN DEFAULT 0,
      real_name TEXT,
      id_card TEXT,
      alipay_account TEXT,
      wechat_account TEXT,
      bank_name TEXT,
      bank_card TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      reward DECIMAL(10,2) NOT NULL,
      daily_limit INTEGER DEFAULT 1,
      max_progress INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      max_progress INTEGER DEFAULT 1,
      completions INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      completed_at DATETIME,
      date TEXT NOT NULL,
      UNIQUE(user_id, task_id, date)
    );

    CREATE TABLE IF NOT EXISTS coin_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS withdraw_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      method TEXT NOT NULL,
      account TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invite_relations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      inviter_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      total_reward DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jokes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS idiom_questions (
      id TEXT PRIMARY KEY,
      idiom TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fashion_quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      reward DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS steps_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      steps INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_quiz_answers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_coin_records_user_id ON coin_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_tasks_user_date ON user_tasks(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_invite_relations_inviter ON invite_relations(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_withdraw_records_user_id ON withdraw_records(user_id);
  `);

  seedData();
}

function seedData() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const insertAdmin = db.prepare(`
      INSERT INTO admins (id, username, password, role)
      VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('admin-001', 'admin', 'admin123', 'super_admin');
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  if (taskCount.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, title, description, category, type, reward, daily_limit, max_progress, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tasks = [
      ['task-joke', '每日笑一笑', '浏览笑话内容，开心每一天', 'content', 'joke', 10, 5, 1, 'active', 1],
      ['task-idiom', '成语答题', '学习成语知识，挑战答题赢金币', 'content', 'idiom', 20, 3, 1, 'active', 2],
      ['task-water', '饮水打卡', '每日饮水打卡，健康生活', 'health', 'water', 5, 1, 1, 'active', 3],
      ['task-steps', '步数挑战', '每日步数达标，运动赚金币', 'health', 'steps', 15, 1, 1000, 'active', 4],
      ['task-fashion-hairstyle', '发型测评', '测试你的专属发型风格', 'fashion', 'hairstyle', 30, 1, 1, 'active', 5],
      ['task-fashion-clothing', '服饰搭配测评', '发现你的穿搭风格', 'fashion', 'clothing', 30, 1, 1, 'active', 6],
      ['task-invite', '邀请好友', '邀请好友注册，获得邀请奖励', 'invite', 'invite', 50, 999, 1, 'active', 7],
    ];
    for (const task of tasks) {
      insertTask.run(...task);
    }
  }

  const jokeCount = db.prepare('SELECT COUNT(*) as count FROM jokes').get() as { count: number };
  if (jokeCount.count === 0) {
    const insertJoke = db.prepare(`
      INSERT INTO jokes (id, content, status) VALUES (?, ?, ?)
    `);
    const jokes = [
      ['joke-1', '程序员去相亲，女方问：你是做什么的？程序员说：我是做IT的。女方：哦，那是做什么的？程序员：就是挨踢的。', 'active'],
      ['joke-2', '程序员最讨厌的数字是什么？1024，因为它总让人想起加班。', 'active'],
      ['joke-3', '为什么程序员喜欢黑暗模式？因为光明会吸引bug。', 'active'],
      ['joke-4', '一个SQL语句走进酒吧，看见两张表，问：我可以加入你们吗？', 'active'],
      ['joke-5', '程序员的老婆让他去买面包，说：如果有西瓜就买一个西瓜。程序员回来只买了一个面包，因为他说：有面包店。', 'active'],
      ['joke-6', '老板对程序员说：这个需求很简单，怎么实现我不管。程序员说：好的，那我就不管了。', 'active'],
      ['joke-7', '程序员最怕的事情是什么？产品经理改需求。', 'active'],
      ['joke-8', '如何让程序员不写注释？写注释的人是傻子，读注释的人也是傻子。', 'active'],
      ['joke-9', '程序员的世界里有10种人：懂二进制的和不懂二进制的。', 'active'],
      ['joke-10', 'bug和程序员有什么区别？bug会自己消失，程序员不会。', 'active'],
      ['joke-11', '我问我妈：我是不是你亲生的？我妈说：你再不好好学习，就不是了。', 'active'],
      ['joke-12', '为什么海是蓝色的？因为鱼在水里吐泡泡，blue blue blue。', 'active'],
    ];
    for (const joke of jokes) {
      insertJoke.run(...joke);
    }
  }

  const idiomCount = db.prepare('SELECT COUNT(*) as count FROM idiom_questions').get() as { count: number };
  if (idiomCount.count === 0) {
    const insertIdiom = db.prepare(`
      INSERT INTO idiom_questions (id, idiom, question, options, answer, difficulty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const idioms = [
      ['idiom-1', '画蛇添足', '比喻做了多余的事，反而把事情弄坏。这个成语是？', JSON.stringify(['画蛇添足', '画龙点睛', '蛇鼠一窝', '杯弓蛇影']), '画蛇添足', 1],
      ['idiom-2', '守株待兔', '比喻死守狭隘经验，不知变通。这个成语是？', JSON.stringify(['守株待兔', '刻舟求剑', '掩耳盗铃', '亡羊补牢']), '守株待兔', 1],
      ['idiom-3', '对牛弹琴', '比喻对不懂道理的人讲道理，对外行人说内行话。这个成语是？', JSON.stringify(['对牛弹琴', '鸡同鸭讲', '牛头不对马嘴', '风马牛不相及']), '对牛弹琴', 1],
      ['idiom-4', '亡羊补牢', '比喻出了问题以后想办法补救，可以防止继续受损失。这个成语是？', JSON.stringify(['亡羊补牢', '画蛇添足', '守株待兔', '掩耳盗铃']), '亡羊补牢', 1],
      ['idiom-5', '掩耳盗铃', '比喻自己欺骗自己，明明掩盖不住的事情偏要想法子掩盖。这个成语是？', JSON.stringify(['掩耳盗铃', '自欺欺人', '画蛇添足', '守株待兔']), '掩耳盗铃', 1],
      ['idiom-6', '刻舟求剑', '比喻拘泥成例，不知道跟着情势的变化而改变看法或办法。这个成语是？', JSON.stringify(['刻舟求剑', '守株待兔', '画蛇添足', '亡羊补牢']), '刻舟求剑', 2],
      ['idiom-7', '杯弓蛇影', '比喻因疑神疑鬼而引起恐惧。这个成语是？', JSON.stringify(['杯弓蛇影', '画蛇添足', '蛇鼠一窝', '虎头蛇尾']), '杯弓蛇影', 2],
      ['idiom-8', '画龙点睛', '比喻在关键处用几句话点明实质，使内容生动有力。这个成语是？', JSON.stringify(['画龙点睛', '画蛇添足', '龙飞凤舞', '龙争虎斗']), '画龙点睛', 2],
      ['idiom-9', '自相矛盾', '比喻自己说话做事前后抵触。这个成语是？', JSON.stringify(['自相矛盾', '掩耳盗铃', '守株待兔', '亡羊补牢']), '自相矛盾', 2],
      ['idiom-10', '井底之蛙', '比喻见识狭窄的人。这个成语是？', JSON.stringify(['井底之蛙', '坐井观天', '鼠目寸光', '目光短浅']), '井底之蛙', 2],
      ['idiom-11', '狐假虎威', '比喻依仗别人的势力欺压人。这个成语是？', JSON.stringify(['狐假虎威', '为虎作伥', '虎头蛇尾', '龙潭虎穴']), '狐假虎威', 2],
      ['idiom-12', '叶公好龙', '比喻口头上说爱好某事物，实际上并不真爱好。这个成语是？', JSON.stringify(['叶公好龙', '画龙点睛', '龙飞凤舞', '龙争虎斗']), '叶公好龙', 3],
    ];
    for (const idiom of idioms) {
      insertIdiom.run(...idiom);
    }
  }

  const quizCount = db.prepare('SELECT COUNT(*) as count FROM fashion_quizzes').get() as { count: number };
  if (quizCount.count === 0) {
    const insertQuiz = db.prepare(`
      INSERT INTO fashion_quizzes (id, title, type, description, reward, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, question, options, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertQuiz.run('quiz-hairstyle', '发型风格测评', 'hairstyle', '发现最适合你的发型风格', 30, 'active');
    const hairstyleQuestions = [
      ['hq-1', 'quiz-hairstyle', '你的脸型是？', JSON.stringify(['鹅蛋脸', '圆脸', '方脸', '长脸']), null, 1],
      ['hq-2', 'quiz-hairstyle', '你喜欢什么风格的穿搭？', JSON.stringify(['甜美可爱', '干练知性', '休闲舒适', '个性潮流']), null, 2],
      ['hq-3', 'quiz-hairstyle', '你的发量属于？', JSON.stringify(['偏多', '适中', '偏少', '细软']), null, 3],
      ['hq-4', 'quiz-hairstyle', '你平时打理头发的时间？', JSON.stringify(['5分钟内', '10分钟左右', '20分钟以上', '从不打理']), null, 4],
      ['hq-5', 'quiz-hairstyle', '你最喜欢的发色是？', JSON.stringify(['自然黑', '棕色系', '浅色系', '个性潮色']), null, 5],
    ];
    for (const q of hairstyleQuestions) {
      insertQuestion.run(...q);
    }

    insertQuiz.run('quiz-clothing', '服饰搭配风格测评', 'clothing', '找到属于你的穿搭风格', 30, 'active');
    const clothingQuestions = [
      ['cq-1', 'quiz-clothing', '你最喜欢的颜色系是？', JSON.stringify(['黑白灰', '莫兰迪色', '明亮鲜艳', '大地色系']), null, 1],
      ['cq-2', 'quiz-clothing', '你平时的穿搭风格偏向？', JSON.stringify(['简约通勤', '休闲运动', '甜美淑女', '街头潮流']), null, 2],
      ['cq-3', 'quiz-clothing', '你更注重服装的？', JSON.stringify(['舒适度', '设计感', '品牌', '性价比']), null, 3],
      ['cq-4', 'quiz-clothing', '你最喜欢的单品是？', JSON.stringify(['T恤牛仔裤', '连衣裙', '西装外套', '卫衣卫裤']), null, 4],
      ['cq-5', 'quiz-clothing', '你希望穿搭给人的感觉是？', JSON.stringify(['专业可靠', '亲切随和', '时尚前卫', '温柔优雅']), null, 5],
    ];
    for (const q of clothingQuestions) {
      insertQuestion.run(...q);
    }
  }
}

export default db;
