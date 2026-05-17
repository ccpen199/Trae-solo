const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT,
    password TEXT,
    is_vip INTEGER DEFAULT 0,
    vip_expire_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    options TEXT,
    answer TEXT NOT NULL,
    explanation TEXT,
    image_url TEXT,
    video_url TEXT,
    category TEXT,
    difficulty INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_practice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    question_id INTEGER NOT NULL,
    subject INTEGER NOT NULL,
    is_correct INTEGER,
    user_answer TEXT,
    practice_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_wrong_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    subject INTEGER NOT NULL,
    wrong_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    UNIQUE(user_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS exam_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    time_used INTEGER,
    answers TEXT,
    passed INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS driving_schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    phone TEXT,
    description TEXT,
    rating REAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    pass_rate REAL DEFAULT 85.0,
    distance REAL,
    price_start INTEGER,
    features TEXT,
    images TEXT,
    rank INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    experience INTEGER,
    rating REAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    specialties TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES driving_schools(id)
  );

  CREATE TABLE IF NOT EXISTS school_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES driving_schools(id)
  );

  CREATE TABLE IF NOT EXISTS school_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    user_id INTEGER,
    rating INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES driving_schools(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    school_id INTEGER,
    coach_id INTEGER,
    user_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    license_type TEXT,
    message TEXT,
    status INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (school_id) REFERENCES driving_schools(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS question_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id INTEGER,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS teaching_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image_url TEXT,
    link_url TEXT,
    position TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const subjects = [1, 4];
const questionTypes = ['single', 'judge', 'multiple'];
const categories = ['交通标志', '交通规则', '安全常识', '紧急情况', '驾驶操作', '恶劣天气'];

const questions = [];

for (let subject of subjects) {
  for (let i = 1; i <= 50; i++) {
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    let content, options, answer, explanation;
    
    if (type === 'judge') {
      content = `${subject === 1 ? '科目一' : '科目四'}第${i}题：驾驶机动车在道路上行驶时，应当随身携带机动车驾驶证。`;
      options = JSON.stringify(['正确', '错误']);
      answer = '0';
      explanation = '根据《道路交通安全法》规定，驾驶机动车时应当随身携带机动车驾驶证。';
    } else if (type === 'single') {
      content = `${subject === 1 ? '科目一' : '科目四'}第${i}题：机动车驾驶人初次申请机动车驾驶证和增加准驾车型后的多长时间为实习期？`;
      options = JSON.stringify(['6个月', '12个月', '18个月', '24个月']);
      answer = '1';
      explanation = '机动车驾驶人初次申请机动车驾驶证和增加准驾车型后的12个月为实习期。';
    } else {
      content = `${subject === 1 ? '科目一' : '科目四'}第${i}题：驾驶机动车遇到校车在道路右侧停车上下学生，同向有两条机动车道时，正确做法是什么？`;
      options = JSON.stringify(['左侧车道车辆可以通行', '相邻车道车辆停车等待', '左侧车道减速通过', '鸣喇叭催促']);
      answer = '1,2';
      explanation = '校车在同方向有两条以上机动车道的道路上停靠时，校车停靠车道后方和相邻机动车道上的机动车应当停车等待。';
    }
    
    questions.push({
      subject,
      type,
      content,
      options,
      answer,
      explanation,
      category
    });
  }
}

const insertQuestion = db.prepare(`
  INSERT INTO questions (subject, type, content, options, answer, explanation, category)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const q of questions) {
  insertQuestion.run(q.subject, q.type, q.content, q.options, q.answer, q.explanation, q.category);
}

const schools = [
  { name: '阳光驾校', address: '北京市朝阳区建国路88号', phone: '010-88881111', rating: 4.8, pass_rate: 92.5, price_start: 3980, distance: 1.2, rank: 1 },
  { name: '平安驾校', address: '北京市海淀区中关村大街1号', phone: '010-88882222', rating: 4.7, pass_rate: 89.3, price_start: 3680, distance: 2.5, rank: 2 },
  { name: '通达驾校', address: '北京市丰台区南三环西路55号', phone: '010-88883333', rating: 4.6, pass_rate: 87.8, price_start: 3480, distance: 3.8, rank: 3 },
  { name: '东方驾校', address: '北京市西城区阜成门大街66号', phone: '010-88884444', rating: 4.5, pass_rate: 86.2, price_start: 3280, distance: 5.1, rank: 4 },
  { name: '顺达驾校', address: '北京市东城区东直门外大街99号', phone: '010-88885555', rating: 4.9, pass_rate: 94.1, price_start: 4280, distance: 0.8, rank: 5 },
];

const insertSchool = db.prepare(`
  INSERT INTO driving_schools (name, address, phone, rating, pass_rate, price_start, distance, rank, description, features)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const school of schools) {
  insertSchool.run(
    school.name,
    school.address,
    school.phone,
    school.rating,
    school.pass_rate,
    school.price_start,
    school.distance,
    school.rank,
    `${school.name}成立于2010年，拥有专业教练团队和现代化训练场地，致力于为学员提供优质的驾驶培训服务。`,
    JSON.stringify(['一对一教学', '免费接送', '夜间练车', '模拟考场', '快速拿证'])
  );
}

const coaches = [
  { school_id: 1, name: '张教练', experience: 12, rating: 4.9, phone: '13800138001' },
  { school_id: 1, name: '李教练', experience: 8, rating: 4.8, phone: '13800138002' },
  { school_id: 2, name: '王教练', experience: 15, rating: 4.7, phone: '13800138003' },
  { school_id: 2, name: '赵教练', experience: 10, rating: 4.9, phone: '13800138004' },
  { school_id: 3, name: '刘教练', experience: 6, rating: 4.6, phone: '13800138005' },
  { school_id: 5, name: '陈教练', experience: 18, rating: 5.0, phone: '13800138006' },
];

const insertCoach = db.prepare(`
  INSERT INTO coaches (school_id, name, experience, rating, phone, description, specialties)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const coach of coaches) {
  insertCoach.run(
    coach.school_id,
    coach.name,
    coach.experience,
    coach.rating,
    coach.phone,
    `${coach.name}从事驾驶培训${coach.experience}年，教学经验丰富，耐心细致，深受学员好评。`,
    JSON.stringify(['科目二', '科目三', '手动挡', '自动挡'])
  );
}

const classes = [
  { school_id: 1, name: '普通班', price: 3980, description: '基础驾驶培训，包含所有科目考试' },
  { school_id: 1, name: 'VIP班', price: 5980, description: '一对一教学，优先安排考试，免费补考' },
  { school_id: 2, name: '速成班', price: 4280, description: '快速拿证，45天完成培训' },
  { school_id: 5, name: '尊享班', price: 6880, description: '全程一对一，上门接送，不过包赔' },
];

const insertClass = db.prepare(`
  INSERT INTO school_classes (school_id, name, price, description, features)
  VALUES (?, ?, ?, ?, ?)
`);

for (const cls of classes) {
  insertClass.run(
    cls.school_id,
    cls.name,
    cls.price,
    cls.description,
    JSON.stringify(['包含考试费', '练车不限时', '免费接送'])
  );
}

const videos = [
  { subject: 2, title: '倒车入库技巧详解', duration: 600, category: '科目二' },
  { subject: 2, title: '侧方停车步骤教学', duration: 480, category: '科目二' },
  { subject: 2, title: '坡道定点停车与起步', duration: 540, category: '科目二' },
  { subject: 2, title: '曲线行驶技巧', duration: 420, category: '科目二' },
  { subject: 2, title: '直角转弯要点', duration: 360, category: '科目二' },
  { subject: 3, title: '科目三考试完整流程', duration: 720, category: '科目三' },
  { subject: 3, title: '灯光操作详解', duration: 300, category: '科目三' },
  { subject: 3, title: '变道与超车技巧', duration: 480, category: '科目三' },
];

const insertVideo = db.prepare(`
  INSERT INTO teaching_videos (subject, title, duration, category, description)
  VALUES (?, ?, ?, ?, ?)
`);

for (const video of videos) {
  insertVideo.run(
    video.subject,
    video.title,
    video.duration,
    video.category,
    `${video.title}，专业教练详细讲解，助您快速掌握驾驶技巧！`
  );
}

const posts = [
  { title: '科目二满分通过经验分享', content: '今天终于考过了科目二，满分通过！给大家分享一下我的备考经验...', category: '经验分享' },
  { title: '科三考试注意事项汇总', content: '马上要考科三了，整理了一些注意事项，希望对大家有帮助...', category: '考试技巧' },
  { title: '选驾校避坑指南', content: '最近陪朋友选驾校，发现这里面水太深了，分享几个避坑技巧...', category: '驾校选择' },
  { title: '练车日常打卡', content: '今天练了2个小时倒车入库，感觉进步很大！继续加油...', category: '日常记录' },
  { title: '科目一答题技巧', content: '科目一其实很简单，掌握这些技巧轻松90+...', category: '考试技巧' },
];

const insertPost = db.prepare(`
  INSERT INTO community_posts (title, content, category, like_count, comment_count, view_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const post of posts) {
  insertPost.run(
    post.title,
    post.content,
    post.category,
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 30),
    Math.floor(Math.random() * 500)
  );
}

console.log('数据库初始化完成！');
console.log(`- 题库：${questions.length} 道题`);
console.log(`- 驾校：${schools.length} 家`);
console.log(`- 教练：${coaches.length} 位`);
console.log(`- 教学视频：${videos.length} 个`);
console.log(`- 社区帖子：${posts.length} 篇`);

db.close();
