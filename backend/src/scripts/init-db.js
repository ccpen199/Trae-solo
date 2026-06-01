const db = require('../db')

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT,
    goal TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    subject TEXT,
    grade_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('question', 'course')),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_time INTEGER,
    options TEXT,
    correct_answer TEXT,
    explanation TEXT,
    in_recommendation_pool INTEGER DEFAULT 0,
    prerequisites TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resource_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    knowledge_point_id INTEGER REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE(resource_id, knowledge_point_id)
  );

  CREATE TABLE IF NOT EXISTS student_mastery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    knowledge_point_id INTEGER REFERENCES knowledge_points(id) ON DELETE CASCADE,
    level REAL DEFAULT 0,
    source TEXT,
    practice_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, knowledge_point_id)
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    strategy TEXT CHECK (strategy IN ('weak', 'reinforce', 'preview', 'sprint')),
    reason TEXT,
    score REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    recommendation_id INTEGER REFERENCES recommendations(id),
    resource_id INTEGER REFERENCES resources(id),
    resource_type TEXT,
    action TEXT CHECK (action IN ('complete', 'skip', 'favorite', 'unfavorite')),
    is_correct INTEGER,
    time_spent INTEGER,
    user_answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wrong_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    wrong_count INTEGER DEFAULT 1,
    last_wrong_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, resource_id)
  );
`)

const insertStudent = db.prepare('INSERT OR IGNORE INTO students (name, grade, goal) VALUES (?, ?, ?)')
insertStudent.run('张三', '九年级', '中考冲刺')
insertStudent.run('李四', '八年级', '期末复习')

const insertKP = db.prepare('INSERT OR IGNORE INTO knowledge_points (name, subject, grade_level) VALUES (?, ?, ?)')
const kps = [
  ['一元二次方程', '数学', '九年级'],
  ['因式分解', '数学', '八年级'],
  ['二次函数', '数学', '九年级'],
  ['勾股定理', '数学', '八年级'],
  ['三角函数', '数学', '九年级'],
  ['平行线证明', '数学', '七年级'],
  ['全等三角形', '数学', '八年级'],
  ['相似三角形', '数学', '九年级']
]
kps.forEach(([name, subject, grade]) => insertKP.run(name, subject, grade))

const insertResource = db.prepare(`
  INSERT OR IGNORE INTO resources 
  (type, title, description, content, difficulty, estimated_time, options, correct_answer, explanation, in_recommendation_pool)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`)

const questions = [
  [
    'question',
    '一元二次方程基础练习',
    '解一元二次方程 x² - 5x + 6 = 0',
    '求方程 x² - 5x + 6 = 0 的两个根',
    'easy', 5,
    JSON.stringify(['x=1, x=6', 'x=2, x=3', 'x=-2, x=-3', 'x=1, x=5']),
    1,
    '使用因式分解法：x² - 5x + 6 = (x-2)(x-3) = 0，所以 x=2 或 x=3'
  ],
  [
    'question',
    '因式分解进阶',
    '分解多项式：x³ - 8',
    '对多项式 x³ - 8 进行因式分解',
    'medium', 8,
    JSON.stringify(['(x-2)³', '(x-2)(x²+2x+4)', '(x+2)(x²-2x+4)', '(x-2)(x+2)²']),
    1,
    '使用立方差公式：a³ - b³ = (a-b)(a²+ab+b²)，所以 x³ - 8 = x³ - 2³ = (x-2)(x²+2x+4)'
  ],
  [
    'question',
    '二次函数顶点坐标',
    '求二次函数 y = x² - 4x + 3 的顶点坐标',
    '求 y = x² - 4x + 3 的顶点坐标',
    'medium', 6,
    JSON.stringify(['(2, -1)', '(-2, 15)', '(2, 1)', '(4, 3)']),
    0,
    '配方法：y = x² - 4x + 3 = (x²-4x+4) - 1 = (x-2)² - 1，顶点坐标为 (2, -1)'
  ],
  [
    'question',
    '勾股定理应用',
    '直角三角形两直角边为3和4，求斜边长度',
    '直角三角形中，两条直角边长度分别为3和4，求斜边长度',
    'easy', 3,
    JSON.stringify(['5', '6', '7', '12']),
    0,
    '根据勾股定理：斜边² = 3² + 4² = 9 + 16 = 25，所以斜边 = 5'
  ],
  [
    'question',
    '三角函数基础',
    '在直角三角形中，对边为3，斜边为5，求 sinθ 的值',
    '在直角三角形中，角θ的对边长度为3，斜边长度为5，求 sinθ',
    'easy', 4,
    JSON.stringify(['3/5', '4/5', '3/4', '5/3']),
    0,
    '正弦函数定义：sinθ = 对边/斜边 = 3/5'
  ],
  [
    'question',
    '全等三角形判定',
    '判断：三边对应相等的两个三角形全等',
    '判断命题"三边对应相等的两个三角形全等"是否正确',
    'easy', 2,
    JSON.stringify(['正确', '错误']),
    0,
    'SSS（边边边）是全等三角形的判定定理之一，三边对应相等的三角形全等'
  ],
  [
    'question',
    '相似三角形性质',
    '相似三角形面积比为4:9，求对应边长比',
    '两个相似三角形的面积比为 4:9，求它们的对应边长之比',
    'medium', 5,
    JSON.stringify(['2:3', '4:9', '16:81', '√2:√3']),
    0,
    '相似三角形面积比等于边长比的平方，所以边长比 = √(4/9) = 2:3'
  ],
  [
    'question',
    '一元二次方程判别式',
    '方程 x² + 2x + 1 = 0 的根的情况',
    '判断一元二次方程 x² + 2x + 1 = 0 的根的情况',
    'medium', 5,
    JSON.stringify(['两个不相等实根', '两个相等实根', '无实根', '无法判断']),
    1,
    '判别式 Δ = b² - 4ac = 4 - 4 = 0，当 Δ = 0 时，方程有两个相等的实数根'
  ]
]

questions.forEach(q => insertResource.run(...q))

const linkResourceKP = db.prepare('INSERT OR IGNORE INTO resource_knowledge (resource_id, knowledge_point_id) VALUES (?, ?)')
const resourceKPLinks = [
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 7],
  [7, 8],
  [8, 1]
]
resourceKPLinks.forEach(([rid, kpid]) => linkResourceKP.run(rid, kpid))

const insertMastery = db.prepare(`
  INSERT OR IGNORE INTO student_mastery 
  (student_id, knowledge_point_id, level, source, practice_count, correct_count)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const masteryData = [
  [1, 1, 0.65, '练习反馈', 5, 3],
  [1, 2, 0.40, '练习反馈', 4, 2],
  [1, 3, 0.80, '练习反馈', 6, 5],
  [1, 4, 0.90, '练习反馈', 3, 3],
  [1, 5, 0.55, '练习反馈', 4, 2],
  [2, 2, 0.75, '练习反馈', 4, 3],
  [2, 4, 0.70, '练习反馈', 5, 3],
  [2, 7, 0.60, '练习反馈', 3, 2]
]
masteryData.forEach(m => insertMastery.run(...m))

console.log('数据库初始化完成！')
db.close()
