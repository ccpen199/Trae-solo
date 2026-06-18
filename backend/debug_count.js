const Database = require('better-sqlite3');
const db = new Database('data/app.sqlite');

console.log('=== training_progress 数据 ===');
const tp = db.prepare('SELECT id, worker_id, course_id, progress, completed FROM training_progress').all();
console.table(tp);

console.log('\n=== 课程 + completed_count ===');
const sql = `
SELECT tc.id, tc.title, tc.category,
  (SELECT COUNT(*) FROM training_progress tp WHERE tp.course_id = tc.id AND tp.completed = 1) as completed_count
FROM training_courses tc
ORDER BY tc.created_at DESC
`;
const courses = db.prepare(sql).all();
console.table(courses);
