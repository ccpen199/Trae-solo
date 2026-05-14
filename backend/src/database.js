const Database = require('better-sqlite3')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, '../../data/app.sqlite')
const db = new Database(dbPath, { verbose: console.log })

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initDatabase = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        password TEXT,
        nickname TEXT,
        avatar TEXT,
        bio TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT,
        is_paid INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        follow_count INTEGER DEFAULT 0,
        answer_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        is_accepted INTEGER DEFAULT 0,
        sort_weight INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        like_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(user_id, answer_id)
      );

      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(user_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(user_id, answer_id)
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        keyword TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS hot_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        search_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expired_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `)

    const hotSearchStmt = db.prepare('SELECT COUNT(*) as count FROM hot_searches')
    const hotSearchCount = hotSearchStmt.get().count
    if (hotSearchCount === 0) {
      const defaultHotSearches = [
        '人工智能如何学习',
        '前端开发最佳实践',
        'Python入门教程',
        '考研复习方法',
        '职场沟通技巧',
        '健身计划制定',
        '投资理财入门',
        '英语学习方法',
        '面试技巧总结',
        '产品经理思维'
      ]
      const insertHotSearch = db.prepare('INSERT INTO hot_searches (keyword, search_count) VALUES (?, ?)')
      defaultHotSearches.forEach((keyword, index) => {
        insertHotSearch.run(keyword, 100 - index * 10)
      })
    }

    const userStmt = db.prepare('SELECT COUNT(*) as count FROM users')
    const userCount = userStmt.get().count
    if (userCount === 0) {
      const hashedPassword = bcrypt.hashSync('123456', 10)
      const insertUser = db.prepare('INSERT INTO users (phone, password, nickname, avatar, bio) VALUES (?, ?, ?, ?, ?)')
      insertUser.run('13800138000', hashedPassword, '测试用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=test', '这是一个测试用户账号')
      insertUser.run('13800138001', hashedPassword, '技术专家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert', '专注于技术领域的专家')
      
      const insertQuestion = db.prepare('INSERT INTO questions (user_id, title, content, view_count, follow_count, answer_count) VALUES (?, ?, ?, ?, ?, ?)')
      const questionId = insertQuestion.run(1, '如何系统地学习前端开发？', '作为一名前端新手，想请教各位前辈，应该如何系统地学习前端开发？需要掌握哪些技术栈？学习顺序是怎样的？', 1520, 89, 2).lastInsertRowid
      insertQuestion.run(2, '人工智能未来的发展趋势是什么？', '随着ChatGPT等大模型的出现，人工智能技术发展迅速。想请教一下，未来3-5年AI的主要发展方向和应用场景会有哪些？', 2340, 156, 0)

      const insertAnswer = db.prepare('INSERT INTO answers (question_id, user_id, content, like_count, comment_count, sort_weight) VALUES (?, ?, ?, ?, ?, ?)')
      insertAnswer.run(questionId, 2, `学习前端开发建议按照以下路径进行：

## 基础阶段
1. **HTML & CSS** - 掌握标签语义化、CSS盒模型、Flexbox、Grid布局
2. **JavaScript基础** - 变量、数据类型、函数、作用域、原型链、异步编程
3. **DOM操作** - 事件处理、DOM增删改查

## 进阶阶段
1. **ES6+** - let/const、箭头函数、Promise、async/await、模块化
2. **前端框架** - 推荐先学Vue或React，掌握组件化思想
3. **工程化** - Webpack/Vite、npm/yarn、Git、代码规范

## 高级阶段
1. **性能优化** - 加载优化、渲染优化、缓存策略
2. **TypeScript** - 类型系统提升代码质量
3. **Node.js** - 全栈开发能力

每天坚持编码2-3小时，多做项目实践，1-2年就能达到不错的水平。`, 234, 45, 100)
      insertAnswer.run(questionId, 1, `补充一下学习资源推荐：

- MDN Web Docs - 最权威的前端文档
- freeCodeCamp - 免费的互动式学习平台
- 掘金、思否 - 国内优质技术社区
- GitHub - 多看优秀开源项目

最重要的是多动手实践，不要只看不练。`, 89, 12, 50)
    }

    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }
}

initDatabase()

module.exports = db
