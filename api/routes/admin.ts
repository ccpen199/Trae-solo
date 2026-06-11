import { Router, type Request, type Response } from 'express'

const router = Router()

interface Department {
  id: string
  name: string
  parentId: string | null
  head: string
  memberCount: number
  children?: Department[]
}

const departments: Department[] = [
  { id: 'dept-001', name: '信息工程学院', parentId: null, head: '张教授', memberCount: 320 },
  { id: 'dept-002', name: '计算机科学与技术系', parentId: 'dept-001', head: '李教授', memberCount: 120 },
  { id: 'dept-003', name: '软件工程系', parentId: 'dept-001', head: '王教授', memberCount: 100 },
  { id: 'dept-004', name: '人工智能系', parentId: 'dept-001', head: '赵教授', memberCount: 100 },
  { id: 'dept-005', name: '经济管理学院', parentId: null, head: '刘教授', memberCount: 280 },
  { id: 'dept-006', name: '金融学系', parentId: 'dept-005', head: '陈教授', memberCount: 90 },
  { id: 'dept-007', name: '工商管理系', parentId: 'dept-005', head: '孙教授', memberCount: 100 },
  { id: 'dept-008', name: '会计学系', parentId: 'dept-005', head: '周教授', memberCount: 90 },
  { id: 'dept-009', name: '文学院', parentId: null, head: '吴教授', memberCount: 200 },
  { id: 'dept-010', name: '中文系', parentId: 'dept-009', head: '郑教授', memberCount: 120 },
  { id: 'dept-011', name: '新闻传播系', parentId: 'dept-009', head: '马教授', memberCount: 80 },
]

function buildDepartmentTree(list: Department[]): Department[] {
  const map = new Map<string, Department>()
  const roots: Department[] = []
  for (const dept of list) {
    map.set(dept.id, { ...dept, children: [] })
  }
  for (const dept of map.values()) {
    if (dept.parentId && map.has(dept.parentId)) {
      map.get(dept.parentId)!.children!.push(dept)
    } else {
      roots.push(dept)
    }
  }
  return roots
}

let deptCounter = 11

interface Geofence {
  id: string
  name: string
  type: '宿舍区' | '教学区' | '食堂区' | '运动区' | '商业区'
  coordinates: { lat: number; lng: number }[]
  radius: number
  rules: string[]
  enabled: boolean
}

const geofences: Geofence[] = [
  { id: 'geo-001', name: '梅园宿舍区', type: '宿舍区', coordinates: [{ lat: 30.516, lng: 114.405 }, { lat: 30.520, lng: 114.405 }, { lat: 30.520, lng: 114.410 }, { lat: 30.516, lng: 114.410 }], radius: 300, rules: ['22:30后限制外卖配送', '禁止机动车通行'], enabled: true },
  { id: 'geo-002', name: '竹园宿舍区', type: '宿舍区', coordinates: [{ lat: 30.522, lng: 114.412 }, { lat: 30.526, lng: 114.412 }, { lat: 30.526, lng: 114.417 }, { lat: 30.522, lng: 114.417 }], radius: 280, rules: ['22:00后限制外卖配送', '限速20km/h'], enabled: true },
  { id: 'geo-003', name: '教学楼区域', type: '教学区', coordinates: [{ lat: 30.518, lng: 114.408 }, { lat: 30.522, lng: 114.408 }, { lat: 30.522, lng: 114.414 }, { lat: 30.518, lng: 114.414 }], radius: 400, rules: ['上课期间禁止大声喧哗', '限速15km/h'], enabled: true },
  { id: 'geo-004', name: '第一食堂区域', type: '食堂区', coordinates: [{ lat: 30.519, lng: 114.406 }, { lat: 30.521, lng: 114.406 }, { lat: 30.521, lng: 114.409 }, { lat: 30.519, lng: 114.409 }], radius: 150, rules: ['用餐高峰期待取餐限制5分钟'], enabled: true },
]

