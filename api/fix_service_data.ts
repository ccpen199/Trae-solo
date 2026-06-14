import db from './db.js'

function dateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

console.log('Adding columns...')

try { db.exec('ALTER TABLE service_applications ADD COLUMN materials TEXT') } catch(e) {}
try { db.exec('ALTER TABLE service_applications ADD COLUMN progress_logs TEXT') } catch(e) {}
try { db.exec('ALTER TABLE service_applications ADD COLUMN receipt TEXT') } catch(e) {}
try { db.exec('ALTER TABLE service_applications ADD COLUMN feedback TEXT') } catch(e) {}

console.log('Fixing service application data...')

const formData = { name: '张三', idCard: '440104199001011234', phone: '13800138000' }

const progress1 = JSON.stringify([
  { status: 'submitted', description: '申请已提交，等待受理', operator: '系统', time: dateDaysAgo(5) },
  { status: 'accepted', description: '材料已核验，进入审批流程', operator: '公安局户籍科', time: dateDaysAgo(4) },
  { status: 'processing', description: '正在办理户口迁移手续', operator: '公安局户籍科', time: dateDaysAgo(3) },
])
const receipt1 = JSON.stringify({
  receipt_no: 'REC-GA-2026-0528-001',
  content: '户口迁移申请已受理，预计5个工作日内完成',
  handler: '李警官',
  department: '广州市公安局户籍管理科',
  issued_at: dateDaysAgo(4)
})

const progress2 = JSON.stringify([
  { status: 'submitted', description: '申请已提交，等待受理', operator: '系统', time: dateDaysAgo(7) },
  { status: 'accepted', description: '入学材料已核验', operator: '教育局基教科', time: dateDaysAgo(5) },
  { status: 'processing', description: '学位分配中', operator: '教育局基教科', time: dateDaysAgo(3) },
])
const receipt2 = JSON.stringify({
  receipt_no: 'REC-JY-2026-0526-002',
  content: '小学入学申请已受理，将按学区分配',
  handler: '王老师',
  department: '广州市教育局基础教育科',
  issued_at: dateDaysAgo(5)
})

const progress3 = JSON.stringify([
  { status: 'submitted', description: '申请已提交，等待受理', operator: '系统', time: dateDaysAgo(14) },
  { status: 'accepted', description: '查询申请已受理', operator: '社保中心', time: dateDaysAgo(12) },
  { status: 'completed', description: '社保缴费明细已出具，可下载', operator: '社保中心', time: dateDaysAgo(10) },
])
const receipt3 = JSON.stringify({
  receipt_no: 'REC-SB-2026-0519-003',
  content: '社保查询申请已受理',
  handler: '陈专员',
  department: '广州市社会保险基金管理中心',
  issued_at: dateDaysAgo(12)
})
const result3 = '2025年度社保缴费明细：养老保险缴费12个月，医疗保险缴费12个月'
const feedback3 = JSON.stringify({
  content: '服务很满意，办理速度快，查询结果清晰详细',
  created_at: dateDaysAgo(9)
})

db.prepare('UPDATE service_applications SET progress_logs = ?, receipt = ?, status = ?, updated_at = ? WHERE id = 1').run(progress1, receipt1, 'processing', dateDaysAgo(3))
db.prepare('UPDATE service_applications SET progress_logs = ?, receipt = ?, status = ?, updated_at = ? WHERE id = 2').run(progress2, receipt2, 'processing', dateDaysAgo(3))
db.prepare('UPDATE service_applications SET progress_logs = ?, receipt = ?, result = ?, feedback = ?, status = ?, updated_at = ? WHERE id = 3').run(progress3, receipt3, result3, feedback3, 'completed', dateDaysAgo(10))

console.log('Service applications fixed!')
