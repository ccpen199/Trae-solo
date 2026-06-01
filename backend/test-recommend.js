const db = require('./src/db');
const studentId = 1;

const mastery = db.prepare(`
  SELECT kp.id, kp.name, sm.level, sm.practice_count
  FROM knowledge_points kp
  LEFT JOIN student_mastery sm ON kp.id = sm.knowledge_point_id AND sm.student_id = ?
`).all(studentId);

console.log('知识点掌握情况:');
mastery.forEach(m => console.log(' ', m.name, ':', Math.round((m.level || 0) * 100) + '%'));

const completedIds = db.prepare(`
  SELECT DISTINCT resource_id FROM feedback 
  WHERE student_id = ? AND action = 'complete' AND created_at >= datetime('now', '-1 hour')
`).all(studentId).map(f => f.resource_id);
console.log('\n1小时内完成的题目ID:', completedIds);

const resources = db.prepare(`
  SELECT r.*, GROUP_CONCAT(kp.name) as kp_names
  FROM resources r
  JOIN resource_knowledge rk ON r.id = rk.resource_id
  JOIN knowledge_points kp ON rk.knowledge_point_id = kp.id
  WHERE r.in_recommendation_pool = 1
  GROUP BY r.id
`).all().filter(r => !completedIds.includes(r.id));

console.log('\n可用题目数量:', resources.length);

console.log('\n--- 各题目的策略判定 ---');
resources.forEach(r => {
  const kpList = r.kp_names.split(',');
  const resourceMastery = mastery.filter(m => kpList.includes(m.name));
  const avgLevel = resourceMastery.length > 0
    ? resourceMastery.reduce((sum, m) => sum + (m.level || 0), 0) / resourceMastery.length
    : 0;
  
  let strategy = 'preview';
  if (avgLevel < 0.4 && resourceMastery.length > 0) strategy = 'weak';
  else if (avgLevel >= 0.4 && avgLevel < 0.7) strategy = 'reinforce';
  
  console.log(`${r.title} | avgLevel: ${avgLevel.toFixed(2)} | ${strategy}`);
});

db.close();
