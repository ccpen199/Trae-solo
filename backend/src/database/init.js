import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'app.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    location TEXT,
    interests TEXT,
    privacy_setting INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    status INTEGER DEFAULT 1,
    intimacy_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id1 INTEGER NOT NULL,
    user_id2 INTEGER NOT NULL,
    status INTEGER DEFAULT 0,
    intimacy_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id1, user_id2)
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT,
    status INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blocked_user_id INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_user_id)
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(actor_id, target_id, type)
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recommended_user_id INTEGER NOT NULL,
    reason TEXT,
    reason_type TEXT,
    score INTEGER DEFAULT 0,
    status INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recommended_user_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    status INTEGER DEFAULT 0,
    handler_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS risk_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    severity INTEGER DEFAULT 1,
    status INTEGER DEFAULT 0,
    handler_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_id INTEGER,
    details TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, action)
  );

  CREATE INDEX IF NOT EXISTS idx_relations_follower ON relations(follower_id);
  CREATE INDEX IF NOT EXISTS idx_relations_following ON relations(following_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id1);
  CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id2);
  CREATE INDEX IF NOT EXISTS idx_blacklist_user ON blacklist(user_id);
  CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  CREATE INDEX IF NOT EXISTS idx_risk_status ON risk_records(status);
  CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
`);

const insertUser = db.prepare(`
  INSERT INTO users (username, nickname, avatar, bio, location, interests, privacy_setting)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const mockUsers = [
  ['admin', '系统管理员', '', '系统管理员账号，负责运营和风控', '北京', '技术,管理,运营', 0],
  ['zhangsan', '张三', '', '热爱生活，喜欢旅行和摄影，美食爱好者', '上海', '旅行,摄影,美食,阅读', 0],
  ['lisi', '李四', '', '程序员一枚，热爱开源和技术分享', '深圳', '编程,游戏,音乐,技术', 0],
  ['wangwu', '王五', '', '健身达人，专注运动健康生活方式', '广州', '健身,运动,篮球,跑步', 1],
  ['zhaoliu', '赵六', '', '美食博主，探店达人，分享各地美食', '杭州', '美食,烹饪,探店,旅行', 0],
  ['sunqi', '孙七', '', '音乐人，吉他手，独立音乐创作者', '成都', '音乐,吉他,演出,创作', 0],
  ['zhouba', '周八', '', '书虫，阅读爱好者，咖啡馆常客', '南京', '读书,写作,咖啡,文学', 1],
  ['wujiu', '吴九', '', '户外爱好者，登山露营徒步', '武汉', '户外,登山,露营,徒步', 0],
  ['zhengshi', '郑十', '', '摄影师，专注人像和风景摄影', '北京', '摄影,旅行,艺术,展览', 0],
  ['wangfang', '王芳', '', '时尚博主，分享穿搭和美妆', '上海', '时尚,美妆,穿搭,购物', 0],
  ['chenbo', '陈波', '', '科技博主，数码产品评测', '深圳', '科技,数码,编程,游戏', 0],
  ['limei', '李梅', '', '教育博主，分享学习方法', '杭州', '教育,学习,读书,英语', 0],
];

const userIds = [];
mockUsers.forEach(user => {
  const result = insertUser.run(...user);
  userIds.push(result.lastInsertRowid);
});

const insertRelation = db.prepare(`
  INSERT INTO relations (follower_id, following_id, status, intimacy_score, created_at, updated_at)
  VALUES (?, ?, 1, ?, datetime('now', ?), datetime('now', ?))
`);

