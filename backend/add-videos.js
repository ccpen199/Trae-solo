const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.sqlite');
const db = new Database(dbPath);

const insertVideo = db.prepare(`
  INSERT INTO videos (user_id, title, description, video_url, cover_url, duration, city, view_count, like_count, comment_count, share_count, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const cities = ['深圳', '杭州', '成都'];
const videoTitles = [
  '深圳夜景', '美食街美食', '东门老街',
  '西湖美景', '杭州小吃', '灵隐寺',
  '成都火锅', '宽窄巷子', '锦里古街'
];

let index = 0;
for (const city of cities) {
  for (let i = 0; i < 3; i++) {
    insertVideo.run(
      (index % 3) + 1,
      videoTitles[index],
      '精彩的视频内容',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      `https://picsum.photos/300/400?random=${index + 210}`,
      30,
      city,
      Math.floor(Math.random() * 1000) + 100,
      Math.floor(Math.random() * 500) + 10,
      Math.floor(Math.random() * 50) + 1,
      Math.floor(Math.random() * 100) + 5
    );
    index++;
  }
}

console.log('已添加深圳、杭州、成都的视频数据');
db.close();
