const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.sqlite');
const db = new Database(dbPath);

try {
  console.log('开始初始化数据库...');

  const insertUser = db.prepare(`
    INSERT INTO users (phone, nickname, avatar, bio, city, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const users = [
    { phone: '13800000001', nickname: '创作者小王', city: '北京' },
    { phone: '13800000002', nickname: '美食达人', city: '上海' },
    { phone: '13800000003', nickname: '旅行家', city: '广州' }
  ];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    insertUser.run(
      user.phone,
      user.nickname,
      `https://picsum.photos/100/100?random=${i + 100}`,
      `这是${user.nickname}的个人简介`,
      user.city
    );
    console.log(`已创建用户: ${user.nickname}`);
  }

  const insertVideo = db.prepare(`
    INSERT INTO videos (user_id, title, description, video_url, cover_url, duration, city, view_count, like_count, comment_count, share_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const videos = [
    { userId: 1, title: '精彩的一天', description: '今天阳光明媚，分享一下我的日常生活', city: '北京' },
    { userId: 1, title: '美食制作教程', description: '今天教大家做一道简单的家常菜', city: '北京' },
    { userId: 2, title: '上海美食探店', description: '发现一家超好吃的本帮菜餐厅', city: '上海' },
    { userId: 2, title: '甜点制作分享', description: '自己在家做的提拉米苏，味道太棒了', city: '上海' },
    { userId: 3, title: '广州一日游', description: '带你逛遍广州的经典景点', city: '广州' },
    { userId: 3, title: '早茶美食', description: '广州早茶的必点菜品推荐', city: '广州' }
  ];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    insertVideo.run(
      video.userId,
      video.title,
      video.description,
      'https://www.w3schools.com/html/mov_bbb.mp4',
      `https://picsum.photos/300/400?random=${i + 200}`,
      30,
      video.city,
      Math.floor(Math.random() * 1000) + 100,
      Math.floor(Math.random() * 500) + 10,
      Math.floor(Math.random() * 50) + 1,
      Math.floor(Math.random() * 100) + 5
    );
    console.log(`已创建视频: ${video.title}`);
  }

  const insertComment = db.prepare(`
    INSERT INTO comments (user_id, video_id, content, like_count, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const comments = [
    { videoId: 1, content: '太棒了，支持一下！' },
    { videoId: 1, content: '期待更多精彩内容' },
    { videoId: 2, content: '学到了，谢谢分享' },
    { videoId: 3, content: '看起来好好吃啊' }
  ];

  for (let i = 0; i < comments.length; i++) {
    insertComment.run(
      (i % 3) + 1,
      comments[i].videoId,
      comments[i].content,
      Math.floor(Math.random() * 20)
    );
    console.log(`已创建评论: ${comments[i].content.substring(0, 20)}...`);
  }

  console.log('数据库初始化完成！');
} catch (error) {
  console.error('初始化失败:', error);
} finally {
  db.close();
}