const mockRelations = [
  [2, 3, 15, '-5 days', '-1 day'],
  [2, 5, 20, '-10 days', '-2 days'],
  [2, 6, 12, '-3 days', '-1 hour'],
  [2, 10, 25, '-15 days', '-3 days'],
  [3, 2, 18, '-8 days', '-2 days'],
  [3, 7, 30, '-20 days', '-1 day'],
  [3, 11, 22, '-6 days', '-4 hours'],
  [4, 2, 10, '-2 days', '-1 day'],
  [4, 8, 35, '-25 days', '-5 hours'],
  [5, 2, 28, '-12 days', '-1 day'],
  [5, 6, 15, '-4 days', '-2 hours'],
  [5, 10, 20, '-7 days', '-1 day'],
  [6, 3, 12, '-3 days', '-1 day'],
  [6, 5, 18, '-9 days', '-3 hours'],
  [6, 10, 25, '-11 days', '-2 days'],
  [7, 4, 15, '-5 days', '-1 day'],
  [7, 8, 45, '-30 days', '-1 day'],
  [7, 12, 32, '-8 days', '-6 hours'],
  [8, 7, 42, '-28 days', '-2 days'],
  [8, 9, 20, '-10 days', '-1 day'],
  [9, 2, 8, '-1 day', '-1 hour'],
  [9, 10, 28, '-14 days', '-3 days'],
  [10, 2, 22, '-6 days', '-1 day'],
  [10, 5, 18, '-4 days', '-2 hours'],
  [10, 6, 15, '-3 days', '-1 day'],
  [11, 3, 25, '-7 days', '-1 day'],
  [11, 7, 18, '-5 days', '-3 hours'],
  [12, 7, 20, '-9 days', '-1 day'],
  [12, 8, 15, '-6 days', '-2 hours'],
];

mockRelations.forEach(r => insertRelation.run(...r));

const insertFriendship = db.prepare(`
  INSERT INTO friendships (user_id1, user_id2, status, intimacy_score, created_at, updated_at)
  VALUES (?, ?, 1, ?, datetime('now', ?), datetime('now', ?))
`);

const mockFriendships = [
  [2, 3, 33, '-8 days', '-1 day'],
  [2, 5, 48, '-12 days', '-2 days'],
  [2, 10, 47, '-15 days', '-3 days'],
  [3, 7, 52, '-20 days', '-1 day'],
  [5, 6, 33, '-9 days', '-2 hours'],
  [5, 10, 38, '-7 days', '-1 day'],
  [6, 10, 40, '-11 days', '-2 days'],
  [7, 8, 87, '-30 days', '-1 day'],
  [7, 12, 52, '-8 days', '-6 hours'],
];

mockFriendships.forEach(f => insertFriendship.run(...f));

const insertFriendRequest = db.prepare(`
  INSERT INTO friend_requests (sender_id, receiver_id, message, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
`);

const mockFriendRequests = [
  [2, 8, '你好，我是张三，关注你很久了', 0, '-1 day', '-1 day'],
  [3, 10, '嗨，看我们有共同好友，认识一下', 0, '-2 hours', '-2 hours'],
  [4, 6, '想认识一下', 1, '-5 days', '-4 days'],
  [5, 7, '你的户外分享很棒', 0, '-3 hours', '-3 hours'],
  [6, 9, '摄影师你好，想交流摄影技巧', 2, '-10 days', '-9 days'],
  [8, 2, 'Hello Zhang San', 1, '-6 days', '-5 days'],
  [9, 11, '科技交流', 0, '-1 day', '-1 day'],
];

mockFriendRequests.forEach(r => insertFriendRequest.run(...r));

const insertBlacklist = db.prepare(`
  INSERT INTO blacklist (user_id, blocked_user_id, reason, created_at)
  VALUES (?, ?, ?, datetime('now', ?))
`);

const mockBlacklist = [
  [2, 4, '频繁骚扰', '-7 days'],
  [3, 9, '广告骚扰', '-15 days'],
  [5, 11, '恶意评论', '-3 days'],
  [7, 10, '不适当内容', '-20 days'],
];

mockBlacklist.forEach(b => insertBlacklist.run(...b));

const insertInteraction = db.prepare(`
  INSERT INTO interactions (actor_id, target_id, type, count, last_at, created_at)
  VALUES (?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
`);