let geoCounter = 4

interface VerificationResult {
  studentId: string
  name: string
  department: string
  status: 'verified' | 'rejected' | 'pending'
  reason?: string
}

interface SentimentAlert {
  id: string
  source: string
  content: string
  sentiment: 'negative' | 'very_negative' | 'neutral'
  score: number
  category: string
  status: 'active' | 'resolved' | 'ticketed'
  createdAt: string
}

const sentimentAlerts: SentimentAlert[] = [
  { id: 'sa-001', source: '校园论坛', content: '食堂饭菜质量严重下降，多次吃出异物', sentiment: 'very_negative', score: -0.85, category: '餐饮服务', status: 'active', createdAt: '2026-06-09T08:00:00Z' },
  { id: 'sa-002', source: '微博', content: '图书馆占座问题一直没人管，太失望了', sentiment: 'negative', score: -0.62, category: '公共设施', status: 'active', createdAt: '2026-06-09T09:30:00Z' },
  { id: 'sa-003', source: '校园论坛', content: '宿舍热水器又坏了，一周了还没修', sentiment: 'negative', score: -0.71, category: '后勤维修', status: 'active', createdAt: '2026-06-09T10:15:00Z' },
  { id: 'sa-004', source: '微信朋友圈', content: '选课系统崩溃了，根本选不上课', sentiment: 'very_negative', score: -0.78, category: '教务系统', status: 'ticketed', createdAt: '2026-06-08T14:00:00Z' },
  { id: 'sa-005', source: '校园论坛', content: '校园网络太慢了，视频会议一直卡', sentiment: 'negative', score: -0.55, category: '网络服务', status: 'active', createdAt: '2026-06-09T11:00:00Z' },
]

interface Ticket {
  id: string
  alertId: string
  title: string
  assignee: string
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'processing' | 'resolved' | 'closed'
  createdAt: string
}

const tickets: Ticket[] = [
  { id: 'tk-001', alertId: 'sa-004', title: '选课系统崩溃问题', assignee: '信息中心-王工', priority: 'high', status: 'processing', createdAt: '2026-06-08T15:00:00Z' },
]

let ticketCounter = 1

router.get('/departments', (_req: Request, res: Response) => {
  const tree = buildDepartmentTree(departments)
  res.json({ success: true, data: tree })
})

router.post('/departments', (req: Request, res: Response) => {
  const { name, parentId, head } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: '部门名称不能为空' })
    return
  }
  deptCounter++
  const dept: Department = {
    id: `dept-${String(deptCounter).padStart(3, '0')}`,
    name,
    parentId: parentId || null,
    head: head || '',
    memberCount: 0,
  }
  departments.push(dept)
  res.status(201).json({ success: true, data: dept })
})

router.get('/geofences', (_req: Request, res: Response) => {
  res.json({ success: true, data: geofences })
})

router.post('/geofences', (req: Request, res: Response) => {
  const { name, type, coordinates, radius, rules } = req.body
  if (!name || !type) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }
  geoCounter++
  const geofence: Geofence = {
    id: `geo-${String(geoCounter).padStart(3, '0')}`,
    name,
    type,
    coordinates: coordinates || [],
    radius: radius || 200,
    rules: rules || [],
    enabled: true,
  }
  geofences.push(geofence)
  res.status(201).json({ success: true, data: geofence })
})

router.post('/verify', (req: Request, res: Response) => {
  const { students } = req.body as { students: { studentId: string; name: string }[] }
  if (!students || !Array.isArray(students)) {
    res.status(400).json({ success: false, error: '缺少学生列表' })
    return
  }
  const deptNames = ['信息工程学院', '经济管理学院', '文学院', '外国语学院', '理学院']
  const statuses: VerificationResult['status'][] = ['verified', 'rejected', 'pending']
  const reasons = ['学籍信息匹配', '学号不存在', '信息待核实', '已毕业', '休学中']
  const results: VerificationResult[] = students.map((s, idx) => {
    const statusIdx = idx % 3
    const status = statuses[statusIdx]
    return {
      studentId: s.studentId,
      name: s.name,
      department: deptNames[idx % deptNames.length],
      status,
      reason: status === 'verified' ? reasons[0] : status === 'rejected' ? reasons[1 + (idx % 3)] : reasons[2],
    }
  })
  res.json({ success: true, data: results })
})

