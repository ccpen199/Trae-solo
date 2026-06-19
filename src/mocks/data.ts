import type {
  SocialInsuranceAccount,
  MonthlyRecord,
  TransferProgress,
  MedicalRecord,
  DesignatedHospital,
  ExamInfo,
  EmployeeDeclaration,
  UnemploymentApplication,
  EContract,
  PolicyDocument,
  TimeoutWarning,
  IdentityAudit,
  Notification,
  DashboardMetric,
} from '@/types'

export const insuranceAccounts: SocialInsuranceAccount[] = [
  { insuranceType: 'pension', personalMonthly: 656, companyMonthly: 1640, totalMonths: 187, accountBalance: 128560.80, status: 'active' },
  { insuranceType: 'medical', personalMonthly: 328, companyMonthly: 1148, totalMonths: 187, accountBalance: 45230.50, status: 'active' },
  { insuranceType: 'unemployment', personalMonthly: 82, companyMonthly: 246, totalMonths: 187, accountBalance: 8540.20, status: 'active' },
  { insuranceType: 'injury', personalMonthly: 0, companyMonthly: 164, totalMonths: 187, accountBalance: 0, status: 'active' },
  { insuranceType: 'maternity', personalMonthly: 0, companyMonthly: 164, totalMonths: 187, accountBalance: 0, status: 'active' },
  { insuranceType: 'housing', personalMonthly: 1200, companyMonthly: 1200, totalMonths: 187, accountBalance: 256800.00, status: 'active' },
]

export const monthlyRecords: MonthlyRecord[] = [
  { month: '2026-05', base: 12000, personalAmount: 1266, companyAmount: 2586, status: 'paid' },
  { month: '2026-04', base: 12000, personalAmount: 1266, companyAmount: 2586, status: 'paid' },
  { month: '2026-03', base: 12000, personalAmount: 1266, companyAmount: 2586, status: 'paid' },
  { month: '2026-02', base: 11500, personalAmount: 1213, companyAmount: 2478, status: 'paid' },
  { month: '2026-01', base: 11500, personalAmount: 1213, companyAmount: 2478, status: 'paid' },
  { month: '2025-12', base: 11500, personalAmount: 1213, companyAmount: 2478, status: 'paid' },
  { month: '2025-11', base: 11000, personalAmount: 1161, companyAmount: 2370, status: 'paid' },
  { month: '2025-10', base: 11000, personalAmount: 1161, companyAmount: 2370, status: 'paid' },
  { month: '2025-09', base: 11000, personalAmount: 1161, companyAmount: 2370, status: 'adjusting' },
  { month: '2025-08', base: 10800, personalAmount: 1139, companyAmount: 2327, status: 'paid' },
  { month: '2025-07', base: 10800, personalAmount: 1139, companyAmount: 2327, status: 'paid' },
  { month: '2025-06', base: 10800, personalAmount: 1139, companyAmount: 2327, status: 'paid' },
]

export const transferProgress: TransferProgress = {
  transferId: 'TF20260601001',
  fromProvince: '浙江省',
  toProvince: '江苏省',
  status: 'processing',
  createdAt: '2026-05-20',
  deadline: '2026-06-10',
  steps: [
    { name: '提交申请', status: 'done', completedAt: '2026-05-20', description: '已提交社保关系转移申请' },
    { name: '转出地审核', status: 'done', completedAt: '2026-05-25', description: '浙江省社保中心已审核通过' },
    { name: '基金划转', status: 'current', description: '正在办理基金划转手续' },
    { name: '转入地接收', status: 'pending', description: '等待江苏省社保中心接收' },
    { name: '转移完成', status: 'pending', description: '转移流程完成确认' },
  ],
}

