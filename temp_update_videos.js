const { db } = require('./backend/src/models/database');

const videoTypes = ['environment', 'work_live', 'team_interview', 'intro'];
const videos = db.prepare('SELECT id FROM videos WHERE type = ?').all('job');

videos.forEach((v, i) => {
  const type = videoTypes[i % videoTypes.length];
  db.prepare('UPDATE videos SET video_type = ? WHERE id = ?').run(type, v.id);
});

const result = db.prepare('SELECT video_type, COUNT(*) as count FROM videos GROUP BY video_type').all();
console.log('视频类型分布:', result);
