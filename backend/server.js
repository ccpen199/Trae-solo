require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 54411;
const DB_PATH = path.join(__dirname, '..', 'data', 'app.sqlite');

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 44411}` }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT DEFAULT '[]',
  category TEXT,
  description TEXT,
  cover_url TEXT,
  source TEXT DEFAULT 'manual',
  creator_id INTEGER DEFAULT 0,
  creator_name TEXT,
  manager_id INTEGER DEFAULT 0,
  manager_name TEXT,
  status INTEGER DEFAULT 1,
  is_pinned INTEGER DEFAULT 0,
  activity_entry TEXT,
  recommendation_reason TEXT,
  post_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  heat_score REAL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  author_id INTEGER,
  author_name TEXT,
  status INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS post_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  source TEXT DEFAULT 'manual',
  operator_id INTEGER DEFAULT 0,
  operator_name TEXT,
  confidence REAL DEFAULT 1.0,
  created_at INTEGER,
  UNIQUE(post_id, topic_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tag_change_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  topic_id INTEGER,
  action TEXT NOT NULL,
  source TEXT,
  operator_id INTEGER,
  operator_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS moderation_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  post_id INTEGER DEFAULT 0,
  topic_id INTEGER DEFAULT 0,
  target_id INTEGER,
  target_type TEXT,
  title TEXT,
  content TEXT,
  reason TEXT,
  reporter_id INTEGER,
  reporter_name TEXT,
  operator_name TEXT,
  status INTEGER DEFAULT 0,
  handler_id INTEGER,
  handler_name TEXT,
  result TEXT,
  created_at INTEGER,
  handled_at INTEGER
);

CREATE TABLE IF NOT EXISTS topic_merges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_topic_id INTEGER,
  target_topic_id INTEGER,
  operator_id INTEGER,
  operator_name TEXT,
  post_count INTEGER,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_post_topics_post ON post_topics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_topics_topic ON post_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_heat ON topics(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
`);

const now = () => Math.floor(Date.now() / 1000);

