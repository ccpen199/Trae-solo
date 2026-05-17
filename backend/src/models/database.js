const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      nickname TEXT,
      bio TEXT,
      active_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover TEXT,
      category_id INTEGER,
      price REAL DEFAULT 0,
      is_free INTEGER DEFAULT 1,
      buy_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      duration TEXT,
      level TEXT DEFAULT 'beginner',
      instructor TEXT,
      instructor_avatar TEXT,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES course_categories(id)
    );

    CREATE TABLE IF NOT EXISTS course_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      video_url TEXT,
      duration TEXT,
      is_free INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES course_chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      progress REAL DEFAULT 0,
      last_lesson_id INTEGER,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_study_at DATETIME,
      UNIQUE(user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      deadline DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT,
      file_url TEXT,
      score REAL,
      comment TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES course_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT,
      file_type TEXT,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discussion_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discussion_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (discussion_id) REFERENCES course_discussions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES discussion_replies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discussion_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discussion_id INTEGER,
      reply_id INTEGER,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, discussion_id),
      UNIQUE(user_id, reply_id),
      FOREIGN KEY (discussion_id) REFERENCES course_discussions(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_id) REFERENCES discussion_replies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      images TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      is_elite INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES community_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES post_replies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover TEXT,
      duration INTEGER DEFAULT 30,
      question_count INTEGER DEFAULT 10,
      pass_score REAL DEFAULT 60,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      type TEXT DEFAULT 'single',
      question TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      explanation TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      score REAL,
      is_passed INTEGER DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      answers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wrong_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM course_categories').get().count;
  if (categoryCount === 0) {
    const insertCategory = db.prepare('INSERT INTO course_categories (name, icon, sort_order) VALUES (?, ?, ?)');
    insertCategory.run('编程开发', '💻', 1);
    insertCategory.run('设计创意', '🎨', 2);
    insertCategory.run('产品运营', '📊', 3);
    insertCategory.run('求职面试', '💼', 4);
    insertCategory.run('语言学习', '🌍', 5);
    insertCategory.run('考证考级', '📜', 6);
  }

  const communityCount = db.prepare('SELECT COUNT(*) as count FROM community_categories').get().count;
  if (communityCount === 0) {
    const insertCommunity = db.prepare('INSERT INTO community_categories (name, icon, sort_order) VALUES (?, ?, ?)');
    insertCommunity.run('考证考级', '📜', 1);
    insertCommunity.run('考研', '🎓', 2);
    insertCommunity.run('出国', '✈️', 3);
    insertCommunity.run('就业实习', '💼', 4);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare('INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)');
    insertUser.run('demo', 'demo@hiu.com', hashedPassword, '演示用户');
  }

  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  if (courseCount === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (title, description, cover, category_id, price, is_free, buy_count, view_count, duration, level, instructor, instructor_avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertCourse.run(
      'React 从入门到精通',
      '全面学习React核心概念，Hooks，状态管理，性能优化等企业级开发技能',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=React%20programming%20course%20cover%20modern%20UI&image_size=square_hd',
      1, 0, 1, 1234, 5678, '24小时', 'intermediate', '张老师', null
    );
    
    insertCourse.run(
      'Python 数据分析实战',
      '从零开始学习Python数据分析，掌握Pandas、NumPy、Matplotlib等工具',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Python%20data%20analysis%20course%20cover%20charts&image_size=square_hd',
      1, 199, 0, 856, 3421, '32小时', 'beginner', '李老师', null
    );

    insertCourse.run(
      'UI/UX 设计基础',
      '系统学习用户界面设计原则，Figma工具使用，交互设计方法论',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=UI%20UX%20design%20course%20cover%20creative&image_size=square_hd',
      2, 0, 1, 2341, 7890, '18小时', 'beginner', '王老师', null
    );

    insertCourse.run(
      '产品经理入门',
      '掌握产品设计思维，需求分析，原型设计，项目管理核心能力',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Product%20manager%20course%20cover%20business&image_size=square_hd',
      3, 299, 0, 567, 2345, '28小时', 'beginner', '赵老师', null
    );

    const insertChapter = db.prepare('INSERT INTO course_chapters (course_id, title, sort_order) VALUES (?, ?, ?)');
    const insertLesson = db.prepare('INSERT INTO course_lessons (course_id, chapter_id, title, duration, sort_order, video_url) VALUES (?, ?, ?, ?, ?, ?)');

    let chapterId = insertChapter.run(1, '第一章：React 基础入门', 1).lastInsertRowid;
    insertLesson.run(1, chapterId, '1.1 React 介绍与环境搭建', '15分钟', 1, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(1, chapterId, '1.2 JSX 语法详解', '20分钟', 2, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(1, chapterId, '1.3 组件的创建与使用', '25分钟', 3, 'https://www.w3schools.com/html/mov_bbb.mp4');

    chapterId = insertChapter.run(1, '第二章：Hooks 深入理解', 2).lastInsertRowid;
    insertLesson.run(1, chapterId, '2.1 useState 状态管理', '20分钟', 1, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(1, chapterId, '2.2 useEffect 副作用处理', '30分钟', 2, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(1, chapterId, '2.3 自定义 Hooks 开发', '25分钟', 3, 'https://www.w3schools.com/html/mov_bbb.mp4');

    chapterId = insertChapter.run(3, '第一章：UI设计基础概念', 1).lastInsertRowid;
    insertLesson.run(3, chapterId, '1.1 什么是UI/UX设计', '18分钟', 1, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(3, chapterId, '1.2 设计原则与规范', '22分钟', 2, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(3, chapterId, '1.3 色彩理论与应用', '20分钟', 3, 'https://www.w3schools.com/html/mov_bbb.mp4');

    chapterId = insertChapter.run(3, '第二章：Figma工具实战', 2).lastInsertRowid;
    insertLesson.run(3, chapterId, '2.1 Figma 界面介绍', '15分钟', 1, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(3, chapterId, '2.2 图层与组件', '25分钟', 2, 'https://www.w3schools.com/html/mov_bbb.mp4');
    insertLesson.run(3, chapterId, '2.3 原型设计与交互', '30分钟', 3, 'https://www.w3schools.com/html/mov_bbb.mp4');
  }

  const assessmentCount = db.prepare('SELECT COUNT(*) as count FROM assessments').get().count;
  if (assessmentCount === 0) {
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (title, description, cover, duration, question_count, pass_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const assessmentId = insertAssessment.run(
      'JavaScript 基础能力测评',
      '检验你的JavaScript基础知识掌握程度，包含变量、函数、数组、对象等核心内容',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=JavaScript%20quiz%20assessment%20cover&image_size=square_hd',
      30, 10, 60
    ).lastInsertRowid;

    const insertQuestion = db.prepare(`
      INSERT INTO assessment_questions (assessment_id, type, question, options, answer, explanation, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const questions = [
      {
        question: '以下哪个不是JavaScript的基本数据类型？',
        options: JSON.stringify(['String', 'Number', 'Array', 'Boolean']),
        answer: 'Array',
        explanation: 'Array是引用类型，不是基本数据类型。JavaScript的基本数据类型包括：String、Number、Boolean、Undefined、Null、Symbol、BigInt'
      },
      {
        question: 'const声明的变量有什么特点？',
        options: JSON.stringify(['可以重新赋值', '必须初始化', '没有块级作用域', '可以重复声明']),
        answer: '必须初始化',
        explanation: 'const声明的常量必须在声明时初始化，且不能重新赋值，但具有块级作用域'
      },
      {
        question: '以下哪个方法不会改变原数组？',
        options: JSON.stringify(['push()', 'pop()', 'map()', 'splice()']),
        answer: 'map()',
        explanation: 'map()方法会返回一个新数组，不会改变原数组。push、pop、splice都会修改原数组'
      }
    ];

    questions.forEach((q, index) => {
      insertQuestion.run(assessmentId, 'single', q.question, q.options, q.answer, q.explanation, index + 1);
    });
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM community_posts').get().count;
  if (postCount === 0) {
    const insertPost = db.prepare(`
      INSERT INTO community_posts (user_id, category_id, title, content, view_count, like_count, reply_count, is_elite, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPost.run(
      1, 1, '2024年计算机二级考试经验分享',
      '今天刚考完计算机二级，来分享一下我的备考经验和考试心得，希望对大家有帮助！首先一定要多做真题，特别是操作题...',
      1567, 89, 23, 1, 'approved'
    );
    
    insertPost.run(
      1, 2, '考研复习时间规划分享',
      '距离考研还有半年时间，分享一下我的复习计划。每天早上8点到12点学数学，下午2点到6点学专业课...',
      2345, 156, 45, 1, 'approved'
    );

    insertPost.run(
      1, 4, '字节跳动实习面试经验',
      '上周收到了字节跳动的实习offer，来分享一下我的面试经历。一共三轮技术面+一轮HR面...',
      4567, 234, 78, 1, 'approved'
    );
  }
};

module.exports = { db, initDatabase };
