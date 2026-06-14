import db from './db.js'

const now = new Date()

function dateDaysAgo(days: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const insertReview = db.prepare(`
  INSERT INTO content_reviews (content_type, content_id, reviewer_id, result, risk_type, details, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const insertComplaint = db.prepare(`
  INSERT INTO complaints (user_id, title, content, category, priority, status, assigned_department, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertComplaintProgress = db.prepare(`
  INSERT INTO complaint_progress (complaint_id, status, description, evidence_hash, operator_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const insertSurvey = db.prepare(`
  INSERT INTO satisfaction_surveys (complaint_id, user_id, rating, comment, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

const insertNews = db.prepare(`
  INSERT INTO news (title, content, summary, source, category, tags, status, author_id, view_count, published_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertCreditLog = db.prepare(`
  INSERT INTO credit_logs (user_id, delta, reason, operator_id, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

const updateCreatorCredit = db.prepare(`
  UPDATE creator_credits SET score = ?, level = ?, violation_count = ? WHERE user_id = ?
`)

const insertServiceApp = db.prepare(`
  INSERT INTO service_applications (user_id, service_id, form_data, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const checkReviews = db.prepare('SELECT COUNT(*) as count FROM content_reviews').get() as any
if (checkReviews.count === 0) {
  console.log('Inserting review data...')

  insertReview.run('news', 5, 2, 'pending', null, null, dateDaysAgo(1))
  insertReview.run('news', 4, 1, 'pass', null, '内容合规，排版规范', dateDaysAgo(2))
  insertReview.run('news', 3, 2, 'pass', null, '内容真实，数据准确', dateDaysAgo(3))
  insertReview.run('news', 2, 1, 'reject', 'politics', '表述不当，需修改敏感表述', dateDaysAgo(5))
  insertReview.run('news', 1, 2, 'pass', null, '审核通过，可发布', dateDaysAgo(7))
  insertReview.run('review', 1, 1, 'pass', null, '用户评价真实可信', dateDaysAgo(2))
  insertReview.run('review', 2, 2, 'pending', null, null, dateDaysAgo(1))
  insertReview.run('media', 1, 1, 'pass', null, '视频内容合规', dateDaysAgo(4))

  console.log('Content reviews inserted:', 8)
}

const checkComplaints = db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any
if (checkComplaints.count <= 3) {
  console.log('Inserting complaint data...')

  const complaints: any[] = [
    [3, '老旧小区改造进度缓慢', '荔湾区某老旧小区改造工程原计划6个月完成，现已过去9个月仍未完工，多次询问无果。', '住建', 'high', 'processing', '住房和城乡建设局', dateDaysAgo(10), dateDaysAgo(3)],
    [3, '公园广场舞噪音扰民', '天河区天河公园南门广场舞音乐过大，严重影响周边居民休息，多次沟通无效。', '环保', 'normal', 'dispatched', '生态环境局', dateDaysAgo(8), dateDaysAgo(5)],
    [3, '地铁口共享单车乱停放', '海珠区客村地铁站C出口共享单车乱停放问题严重，占用盲道和人行道。', '交通', 'normal', 'resolved', '交通运输局', dateDaysAgo(12), dateDaysAgo(2)],
    [3, '餐饮店铺油烟直排', '越秀区北京路某餐饮店油烟直排，影响楼上居民正常生活。', '环保', 'urgent', 'processing', '生态环境局', dateDaysAgo(15), dateDaysAgo(1)],
    [3, '小学学位分配不合理', '黄埔区某新建小区居民反映，小区对口小学距离过远，就近入学政策未落实。', '教育', 'high', 'dispatched', '教育局', dateDaysAgo(5), dateDaysAgo(4)],
    [3, '社保医保账户余额查询异常', '市民反映粤省事APP查询社保医保账户余额显示为0，线下查询正常。', '社保', 'normal', 'resolved', '社会保险基金管理中心', dateDaysAgo(20), dateDaysAgo(10)],
    [3, '红绿灯设置不合理', '番禺区某路口红绿灯时长设置不合理，早高峰严重拥堵。', '交通', 'normal', 'submitted', '公安局', dateDaysAgo(2), dateDaysAgo(2)],
    [3, '垃圾清运不及时', '白云区某街道生活垃圾清运不及时，垃圾桶满溢，蚊虫滋生。', '市政', 'high', 'overdue', '城市管理和综合执法局', dateDaysAgo(15), dateDaysAgo(15)],
    [3, '房产证办理拖延', '增城区某楼盘交付已2年，房产证仍未办理，开发商推诿责任。', '住建', 'urgent', 'overdue', '规划和自然资源局', dateDaysAgo(30), dateDaysAgo(20)],
  ]

  for (const c of complaints) {
    insertComplaint.run(...c)
  }

  const progresses: any[] = [
    [4, 'submitted', '市民提交诉求', 'hash_prog_1', null, dateDaysAgo(10)],
    [4, 'dispatched', '派单至住建局', 'hash_prog_2', 1, dateDaysAgo(9)],
    [4, 'processing', '现场核查中', 'hash_prog_3', 2, dateDaysAgo(5)],
    [5, 'submitted', '市民提交诉求', 'hash_prog_4', null, dateDaysAgo(8)],
    [5, 'dispatched', '派单至环保局', 'hash_prog_5', 1, dateDaysAgo(7)],
    [6, 'submitted', '市民提交诉求', 'hash_prog_6', null, dateDaysAgo(12)],
    [6, 'dispatched', '派单至交通局', 'hash_prog_7', 1, dateDaysAgo(11)],
    [6, 'resolved', '已清理完毕', 'hash_prog_8', 2, dateDaysAgo(2)],
    [7, 'submitted', '市民提交诉求', 'hash_prog_9', null, dateDaysAgo(15)],
    [7, 'dispatched', '派单至环保局', 'hash_prog_10', 1, dateDaysAgo(14)],
    [7, 'processing', '责令整改中', 'hash_prog_11', 2, dateDaysAgo(10)],
    [9, 'submitted', '市民提交诉求', 'hash_prog_12', null, dateDaysAgo(20)],
    [9, 'dispatched', '派单至社保局', 'hash_prog_13', 1, dateDaysAgo(19)],
    [9, 'resolved', '系统已修复', 'hash_prog_14', 2, dateDaysAgo(10)],
  ]

  for (const p of progresses) {
    insertComplaintProgress.run(...p)
  }

  const surveys: any[] = [
    [6, 3, 5, '处理速度快，效果好，非常满意', dateDaysAgo(1)],
    [9, 3, 4, '问题解决了，整体还不错', dateDaysAgo(8)],
  ]

  for (const s of surveys) {
    insertSurvey.run(...s)
  }

  console.log('Complaints inserted:', complaints.length)
}

const checkNews = db.prepare('SELECT COUNT(*) as count FROM news').get() as any
if (checkNews.count <= 5) {
  console.log('Inserting additional news data...')

  const newsList: any[] = [
    ['广州市2026年第一季度经济数据发布', '广州市统计局今日发布2026年第一季度经济运行数据，全市地区生产总值同比增长5.2%，主要经济指标稳步回升。', '一季度GDP同比增长5.2%', 'manual', '经济', '经济,GDP,统计', 'pending', 2, 0, null, dateDaysAgo(1)],
    ['广州人工智能产业园区正式开园', '广州人工智能产业园区在黄埔区正式开园，首批30家人工智能企业签约入驻，涵盖大模型、机器人、自动驾驶等领域。', '人工智能产业园开园，30家企业签约', 'manual', '科技', '人工智能,产业园,黄埔', 'pending', 2, 0, null, dateDaysAgo(2)],
    ['广交会开幕首日意向成交额超百亿', '第135届广交会在广州琶洲会展中心正式开幕，首日意向成交额达126亿元，创历史新高。', '广交会首日成交额126亿创新高', 'manual', '经贸', '广交会,外贸,成交额', 'published', 2, 5678, dateDaysAgo(5), dateDaysAgo(5)],
    ['广州新增500个共享停车位', '广州市交通部门联合多家企业推出500个共享停车位，覆盖天河、越秀、海珠等核心区域，缓解停车难问题。', '新增500个共享停车位缓解停车难', 'manual', '民生', '共享停车,交通,民生', 'rejected', 2, 0, null, dateDaysAgo(3)],
  ]

  for (const n of newsList) {
    insertNews.run(...n)
  }

  console.log('News inserted:', newsList.length)
}

const checkCreditLogs = db.prepare('SELECT COUNT(*) as count FROM credit_logs').get() as any
if (checkCreditLogs.count === 0) {
  console.log('Inserting credit log data...')

  insertCreditLog.run(2, -5, '新闻内容质量不达标', 1, dateDaysAgo(5))
  insertCreditLog.run(2, 10, '优质原创内容表彰', 1, dateDaysAgo(3))
  insertCreditLog.run(3, -10, '提交不实诉求', 1, dateDaysAgo(7))
  insertCreditLog.run(1, 20, '优秀管理员奖励', null, dateDaysAgo(10))

  updateCreatorCredit.run(95, 'normal', 1, 2)
  updateCreatorCredit.run(90, 'warning', 1, 3)
  updateCreatorCredit.run(120, 'excellent', 0, 1)

  console.log('Credit logs inserted')
}

const checkServiceApps = db.prepare('SELECT COUNT(*) as count FROM service_applications').get() as any
if (checkServiceApps.count === 0) {
  console.log('Inserting service application data...')

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

  db.prepare('INSERT INTO service_applications (user_id, service_id, form_data, progress_logs, receipt, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    3, 6, JSON.stringify({ ...formData, type: '户口迁移', from: '湖北武汉', to: '广州天河' }), progress1, receipt1, 'processing', dateDaysAgo(5), dateDaysAgo(3)
  )
  db.prepare('INSERT INTO service_applications (user_id, service_id, form_data, progress_logs, receipt, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    3, 2, JSON.stringify({ ...formData, type: '小学入学', childName: '张小宝', school: '华阳小学' }), progress2, receipt2, 'processing', dateDaysAgo(7), dateDaysAgo(3)
  )
  db.prepare('INSERT INTO service_applications (user_id, service_id, form_data, progress_logs, receipt, result, feedback, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    3, 3, JSON.stringify({ ...formData, type: '社保查询', period: '2025年度' }), progress3, receipt3, result3, feedback3, 'completed', dateDaysAgo(14), dateDaysAgo(10)
  )

  console.log('Service applications inserted: 3')
}

console.log('Enhanced seeding completed!')