const initData = db.transaction(() => {
  const topicCount = db.prepare('SELECT COUNT(*) as c FROM topics').get().c;
  if (topicCount === 0) {
    const insertTopic = db.prepare(`INSERT INTO topics 
      (name, aliases, category, description, source, creator_name, manager_name, status, 
       is_pinned, recommendation_reason, post_count, view_count, heat_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const topics = [
      ['人工智能', '["AI","机器学习"]', '科技', '人工智能技术讨论与分享', 'system', '系统', '张运营', 1, 1, '全站热门话题', 128, 5680, 98.5, now(), now()],
      ['前端开发', '["Web开发","Vue","React"]', '技术', '前端技术交流社区', 'manual', '李创建', '王经理', 1, 0, '技术类热门', 256, 8920, 95.2, now(), now()],
      ['美食探店', '["美食","探店","餐厅推荐"]', '生活', '分享美食体验与餐厅推荐', 'manual', '陈美食', '刘运营', 1, 0, '生活类高增长', 189, 7650, 88.7, now(), now()],
      ['旅行日记', '["旅游","出行","攻略"]', '生活', '记录旅行美好时光', 'auto', '系统', '赵管理', 1, 0, '', 145, 6230, 82.3, now(), now()],
      ['健身打卡', '["运动","减肥","健康"]', '生活', '每日健身打卡，健康生活方式', 'manual', '孙健身', '周运营', 1, 0, '健康生活话题', 312, 12450, 91.8, now(), now()],
      ['职场干货', '["工作","求职","面试"]', '职场', '职场经验分享与求职攻略', 'system', '系统', '吴经理', 1, 0, '职场类热门', 278, 9870, 89.5, now(), now()],
      ['投资理财', '["理财","基金","股票"]', '财经', '投资理财知识分享', 'manual', '郑财经', '钱管理', 1, 0, '', 167, 5430, 76.4, now(), now()],
      ['亲子育儿', '["育儿","母婴","宝宝"]', '家庭', '亲子育儿经验交流', 'auto', '系统', '孙运营', 0, 0, '', 89, 3210, 45.2, now(), now()],
    ];
    topics.forEach(t => insertTopic.run(...t));

    const insertPost = db.prepare(`INSERT INTO posts 
      (title, content, author_name, status, view_count, like_count, comment_count, share_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const posts = [
      ['2024年AI发展趋势预测', '人工智能正在改变世界，让我们一起探讨未来的发展方向...', '王科技', 1, 1256, 89, 23, 45, now(), now()],
      ['Vue3组合式API最佳实践', '分享Vue3项目中使用组合式API的一些经验和技巧...', '李前端', 1, 2340, 156, 45, 78, now(), now()],
      ['上海必吃的10家老字号餐厅', '今天给大家推荐几家上海真正值得去的老字号餐厅...', '陈美食', 1, 5678, 345, 89, 123, now(), now()],
      ['西藏自驾游完全攻略', '分享我历时15天的西藏自驾之旅，路线、住宿、费用全攻略...', '张旅行', 1, 8901, 567, 123, 234, now(), now()],
      ['30天健身打卡挑战第1天', '从今天开始30天健身打卡，目标减重5kg，欢迎监督...', '刘健身', 1, 3456, 234, 67, 89, now(), now()],
      ['面试时如何回答优缺点问题', '作为面试官，我来告诉你这个问题的标准答案是什么...', '赵HR', 1, 4567, 312, 78, 145, now(), now()],
      ['基金定投新手入门指南', '从零开始学基金定投，适合新手的投资方法分享...', '钱理财', 1, 2345, 167, 45, 67, now(), now()],
      ['React Hooks深度解析', '深入理解React Hooks的工作原理和最佳实践...', '周前端', 1, 3456, 234, 56, 89, now(), now()],
      ['宝宝辅食添加全攻略', '6-12个月宝宝辅食添加时间表和注意事项...', '孙妈妈', 1, 1234, 89, 34, 56, now(), now()],
      ['2024年最值得去的5个小众旅行地', '推荐几个游客不多但风景绝美的旅行目的地...', '吴旅行', 1, 6789, 456, 112, 178, now(), now()],
    ];
    posts.forEach(p => insertPost.run(...p));

    const insertPostTopic = db.prepare(`INSERT INTO post_topics 
      (post_id, topic_id, source, operator_name, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`);
    
    const relations = [
      [1, 1, 'auto', '系统', 0.95],
      [2, 2, 'manual', '李前端', 1.0],
      [3, 3, 'manual', '陈美食', 1.0],
      [4, 4, 'auto', '系统', 0.88],
      [5, 5, 'manual', '刘健身', 1.0],
      [6, 6, 'manual', '赵HR', 1.0],
      [7, 7, 'manual', '钱理财', 1.0],
      [8, 2, 'auto', '系统', 0.92],
      [10, 4, 'manual', '吴旅行', 1.0],
      [1, 6, 'auto', '系统', 0.65],
    ];
    relations.forEach(r => insertPostTopic.run(r[0], r[1], r[2], r[3], r[4], now()));

    //  // 初始化变更日志
    const insertLog = db.prepare(`INSERT INTO tag_change_logs 
      (post_id, topic_id, action, source, operator_name, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    topics.forEach((t, idx) => {
      insertLog.run(0, idx + 1, 'topic_create', t[4], t[6] || '系统', JSON.stringify({ name: t[0], category: t[2] || '', source: t[4] }), now());
    });
    
    relations.forEach(r => {
      insertLog.run(r[0], r[1], 'add', r[2], r[3], String(r[1]), now());
    });

    const insertMod = db.prepare(`INSERT INTO moderation_queue 
      (type, post_id, topic_id, target_id, target_type, title, content, reason, reporter_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    const mods = [
      ['sensitive_topic', 0, 8, 8, 'topic', '亲子育儿', '话题内容可能存在广告营销', '疑似商业推广', '用户A', 0, now()],
      ['malicious_tag', 1, 1, 1, 'post', '2024年AI发展趋势预测', '被恶意添加不相关标签', '恶意蹭标签', '系统检测', 0, now()],
      ['duplicate_topic', 0, 0, null, 'topic', '机器学习 vs 人工智能', '两个话题高度相似建议合并', '重复话题', '王运营', 0, now()],
      ['wrong_category', 3, 0, 3, 'post', '上海必吃的10家老字号餐厅', '归类错误，应该是美食探店', '分类错误', '李审核', 1, now()],
    ];
    mods.forEach(m => insertMod.run(...m));

    console.log('Initialized sample data');
  }
});
initData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: now() });
});

