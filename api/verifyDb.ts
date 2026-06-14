import { getDatabase } from './config/database.js'

const db = getDatabase()

const uniCount = db.prepare('SELECT COUNT(*) as count FROM universities').get() as any
const majorCount = db.prepare('SELECT COUNT(*) as count FROM majors').get() as any
const scoreCount = db.prepare('SELECT COUNT(*) as count FROM admission_scores').get() as any
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
const qaCount = db.prepare('SELECT COUNT(*) as count FROM qa_questions').get() as any
const answerCount = db.prepare('SELECT COUNT(*) as count FROM qa_answers').get() as any
const liveCount = db.prepare('SELECT COUNT(*) as count FROM live_sessions').get() as any
const spaceCount = db.prepare('SELECT COUNT(*) as count FROM collaboration_spaces').get() as any
const planCount = db.prepare('SELECT COUNT(*) as count FROM volunteer_plans').get() as any
const itemCount = db.prepare('SELECT COUNT(*) as count FROM plan_items').get() as any
const heatmapCount = db.prepare('SELECT COUNT(*) as count FROM province_heatmap').get() as any

console.log('=== 数据库验证 ===')
console.log('大学数量:', uniCount.count)
console.log('专业数量:', majorCount.count)
console.log('投档分数记录:', scoreCount.count)
console.log('用户数量:', userCount.count)
console.log('问答问题:', qaCount.count)
console.log('问答回答:', answerCount.count)
console.log('直播场次:', liveCount.count)
console.log('协作空间:', spaceCount.count)
console.log('志愿方案:', planCount.count)
console.log('志愿项:', itemCount.count)
console.log('热力图数据:', heatmapCount.count)

console.log('\n=== 大学示例 ===')
const unis = db.prepare('SELECT id, name, level, type, province FROM universities LIMIT 5').all()
unis.forEach((u: any) => console.log(`${u.id}. ${u.name} (${u.level}, ${u.type}, ${u.province})`))

console.log('\n=== 专业示例 ===')
const majors = db.prepare('SELECT id, name, category, avg_salary FROM majors LIMIT 5').all()
majors.forEach((m: any) => console.log(`${m.id}. ${m.name} (${m.category}, 平均薪资: ${m.avg_salary})`))

console.log('\n=== 用户示例 ===')
const users = db.prepare('SELECT id, name, role, phone FROM users').all()
users.forEach((u: any) => console.log(`${u.id}. ${u.name} (${u.role}, ${u.phone})`))

console.log('\n=== 投档分数示例 (北京大学计算机专业) ===')
const scores = db.prepare(`
  SELECT s.year, s.province, s.min_score, s.max_score, s.avg_score, s.min_rank
  FROM admission_scores s
  JOIN universities u ON s.university_id = u.id
  JOIN majors m ON s.major_id = m.id
  WHERE u.name = '北京大学' AND m.name = '计算机科学与技术'
  ORDER BY s.year, s.province
  LIMIT 5
`).all()
scores.forEach((s: any) => console.log(`${s.year}年 ${s.province}: ${s.min_score}-${s.max_score}分 (平均${s.avg_score}, 位次${s.min_rank})`))

console.log('\n=== 数据库验证完成 ===')