export const medicalRecords: MedicalRecord[] = [
  {
    recordId: 'MR20260601001',
    hospitalName: '江苏省人民医院',
    department: '内科',
    visitDate: '2026-06-01',
    diagnosis: '上呼吸道感染',
    totalCost: 356.80,
    reimbursement: 285.44,
    reimbursementRatio: 0.8,
    drugs: [
      { name: '阿莫西林胶囊', category: '甲类', price: 28.50, isCovered: true },
      { name: '布洛芬缓释胶囊', category: '甲类', price: 19.80, isCovered: true },
      { name: '复方甘草片', category: '乙类', price: 15.60, isCovered: true },
    ],
  },
  {
    recordId: 'MR20260515001',
    hospitalName: '南京市第一医院',
    department: '骨科',
    visitDate: '2026-05-15',
    diagnosis: '腰椎间盘突出',
    totalCost: 1280.00,
    reimbursement: 896.00,
    reimbursementRatio: 0.7,
    drugs: [
      { name: '塞来昔布胶囊', category: '乙类', price: 68.00, isCovered: true },
      { name: '甲钴胺片', category: '甲类', price: 32.50, isCovered: true },
    ],
  },
  {
    recordId: 'MR20260420001',
    hospitalName: '东南大学附属中大医院',
    department: '眼科',
    visitDate: '2026-04-20',
    diagnosis: '结膜炎',
    totalCost: 185.50,
    reimbursement: 148.40,
    reimbursementRatio: 0.8,
    drugs: [
      { name: '左氧氟沙星滴眼液', category: '甲类', price: 22.00, isCovered: true },
    ],
  },
  {
    recordId: 'MR20260310001',
    hospitalName: '江苏省中医院',
    department: '中医科',
    visitDate: '2026-03-10',
    diagnosis: '脾胃虚弱',
    totalCost: 420.00,
    reimbursement: 252.00,
    reimbursementRatio: 0.6,
    drugs: [
      { name: '参苓白术散', category: '乙类', price: 45.00, isCovered: true },
      { name: '香砂六君丸', category: '乙类', price: 38.00, isCovered: true },
    ],
  },
]

export const designatedHospitals: DesignatedHospital[] = [
  { id: 'H001', name: '江苏省人民医院', level: '三级甲等', address: '南京市广州路300号', isContracted: true },
  { id: 'H002', name: '南京市第一医院', level: '三级甲等', address: '南京市长乐路68号', isContracted: true },
  { id: 'H003', name: '东南大学附属中大医院', level: '三级甲等', address: '南京市丁家桥87号', isContracted: true },
  { id: 'H004', name: '江苏省中医院', level: '三级甲等', address: '南京市汉中路155号', isContracted: true },
  { id: 'H005', name: '南京鼓楼医院', level: '三级甲等', address: '南京市中山路321号', isContracted: true },
  { id: 'H006', name: '南京市第二医院', level: '三级乙等', address: '南京市钟阜路1-1号', isContracted: true },
]

export const examList: ExamInfo[] = [
  { examId: 'E001', name: '2026年度二级建造师执业资格考试', registrationStart: '2026-06-01', registrationEnd: '2026-06-20', examDate: '2026-10-25', status: 'open', registeredCount: 15680, category: '职业资格' },
  { examId: 'E002', name: '2026年度中级经济师考试', registrationStart: '2026-07-15', registrationEnd: '2026-08-05', examDate: '2026-11-08', status: 'upcoming', registeredCount: 0, category: '职业资格' },
  { examId: 'E003', name: '2026年省属事业单位公开招聘笔试', registrationStart: '2026-05-10', registrationEnd: '2026-05-25', examDate: '2026-06-28', status: 'closed', registeredCount: 28500, category: '公开招聘' },
  { examId: 'E004', name: '2026年度社会工作者职业水平考试', registrationStart: '2026-04-01', registrationEnd: '2026-04-20', examDate: '2026-06-15', status: 'closed', registeredCount: 9320, category: '职业资格' },
  { examId: 'E005', name: '2026年度一级造价工程师考试', registrationStart: '2026-08-01', registrationEnd: '2026-08-25', examDate: '2026-11-15', status: 'upcoming', registeredCount: 0, category: '职业资格' },
]

