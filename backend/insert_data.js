const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

const userId = 1;

// 插入圈子数据
const insertCircle = db.prepare('INSERT INTO circles (name, description, owner_id, member_count) VALUES (?, ?, ?, ?)');
insertCircle.run('早起打卡团', '每天早起打卡，养成好习惯！', userId, 15);
insertCircle.run('阅读爱好者', '分享阅读心得，推荐好书', userId, 32);
insertCircle.run('健身日常', '记录健身日常，互相鼓励', userId, 28);

// 插入帖子数据
const insertPost = db.prepare('INSERT INTO posts (user_id, circle_id, content, likes_count, comments_count) VALUES (?, ?, ?, ?, ?)');
insertPost.run(userId, 1, '今天5点就起床了，晨跑30分钟，感觉很棒！大家一起坚持早起哦！', 12, 3);
insertPost.run(userId, 1, '连续早起第7天，打卡！', 8, 1);
insertPost.run(userId, 2, '刚读完《原子习惯》，强烈推荐！这本书真的改变了我对习惯的看法。', 25, 7);
insertPost.run(userId, 3, '今天练了腿，明天估计要废了😂', 18, 4);
insertPost.run(userId, null, '分享一个好用的习惯追踪技巧：把新习惯和已有习惯绑定在一起', 42, 8);

console.log('数据统计:');
console.log('用户:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
console.log('习惯:', db.prepare('SELECT COUNT(*) as c FROM habits').get().c);
console.log('圈子:', db.prepare('SELECT COUNT(*) as c FROM circles').get().c);
console.log('帖子:', db.prepare('SELECT COUNT(*) as c FROM posts').get().c);