const mockInteractions = [
  [2, 3, 'like', 15, '-1 day', '-10 days'],
  [2, 3, 'comment', 8, '-2 days', '-15 days'],
  [2, 5, 'like', 25, '-1 day', '-20 days'],
  [2, 10, 'like', 30, '-2 days', '-15 days'],
  [3, 2, 'like', 12, '-1 day', '-8 days'],
  [3, 7, 'comment', 18, '-2 days', '-20 days'],
  [5, 2, 'like', 22, '-1 day', '-12 days'],
  [5, 10, 'comment', 10, '-3 days', '-7 days'],
  [6, 10, 'like', 20, '-2 days', '-11 days'],
  [7, 8, 'like', 50, '-1 day', '-30 days'],
  [7, 8, 'share', 15, '-3 days', '-25 days'],
  [10, 2, 'like', 18, '-1 day', '-6 days'],
  [10, 5, 'comment', 12, '-2 days', '-4 days'],
];

mockInteractions.forEach(i => insertInteraction.run(...i));

const insertRecommendation = db.prepare(`
  INSERT INTO recommendations (user_id, recommended_user_id, reason, reason_type, score, status, created_at)
  VALUES (?, ?, ?, ?, ?, 0, datetime('now', ?))
`);

const mockRecommendations = [
  [2, 7, '共同兴趣：旅行、摄影；3位共同关注', 'interest', 45, '-1 day'],
  [2, 8, '共同兴趣：户外、登山；同在上海', 'interest', 40, '-2 days'],
  [2, 9, '5位共同关注；同在上海', 'mutual', 35, '-3 days'],
  [2, 11, '共同兴趣：编程、游戏', 'interest', 30, '-1 day'],
  [2, 12, '3位共同关注', 'mutual', 25, '-4 days'],
  [3, 5, '共同兴趣：音乐、旅行；同在深圳', 'interest', 50, '-1 day'],
  [3, 10, '4位共同关注', 'mutual', 38, '-2 days'],
  [3, 12, '共同兴趣：读书、学习', 'interest', 32, '-3 days'],
  [4, 2, '共同关注：张三、王五；3位共同关注', 'mutual', 42, '-1 day'],
  [4, 6, '共同兴趣：音乐、吉他', 'interest', 35, '-2 days'],
  [5, 3, '共同兴趣：美食、旅行；4位共同关注', 'interest', 55, '-1 day'],
  [5, 7, '共同兴趣：健身、运动', 'interest', 40, '-3 days'],
  [5, 9, '5位共同关注', 'mutual', 30, '-2 days'],
  [6, 2, '共同兴趣：美食、旅行；3位共同关注', 'interest', 48, '-1 day'],
  [6, 7, '共同兴趣：户外、登山', 'interest', 35, '-4 days'],
  [6, 8, '4位共同关注', 'mutual', 32, '-2 days'],
];

mockRecommendations.forEach(r => insertRecommendation.run(...r));

const insertReport = db.prepare(`
  INSERT INTO reports (reporter_id, reported_user_id, type, description, status, handler_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
`);

const mockReports = [
  [2, 4, 'harassment', '频繁发送骚扰消息', 0, null, '-1 day', '-1 day'],
  [3, 9, 'spam', '发送大量广告', 1, 1, '-5 days', '-4 days'],
  [5, 11, 'harassment', '恶意评论骚扰', 0, null, '-2 days', '-2 days'],
  [6, 10, 'inappropriate', '发布不当内容', 2, 1, '-10 days', '-9 days'],
  [7, 10, 'inappropriate', '不适当内容', 1, 1, '-8 days', '-7 days'],
  [8, 4, 'fake', '疑似虚假账号', 0, null, '-3 days', '-3 days'],
  [9, 11, 'spam', '大量广告推广', 0, null, '-6 hours', '-6 hours'],
];

mockReports.forEach(r => insertReport.run(...r));

