import { runQueryOne, runInsert, runTransaction } from '../utils/db'
import { TRADES } from './trades'

export function initSeedData(): void {
  const workerCount = runQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM workers')
  const jobCount = runQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM job_requirements')
  if ((workerCount?.count || 0) > 0 && (jobCount?.count || 0) > 0) {
    console.log('Demo workers and jobs already exist, skipping seed')
    return
  }

  const tradeCount = runQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM trades')
  if (!tradeCount || tradeCount.count === 0) {
    runTransaction(() => {
      TRADES.forEach(trade => {
        runInsert(
          'INSERT INTO trades (name, category, description, skill_level) VALUES (?, ?, ?, ?)',
          [trade.name, trade.category, trade.description, trade.skillLevel]
        )
      })
    })

    console.log(`Successfully seeded ${TRADES.length} trades`)
  } else {
    console.log(`Trades data already exists (${tradeCount.count}), continuing remaining seed`)
  }

  const sampleEmployers = [
    { companyName: '中建集团第一工程有限公司', legalPerson: '张三', businessLicense: '911100001234567890', qualificationLevel: '特级', contactName: '李经理', contactPhone: '13800138001', address: '北京市朝阳区建国路100号', creditRating: 95, verified: 1 },
    { companyName: '上海建工集团', legalPerson: '王五', businessLicense: '913100002345678901', qualificationLevel: '一级', contactName: '赵经理', contactPhone: '13800138002', address: '上海市浦东新区陆家嘴金融中心', creditRating: 92, verified: 1 },
    { companyName: '广州建筑集团', legalPerson: '钱六', businessLicense: '914400003456789012', qualificationLevel: '一级', contactName: '孙经理', contactPhone: '13800138003', address: '广州市天河区珠江新城', creditRating: 88, verified: 1 },
  ]

  sampleEmployers.forEach(emp => {
    runInsert(
      'INSERT INTO employers (company_name, legal_person, business_license, qualification_level, contact_name, contact_phone, address, credit_rating, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [emp.companyName, emp.legalPerson, emp.businessLicense, emp.qualificationLevel, emp.contactName, emp.contactPhone, emp.address, emp.creditRating, emp.verified]
    )
  })

  const sampleWorkers = [
    { idCard: '110101199001010001', name: '王建国', gender: '男', age: 35, phone: '13900139001', address: '北京市海淀区中关村大街1号', latitude: 39.9842, longitude: 116.3074, tradeIds: JSON.stringify([1, 2]), performanceScore: 4.5, healthStatus: 'green', healthCodeSource: 'alipay', healthCodeUpdatedAt: '2026-06-05 08:30:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'three_doses' },
    { idCard: '110101199202020002', name: '李明华', gender: '男', age: 32, phone: '13900139002', address: '北京市西城区西单大街2号', latitude: 39.9138, longitude: 116.3690, tradeIds: JSON.stringify([1, 3]), performanceScore: 4.2, healthStatus: 'green', healthCodeSource: 'national', healthCodeUpdatedAt: '2026-06-04 14:20:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'two_doses' },
    { idCard: '110101198803030003', name: '张铁柱', gender: '男', age: 36, phone: '13900139003', address: '北京市东城区王府井大街3号', latitude: 39.9139, longitude: 116.4074, tradeIds: JSON.stringify([4, 5]), performanceScore: 4.8, healthStatus: 'green', healthCodeSource: 'alipay', healthCodeUpdatedAt: '2026-06-05 09:15:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'three_doses' },
    { idCard: '310101199004040004', name: '陈志强', gender: '男', age: 34, phone: '13900139004', address: '上海市黄浦区南京东路4号', latitude: 31.2304, longitude: 121.4737, tradeIds: JSON.stringify([19, 20]), performanceScore: 4.6, healthStatus: 'yellow', healthCodeSource: 'yueshengshi', healthCodeUpdatedAt: '2026-06-03 16:45:00', nucleicAcidStatus: 'untested', vaccinationStatus: 'two_doses' },
    { idCard: '310101199105050005', name: '刘建设', gender: '男', age: 33, phone: '13900139005', address: '上海市徐汇区衡山路5号', latitude: 31.1980, longitude: 121.4370, tradeIds: JSON.stringify([1, 6]), performanceScore: 3.9, healthStatus: 'green', healthCodeSource: 'alipay', healthCodeUpdatedAt: '2026-06-05 07:50:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'one_dose' },
    { idCard: '440101198906060006', name: '赵工头', gender: '男', age: 35, phone: '13900139006', address: '广州市越秀区北京路6号', latitude: 23.1291, longitude: 113.2644, tradeIds: JSON.stringify([10, 11]), performanceScore: 4.3, healthStatus: 'green', healthCodeSource: 'yueshengshi', healthCodeUpdatedAt: '2026-06-05 10:30:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'three_doses' },
    { idCard: '440101198707070007', name: '孙大锤', gender: '男', age: 37, phone: '13900139007', address: '广州市天河区天河路7号', latitude: 23.1360, longitude: 113.3510, tradeIds: JSON.stringify([7, 8]), performanceScore: 4.0, healthStatus: 'green', healthCodeSource: 'national', healthCodeUpdatedAt: '2026-06-04 11:20:00', nucleicAcidStatus: 'negative', vaccinationStatus: 'two_doses' },
    { idCard: '110101199308080008', name: '周安全', gender: '男', age: 31, phone: '13900139008', address: '北京市朝阳区三里屯8号', latitude: 39.9375, longitude: 116.4516, tradeIds: JSON.stringify([28, 4]), performanceScore: 4.7, healthStatus: 'green', healthCodeSource: 'alipay', healthCodeUpdatedAt: '2026-06-05 08:00:00', nucleicAcidStatus: 'untested', vaccinationStatus: 'three_doses' },
  ]

  sampleWorkers.forEach(w => {
    runInsert(
      'INSERT INTO workers (id_card, name, gender, age, phone, address, latitude, longitude, trade_ids, performance_score, health_status, health_code_source, health_code_updated_at, nucleic_acid_status, vaccination_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [w.idCard, w.name, w.gender, w.age, w.phone, w.address, w.latitude, w.longitude, w.tradeIds, w.performanceScore, w.healthStatus, w.healthCodeSource, w.healthCodeUpdatedAt, w.nucleicAcidStatus, w.vaccinationStatus]
    )
  })

  for (let i = 1; i <= 8; i++) {
    const certTypes = ['高级技工证', '特种作业操作证', '安全培训合格证', '职业资格证书']
    for (let j = 0; j < 2; j++) {
      runInsert(
        'INSERT INTO skill_certificates (worker_id, certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, ocr_result, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [i, certTypes[j % certTypes.length], `CERT${i}${j}${Date.now()}`, '住房和城乡建设部', '2023-06-01', '2028-06-01', JSON.stringify({ name: certTypes[j % certTypes.length], number: `CERT${i}${j}` }), 1]
      )
    }

    const projects = ['中关村科技园项目', 'CBD商务中心项目', '城市地铁3号线项目', '新区安置房项目']
    for (let j = 0; j < 2; j++) {
      const rating = Math.floor(Math.random() * 2) + 4
      runInsert(
        'INSERT INTO performance_reviews (worker_id, project_id, project_name, rating, comment, reviewer, review_date, work_quality, attendance, discipline, safety, teamwork) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [i, j + 1, projects[j % projects.length], rating, '工作表现良好，技术过硬', '项目经理', j === 0 ? '2026-04-15' : '2026-05-10', rating, rating, rating, rating, rating]
      )
    }

    const trainings = ['安全生产培训', '消防安全培训', '高空作业培训', '应急救援培训']
    for (let j = 0; j < 2; j++) {
      runInsert(
        'INSERT INTO safety_trainings (worker_id, training_name, training_date, training_hours, exam_score, passed, certificate_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [i, trainings[j % trainings.length], j === 0 ? '2026-04-10' : '2026-05-05', 8, 85 + Math.random() * 15, 1, `TRAIN${i}${j}`]
      )
    }
  }

  const sampleJobs = [
    { employerId: 1, projectName: '北京CBD核心区商业综合体项目', projectAddress: '北京市朝阳区建国路88号', latitude: 39.9147, longitude: 116.4607, tradeId: 1, tradeName: '钢筋工', quantity: 15, startDate: '2026-07-01', endDate: '2026-12-31', dailyWage: 380, workHours: '8:00-18:00', qualificationRequired: '高级技工证', description: '需熟练掌握钢筋绑扎、下料工艺，有大型商业项目经验优先', status: 'published' },
    { employerId: 1, projectName: '北京CBD核心区商业综合体项目', projectAddress: '北京市朝阳区建国路88号', latitude: 39.9147, longitude: 116.4607, tradeId: 2, tradeName: '模板工', quantity: 10, startDate: '2026-07-01', endDate: '2026-12-31', dailyWage: 360, workHours: '8:00-18:00', qualificationRequired: '高级技工证', description: '需熟练掌握木模、铝模安装工艺', status: 'published' },
    { employerId: 2, projectName: '上海张江科技园标准厂房项目', projectAddress: '上海市浦东新区张江高科技园区', latitude: 31.2001, longitude: 121.5892, tradeId: 19, tradeName: '装配式工', quantity: 20, startDate: '2026-07-15', endDate: '2027-03-31', dailyWage: 420, workHours: '7:30-17:30', qualificationRequired: '特种作业操作证', description: '需有装配式建筑施工经验，熟悉预制构件吊装、灌浆工艺', status: 'pending_review' },
    { employerId: 2, projectName: '上海张江科技园标准厂房项目', projectAddress: '上海市浦东新区张江高科技园区', latitude: 31.2001, longitude: 121.5892, tradeId: 1, tradeName: '钢筋工', quantity: 8, startDate: '2024-07-10', endDate: '2025-03-31', dailyWage: 390, workHours: '7:30-17:30', qualificationRequired: '高级技工证', description: '需有5年以上钢筋工经验，能看懂复杂图纸', status: 'published' },
    { employerId: 3, projectName: '广州天河智慧城办公楼项目', projectAddress: '广州市天河区高唐路', latitude: 23.1671, longitude: 113.3830, tradeId: 10, tradeName: '电工', quantity: 6, startDate: '2026-08-01', endDate: '2027-06-30', dailyWage: 400, workHours: '8:00-18:00', qualificationRequired: '特种作业操作证', description: '需有电工证，熟悉强弱电系统安装', status: 'published' },
    { employerId: 3, projectName: '广州天河智慧城办公楼项目', projectAddress: '广州市天河区高唐路', latitude: 23.1671, longitude: 113.3830, tradeId: 11, tradeName: '焊工', quantity: 4, startDate: '2026-08-01', endDate: '2027-06-30', dailyWage: 420, workHours: '8:00-18:00', qualificationRequired: '特种作业操作证', description: '需有焊工证，能进行氩弧焊、二保焊作业', status: 'ai_reviewed' },
    { employerId: 1, projectName: '北京通州副中心住宅项目', projectAddress: '北京市通州区潞城镇', latitude: 39.9087, longitude: 116.7129, tradeId: 4, tradeName: '架子工', quantity: 12, startDate: '2026-07-20', endDate: '2027-05-31', dailyWage: 450, workHours: '6:00-16:00', qualificationRequired: '特种作业操作证', description: '需有高空作业证，有5年以上架子工经验', status: 'manual_reviewed' },
    { employerId: 2, projectName: '上海临港新片区安置房项目', projectAddress: '上海市浦东新区临港新城', latitude: 30.9000, longitude: 121.9000, tradeId: 6, tradeName: '抹灰工', quantity: 25, startDate: '2026-08-15', endDate: '2027-04-30', dailyWage: 340, workHours: '7:00-17:00', qualificationRequired: '', description: '需熟练掌握内墙、外墙抹灰工艺，有住宅项目经验优先', status: 'published' },
  ]

  sampleJobs.forEach(j => {
    runInsert(
      'INSERT INTO job_requirements (employer_id, project_name, project_address, latitude, longitude, trade_id, trade_name, quantity, start_date, end_date, daily_wage, work_hours, qualification_required, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [j.employerId, j.projectName, j.projectAddress, j.latitude, j.longitude, j.tradeId, j.tradeName, j.quantity, j.startDate, j.endDate, j.dailyWage, j.workHours, j.qualificationRequired, j.description, j.status]
    )
  })

  const contractTemplates = [
    { name: '标准劳动合同模板', templateType: 'labor', content: '甲方（雇主）：{employerName}\n乙方（工人）：{workerName}\n\n根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方本着平等自愿、协商一致的原则，签订本合同。\n\n一、工作内容：{jobDescription}\n二、工作地点：{projectAddress}\n三、合同期限：从{startDate}至{endDate}\n四、劳动报酬：每日工资{dailyWage}元，按月结算\n五、工作时间：{workHours}\n六、双方权利与义务...\n\n甲方签字：__________  日期：__________\n乙方签字：__________  日期：__________', version: '1.0', isActive: 1 },
    { name: '短期劳务合同模板', templateType: 'short_term', content: '甲方（雇主）：{employerName}\n乙方（工人）：{workerName}\n\n根据《中华人民共和国民法典》及相关法律法规，就短期劳务事宜达成协议。\n\n一、劳务内容：{jobDescription}\n二、劳务地点：{projectAddress}\n三、劳务期限：从{startDate}至{endDate}\n四、劳务报酬：每日{dailyWage}元，按日结算\n五、双方责任...\n\n甲方签字：__________  日期：__________\n乙方签字：__________  日期：__________', version: '1.0', isActive: 1 },
  ]

  contractTemplates.forEach(t => {
    runInsert(
      'INSERT INTO contract_templates (name, template_type, content, version, is_active) VALUES (?, ?, ?, ?, ?)',
      [t.name, t.templateType, t.content, t.version, t.isActive]
    )
  })

  const sampleMatches = [
    { jobId: 1, workerId: 1, matchScore: 92.5, skillMatchScore: 95, locationMatchScore: 88, performanceMatchScore: 94, status: 'accepted' },
    { jobId: 1, workerId: 2, matchScore: 88.3, skillMatchScore: 90, locationMatchScore: 85, performanceMatchScore: 90, status: 'pending' },
    { jobId: 1, workerId: 5, matchScore: 85.0, skillMatchScore: 88, locationMatchScore: 80, performanceMatchScore: 87, status: 'rejected' },
    { jobId: 2, workerId: 1, matchScore: 90.0, skillMatchScore: 92, locationMatchScore: 88, performanceMatchScore: 90, status: 'hired' },
    { jobId: 4, workerId: 2, matchScore: 87.5, skillMatchScore: 90, locationMatchScore: 82, performanceMatchScore: 90, status: 'accepted' },
    { jobId: 5, workerId: 6, matchScore: 93.0, skillMatchScore: 95, locationMatchScore: 92, performanceMatchScore: 92, status: 'pending' },
  ]

  sampleMatches.forEach(m => {
    runInsert(
      'INSERT INTO job_matches (job_id, worker_id, match_score, skill_match_score, location_match_score, performance_match_score, status, worker_notified, employer_notified) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)',
      [m.jobId, m.workerId, m.matchScore, m.skillMatchScore, m.locationMatchScore, m.performanceMatchScore, m.status]
    )
  })

  const sampleReviewRecords = [
    { jobId: 1, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过：信息完整、资质符合要求', reviewDate: '2026-05-21', details: JSON.stringify({ checkItems: ['资质验证', '信息完整性', '风险评估'], score: 92 }) },
    { jobId: 1, reviewLevel: 'manual', reviewer: '住建部门-李审核员', result: 'pass', comment: '人工复核通过：项目真实有效，用工需求合理', reviewDate: '2026-05-22', details: JSON.stringify({ checkItems: ['企业资质', '项目审批文件', '工资保证金'], score: 95 }) },
    { jobId: 1, reviewLevel: 'site', reviewer: '工地管理员-王工长', result: 'pass', comment: '工地实名核验通过：工人信息与身份证一致', reviewDate: '2026-05-23', details: JSON.stringify({ checkItems: ['身份证核验', '人脸比对', '健康码检查'], verifiedCount: 10 }) },
    { jobId: 2, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-05-23', details: JSON.stringify({ score: 88 }) },
    { jobId: 2, reviewLevel: 'manual', reviewer: '住建部门-张审核员', result: 'pass', comment: '人工复核通过', reviewDate: '2026-05-24', details: JSON.stringify({ score: 90 }) },
    { jobId: 2, reviewLevel: 'site', reviewer: '工地管理员-刘工长', result: 'pass', comment: '工地实名核验通过', reviewDate: '2026-05-25', details: JSON.stringify({ verifiedCount: 8 }) },
    { jobId: 4, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-05-26', details: JSON.stringify({ score: 90 }) },
    { jobId: 4, reviewLevel: 'manual', reviewer: '住建部门-王审核员', result: 'pass', comment: '人工复核通过', reviewDate: '2026-05-27', details: JSON.stringify({ score: 88 }) },
    { jobId: 4, reviewLevel: 'site', reviewer: '工地管理员-陈工长', result: 'pass', comment: '工地实名核验通过', reviewDate: '2026-05-28', details: JSON.stringify({ verifiedCount: 6 }) },
    { jobId: 5, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-05-29', details: JSON.stringify({ score: 86 }) },
    { jobId: 5, reviewLevel: 'manual', reviewer: '住建部门-李审核员', result: 'pass', comment: '人工复核通过', reviewDate: '2026-05-30', details: JSON.stringify({ score: 91 }) },
    { jobId: 5, reviewLevel: 'site', reviewer: '工地管理员-林工长', result: 'pass', comment: '工地实名核验通过', reviewDate: '2026-05-31', details: JSON.stringify({ verifiedCount: 5 }) },
    { jobId: 6, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-06-03', details: JSON.stringify({ score: 85 }) },
    { jobId: 7, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-05-31', details: JSON.stringify({ score: 91 }) },
    { jobId: 7, reviewLevel: 'manual', reviewer: '住建部门-王审核员', result: 'pass', comment: '人工复核通过', reviewDate: '2026-06-01', details: JSON.stringify({ score: 89 }) },
    { jobId: 8, reviewLevel: 'ai', reviewer: 'AI系统', result: 'pass', comment: 'AI自动审核通过', reviewDate: '2026-05-21', details: JSON.stringify({ score: 87 }) },
    { jobId: 8, reviewLevel: 'manual', reviewer: '住建部门-李审核员', result: 'pass', comment: '人工复核通过', reviewDate: '2026-05-22', details: JSON.stringify({ score: 93 }) },
    { jobId: 8, reviewLevel: 'site', reviewer: '工地管理员-赵工长', result: 'pass', comment: '工地实名核验通过', reviewDate: '2026-05-23', details: JSON.stringify({ verifiedCount: 20 }) },
  ]

  sampleReviewRecords.forEach(r => {
    runInsert(
      'INSERT INTO review_records (job_id, review_level, reviewer, result, comment, review_date, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [r.jobId, r.reviewLevel, r.reviewer, r.result, r.comment, r.reviewDate, r.details]
    )
  })

  const sampleContracts = [
    { jobId: 2, workerId: 1, employerId: 1, contractNumber: 'CT-2026-0001', startDate: '2026-07-01', endDate: '2026-12-31', dailyWage: 360, totalAmount: 64800, status: 'fully_signed', workerSignedAt: '2026-05-27', employerSignedAt: '2026-05-27', templateId: 1 },
    { jobId: 1, workerId: 1, employerId: 1, contractNumber: 'CT-2026-0002', startDate: '2026-07-01', endDate: '2026-12-31', dailyWage: 380, totalAmount: 68400, status: 'signed_by_worker', workerSignedAt: '2026-05-25', employerSignedAt: null, templateId: 1 },
    { jobId: 4, workerId: 2, employerId: 2, contractNumber: 'CT-2026-0003', startDate: '2026-07-10', endDate: '2027-03-31', dailyWage: 390, totalAmount: 84240, status: 'signed_by_employer', workerSignedAt: null, employerSignedAt: '2026-05-30', templateId: 2 },
    { jobId: 8, workerId: 3, employerId: 2, contractNumber: 'CT-2026-0004', startDate: '2026-08-15', endDate: '2027-04-30', dailyWage: 340, totalAmount: 73440, status: 'draft', workerSignedAt: null, employerSignedAt: null, templateId: 1 },
  ]

  sampleContracts.forEach(c => {
    runInsert(
      'INSERT INTO contracts (job_id, worker_id, employer_id, contract_number, start_date, end_date, daily_wage, total_amount, status, worker_signed_at, employer_signed_at, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.jobId, c.workerId, c.employerId, c.contractNumber, c.startDate, c.endDate, c.dailyWage, c.totalAmount, c.status, c.workerSignedAt, c.employerSignedAt, c.templateId]
    )
  })

  const samplePayments = [
    { contractId: 1, workerId: 1, employerId: 1, amount: 11400, paymentDate: '2026-06-01', paymentMethod: '银行转账', workDays: 30, status: 'paid', supervisoryRecorded: 1, remark: '2026年5月工资，已监管' },
    { contractId: 1, workerId: 1, employerId: 1, amount: 11780, paymentDate: '2026-06-03', paymentMethod: '银行转账', workDays: 31, status: 'paid', supervisoryRecorded: 1, remark: '2026年5月工资，已监管' },
    { contractId: 1, workerId: 1, employerId: 1, amount: 11400, paymentDate: '2026-06-05', paymentMethod: '银行转账', workDays: 30, status: 'pending', supervisoryRecorded: 0, remark: '2026年6月工资，待支付' },
    { contractId: 2, workerId: 1, employerId: 1, amount: 7600, paymentDate: '2026-06-02', paymentMethod: '银行转账', workDays: 20, status: 'overdue', supervisoryRecorded: 0, remark: '2026年5月上半月工资，逾期3天' },
    { contractId: 4, workerId: 3, employerId: 2, amount: 10200, paymentDate: '2026-06-04', paymentMethod: '现金', workDays: 30, status: 'disputed', supervisoryRecorded: 1, remark: '工人对工时有异议，正在调解' },
  ]

  samplePayments.forEach(p => {
    runInsert(
      'INSERT INTO wage_payments (contract_id, worker_id, employer_id, amount, payment_date, payment_method, work_days, status, supervisory_recorded, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.contractId, p.workerId, p.employerId, p.amount, p.paymentDate, p.paymentMethod, p.workDays, p.status, p.supervisoryRecorded, p.remark]
    )
  })

  console.log('Successfully seeded all sample data')
}