export const employeeDeclarations: EmployeeDeclaration[] = [
  { employeeId: 'D001', name: '张明', idNumber: '320102199001012345', operation: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育', '公积金'], status: 'submitted', submittedAt: '2026-06-15' },
  { employeeId: 'D002', name: '李华', idNumber: '320102199203054321', operation: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], status: 'approved', submittedAt: '2026-06-12' },
  { employeeId: 'D003', name: '王芳', idNumber: '320102198812060789', operation: 'remove', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育', '公积金'], status: 'pending' },
  { employeeId: 'D004', name: '陈刚', idNumber: '320102199505081234', operation: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育', '公积金'], status: 'rejected', submittedAt: '2026-06-10' },
  { employeeId: 'D005', name: '赵丽', idNumber: '320102199108126789', operation: 'remove', insuranceTypes: ['养老', '医疗', '公积金'], status: 'submitted', submittedAt: '2026-06-14' },
  { employeeId: 'D006', name: '刘伟', idNumber: '320102198703150456', operation: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育', '公积金'], status: 'approved', submittedAt: '2026-06-08' },
]

export const unemploymentApplications: UnemploymentApplication[] = [
  {
    applicationId: 'UA001',
    employeeName: '周建国',
    idNumber: '320102198505012345',
    reason: '公司裁员',
    applicationDate: '2026-06-10',
    status: 'pre-reviewing',
    requiredDocs: ['解除劳动关系证明', '身份证复印件', '失业登记证', '银行卡信息'],
    submittedDocs: ['解除劳动关系证明', '身份证复印件', '失业登记证', '银行卡信息'],
  },
  {
    applicationId: 'UA002',
    employeeName: '孙丽丽',
    idNumber: '320102199007084321',
    reason: '合同到期未续签',
    applicationDate: '2026-06-12',
    status: 'submitted',
    requiredDocs: ['解除劳动关系证明', '身份证复印件', '失业登记证', '银行卡信息'],
    submittedDocs: ['解除劳动关系证明', '身份证复印件'],
  },
]

export const eContracts: EContract[] = [
  { contractId: 'EC001', title: '劳动合同-张明', parties: ['江苏信达科技有限公司', '张明'], signDate: '2026-06-01', status: 'notarized', blockchainHash: '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c', templateName: '标准劳动合同' },
  { contractId: 'EC002', title: '劳动合同-李华', parties: ['江苏信达科技有限公司', '李华'], signDate: '2026-06-05', status: 'signed', blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', templateName: '标准劳动合同' },
  { contractId: 'EC003', title: '保密协议-王芳', parties: ['江苏信达科技有限公司', '王芳'], signDate: '2026-06-08', status: 'signed', blockchainHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d', templateName: '保密协议' },
  { contractId: 'EC004', title: '竞业限制协议-陈刚', parties: ['江苏信达科技有限公司', '陈刚'], signDate: '2026-05-20', status: 'expired', blockchainHash: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a', templateName: '竞业限制协议' },
  { contractId: 'EC005', title: '劳动合同-赵丽', parties: ['江苏信达科技有限公司', '赵丽'], signDate: '', status: 'draft', blockchainHash: '', templateName: '标准劳动合同' },
]

export const policyDocuments: PolicyDocument[] = [
  {
    policyId: 'P001',
    title: '关于调整2026年度社会保险缴费基数上下限的通知',
    publishDate: '2026-05-15',
    effectiveDate: '2026-07-01',
    expiryDate: '2027-06-30',
    tags: [
      { name: '在职职工', category: '人群', confidence: 0.95 },
      { name: '缴费基数调整', category: '场景', confidence: 0.98 },
      { name: '年度调整', category: '时效', confidence: 0.92 },
    ],
    summary: '根据全省上年度城镇单位就业人员平均工资，调整2026年度社会保险缴费基数上下限标准。',
  },
  {
    policyId: 'P002',
    title: '关于进一步优化失业保险金申领流程的通知',
    publishDate: '2026-04-20',
    effectiveDate: '2026-05-01',
    tags: [
      { name: '失业人员', category: '人群', confidence: 0.97 },
      { name: '失业金申领', category: '场景', confidence: 0.96 },
      { name: '长期有效', category: '时效', confidence: 0.85 },
    ],
    summary: '简化失业保险金申领手续，推行"免申即享"服务模式，实现网上办理、限时办结。',
  },
  {
    policyId: 'P003',
    title: '关于推进电子社保卡应用的通知',
    publishDate: '2026-03-10',
    effectiveDate: '2026-04-01',
    tags: [
      { name: '全体参保人', category: '人群', confidence: 0.90 },
      { name: '电子社保卡', category: '场景', confidence: 0.99 },
      { name: '长期有效', category: '时效', confidence: 0.88 },
    ],
    summary: '加快推进电子社保卡发放应用，实现社保卡线上线下融合用卡，支持NFC闪付功能。',
  },
  {
    policyId: 'P004',
    title: '关于规范劳动关系电子合同存证管理的指导意见',
    publishDate: '2026-02-28',
    effectiveDate: '2026-03-15',
    tags: [
      { name: '企业HR', category: '人群', confidence: 0.93 },
      { name: '电子合同存证', category: '场景', confidence: 0.97 },
      { name: '长期有效', category: '时效', confidence: 0.80 },
    ],
    summary: '规范劳动关系电子合同存证管理，明确区块链存证效力，保障劳动者合法权益。',
  },
  {
    policyId: 'P005',
    title: '关于跨省社保关系转移接续优化的通知',
    publishDate: '2026-01-20',
    effectiveDate: '2026-02-01',
    tags: [
      { name: '流动就业人员', category: '人群', confidence: 0.96 },
      { name: '社保转移', category: '场景', confidence: 0.98 },
      { name: '长期有效', category: '时效', confidence: 0.82 },
    ],
    summary: '优化跨省社保关系转移接续流程，压缩办理时限至15个工作日，建立超时督办机制。',
  },
  {
    policyId: 'P006',
    title: '关于扩大医保门诊慢特病病种范围的通知',
    publishDate: '2026-06-01',
    effectiveDate: '2026-07-01',
    tags: [
      { name: '慢特病患者', category: '人群', confidence: 0.94 },
      { name: '医保报销', category: '场景', confidence: 0.91 },
      { name: '年度调整', category: '时效', confidence: 0.89 },
    ],
    summary: '新增12种门诊慢特病病种，提高报销比例，减轻参保患者门诊医疗费用负担。',
  },
]

export const timeoutWarnings: TimeoutWarning[] = [
  { warningId: 'W001', businessType: '社保关系转移', applicantName: '王建国', submittedAt: '2026-05-15', deadline: '2026-06-05', remainingDays: -14, level: 'red', handler: '张经办', status: 'active' },
  { warningId: 'W002', businessType: '社保关系转移', applicantName: '刘美丽', submittedAt: '2026-05-18', deadline: '2026-06-08', remainingDays: -11, level: 'red', handler: '李经办', status: 'active' },
  { warningId: 'W003', businessType: '失业金申领', applicantName: '陈小明', submittedAt: '2026-05-22', deadline: '2026-06-12', remainingDays: -7, level: 'orange', handler: '张经办', status: 'active' },
  { warningId: 'W004', businessType: '工伤认定', applicantName: '赵大力', submittedAt: '2026-05-28', deadline: '2026-06-18', remainingDays: -1, level: 'orange', handler: '王经办', status: 'supervised' },
  { warningId: 'W005', businessType: '社保关系转移', applicantName: '孙小芳', submittedAt: '2026-06-02', deadline: '2026-06-22', remainingDays: 3, level: 'yellow', handler: '李经办', status: 'active' },
  { warningId: 'W006', businessType: '退休审批', applicantName: '周明华', submittedAt: '2026-06-05', deadline: '2026-06-25', remainingDays: 6, level: 'yellow', handler: '王经办', status: 'active' },
]

export const identityAudits: IdentityAudit[] = [
  { auditId: 'IA001', userName: '张明', idNumber: '320102****2345', authMethod: 'face', authTime: '2026-06-19 09:15:23', status: 'passed', matchScore: 98.5 },
  { auditId: 'IA002', userName: '李华', idNumber: '320102****4321', authMethod: 'face', authTime: '2026-06-19 09:12:45', status: 'passed', matchScore: 96.8 },
  { auditId: 'IA003', userName: '王芳', idNumber: '320102****0789', authMethod: 'face', authTime: '2026-06-19 08:56:12', status: 'failed', matchScore: 42.3 },
  { auditId: 'IA004', userName: '陈刚', idNumber: '320102****1234', authMethod: 'fingerprint', authTime: '2026-06-19 08:45:30', status: 'passed', matchScore: 95.2 },
  { auditId: 'IA005', userName: '赵丽', idNumber: '320102****6789', authMethod: 'face', authTime: '2026-06-18 17:30:00', status: 'suspicious', matchScore: 61.7 },
  { auditId: 'IA006', userName: '刘伟', idNumber: '320102****0456', authMethod: 'face', authTime: '2026-06-18 16:20:15', status: 'passed', matchScore: 97.1 },
]

export const notifications: Notification[] = [
  { id: 'N001', title: '2026年度社保缴费基数调整公告', date: '2026-06-18', type: 'policy', content: '自2026年7月1日起，全省社会保险缴费基数上下限进行调整。' },
  { id: 'N002', title: '电子社保卡NFC闪付功能上线通知', date: '2026-06-17', type: 'service', content: '电子社保卡新增NFC闪付功能，可在定点药店和医院直接刷卡结算。' },
  { id: 'N003', title: '二级建造师考试报名即将截止', date: '2026-06-16', type: 'system', content: '2026年度二级建造师考试报名将于6月20日截止，请尽快完成报名。' },
  { id: 'N004', title: '医保门诊慢特病病种范围扩大', date: '2026-06-15', type: 'policy', content: '新增12种门诊慢特病病种，7月1日起执行。' },
  { id: 'N005', title: '社保关系转移时限压缩通知', date: '2026-06-10', type: 'service', content: '跨省社保关系转移办理时限压缩至15个工作日。' },
  { id: 'N006', title: '劳动关系电子合同存证系统升级', date: '2026-06-08', type: 'system', content: '电子合同存证系统已完成升级，新增批量签署功能。' },
]

export const dashboardMetrics: DashboardMetric[] = [
  { label: '今日在线办理量', value: 12580, unit: '件', trend: 'up', changePercent: 12.5 },
  { label: '累计服务人次', value: 3856200, unit: '人次', trend: 'up', changePercent: 8.3 },
  { label: '平均办理时长', value: 3.2, unit: '工作日', trend: 'down', changePercent: 15.0 },
  { label: '网办率', value: 94.6, unit: '%', trend: 'up', changePercent: 2.1 },
]

export const insuranceTypeLabels: Record<string, string> = {
  pension: '养老保险',
  medical: '医疗保险',
  unemployment: '失业保险',
  injury: '工伤保险',
  maternity: '生育保险',
  housing: '住房公积金',
}

export const insuranceTypeColors: Record<string, string> = {
  pension: '#0D3B66',
  medical: '#2E86AB',
  unemployment: '#C41E3A',
  injury: '#D4A843',
  maternity: '#6B8E23',
  housing: '#8B4513',
}