app.get('/api/topics', (req, res) => {
  const { page = 1, pageSize = 20, status, category, keyword, sort = 'heat' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  if (status !== undefined) { where.push('status = ?'); params.push(Number(status)); }
  if (category) { where.push('category = ?'); params.push(category); }
  if (keyword) { where.push('(name LIKE ? OR aliases LIKE ? OR description LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const orderBy = sort === 'heat' ? 'heat_score DESC' : sort === 'newest' ? 'created_at DESC' : 'post_count DESC';
  
  const total = db.prepare(`SELECT COUNT(*) as c FROM topics ${whereSql}`).get(...params).c;
  const list = db.prepare(`SELECT * FROM topics ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);
  
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

app.get('/api/topics/check-similar', (req, res) => {
  const { name, aliases = [] } = req.query;
  if (!name) return res.json({ similar: [] });
  
  const checkName = name.trim();
  const similar = db.prepare(`
    SELECT id, name, aliases, category, 
      CASE 
        WHEN name LIKE ? THEN 100
        WHEN aliases LIKE ? THEN 90
        WHEN name LIKE ? THEN 80
        ELSE 50
      END as match_score
    FROM topics 
    WHERE name LIKE ? OR aliases LIKE ? OR name LIKE ?
    LIMIT 10
  `).all(
    checkName,
    `%${checkName}%`,
    `%${checkName}%`,
    `%${checkName}%`,
    `%${checkName}%`,
    `%${checkName}%`
  );
  
  res.json({ similar });
});

app.get('/api/topics/:id', (req, res) => {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  
  const posts = db.prepare(`
    SELECT p.*, pt.source as tag_source, pt.confidence
    FROM post_topics pt
    JOIN posts p ON pt.post_id = p.id
    WHERE pt.topic_id = ? AND p.status = 1
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT 20
  `).all(req.params.id);
  
  const trend = db.prepare(`
    SELECT 
      DATE(pt.created_at, 'unixepoch') as date,
      COUNT(*) as post_count,
      SUM(p.like_count) as total_likes
    FROM post_topics pt
    JOIN posts p ON pt.post_id = p.id
    WHERE pt.topic_id = ? AND pt.created_at > ?
    GROUP BY DATE(pt.created_at, 'unixepoch')
    ORDER BY date DESC
    LIMIT 7
  `).all(req.params.id, now() - 7 * 24 * 3600);
  
  db.prepare('UPDATE topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  
  res.json({ ...topic, posts, trend });
});

app.post('/api/topics', (req, res) => {
  const { name, aliases = [], category, description, cover_url, source = 'manual', creator_name, manager_name } = req.body;
  
  if (!name || !name.trim()) return res.status(400).json({ error: '话题名称不能为空' });
  
  const exists = db.prepare('SELECT id FROM topics WHERE name = ?').get(name.trim());
  if (exists) return res.status(400).json({ error: '话题名称已存在' });
  
  const info = db.prepare(`INSERT INTO topics 
    (name, aliases, category, description, cover_url, source, creator_name, manager_name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    name.trim(),
    JSON.stringify(aliases),
    category || '',
    description || '',
    cover_url || '',
    source,
    creator_name || '系统',
    manager_name || '',
    now(),
    now()
  );

  db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, new_value, created_at) VALUES (0, ?, \'topic_create\', ?, ?, ?, ?)').run(info.lastInsertRowid, source, creator_name || '系统', JSON.stringify({ name: name.trim(), category: category || '', source: source }), now());
  
  res.json({ id: info.lastInsertRowid, name });
});

app.put('/api/topics/:id', (req, res) => {
  const { name, aliases, category, description, cover_url, manager_name, status, is_pinned, activity_entry, recommendation_reason } = req.body;
  
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  
  if (name && name !== topic.name) {
    const exists = db.prepare('SELECT id FROM topics WHERE name = ? AND id != ?').get(name.trim(), req.params.id);
    if (exists) return res.status(400).json({ error: '话题名称已存在' });
  }
  
  db.prepare(`UPDATE topics SET 
    name = COALESCE(?, name),
    aliases = COALESCE(?, aliases),
    category = COALESCE(?, category),
    description = COALESCE(?, description),
    cover_url = COALESCE(?, cover_url),
    manager_name = COALESCE(?, manager_name),
    status = COALESCE(?, status),
    is_pinned = COALESCE(?, is_pinned),
    activity_entry = COALESCE(?, activity_entry),
    recommendation_reason = COALESCE(?, recommendation_reason),
    updated_at = ?
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    aliases !== undefined ? JSON.stringify(aliases) : null,
    category !== undefined ? category : null,
    description !== undefined ? description : null,
    cover_url !== undefined ? cover_url : null,
    manager_name !== undefined ? manager_name : null,
    status !== undefined ? status : null,
    is_pinned !== undefined ? is_pinned : null,
    activity_entry !== undefined ? activity_entry : null,
    recommendation_reason !== undefined ? recommendation_reason : null,
    now(),
    req.params.id
  );

  const changes = {};
  if (name && name !== topic.name) changes.name = { old: topic.name, new: name.trim() };
  if (category !== undefined && category !== topic.category) changes.category = { old: topic.category, new: category };
  if (status !== undefined && status !== topic.status) changes.status = { old: topic.status, new: status };
  
  if (Object.keys(changes).length > 0) {
    db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, new_value, created_at) VALUES (0, ?, \'topic_update\', \'manual\', ?, ?, ?)').run(req.params.id, manager_name || '系统', JSON.stringify(changes), now());
  }
  
  res.json({ success: true });
});

app.post('/api/topics/:id/merge', (req, res) => {
  const { target_topic_id, operator_name } = req.body;
  const source_id = req.params.id;
  let mergedCount = 0;
  
  if (Number(source_id) === Number(target_topic_id)) {
    return res.status(400).json({ error: '不能合并到自身' });
  }
  
  const source = db.prepare('SELECT * FROM topics WHERE id = ?').get(source_id);
  const target = db.prepare('SELECT * FROM topics WHERE id = ?').get(target_topic_id);
  
  if (!source || !target) return res.status(404).json({ error: '话题不存在' });
  
  const mergeTx = db.transaction(() => {
    const postTopics = db.prepare('SELECT post_id FROM post_topics WHERE topic_id = ?').all(source_id);
    
    db.prepare('INSERT OR IGNORE INTO post_topics (post_id, topic_id, source, operator_name, created_at) SELECT post_id, ?, "merge", ?, ? FROM post_topics WHERE topic_id = ?').run(target_topic_id, operator_name || '系统', now(), source_id);
    
    mergedCount = db.prepare('SELECT changes() as c').get().c;
    
    db.prepare('DELETE FROM post_topics WHERE topic_id = ?').run(source_id);
    
    db.prepare('UPDATE topics SET post_count = post_count + ?, updated_at = ? WHERE id = ?').run(mergedCount, now(), target_topic_id);
    
    db.prepare('INSERT INTO topic_merges (source_topic_id, target_topic_id, operator_name, post_count, created_at) VALUES (?, ?, ?, ?, ?)').run(source_id, target_topic_id, operator_name || '系统', mergedCount, now());
    
    db.prepare('DELETE FROM topics WHERE id = ?').run(source_id);
  });
  
  mergeTx();

  db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, new_value, created_at) VALUES (0, ?, \'topic_merge\', \'merge\', ?, ?, ?)').run(target_topic_id, operator_name || '系统', JSON.stringify({ source_topic: source.name, target_topic: target.name, merged_posts: mergedCount }), now());

  res.json({ success: true });
});

app.post('/api/topics/:id/submit-audit', (req, res) => {
  const { reason, operator_name } = req.body;
  const topicId = req.params.id;
  
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
  if (!topic) return res.status(404).json({ error: '话题不存在' });
  
  db.prepare('INSERT INTO moderation_queue (topic_id, post_id, type, reason, operator_name, status, created_at) VALUES (?, 0, \'topic_cleanup\', ?, ?, 0, ?)').run(topicId, reason || '零内容话题待清理', operator_name || '系统', now());
  
  res.json({ success: true });
});

app.get('/api/posts', (req, res) => {
  const { page = 1, pageSize = 20, topic_id, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = 'SELECT p.* FROM posts p';
  let countSql = 'SELECT COUNT(*) as c FROM posts p';
  let where = [];
  let params = [];
  
  if (topic_id) {
    sql += ' JOIN post_topics pt ON p.id = pt.post_id';
    countSql += ' JOIN post_topics pt ON p.id = pt.post_id';
    where.push('pt.topic_id = ?');
    params.push(Number(topic_id));
  }
  if (keyword) {
    where.push('(p.title LIKE ? OR p.content LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(countSql + whereSql).get(...params).c;
  const list = db.prepare(sql + whereSql + ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?').all(...params, Number(pageSize), offset);
  
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

app.get('/api/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  
  const topics = db.prepare(`
    SELECT t.*, pt.source as tag_source, pt.confidence, pt.operator_name, pt.created_at as tagged_at
    FROM post_topics pt
    JOIN topics t ON pt.topic_id = t.id
    WHERE pt.post_id = ? AND t.status = 1
  `).all(req.params.id);
  
  res.json({ ...post, topics });
});

app.post('/api/posts/:id/tags', (req, res) => {
  const { topic_ids, source = 'manual', operator_name } = req.body;
  const postId = req.params.id;
  
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  
  const tagTx = db.transaction(() => {
    db.prepare('DELETE FROM post_topics WHERE post_id = ?').run(postId);
    
    const insert = db.prepare('INSERT INTO post_topics (post_id, topic_id, source, operator_name, confidence, created_at) VALUES (?, ?, ?, ?, 1.0, ?)');
    
    (topic_ids || []).forEach(tid => {
      insert.run(postId, tid, source, operator_name || '系统', now());
      
      db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, new_value, created_at) VALUES (?, ?, \'add\', ?, ?, ?, ?)').run(postId, tid, source, operator_name || '系统', String(tid), now());
    });
    
    db.prepare('UPDATE topics SET post_count = (SELECT COUNT(*) FROM post_topics WHERE topic_id = topics.id), updated_at = ? WHERE id IN (SELECT topic_id FROM post_topics WHERE post_id = ?)').run(now(), postId);
  });
  
  tagTx();
  res.json({ success: true });
});

app.post('/api/posts/:id/tags/batch', (req, res) => {
  const { add_topic_ids = [], remove_topic_ids = [], source = 'batch', operator_name } = req.body;
  const postId = req.params.id;
  
  const batchTx = db.transaction(() => {
    remove_topic_ids.forEach(tid => {
      db.prepare('DELETE FROM post_topics WHERE post_id = ? AND topic_id = ?').run(postId, tid);
      db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, old_value, created_at) VALUES (?, ?, \'remove\', ?, ?, ?, ?)').run(postId, tid, source, operator_name || '系统', String(tid), now());
    });
    
    const insert = db.prepare('INSERT OR IGNORE INTO post_topics (post_id, topic_id, source, operator_name, confidence, created_at) VALUES (?, ?, ?, ?, 1.0, ?)');
    add_topic_ids.forEach(tid => {
      insert.run(postId, tid, source, operator_name || '系统', now());
      db.prepare('INSERT INTO tag_change_logs (post_id, topic_id, action, source, operator_name, new_value, created_at) VALUES (?, ?, \'add\', ?, ?, ?, ?)').run(postId, tid, source, operator_name || '系统', String(tid), now());
    });
  });
  
  batchTx();
  res.json({ success: true });
});

app.get('/api/posts/:id/tag-suggestions', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  
  const existingTopicIds = db.prepare('SELECT topic_id FROM post_topics WHERE post_id = ?').all(req.params.id).map(t => t.topic_id);
  
  const suggestions = db.prepare(`
    SELECT t.*, 
      CASE 
        WHEN ? LIKE '%' || t.name || '%' THEN 0.9
        WHEN t.aliases LIKE '%' || ? || '%' THEN 0.8
        ELSE 0.5 + RANDOM() * 0.3
      END as confidence
    FROM topics t
    WHERE t.status = 1 AND t.id NOT IN (${existingTopicIds.length ? existingTopicIds.join(',') : '0'})
    ORDER BY confidence DESC, t.heat_score DESC
    LIMIT 10
  `).all(post.title, post.title);
  
  res.json({ suggestions });
});

app.post('/api/moderation', (req, res) => {
  const { post_id, topic_id, type, reason, operator_name } = req.body;
  
  const info = db.prepare('INSERT INTO moderation_queue (post_id, topic_id, type, reason, operator_name, status, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)').run(
    post_id || 0,
    topic_id || 0,
    type || 'misclassification',
    reason || '',
    operator_name || '系统',
    now()
  );
  
  res.json({ id: info.lastInsertRowid, success: true });
});

app.get('/api/moderation', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  if (status !== undefined) { where.push('status = ?'); params.push(Number(status)); }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM moderation_queue ${whereSql}`).get(...params).c;
  const list = db.prepare(`SELECT * FROM moderation_queue ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);
  
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

app.post('/api/moderation/:id/handle', (req, res) => {
  const { result, handler_name, action, target_topic_id } = req.body;
  const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  
  const handleTx = db.transaction(() => {
    if (action === 'ban_topic' && item.target_type === 'topic') {
      db.prepare('UPDATE topics SET status = 0, updated_at = ? WHERE id = ?').run(now(), item.target_id);
    } else if (action === 'merge_topics' && target_topic_id) {
      const postTopics = db.prepare('SELECT post_id FROM post_topics WHERE topic_id = ?').all(item.target_id);
      postTopics.forEach(pt => {
        db.prepare('INSERT OR IGNORE INTO post_topics (post_id, topic_id, source, operator_name, created_at) VALUES (?, ?, "merge", ?, ?)').run(pt.post_id, target_topic_id, handler_name || '系统', now());
      });
      db.prepare('DELETE FROM post_topics WHERE topic_id = ?').run(item.target_id);
      db.prepare('DELETE FROM topics WHERE id = ?').run(item.target_id);
    } else if (action === 'remove_tag' && item.target_type === 'post') {
      db.prepare('DELETE FROM post_topics WHERE post_id = ?').run(item.target_id);
    } else if (action === 'downgrade' && item.target_type === 'topic') {
      db.prepare('UPDATE topics SET heat_score = heat_score * 0.5, updated_at = ? WHERE id = ?').run(now(), item.target_id);
    }
    
    db.prepare('UPDATE moderation_queue SET status = 1, handler_name = ?, result = ?, handled_at = ? WHERE id = ?').run(handler_name || '系统', result || '已处理', now(), req.params.id);
  });
  
  handleTx();
  res.json({ success: true });
});

app.get('/api/dashboard/overview', (req, res) => {
  const totalTopics = db.prepare('SELECT COUNT(*) as c FROM topics').get().c;
  const activeTopics = db.prepare('SELECT COUNT(*) as c FROM topics WHERE status = 1').get().c;
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const totalRelations = db.prepare('SELECT COUNT(*) as c FROM post_topics').get().c;
  const pendingModeration = db.prepare('SELECT COUNT(*) as c FROM moderation_queue WHERE status = 0').get().c;
  
  const topicGrowth = db.prepare(`
    SELECT DATE(created_at, 'unixepoch') as date, COUNT(*) as count
    FROM topics
    WHERE created_at > ?
    GROUP BY DATE(created_at, 'unixepoch')
    ORDER BY date DESC
    LIMIT 7
  `).all(now() - 30 * 24 * 3600);
  
  const topTopics = db.prepare(`
    SELECT id, name, post_count, view_count, heat_score, category
    FROM topics
    WHERE status = 1
    ORDER BY heat_score DESC
    LIMIT 10
  `).all();
  
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count, SUM(post_count) as total_posts
    FROM topics
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY count DESC
  `).all();
  
  const moderationStats = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM moderation_queue
    WHERE created_at > ?
    GROUP BY type
  `).all(now() - 30 * 24 * 3600);

  const contentQuality = db.prepare(`
    SELECT 
      AVG(CASE WHEN like_count > 50 THEN 1 ELSE 0 END) * 100 as high_quality_rate,
      AVG(CASE WHEN comment_count > 20 THEN 1 ELSE 0 END) * 100 as high_comment_rate,
      AVG(CASE WHEN share_count > 10 THEN 1 ELSE 0 END) * 100 as high_share_rate
    FROM posts
    WHERE status = 1
  `).get();

  const interactionContribution = db.prepare(`
    SELECT 
      t.id, t.name, t.category,
      SUM(p.like_count) as total_likes,
      SUM(p.comment_count) as total_comments,
      SUM(p.share_count) as total_shares,
      (SUM(p.like_count) + SUM(p.comment_count) * 2 + SUM(p.share_count) * 3) as interaction_score
    FROM topics t
    JOIN post_topics pt ON t.id = pt.topic_id
    JOIN posts p ON pt.post_id = p.id
    WHERE t.status = 1 AND p.status = 1
    GROUP BY t.id
    ORDER BY interaction_score DESC
    LIMIT 10
  `).all();

  const searchHitRate = db.prepare(`
    SELECT 
      AVG(CASE WHEN view_count > 100 THEN 1 ELSE 0 END) * 100 as high_view_rate,
      COUNT(*) as total_posts,
      SUM(CASE WHEN view_count > 100 THEN 1 ELSE 0 END) as high_view_posts
    FROM posts
    WHERE status = 1
  `).get();

  const governanceResults = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM moderation_queue
    GROUP BY status
  `).all();

  const sourceStats = db.prepare(`
    SELECT source, COUNT(*) as count
    FROM topics
    GROUP BY source
  `).all();
  
  res.json({
    stats: { 
      totalTopics, activeTopics, totalPosts, totalRelations, pendingModeration,
      contentQuality, searchHitRate
    },
    topicGrowth,
    topTopics,
    categoryStats,
    moderationStats,
    interactionContribution,
    governanceResults,
    sourceStats
  });
});

app.get('/api/dashboard/topic-trend', (req, res) => {
  const days = Number(req.query.days || 7);
  const data = db.prepare(`
    SELECT 
      DATE(pt.created_at, 'unixepoch') as date,
      t.name as topic_name,
      COUNT(*) as tag_count
    FROM post_topics pt
    JOIN topics t ON pt.topic_id = t.id
    WHERE pt.created_at > ?
    GROUP BY DATE(pt.created_at, 'unixepoch'), t.id
    ORDER BY date DESC, tag_count DESC
    LIMIT 50
  `).all(now() - days * 24 * 3600);
  
  res.json({ data, days });
});

app.get('/api/tag-changes', (req, res) => {
  const { page = 1, pageSize = 20, post_id, topic_id, action } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  if (post_id) { where.push('post_id = ?'); params.push(Number(post_id)); }
  if (topic_id) { where.push('topic_id = ?'); params.push(Number(topic_id)); }
  if (action) { where.push('action = ?'); params.push(action); }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM tag_change_logs ${whereSql}`).get(...params).c;
  const list = db.prepare(`SELECT * FROM tag_change_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);
  
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT DISTINCT category as name, COUNT(*) as topic_count
    FROM topics
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY topic_count DESC
  `).all();
  res.json({ categories });
});

app.post('/api/posts', (req, res) => {
  const { title, content, author_name, topic_ids = [] } = req.body;
  
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' });
  
  const createTx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO posts 
      (title, content, author_name, status, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(title.trim(), content || '', author_name || '匿名用户', now(), now());
    
    const postId = info.lastInsertRowid;
    const insert = db.prepare('INSERT INTO post_topics (post_id, topic_id, source, operator_name, confidence, created_at) VALUES (?, ?, "manual", ?, 1.0, ?)');
    
    topic_ids.forEach(tid => {
      if (tid) insert.run(postId, tid, author_name || '匿名用户', now());
    });
    
    return postId;
  });
  
  const postId = createTx();
  res.json({ id: postId, title });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`API docs: http://127.0.0.1:${PORT}/api/health`);
});