const insertRiskRecord = db.prepare(`
  INSERT INTO risk_records (user_id, type, description, severity, status, handler_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
`);

const mockRiskRecords = [
  [4, 'batch_follow', '1小时内关注35人，疑似批量关注', 2, 0, null, '-1 day', '-1 day'],
  [9, 'multiple_reports', '累计收到5条举报', 2, 0, null, '-5 days', '-5 days'],
  [10, 'admin_warn', '管理员警告：发布不当内容', 1, 1, 1, '-8 days', '-7 days'],
  [11, 'batch_follow', '1小时内关注42人，疑似批量关注', 2, 1, 1, '-3 days', '-2 days'],
  [4, 'multiple_reports', '累计收到3条骚扰举报', 2, 0, null, '-2 days', '-2 days'],
  [9, 'admin_ban', '管理员封禁：发送大量广告', 3, 1, 1, '-4 days', '-4 days'],
];

mockRiskRecords.forEach(r => insertRiskRecord.run(...r));

const insertActionLog = db.prepare(`
  INSERT INTO action_logs (user_id, action, target_id, details, ip, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now', ?))
`);

const mockActionLogs = [
  [2, 'follow', 3, '{}', '127.0.0.1', '-1 day'],
  [2, 'follow', 5, '{}', '127.0.0.1', '-2 days'],
  [2, 'follow', 6, '{}', '127.0.0.1', '-3 days'],
  [2, 'follow', 10, '{}', '127.0.0.1', '-4 days'],
  [2, 'unfollow', 4, '{}', '127.0.0.1', '-5 days'],
  [2, 'block', 4, '{"reason":"频繁骚扰"}', '127.0.0.1', '-7 days'],
  [2, 'friend_request', 8, '{"message":"你好"}', '127.0.0.1', '-1 day'],
  [2, 'report', 4, '{"type":"harassment"}', '127.0.0.1', '-1 day'],
  [3, 'follow', 2, '{}', '127.0.0.1', '-2 days'],
  [3, 'follow', 7, '{}', '127.0.0.1', '-3 days'],
  [3, 'friend_accept', 6, '{}', '127.0.0.1', '-5 days'],
  [3, 'report', 9, '{"type":"spam"}', '127.0.0.1', '-5 days'],
  [5, 'follow', 2, '{}', '127.0.0.1', '-1 day'],
  [5, 'follow', 6, '{}', '127.0.0.1', '-2 days'],
  [5, 'block', 11, '{"reason":"恶意评论"}', '127.0.0.1', '-3 days'],
  [6, 'follow', 3, '{}', '127.0.0.1', '-2 days'],
  [6, 'follow', 5, '{}', '127.0.0.1', '-3 days'],
  [7, 'follow', 4, '{}', '127.0.0.1', '-4 days'],
  [7, 'follow', 8, '{}', '127.0.0.1', '-5 days'],
  [7, 'block', 10, '{"reason":"不适当内容"}', '127.0.0.1', '-20 days'],
  [10, 'follow', 2, '{}', '127.0.0.1', '-1 day'],
  [10, 'follow', 5, '{}', '127.0.0.1', '-2 days'],
  [10, 'follow', 6, '{}', '127.0.0.1', '-3 days'],
];

mockActionLogs.forEach(l => insertActionLog.run(...l));

console.log('数据库初始化完成，已创建完整模拟数据');
console.log(`用户数: ${userIds.length}`);
console.log(`关注关系: ${mockRelations.length}`);
console.log(`好友关系: ${mockFriendships.length}`);
console.log(`好友申请: ${mockFriendRequests.length}`);
console.log(`黑名单: ${mockBlacklist.length}`);
console.log(`互动记录: ${mockInteractions.length}`);
console.log(`推荐记录: ${mockRecommendations.length}`);
console.log(`举报记录: ${mockReports.length}`);
console.log(`风控记录: ${mockRiskRecords.length}`);
console.log(`操作日志: ${mockActionLogs.length}`);

db.close();
