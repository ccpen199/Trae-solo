const db = require('./src/db');

const questions = [
  {
    title: '一元二次方程求根公式练习',
    desc: '用求根公式解基础方程',
    content: '解方程 x² + 4x - 5 = 0',
    difficulty: 'easy',
    time: 5,
    options: ['x=1或x=-5', 'x=-1或x=5', 'x=1或x=5', 'x=-1或x=-5'],
    answer: 0,
    explanation: '求根公式得 x=1或x=-5'
  },
  {
    title: '一元二次方程韦达定理',
    desc: '应用韦达定理求根的关系',
    content: '方程 x² - 6x + 8 = 0 的两根之和是？',
    difficulty: 'medium',
    time: 5,
    options: ['6', '-6', '8', '-8'],
    answer: 0,
    explanation: '韦达定理：两根之和 = -b/a = 6'
  }
];

const insert = db.prepare(`
  INSERT INTO resources (type, title, description, content, difficulty, estimated_time, options, correct_answer, explanation, in_recommendation_pool)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);
const link = db.prepare('INSERT INTO resource_knowledge (resource_id, knowledge_point_id) VALUES (?, 1)');

questions.forEach(q => {
  const res = insert.run('question', q.title, q.desc, q.content, q.difficulty, q.time, JSON.stringify(q.options), q.answer, q.explanation);
  link.run(res.lastInsertRowid);
  console.log('Added:', q.title, 'ID:', res.lastInsertRowid);
});

console.log('Total resources:', db.prepare('SELECT COUNT(*) as c FROM resources').get().c);
db.close();