router.get('/analytics/consumption', (_req: Request, res: Response) => {
  const trends = [
    { month: '2026-01', total: 285600, avgPerStudent: 1428 },
    { month: '2026-02', total: 312400, avgPerStudent: 1562 },
    { month: '2026-03', total: 298700, avgPerStudent: 1494 },
    { month: '2026-04', total: 325100, avgPerStudent: 1626 },
    { month: '2026-05', total: 341800, avgPerStudent: 1709 },
    { month: '2026-06', total: 289300, avgPerStudent: 1447 },
  ]
  const distribution = [
    { category: '餐饮', percentage: 45.2, amount: 148560 },
    { category: '超市购物', percentage: 22.8, amount: 75020 },
    { category: '教材文具', percentage: 12.5, amount: 41130 },
    { category: '交通出行', percentage: 8.3, amount: 27310 },
    { category: '娱乐休闲', percentage: 6.7, amount: 22040 },
    { category: '其他', percentage: 4.5, amount: 14800 },
  ]
  res.json({ success: true, data: { trends, distribution } })
})

router.get('/analytics/heatmap', (_req: Request, res: Response) => {
  const timeSlots = ['6:30-7:00', '7:00-7:30', '7:30-8:00', '8:00-8:30', '8:30-9:00']
  const canteens = [
    { name: '第一食堂', data: [45, 180, 320, 150, 30] },
    { name: '第二食堂', data: [30, 140, 280, 120, 20] },
    { name: '第三食堂', data: [20, 100, 210, 90, 15] },
  ]
  const zones = [
    { lat: 30.519, lng: 114.407, intensity: 0.95, label: '第一食堂' },
    { lat: 30.521, lng: 114.411, intensity: 0.78, label: '第二食堂' },
    { lat: 30.517, lng: 114.413, intensity: 0.62, label: '第三食堂' },
    { lat: 30.523, lng: 114.409, intensity: 0.45, label: '教工食堂' },
    { lat: 30.515, lng: 114.410, intensity: 0.30, label: '清真食堂' },
  ]
  res.json({ success: true, data: { timeSlots, canteens, zones } })
})

router.get('/sentiment/alerts', (_req: Request, res: Response) => {
  res.json({ success: true, data: sentimentAlerts })
})

router.post('/sentiment/tickets', (req: Request, res: Response) => {
  const { alertId, title, assignee, priority } = req.body
  if (!alertId || !title) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }
  ticketCounter++
  const ticket: Ticket = {
    id: `tk-${String(ticketCounter).padStart(3, '0')}`,
    alertId,
    title,
    assignee: assignee || '',
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  tickets.push(ticket)
  const alert = sentimentAlerts.find((a) => a.id === alertId)
  if (alert) {
    alert.status = 'ticketed'
  }
  res.status(201).json({ success: true, data: ticket })
})

router.put('/sentiment/tickets/:id', (req: Request, res: Response) => {
  const ticket = tickets.find((t) => t.id === req.params.id)
  if (!ticket) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }
  const { status, assignee, priority } = req.body
  if (status) ticket.status = status
  if (assignee) ticket.assignee = assignee
  if (priority) ticket.priority = priority
  if (status === 'resolved' || status === 'closed') {
    const alert = sentimentAlerts.find((a) => a.id === ticket.alertId)
    if (alert) alert.status = 'resolved'
  }
  res.json({ success: true, data: ticket })
})

export default router
