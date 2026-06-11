import type {
  User,
  EnterpriseUser,
  InsuranceRecord,
  InsuranceSummary,
  TransferProgress,
  HousingFundAccount,
  HousingFundDepositRecord,
  HousingFundLoanInfo,
  HousingFundRepaymentPlan,
  HousingFundWithdrawRecord,
  MedicalRecord,
  Hospital,
  Drug,
  ExamInfo,
  ExamRegistration,
  ECardInfo,
  PaymentRecord,
  EmployeeInsurance,
  UnemploymentApplication,
  LaborContract,
  SupervisionOrder,
  SupervisionStatistics,
  PolicyDocument,
  PolicyTag,
  Message,
  FaceAuthRecord,
  AuthReviewRecord,
  AuthStatistics,
  PoliceDbStatus,
  InsuranceType,
  GuideItem,
  InsuranceChange,
  OperationLog,
} from '@/types';

export const mockUser: User = {
  id: 'U001',
  name: '张明华',
  idCard: '110101199001011234',
  phone: '138****8888',
  avatar: '',
  role: 'personal',
  authStatus: 'verified',
  email: 'zhangminghua@example.com',
  address: '北京市朝阳区建国路88号',
};

export const mockEnterpriseUser: EnterpriseUser = {
  id: 'E001',
  companyName: '北京智慧科技有限公司',
  creditCode: '91110105MA01ABCD23',
  legalPerson: '张明华',
  legalPersonIdCard: '110101199001011234',
  contactPhone: '010-88888888',
  authStatus: 'verified',
  employeeCount: 256,
  industry: '信息技术',
};

export const mockAdminUser: User = {
  id: 'A001',
  name: '李管理员',
  idCard: '110101198501015678',
  phone: '139****6666',
  role: 'admin',
  authStatus: 'verified',
};

const generateInsuranceRecords = (): InsuranceRecord[] => {
  const records: InsuranceRecord[] = [];
  const types = ['pension', 'medical', 'unemployment', 'injury', 'maternity'] as const;
  const years = [2022, 2023, 2024, 2025];
  const companyHistory = [
    { year: 2022, name: '北京华信信息技术有限公司', base: 7500 },
    { year: 2023, name: '北京云创数据科技有限公司', base: 8800 },
    { year: 2024, name: '北京智慧科技有限公司', base: 10000 },
    { year: 2025, name: '北京智慧科技有限公司', base: 10500 },
  ];

  years.forEach((year) => {
    const companyInfo = companyHistory.find((c) => c.year === year)!;
    const maxMonth = year === 2025 ? 12 : 12;
    for (let month = 1; month <= maxMonth; month++) {
      const isPaid = year < 2025 || (year === 2025 && month <= 9);
      types.forEach((type) => {
        const base = companyInfo.base;
        records.push({
          id: `${type}-${year}-${month.toString().padStart(2, '0')}`,
          insuranceType: type,
          paymentMonth: `${year}-${month.toString().padStart(2, '0')}`,
          paymentBase: base,
          personalPayment:
            type === 'pension'
              ? Math.round(base * 0.08 * 100) / 100
              : type === 'medical'
              ? Math.round(base * 0.02 * 100) / 100
              : type === 'unemployment'
              ? Math.round(base * 0.005 * 100) / 100
              : 0,
          companyPayment:
            type === 'pension'
              ? Math.round(base * 0.16 * 100) / 100
              : type === 'medical'
              ? Math.round(base * 0.10 * 100) / 100
              : type === 'unemployment'
              ? Math.round(base * 0.005 * 100) / 100
              : type === 'injury'
              ? Math.round(base * 0.002 * 100) / 100
              : Math.round(base * 0.004 * 100) / 100,
          paymentStatus: isPaid ? 'paid' : 'unpaid',
          companyName: companyInfo.name,
        });
      });
    }
  });
  return records;
};

export const mockInsuranceRecords = generateInsuranceRecords();

export const mockInsuranceSummaries: InsuranceSummary[] = [
  {
    type: 'pension',
    typeName: '养老保险',
    totalMonths: 156,
    personalBalance: 125600.5,
    companyBalance: 251200.8,
    totalBalance: 376801.3,
    lastPaymentMonth: '2025-06',
    status: 'normal',
  },
  {
    type: 'medical',
    typeName: '医疗保险',
    totalMonths: 156,
    personalBalance: 35600.2,
    companyBalance: 0,
    totalBalance: 35600.2,
    lastPaymentMonth: '2025-06',
    status: 'normal',
  },
  {
    type: 'unemployment',
    typeName: '失业保险',
    totalMonths: 156,
    personalBalance: 5200.8,
    companyBalance: 5200.8,
    totalBalance: 10401.6,
    lastPaymentMonth: '2025-06',
    status: 'normal',
  },
  {
    type: 'injury',
    typeName: '工伤保险',
    totalMonths: 156,
    personalBalance: 0,
    companyBalance: 3120.5,
    totalBalance: 3120.5,
    lastPaymentMonth: '2025-06',
    status: 'normal',
  },
  {
    type: 'maternity',
    typeName: '生育保险',
    totalMonths: 156,
    personalBalance: 0,
    companyBalance: 6240.6,
    totalBalance: 6240.6,
    lastPaymentMonth: '2025-06',
    status: 'normal',
  },
];

export const mockTransferProgress: TransferProgress[] = [
  {
    id: 'T001',
    transferNo: 'SBZY20250601001',
    insuranceType: 'pension',
    fromCity: '上海市',
    toCity: '北京市',
    applyDate: '2025-05-15',
    status: 'transferring',
    currentNode: '转入地社保经办机构审核',
    estimatedDays: 15,
    completedDays: 32,
    isOverdue: true,
    overdueDays: 17,
    remark: '材料审核通过，正在办理基金划转。因系统对接延迟已触发超时督办',
    nodes: [
      {
        name: '转出地参保缴费凭证打印',
        completed: true,
        completedAt: '2025-05-15 10:30:00',
        handler: '陈经办',
        handlerDept: '上海市社保中心浦东分中心业务受理科',
        remark: '缴费凭证已生成并加盖电子公章',
        promiseTime: '2025-05-16',
      },
      {
        name: '转入地申请受理',
        completed: true,
        completedAt: '2025-05-18 09:15:00',
        handler: '王经办',
        handlerDept: '北京市朝阳区社保中心业务受理窗口',
        remark: '申请材料齐全，予以受理',
        promiseTime: '2025-05-20',
      },
      {
        name: '转出地信息表传递',
        completed: true,
        completedAt: '2025-05-25 14:20:00',
        handler: '李经办',
        handlerDept: '上海市社保中心基金财务科',
        remark: '养老保险参保信息表已通过部平台发送',
        promiseTime: '2025-05-28',
      },
      {
        name: '转入地社保经办机构审核',
        completed: false,
        handler: '张经办',
        handlerDept: '北京市社保中心基金转移接续科',
        remark: '基金划转对账中，因跨系统数据校验延迟',
        promiseTime: '2025-06-02',
      },
      {
        name: '转移办结',
        completed: false,
        handler: '刘经办',
        handlerDept: '北京市朝阳区社保中心账户管理科',
        remark: '待基金到账后完成个人账户记实',
        promiseTime: '2025-06-05',
      },
    ],
    supervisionRecords: [
      {
        id: 'SUP-T001-001',
        triggeredAt: '2025-06-02 09:00:00',
        reason: '超过15个工作日承诺办结时限，系统自动触发一级督办',
        handledBy: '赵督办',
        handleDept: '北京市人社局政务服务监督处',
        result: '已向责任科室发送督办通知，要求3个工作日内反馈进展',
        status: 'resolved',
      },
      {
        id: 'SUP-T001-002',
        triggeredAt: '2025-06-10 09:00:00',
        reason: '一级督办后仍未办结，升级为二级督办',
        handledBy: '孙处长',
        handleDept: '北京市人社局政务服务监督处',
        result: '已约谈责任科室负责人，要求即日协调上海市社保中心完成基金划转对账',
        status: 'processing',
      },
    ],
    reviewRecords: [
      {
        id: 'REV-T001-001',
        reviewedAt: '2025-06-03 14:00:00',
        reviewedBy: '赵督办',
        reviewResult: 'recheck',
        remark: '申请材料完整，流程合规，主要原因为跨省市基金划转系统对接延迟，需督促加快处理',
      },
    ],
  },
  {
    id: 'T002',
    transferNo: 'SBZY20250301002',
    insuranceType: 'medical',
    fromCity: '广州市',
    toCity: '北京市',
    applyDate: '2025-03-10',
    status: 'completed',
    currentNode: '已完成',
    estimatedDays: 15,
    completedDays: 12,
    isOverdue: false,
    remark: '医保关系转移完成，个人账户余额已划转',
    nodes: [
      {
        name: '转出地参保凭证打印',
        completed: true,
        completedAt: '2025-03-10 11:00:00',
        handler: '林经办',
        handlerDept: '广州市医保中心越秀分中心',
        remark: '医保缴费凭证已生成',
        promiseTime: '2025-03-11',
      },
      {
        name: '转入地申请受理',
        completed: true,
        completedAt: '2025-03-13 10:00:00',
        handler: '王经办',
        handlerDept: '北京市朝阳区医保中心',
        remark: '申请受理',
        promiseTime: '2025-03-15',
      },
      {
        name: '信息表与个人账户划转',
        completed: true,
        completedAt: '2025-03-20 16:30:00',
        handler: '何经办',
        handlerDept: '广州市医保中心基金财务科',
        remark: '个人账户余额3,200.50元已划转',
        promiseTime: '2025-03-23',
      },
      {
        name: '转入地账户接续',
        completed: true,
        completedAt: '2025-03-22 14:00:00',
        handler: '张经办',
        handlerDept: '北京市朝阳区医保中心账户科',
        remark: '医保关系接续完成，缴费年限累计180个月',
        promiseTime: '2025-03-25',
      },
      {
        name: '转移办结',
        completed: true,
        completedAt: '2025-03-22 17:00:00',
        handler: '刘经办',
        handlerDept: '北京市朝阳区医保中心',
        remark: '短信通知申请人办结',
        promiseTime: '2025-03-25',
      },
    ],
    supervisionRecords: [],
    reviewRecords: [
      {
        id: 'REV-T002-001',
        reviewedAt: '2025-03-26 10:00:00',
        reviewedBy: '赵督办',
        reviewResult: 'pass',
        remark: '办结时限符合承诺，流程规范，材料齐全',
      },
    ],
  },
];

export const mockHousingFund: HousingFundAccount = {
  accountNo: '1101001234567890',
  balance: 268500.5,
  monthlyDeposit: 3360,
  personalDeposit: 1680,
  companyDeposit: 1680,
  depositBase: 14000,
  depositRatio: 12,
  totalMonths: 156,
  lastDepositMonth: '2025-06',
  status: 'normal',
};

const generateHousingFundDepositRecords = (): HousingFundDepositRecord[] => {
  const records: HousingFundDepositRecord[] = [];
  const baseSalaries = [12000, 12500, 13000, 13500, 14000, 14000, 14000, 14000, 14000, 14000, 14000, 14000];
  
  for (let i = 0; i < 12; i++) {
    const month = 6 - i;
    let year = 2025;
    let monthStr = month;
    if (month <= 0) {
      monthStr = 12 + month;
      year = 2024;
    }
    const depositBase = baseSalaries[11 - i];
    const personalDeposit = depositBase * 0.12;
    const companyDeposit = depositBase * 0.12;
    records.push({
      id: `HF-${year}-${monthStr.toString().padStart(2, '0')}`,
      month: `${year}-${monthStr.toString().padStart(2, '0')}`,
      depositBase,
      personalDeposit,
      companyDeposit,
      totalDeposit: personalDeposit + companyDeposit,
      status: month <= 6 ? 'paid' : 'paid',
      companyName: '北京智慧科技有限公司',
    });
  }
  return records;
};

export const mockHousingFundDepositRecords = generateHousingFundDepositRecords();

export const mockHousingFundLoan: HousingFundLoanInfo = {
  loanNo: 'GK202301001234',
  loanAmount: 800000,
  paidPrincipal: 125600,
  remainingPrincipal: 674400,
  interestRate: 3.1,
  loanTerm: 360,
  remainingMonths: 300,
  monthlyPayment: 3430.5,
  startDate: '2023-01-15',
  endDate: '2053-01-15',
  status: 'normal',
};

const generateRepaymentPlans = (): HousingFundRepaymentPlan[] => {
  const plans: HousingFundRepaymentPlan[] = [];
  let remainingPrincipal = 674400;
  const monthlyPayment = 3430.5;
  const monthlyRate = 0.031 / 12;
  
  for (let i = 1; i <= 12; i++) {
    const interest = remainingPrincipal * monthlyRate;
    const principal = monthlyPayment - interest;
    remainingPrincipal -= principal;
    
    const date = new Date(2025, 5 + i, 15);
    plans.push({
      id: `RP-${i.toString().padStart(3, '0')}`,
      period: 30 + i,
      dueDate: date.toISOString().split('T')[0],
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      monthlyPayment,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      status: i <= 6 ? 'paid' : 'pending',
    });
  }
  return plans;
};

export const mockRepaymentPlans = generateRepaymentPlans();

export const mockHousingFundWithdraws: HousingFundWithdrawRecord[] = [
  {
    id: 'W001',
    withdrawNo: 'TQ202505001',
    withdrawType: '购房提取',
    withdrawAmount: 50000,
    withdrawTime: '2025-05-10 14:30:00',
    status: 'completed',
    remark: '购买首套住房提取',
  },
  {
    id: 'W002',
    withdrawNo: 'TQ202412002',
    withdrawType: '租房提取',
    withdrawAmount: 18000,
    withdrawTime: '2024-12-15 09:15:00',
    status: 'completed',
    remark: '2024年度租房提取',
  },
  {
    id: 'W003',
    withdrawNo: 'TQ202406003',
    withdrawType: '装修提取',
    withdrawAmount: 30000,
    withdrawTime: '2024-06-20 16:45:00',
    status: 'completed',
    remark: '自住住房装修提取',
  },
  {
    id: 'W004',
    withdrawNo: 'TQ202311004',
    withdrawType: '购房提取',
    withdrawAmount: 80000,
    withdrawTime: '2023-11-08 10:20:00',
    status: 'completed',
    remark: '首付款提取',
  },
];

export const mockMedicalRecords: MedicalRecord[] = [
  {
    id: 'M001',
    hospitalName: '北京协和医院',
    hospitalLevel: '三级甲等',
    visitDate: '2025-06-15',
    visitType: 'outpatient',
    totalAmount: 856.5,
    reimbursementAmount: 520.8,
    personalPayment: 335.7,
    reimbursementRatio: 60.8,
    diagnosis: '上呼吸道感染',
    department: '呼吸内科',
    doctorName: '王医生',
    feeDetails: [
      { name: '门诊挂号费', category: '诊疗费', qty: 1, unitPrice: 50, totalAmount: 50, reimbursement: 40, personal: 10, isReimbursable: true },
      { name: '血常规检查', category: '检查费', qty: 1, unitPrice: 35, totalAmount: 35, reimbursement: 28, personal: 7, isReimbursable: true },
      { name: '胸部X光片', category: '检查费', qty: 1, unitPrice: 120, totalAmount: 120, reimbursement: 96, personal: 24, isReimbursable: true },
      { name: '阿莫西林胶囊', category: '西药费', qty: 2, unitPrice: 18.5, totalAmount: 37, reimbursement: 33.3, personal: 3.7, isReimbursable: true },
      { name: '布洛芬缓释胶囊', category: '西药费', qty: 1, unitPrice: 22, totalAmount: 22, reimbursement: 19.8, personal: 2.2, isReimbursable: true },
      { name: '连花清瘟颗粒', category: '中成药', qty: 2, unitPrice: 32, totalAmount: 64, reimbursement: 57.6, personal: 6.4, isReimbursable: true },
      { name: '门诊输液(含留观)', category: '诊疗费', qty: 2, unitPrice: 250, totalAmount: 500, reimbursement: 230, personal: 270, isReimbursable: true },
      { name: '一次性医用口罩', category: '卫生材料', qty: 1, unitPrice: 28.5, totalAmount: 28.5, reimbursement: 0, personal: 28.5, isReimbursable: false },
    ],
  },
  {
    id: 'M002',
    hospitalName: '北京天坛医院',
    hospitalLevel: '三级甲等',
    visitDate: '2025-05-20',
    visitType: 'outpatient',
    totalAmount: 1280.0,
    reimbursementAmount: 896.0,
    personalPayment: 384.0,
    reimbursementRatio: 70.0,
    diagnosis: '高血压复诊',
    department: '心血管内科',
    doctorName: '李主任',
    feeDetails: [
      { name: '专家门诊挂号费', category: '诊疗费', qty: 1, unitPrice: 100, totalAmount: 100, reimbursement: 80, personal: 20, isReimbursable: true },
      { name: '动态血压监测', category: '检查费', qty: 1, unitPrice: 180, totalAmount: 180, reimbursement: 144, personal: 36, isReimbursable: true },
      { name: '心电图', category: '检查费', qty: 1, unitPrice: 40, totalAmount: 40, reimbursement: 32, personal: 8, isReimbursable: true },
      { name: '血脂四项', category: '化验费', qty: 1, unitPrice: 120, totalAmount: 120, reimbursement: 96, personal: 24, isReimbursable: true },
      { name: '肝肾功能检查', category: '化验费', qty: 1, unitPrice: 180, totalAmount: 180, reimbursement: 144, personal: 36, isReimbursable: true },
      { name: '氨氯地平片(络活喜)', category: '西药费', qty: 3, unitPrice: 45.8, totalAmount: 137.4, reimbursement: 116.79, personal: 20.61, isReimbursable: true },
      { name: '阿托伐他汀钙片', category: '西药费', qty: 2, unitPrice: 68, totalAmount: 136, reimbursement: 115.6, personal: 20.4, isReimbursable: true },
      { name: '阿司匹林肠溶片', category: '西药费', qty: 3, unitPrice: 28.87, totalAmount: 86.6, reimbursement: 73.61, personal: 12.99, isReimbursable: true },
    ],
  },
  {
    id: 'M003',
    hospitalName: '北京市朝阳区社区卫生服务中心',
    hospitalLevel: '一级',
    visitDate: '2025-04-10',
    visitType: 'pharmacy',
    totalAmount: 156.8,
    reimbursementAmount: 125.4,
    personalPayment: 31.4,
    reimbursementRatio: 80.0,
    diagnosis: '常规用药',
    department: '全科',
    feeDetails: [
      { name: '氨氯地平片', category: '西药费', qty: 2, unitPrice: 45.8, totalAmount: 91.6, reimbursement: 82.44, personal: 9.16, isReimbursable: true },
      { name: '二甲双胍缓释片', category: '西药费', qty: 2, unitPrice: 32.6, totalAmount: 65.2, reimbursement: 42.96, personal: 22.24, isReimbursable: true },
    ],
  },
  {
    id: 'M004',
    hospitalName: '北京朝阳医院',
    hospitalLevel: '三级甲等',
    visitDate: '2025-03-15',
    visitType: 'inpatient',
    totalAmount: 12580.0,
    reimbursementAmount: 9850.0,
    personalPayment: 2730.0,
    reimbursementRatio: 78.3,
    diagnosis: '急性阑尾炎',
    department: '普外科',
    doctorName: '赵医生',
    feeDetails: [
      { name: '住院诊查费', category: '诊疗费', qty: 5, unitPrice: 30, totalAmount: 150, reimbursement: 120, personal: 30, isReimbursable: true },
      { name: '床位费(双人间)', category: '床位费', qty: 5, unitPrice: 80, totalAmount: 400, reimbursement: 320, personal: 80, isReimbursable: true },
      { name: '护理费', category: '护理费', qty: 5, unitPrice: 50, totalAmount: 250, reimbursement: 200, personal: 50, isReimbursable: true },
      { name: '血常规+生化全项', category: '化验费', qty: 1, unitPrice: 380, totalAmount: 380, reimbursement: 304, personal: 76, isReimbursable: true },
      { name: '腹部CT平扫', category: '检查费', qty: 1, unitPrice: 650, totalAmount: 650, reimbursement: 520, personal: 130, isReimbursable: true },
      { name: '腹腔镜阑尾切除术', category: '手术费', qty: 1, unitPrice: 3200, totalAmount: 3200, reimbursement: 2720, personal: 480, isReimbursable: true },
      { name: '全身麻醉', category: '麻醉费', qty: 1, unitPrice: 1500, totalAmount: 1500, reimbursement: 1200, personal: 300, isReimbursable: true },
      { name: '一次性手术耗材', category: '卫生材料', qty: 1, unitPrice: 2800, totalAmount: 2800, reimbursement: 1960, personal: 840, isReimbursable: true },
      { name: '头孢类抗生素', category: '西药费', qty: 3, unitPrice: 260, totalAmount: 780, reimbursement: 702, personal: 78, isReimbursable: true },
      { name: '止痛药物', category: '西药费', qty: 1, unitPrice: 320, totalAmount: 320, reimbursement: 288, personal: 32, isReimbursable: true },
      { name: '静脉输液治疗', category: '诊疗费', qty: 5, unitPrice: 120, totalAmount: 600, reimbursement: 480, personal: 120, isReimbursable: true },
      { name: '住院期间餐费', category: '其他', qty: 5, unitPrice: 50, totalAmount: 250, reimbursement: 0, personal: 250, isReimbursable: false },
      { name: '高级病房补差价', category: '其他', qty: 5, unitPrice: 60, totalAmount: 300, reimbursement: 0, personal: 300, isReimbursable: false },
    ],
  },
  {
    id: 'M005',
    hospitalName: '北京同仁医院',
    hospitalLevel: '三级甲等',
    visitDate: '2025-02-20',
    visitType: 'outpatient',
    totalAmount: 450.0,
    reimbursementAmount: 270.0,
    personalPayment: 180.0,
    reimbursementRatio: 60.0,
    diagnosis: '视疲劳',
    department: '眼科',
    feeDetails: [
      { name: '专科挂号费', category: '诊疗费', qty: 1, unitPrice: 60, totalAmount: 60, reimbursement: 48, personal: 12, isReimbursable: true },
      { name: '视力检查', category: '检查费', qty: 1, unitPrice: 20, totalAmount: 20, reimbursement: 16, personal: 4, isReimbursable: true },
      { name: '眼压测量', category: '检查费', qty: 1, unitPrice: 40, totalAmount: 40, reimbursement: 32, personal: 8, isReimbursable: true },
      { name: '眼底检查', category: '检查费', qty: 1, unitPrice: 80, totalAmount: 80, reimbursement: 64, personal: 16, isReimbursable: true },
      { name: '人工泪液滴眼液', category: '西药费', qty: 2, unitPrice: 45, totalAmount: 90, reimbursement: 81, personal: 9, isReimbursable: true },
      { name: '七叶洋地黄双苷滴眼液', category: '西药费', qty: 2, unitPrice: 40, totalAmount: 80, reimbursement: 29, personal: 51, isReimbursable: true },
      { name: '防蓝光护眼眼镜', category: '其他', qty: 1, unitPrice: 80, totalAmount: 80, reimbursement: 0, personal: 80, isReimbursable: false },
    ],
  },
];

export const mockHospitals: Hospital[] = [
  {
    id: 'H001',
    name: '北京协和医院',
    level: '三级甲等',
    address: '北京市东城区帅府园1号',
    phone: '010-69156114',
    type: 'general',
    isDesignated: true,
    distance: 3.5,
    designatedType: '定点综合医院',
    reimbursementScope: '门诊统筹70% · 住院85% · 起付线1300元',
    departments: ['内科', '外科', '妇产科', '儿科', '眼科', '耳鼻喉科', '皮肤科', '口腔科', '中医科', '急诊科', '重症医学科'],
  },
  {
    id: 'H002',
    name: '北京天坛医院',
    level: '三级甲等',
    address: '北京市丰台区南四环西路119号',
    phone: '010-59976611',
    type: 'general',
    isDesignated: true,
    distance: 5.2,
    designatedType: '定点综合医院',
    reimbursementScope: '门诊统筹70% · 住院85% · 起付线1300元',
    departments: ['神经内科', '神经外科', '心血管内科', '呼吸内科', '普外科', '骨科', '妇产科', '急诊科'],
  },
  {
    id: 'H003',
    name: '北京朝阳医院',
    level: '三级甲等',
    address: '北京市朝阳区工人体育场南路8号',
    phone: '010-85231000',
    type: 'general',
    isDesignated: true,
    distance: 2.8,
    designatedType: '定点综合医院',
    reimbursementScope: '门诊统筹70% · 住院85% · 起付线1300元',
    departments: ['呼吸内科', '心血管内科', '普外科', '骨科', '妇产科', '急诊科', '重症医学科', '麻醉科'],
  },
  {
    id: 'H004',
    name: '北京同仁医院',
    level: '三级甲等',
    address: '北京市东城区崇文门内大街8号',
    phone: '010-58269911',
    type: 'specialized',
    isDesignated: true,
    distance: 4.1,
    designatedType: '定点专科医院(眼科/耳鼻喉)',
    reimbursementScope: '门诊专科70% · 住院85% · 起付线1300元',
    departments: ['眼科中心', '耳鼻喉科', '口腔科', '头颈外科', '眼底病科', '屈光科'],
  },
  {
    id: 'H005',
    name: '朝阳区社区卫生服务中心',
    level: '一级',
    address: '北京市朝阳区建国路86号',
    phone: '010-85881234',
    type: 'community',
    isDesignated: true,
    distance: 0.8,
    designatedType: '定点社区卫生服务中心',
    reimbursementScope: '门诊统筹90% · 起付线0元 · 转诊住院92%',
    departments: ['全科医学', '预防保健', '中医科', '康复理疗', '口腔科', '计划免疫'],
  },
  {
    id: 'H006',
    name: '北京积水潭医院',
    level: '三级甲等',
    address: '北京市西城区新街口东街31号',
    phone: '010-58516688',
    type: 'specialized',
    isDesignated: true,
    distance: 6.5,
    designatedType: '定点专科医院(骨科/烧伤)',
    reimbursementScope: '门诊专科70% · 住院85% · 起付线1300元',
    departments: ['创伤骨科', '脊柱外科', '关节外科', '烧伤科', '手外科', '运动医学科'],
  },
];

export const mockDrugs: Drug[] = [
  {
    id: 'D001',
    name: '阿莫西林胶囊',
    spec: '0.25g*24粒',
    manufacturer: '华北制药股份有限公司',
    category: '抗生素',
    isReimbursable: true,
    reimbursementRatio: 90,
    price: 18.5,
    unit: '盒',
  },
  {
    id: 'D002',
    name: '氨氯地平片',
    spec: '5mg*14片',
    manufacturer: '辉瑞制药有限公司',
    category: '心血管系统',
    isReimbursable: true,
    reimbursementRatio: 85,
    price: 45.8,
    unit: '盒',
  },
  {
    id: 'D003',
    name: '布洛芬缓释胶囊',
    spec: '0.3g*20粒',
    manufacturer: '中美天津史克制药有限公司',
    category: '解热镇痛',
    isReimbursable: true,
    reimbursementRatio: 90,
    price: 22.0,
    unit: '盒',
  },
  {
    id: 'D004',
    name: '奥美拉唑肠溶胶囊',
    spec: '20mg*14粒',
    manufacturer: '阿斯利康制药有限公司',
    category: '消化系统',
    isReimbursable: true,
    reimbursementRatio: 80,
    price: 58.6,
    unit: '盒',
  },
  {
    id: 'D005',
    name: '维生素C片',
    spec: '100mg*100片',
    manufacturer: '东北制药集团股份有限公司',
    category: '维生素类',
    isReimbursable: false,
    reimbursementRatio: 0,
    price: 8.5,
    unit: '瓶',
  },
];

export const mockExams: ExamInfo[] = [
  {
    id: 'EX001',
    name: '2025年度二级建造师执业资格考试',
    examType: '执业资格',
    registerStartTime: '2025-06-01',
    registerEndTime: '2025-06-30',
    examDate: '2025-09-20',
    examFee: 150,
    status: 'registering',
    totalQuestions: 100,
    duration: 180,
  },
  {
    id: 'EX002',
    name: '2025年度人力资源管理师考试',
    examType: '职业资格',
    registerStartTime: '2025-05-15',
    registerEndTime: '2025-06-15',
    examDate: '2025-08-10',
    examFee: 200,
    status: 'registering',
    totalQuestions: 120,
    duration: 150,
  },
  {
    id: 'EX003',
    name: '2025年度社会工作者职业水平考试',
    examType: '职业水平',
    registerStartTime: '2025-07-01',
    registerEndTime: '2025-07-31',
    examDate: '2025-10-15',
    examFee: 120,
    status: 'not_started',
    totalQuestions: 100,
    duration: 120,
  },
  {
    id: 'EX004',
    name: '2025年度经济师专业技术资格考试',
    examType: '专业技术',
    registerStartTime: '2025-04-01',
    registerEndTime: '2025-04-30',
    examDate: '2025-06-15',
    examFee: 180,
    status: 'finished',
    totalQuestions: 100,
    duration: 150,
  },
];

export const mockExamRegistrations: ExamRegistration[] = [
  {
    id: 'ER001',
    examId: 'EX002',
    examName: '2025年度人力资源管理师考试',
    registrationNo: 'HR20250601001',
    applicantName: '张明华',
    idCard: '110101199001011234',
    registerDate: '2025-06-05',
    status: 'approved',
    examRoom: '第3考场',
    seatNo: '25号',
    ticketUrl: '/tickets/HR20250601001.pdf',
  },
  {
    id: 'ER002',
    examId: 'EX004',
    examName: '2025年度经济师专业技术资格考试',
    registrationNo: 'ECO20250401001',
    applicantName: '张明华',
    idCard: '110101199001011234',
    registerDate: '2025-04-10',
    status: 'approved',
    examRoom: '第5考场',
    seatNo: '12号',
    score: 86,
  },
];

export const mockECard: ECardInfo = {
  cardNo: '11010019900101123400',
  name: '张明华',
  idCard: '110101199001011234',
  issueDate: '2023-06-15',
  validDate: '2033-06-15',
  status: 'active',
  balance: 2568.5,
  lastUsedTime: '2025-06-15 09:32:15',
  lastUsedPlace: '北京协和医院',
};

export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'P001',
    amount: 335.7,
    type: 'medical',
    merchantName: '北京协和医院',
    paymentTime: '2025-06-15 09:32:15',
    paymentMethod: 'qrcode',
    status: 'success',
  },
  {
    id: 'P002',
    amount: 89.5,
    type: 'pharmacy',
    merchantName: '金象大药房',
    paymentTime: '2025-06-10 18:45:20',
    paymentMethod: 'nfc',
    status: 'success',
  },
  {
    id: 'P003',
    amount: 125.0,
    type: 'medical',
    merchantName: '朝阳区社区卫生服务中心',
    paymentTime: '2025-05-28 14:20:33',
    paymentMethod: 'qrcode',
    status: 'success',
  },
];

const generateEmployees = (): EmployeeInsurance[] => {
  const names = ['张伟', '王芳', '李强', '刘洋', '陈静', '杨帆', '赵磊', '周敏', '吴昊', '郑丽',
    '孙涛', '马超', '朱琳', '胡军', '郭娜', '林峰', '何勇', '高飞', '罗静', '梁晨'];
  const departments = ['技术部', '产品部', '市场部', '人事部', '财务部', '运营部', '设计部'];
  const positions = ['工程师', '经理', '主管', '专员', '总监', '助理', '实习生'];
  const types: InsuranceType[] = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  
  return names.map((name, index) => ({
    id: `EMP${(index + 1).toString().padStart(3, '0')}`,
    employeeName: name,
    idCard: `110101199${index % 9}${(index * 3) % 12 + 1}${(index * 7) % 28 + 1}${(1000 + index).toString().slice(-4)}`,
    insuranceTypes: types,
    paymentBase: 8000 + (index % 5) * 2000,
    startDate: `202${index % 5}-${((index * 3) % 12 + 1).toString().padStart(2, '0')}-01`,
    status: index < 18 ? 'normal' : 'suspended',
    department: departments[index % departments.length],
    position: positions[index % positions.length],
  }));
};

export const mockEmployees = generateEmployees();

export const mockUnemploymentApplications: UnemploymentApplication[] = [
  {
    id: 'UA001',
    applicationNo: 'SYJ20250601001',
    applicantName: '王伟',
    idCard: '110101199203154567',
    companyName: '北京智慧科技有限公司',
    applyDate: '2025-06-08',
    lastWorkDate: '2025-05-31',
    reason: '合同到期不续签',
    status: 'pending_review',
    monthlyBenefit: 2480,
    benefitMonths: 6,
  },
  {
    id: 'UA002',
    applicationNo: 'SYJ20250601002',
    applicantName: '李娜',
    idCard: '110101199508207890',
    companyName: '北京智慧科技有限公司',
    applyDate: '2025-06-05',
    lastWorkDate: '2025-05-20',
    reason: '协商一致解除劳动合同',
    status: 'reviewing',
    monthlyBenefit: 2480,
    benefitMonths: 12,
    reviewComment: '材料齐全，正在审核中',
  },
  {
    id: 'UA003',
    applicationNo: 'SYJ20250501001',
    applicantName: '张强',
    idCard: '110101198812102345',
    companyName: '北京智慧科技有限公司',
    applyDate: '2025-05-20',
    lastWorkDate: '2025-05-15',
    reason: '公司裁员',
    status: 'approved',
    monthlyBenefit: 2480,
    benefitMonths: 18,
    reviewComment: '审核通过，按月发放',
    reviewDate: '2025-05-25',
    reviewer: '刘经办',
  },
];

export const mockLaborContracts: LaborContract[] = [
  {
    id: 'LC001',
    contractNo: 'LDHT2024001',
    employeeName: '张伟',
    idCard: '110101199001012345',
    contractType: 'fixed_term',
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    position: '高级工程师',
    salary: 25000,
    status: 'signed',
    signDate: '2024-01-01',
    storageHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    createTime: '2023-12-25 10:00:00',
  },
  {
    id: 'LC002',
    contractNo: 'LDHT2024002',
    employeeName: '王芳',
    idCard: '110101199205156789',
    contractType: 'open_ended',
    startDate: '2024-03-15',
    position: '产品经理',
    salary: 22000,
    status: 'signed',
    signDate: '2024-03-15',
    storageHash: '0x8a3b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    createTime: '2024-03-10 14:30:00',
  },
  {
    id: 'LC003',
    contractNo: 'LDHT2025003',
    employeeName: '李强',
    idCard: '110101199510201234',
    contractType: 'fixed_term',
    startDate: '2025-06-01',
    endDate: '2028-05-31',
    position: '市场专员',
    salary: 12000,
    status: 'pending_sign',
    storageHash: '',
    createTime: '2025-05-28 09:00:00',
  },
  {
    id: 'LC004',
    contractNo: 'LDHT2023001',
    employeeName: '陈静',
    idCard: '110101198803085678',
    contractType: 'fixed_term',
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    position: '财务主管',
    salary: 18000,
    status: 'expired',
    signDate: '2023-01-01',
    storageHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    createTime: '2022-12-20 16:00:00',
  },
];

const generateSupervisionOrders = (): SupervisionOrder[] => {
  const businessTypes = ['社保转移', '医保报销', '失业金申领', '工伤认定', '生育津贴', '社保卡办理'];
  const handlers = ['刘经办', '陈主任', '王科员', '赵科长', '李处长'];
  const depts = ['社保科', '医保科', '失业科', '工伤科', '综合科'];
  const statuses: ('normal' | 'warning' | 'overdue' | 'completed')[] = ['normal', 'warning', 'overdue', 'completed'];
  
  const orders: SupervisionOrder[] = [];
  for (let i = 0; i < 20; i++) {
    const status = statuses[i % 4];
    const receiveDate = new Date(2025, 5, 15 - i);
    const deadlineDate = new Date(receiveDate);
    deadlineDate.setDate(deadlineDate.getDate() + 15);
    const remainingDays = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    orders.push({
      id: `SO${(i + 1).toString().padStart(3, '0')}`,
      businessType: businessTypes[i % businessTypes.length],
      businessNo: `YW${202506}${(100 + i).toString()}`,
      applicantName: `申请人${i + 1}`,
      applicantType: i % 3 === 0 ? 'enterprise' : 'personal',
      receiveDate: receiveDate.toISOString().split('T')[0],
      deadlineDate: deadlineDate.toISOString().split('T')[0],
      remainingDays: status === 'completed' ? 0 : remainingDays,
      status,
      currentNode: ['材料审核', '业务办理', '领导审批', '结果反馈'][i % 4],
      handler: handlers[i % handlers.length],
      handlerDept: depts[i % depts.length],
      slaDays: 15,
      priority: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
    });
  }
  return orders;
};

export const mockSupervisionOrders = generateSupervisionOrders();

export const mockSupervisionStats: SupervisionStatistics = {
  totalCount: 156,
  normalCount: 98,
  warningCount: 28,
  overdueCount: 12,
  completedCount: 18,
  avgHandlingDays: 8.5,
  onTimeRate: 92.3,
  trend: Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date: date.toISOString().split('T')[0],
      newCount: 15 + Math.floor(Math.random() * 10),
      completedCount: 12 + Math.floor(Math.random() * 8),
    };
  }),
  businessTypeDistribution: [
    { type: '社保转移', count: 35 },
    { type: '医保报销', count: 42 },
    { type: '失业金申领', count: 28 },
    { type: '工伤认定', count: 18 },
    { type: '生育津贴', count: 22 },
    { type: '社保卡办理', count: 11 },
  ],
};

export const mockPolicyTags: PolicyTag[] = [
  { id: 'T001', name: '企业职工', category: 'crowd', color: '#165DFF' },
  { id: 'T002', name: '灵活就业人员', category: 'crowd', color: '#0FC6C2' },
  { id: 'T003', name: '退休人员', category: 'crowd', color: '#FF7D00' },
  { id: 'T004', name: '城乡居民', category: 'crowd', color: '#00B42A' },
  { id: 'T005', name: '参保缴费', category: 'scene', color: '#165DFF' },
  { id: 'T006', name: '待遇领取', category: 'scene', color: '#722ED1' },
  { id: 'T007', name: '关系转移', category: 'scene', color: '#13C2C2' },
  { id: 'T008', name: '医疗报销', category: 'scene', color: '#FA8C16' },
  { id: 'T009', name: '最新政策', category: 'timeliness', color: '#F53F3F' },
  { id: 'T010', name: '长期有效', category: 'timeliness', color: '#52C41A' },
  { id: 'T011', name: '即将到期', category: 'timeliness', color: '#FAAD14' },
  { id: 'T012', name: '阶段性政策', category: 'timeliness', color: '#2F54EB' },
];

export const mockPolicyDocuments: PolicyDocument[] = [
  {
    id: 'P001',
    title: '关于调整2025年度社会保险缴费基数上下限的通知',
    documentNo: '京人社发〔2025〕12号',
    issuingAuthority: '北京市人力资源和社会保障局',
    publishDate: '2025-06-01',
    effectiveDate: '2025-07-01',
    expiryDate: '2026-06-30',
    validUntil: '2026-06-30',
    type: 'notice',
    tags: [mockPolicyTags[0], mockPolicyTags[4], mockPolicyTags[11]],
    summary: '根据本市上年度全口径城镇单位就业人员平均工资，调整2025年度社会保险缴费基数上下限标准。',
    content: '各参保单位、参保人员：\n\n根据《中华人民共和国社会保险法》及相关规定，结合本市上年度全口径城镇单位就业人员平均工资，经市政府同意，现就2025年度社会保险缴费基数上下限调整有关事项通知如下：\n\n一、缴费基数上下限\n（一）职工基本养老保险、失业保险缴费基数上限为33891元，下限为6778元。\n（二）职工基本医疗保险、工伤保险、生育保险缴费基数上限为33891元，下限为6778元。\n\n二、执行时间\n本通知自2025年7月1日起执行。\n\n北京市人力资源和社会保障局\n2025年6月1日',
    status: 'published',
    viewCount: 15680,
    applicableGroups: ['本市参保企业', '机关事业单位', '灵活就业人员', '个体工商户'],
    applicableScenarios: ['社保缴费申报', '工资核算', '社保补缴', '基数调整'],
    handlingMethods: [
      { channel: '线上办理', description: '通过北京人社APP、单位网上服务平台申报', url: '/personal/social-insurance' },
      { channel: '线下办理', description: '前往各社保经办机构服务窗口办理' },
    ],
  },
  {
    id: 'P002',
    title: '关于优化失业保险金申领流程的实施意见',
    documentNo: '京人社就发〔2025〕8号',
    issuingAuthority: '北京市人力资源和社会保障局',
    publishDate: '2025-05-15',
    effectiveDate: '2025-06-01',
    validUntil: '长期有效',
    type: 'policy',
    tags: [mockPolicyTags[1], mockPolicyTags[5], mockPolicyTags[8]],
    summary: '简化失业保险金申领材料，推行"免申即享"服务模式，实现线上全程办理。',
    content: '为深入贯彻落实"放管服"改革要求，进一步优化营商环境，提升失业保险服务便利度，现就优化失业保险金申领流程提出以下实施意见...',
    status: 'published',
    viewCount: 8956,
    applicableGroups: ['参保失业人员', '领取失业金人员', '灵活就业转失业人员'],
    applicableScenarios: ['失业保险金申领', '失业登记', '职业技能培训补贴', '创业扶持'],
    handlingMethods: [
      { channel: '线上办理', description: '通过北京人社APP、微信/支付宝小程序申领', url: '/personal/profile' },
      { channel: '线下办理', description: '前往街道便民服务中心办理' },
      { channel: '免申即享', description: '符合条件人员自动发放，无需申请' },
    ],
  },
  {
    id: 'P003',
    title: '关于做好2025年度基本医疗保险门诊共济保障工作的通知',
    documentNo: '京医保发〔2025〕6号',
    issuingAuthority: '北京市医疗保障局',
    publishDate: '2025-04-20',
    effectiveDate: '2025-05-01',
    expiryDate: '2025-12-31',
    validUntil: '2025-12-31',
    type: 'notice',
    tags: [mockPolicyTags[0], mockPolicyTags[7], mockPolicyTags[10]],
    summary: '完善门诊共济保障机制，优化个人账户使用范围，提高门诊待遇保障水平。',
    content: '为进一步健全职工基本医疗保险制度，增强门诊共济保障功能，根据国家医保局相关要求，结合本市实际，现就做好2025年度基本医疗保险门诊共济保障工作通知如下...',
    status: 'published',
    viewCount: 23456,
    applicableGroups: ['职工医保参保人员', '退休人员', '灵活就业医保参保人员'],
    applicableScenarios: ['门诊就医结算', '个人账户使用', '门诊慢特病报销', '家庭共济'],
    handlingMethods: [
      { channel: '线上查询', description: '通过北京医保APP查询个人账户明细', url: '/personal/medical' },
      { channel: '直接结算', description: '持社保卡在定点医院直接结算' },
    ],
  },
  {
    id: 'P004',
    title: '关于印发《北京市灵活就业人员参加社会保险办法》的通知',
    documentNo: '京人社发〔2025〕5号',
    issuingAuthority: '北京市人力资源和社会保障局',
    publishDate: '2025-03-10',
    effectiveDate: '2025-04-01',
    validUntil: '长期有效',
    type: 'policy',
    tags: [mockPolicyTags[1], mockPolicyTags[4], mockPolicyTags[9]],
    summary: '规范灵活就业人员参保缴费政策，扩大社会保险覆盖范围，保障灵活就业人员社保权益。',
    content: '为促进多渠道灵活就业，保障灵活就业人员社会保险权益，根据相关法律法规，结合本市实际，制定本办法...',
    status: 'published',
    viewCount: 12345,
    applicableGroups: ['个体工商户', '自由职业者', '新业态从业人员', '非全日制从业人员'],
    applicableScenarios: ['社保参保登记', '社保缴费', '社保补贴申请', '社保关系转移'],
    handlingMethods: [
      { channel: '线上办理', description: '通过北京人社APP办理参保登记', url: '/personal/profile' },
      { channel: '线下办理', description: '前往街道便民服务中心办理' },
    ],
  },
  {
    id: 'P005',
    title: '关于调整企业职工基本养老保险关系转移接续办理时限的通知',
    documentNo: '京人社养发〔2025〕3号',
    issuingAuthority: '北京市人力资源和社会保障局',
    publishDate: '2025-02-28',
    effectiveDate: '2025-03-15',
    validUntil: '长期有效',
    type: 'interpretation',
    tags: [mockPolicyTags[0], mockPolicyTags[6], mockPolicyTags[9]],
    summary: '压缩养老保险关系转移接续办理时限，从45个工作日压缩至15个工作日。',
    content: '为进一步提升养老保险关系转移接续服务效率，保障参保人员社保权益，根据国家有关规定，结合本市实际，现就调整企业职工基本养老保险关系转移接续办理时限通知如下...',
    status: 'published',
    viewCount: 6789,
    applicableGroups: ['跨省市流动就业人员', '跨省异地安置退休人员', '返回户籍地参保人员'],
    applicableScenarios: ['养老保险关系转移', '异地就业社保接续', '退休前社保归集'],
    handlingMethods: [
      { channel: '线上办理', description: '通过掌上12333APP、国家社保服务平台申请', url: '/personal/social-insurance' },
      { channel: '线下办理', description: '前往转入地社保经办机构申请' },
    ],
  },
];

export const mockPersonalGuides: GuideItem[] = [
  {
    id: 'G001',
    title: '养老保险关系转移接续',
    desc: '跨省市就业人员办理养老保险关系跨省转移',
    path: '/personal/social-insurance',
    category: '社会保险',
    materials: ['本人有效身份证件', '原参保地参保缴费凭证', '转入地就业证明材料', '本人银行卡账户信息'],
    flow: ['提交申请(线上/线下)', '转入地受理审核', '转出地开具信息表', '基金划转', '转入地账户接续办结'],
    time: '15个工作日',
    dept: '北京市社会保险基金管理中心',
    targetGroups: ['跨省市流动就业人员', '跨省异地安置退休人员', '返回户籍地参保人员'],
    scenarios: ['跨省就业', '异地工作调动', '退休前社保归集', '户籍迁移'],
    timeliness: 'medium',
    timelinessDesc: '男性不满50周岁、女性不满40周岁可随时办理',
    conditions: ['在转入地已参保缴费', '转出地社保关系已暂停', '在转出地无欠费记录', '未在多地同时参保'],
    onlineEntry: '/personal/social-insurance',
    offlineLocations: [
      { name: '北京市朝阳区社保中心', address: '北京市朝阳区周家井世通国际大厦E座', phone: '010-53916600' },
      { name: '北京市海淀区社保中心', address: '北京市海淀区西四环北路73号中关村人才发展中心', phone: '010-88506136' },
    ],
  },
  {
    id: 'G002',
    title: '医保异地就医备案',
    desc: '长期异地居住人员办理医保跨省直接结算备案',
    path: '/personal/medical',
    category: '医疗保险',
    materials: ['本人社保卡', '异地居住证明(异地户籍/居住证/居委会证明)', '代办人身份证(代办)'],
    flow: ['线上或窗口提交材料', '医保经办机构审核', '1个工作日内完成备案', '就医地定点医院直接结算'],
    time: '1个工作日',
    dept: '北京市医疗保障局异地就医管理处',
    targetGroups: ['异地长期居住人员', '异地安置退休人员', '常驻异地工作人员', '异地转诊人员'],
    scenarios: ['异地居住', '异地工作', '异地就医', '转诊转院'],
    timeliness: 'short',
    timelinessDesc: '备案长期有效，变更需重新备案',
    conditions: ['已参加北京市基本医疗保险', '符合异地就医备案情形', '社保卡状态正常'],
    onlineEntry: '/personal/medical',
    offlineLocations: [
      { name: '北京市医保经办大厅', address: '北京市丰台区西三环南路1号', phone: '010-12333' },
    ],
  },
  {
    id: 'G003',
    title: '公积金购房提取',
    desc: '购买自住住房提取住房公积金',
    path: '/personal/housing-fund',
    category: '住房公积金',
    materials: ['本人身份证', '不动产权证/购房合同', '购房发票', '本人银行卡'],
    flow: ['线上或柜台申请', '材料核验(1工作日)', '资金审批(2工作日)', '资金到账'],
    time: '3个工作日',
    dept: '北京住房公积金管理中心',
    targetGroups: ['购买自住住房职工', '购买二手房职工', '购买保障性住房职工'],
    scenarios: ['购买新房', '购买二手房', '购买经济适用房', '购买两限房'],
    timeliness: 'medium',
    timelinessDesc: '购房后一年内可申请提取',
    conditions: ['连续足额缴存住房公积金6个月以上', '购买的是自住住房', '本人及配偶无未结清的公积金贷款'],
    onlineEntry: '/personal/housing-fund',
    offlineLocations: [
      { name: '北京住房公积金管理中心东城管理部', address: '北京市东城区贡院西街9号', phone: '010-12329' },
    ],
  },
  {
    id: 'G004',
    title: '失业保险金申领',
    desc: '符合条件的失业人员按月领取失业保险金',
    path: '/personal/profile',
    category: '就业创业',
    materials: ['本人身份证', '解除劳动关系证明', '本人银行卡', '就业失业登记凭证'],
    flow: ['线上或柜台申领', '经办机构审核(5工作日)', '公示', '按月发放至银行卡'],
    time: '5个工作日',
    dept: '北京市人力资源和社会保障局失业保险处',
    targetGroups: ['参保满1年失业人员', '非因本人意愿中断就业人员', '已办理失业登记人员'],
    scenarios: ['合同到期终止', '被用人单位解除劳动合同', '用人单位裁员', '用人单位破产'],
    timeliness: 'short',
    timelinessDesc: '失业后60日内申领，逾期需说明理由',
    conditions: ['失业前已缴纳失业保险满1年', '非因本人意愿中断就业', '已办理失业登记并有求职要求'],
    onlineEntry: '/personal/profile',
    offlineLocations: [
      { name: '北京市各街道便民服务中心', address: '各街道便民服务中心均可办理' },
    ],
  },
  {
    id: 'G005',
    title: '职业技能提升补贴申领',
    desc: '参保职工取得职业资格证书后申领技能提升补贴',
    path: '/personal/profile',
    category: '就业创业',
    materials: ['本人身份证', '职业资格证书或技能等级证书', '本人银行卡', '社保缴费证明'],
    flow: ['证书核发后12个月内申请', '经办机构审核(10工作日)', '公示5日', '补贴发放至银行卡'],
    time: '15个工作日',
    dept: '北京市人力资源和社会保障局职业能力建设处',
    targetGroups: ['企业参保职工', '累计缴纳失业保险满12个月', '取得职业资格证书人员'],
    scenarios: ['取得初级(五级)证书', '取得中级(四级)证书', '取得高级(三级)证书', '技师/高级技师'],
    timeliness: 'medium',
    timelinessDesc: '证书核发后12个月内可申请',
    conditions: ['累计缴纳失业保险满12个月', '取得职业资格证书或技能等级证书', '在证书核发后12个月内申请'],
    onlineEntry: '/personal/profile',
    offlineLocations: [
      { name: '北京市各区职业技能鉴定中心', address: '各区职业技能鉴定中心均可办理' },
    ],
  },
  {
    id: 'G006',
    title: '灵活就业人员社保参保',
    desc: '灵活就业人员参加职工养老、医疗保险',
    path: '/personal/profile',
    category: '就业创业',
    materials: ['本人身份证', '本市户籍证明/居住证', '本人银行卡', '就业证明材料'],
    flow: ['线上或窗口提交申请', '经办机构审核(3工作日)', '办理参保登记', '按月代扣代缴'],
    time: '3个工作日',
    dept: '北京市人力资源和社会保障局养老保险处',
    targetGroups: ['本市户籍灵活就业人员', '持有居住证外埠灵活就业人员', '个体工商户', '新业态从业人员'],
    scenarios: ['自由职业者参保', '个体工商户参保', '网约车/外卖骑手参保', '电商从业者参保'],
    timeliness: 'long',
    timelinessDesc: '长期参保，按月缴费，累计满15年可领取养老金',
    conditions: ['男性未满60周岁、女性未满55周岁', '未在单位参加社会保险', '有合法稳定的经济收入'],
    onlineEntry: '/personal/profile',
    offlineLocations: [
      { name: '北京市各街道便民服务中心', address: '各街道便民服务中心均可办理' },
    ],
  },
  {
    id: 'G007',
    title: '电子社保卡申领',
    desc: '申领全国统一电子社保卡，享受移动支付等服务',
    path: '/personal/ecard',
    category: '社保卡服务',
    materials: ['本人有效身份证', '已激活的实体社保卡', '人脸识别认证'],
    flow: ['下载掌上12333/北京人社APP', '实名认证', '人脸识别', '设置密码完成申领'],
    time: '即时办结',
    dept: '北京市人力资源和社会保障局信息中心',
    targetGroups: ['持有实体社保卡的参保人员', '已完成实名认证的参保人员'],
    scenarios: ['医保移动支付', '社保查询', '养老金领取', '人社业务办理'],
    timeliness: 'immediate',
    timelinessDesc: '即时申领，长期有效，与实体社保卡一一对应',
    conditions: ['已申领实体社保卡', '实体社保卡已激活', '完成实名认证和人脸识别'],
    onlineEntry: '/personal/ecard',
  },
  {
    id: 'G008',
    title: '人事考试报名',
    desc: '公务员、事业单位、职业资格等考试在线报名',
    path: '/personal/exam',
    category: '人事考试',
    materials: ['本人身份证', '学历学位证书', '专业工作年限证明', '电子证件照'],
    flow: ['网上注册', '选择考试', '填写报名信息', '上传材料', '资格审核', '缴费完成报名'],
    time: '考务周期内',
    dept: '北京市人事考评办公室',
    targetGroups: ['公务员考试报考人员', '事业单位招聘报考人员', '专业技术资格考试人员', '职业技能等级考试人员'],
    scenarios: ['公务员考试', '事业单位招聘', '注册会计师考试', '教师资格考试', '建造师考试'],
    timeliness: 'medium',
    timelinessDesc: '按各考试考务周期为准，逾期不予补报',
    conditions: ['符合考试公告规定的学历要求', '符合专业工作年限要求', '无考试违纪记录'],
    onlineEntry: '/personal/exam',
  },
  {
    id: 'G009',
    title: '创业担保贷款申请',
    desc: '符合条件的创业者申请创业担保贷款及贴息',
    path: '/personal/profile',
    category: '就业创业',
    materials: ['本人身份证', '营业执照', '经营场所证明', '创业计划书', '反担保材料'],
    flow: ['创业担保贷款申请', '经办银行初审', '人社部门审核', '担保机构担保', '银行发放贷款'],
    time: '20个工作日',
    dept: '北京市人力资源和社会保障局就业促进处',
    targetGroups: ['自主创业人员', '复员转业退役军人', '高校毕业生', '就业困难人员'],
    scenarios: ['个人创业贷款', '合伙企业贷款', '小微企业贷款', '创业贴息支持'],
    timeliness: 'medium',
    timelinessDesc: '贷款期限最长3年，按时还款可申请贴息',
    conditions: ['有具体经营项目和营业执照', '信用记录良好', '有稳定的经营收入和还款能力', '提供必要的反担保'],
    onlineEntry: '/personal/profile',
    offlineLocations: [
      { name: '北京市各区人力资源和社会保障局', address: '各区人力社保局创业服务窗口' },
    ],
  },
  {
    id: 'G010',
    title: '失业人员职业培训报名',
    desc: '失业人员免费参加职业技能培训',
    path: '/personal/profile',
    category: '就业创业',
    materials: ['本人身份证', '就业失业登记证', '社保卡'],
    flow: ['线上或窗口报名', '选择培训项目', '参加培训', '培训考核', '获取职业资格证书'],
    time: '即时报名',
    dept: '北京市人力资源和社会保障局职业能力建设处',
    targetGroups: ['城镇登记失业人员', '农村转移就业劳动者', '毕业年度高校毕业生', '城乡未继续升学初高中毕业生'],
    scenarios: ['美容美发培训', '电工培训', '厨师培训', '家政服务培训', '计算机技能培训'],
    timeliness: 'medium',
    timelinessDesc: '培训周期1-6个月不等，培训期间享受生活补贴',
    conditions: ['处于失业状态', '有培训意愿和就业愿望', '能够保证培训时间'],
    onlineEntry: '/personal/profile',
    offlineLocations: [
      { name: '北京市各区职业技能培训机构', address: '各区定点职业技能培训机构' },
    ],
  },
];

export const mockEnterpriseGuides: GuideItem[] = [
  {
    id: 'EG001',
    title: '员工社保增员',
    desc: '新入职员工参加社会保险登记',
    path: '/enterprise/insurance',
    category: '社会保险',
    materials: ['员工身份证复印件', '劳动合同', '社保增员申报表', '工资发放凭证'],
    flow: ['登录企业网上服务平台', '录入员工信息', '上传材料', '系统校验通过', '当月生效'],
    time: '5个工作日',
    dept: '北京市社会保险基金管理中心',
    targetGroups: ['企业HR', '机关事业单位经办人', '个体工商户经营者'],
    scenarios: ['新员工入职', '异地员工调入', '员工社保恢复', '试用期转正参保'],
    timeliness: 'short',
    timelinessDesc: '每月5-25日办理，当月生效',
    conditions: ['员工已与单位建立劳动关系', '员工未在其他单位参保', '单位社保账户状态正常'],
    onlineEntry: '/enterprise/insurance',
    offlineLocations: [
      { name: '北京市各区社保中心企业服务窗口', address: '各区社保中心企业服务窗口' },
    ],
  },
  {
    id: 'EG002',
    title: '稳岗补贴申请',
    desc: '符合条件的企业申请失业保险稳岗返还',
    path: '/enterprise/profile',
    category: '就业创业',
    materials: ['企业营业执照', '上年度社保缴费证明', '不裁员或少裁员承诺书'],
    flow: ['网上申报', '人社部门初审', '公示5日', '资金拨付至企业账户'],
    time: '15个工作日',
    dept: '北京市人力资源和社会保障局失业保险处',
    targetGroups: ['参保企业', '受疫情影响困难企业', '服务业小微企业', '制造业企业'],
    scenarios: ['常规稳岗返还', '困难企业稳岗返还', '一次性留工培训补助', '一次性扩岗补助'],
    timeliness: 'medium',
    timelinessDesc: '每年1-12月可申请上年度稳岗补贴',
    conditions: ['参加失业保险并足额缴费满12个月', '裁员率不高于5.5%', '30人以下企业裁员率不高于20%'],
    onlineEntry: '/enterprise/profile',
  },
  {
    id: 'EG003',
    title: '电子劳动合同签订',
    desc: '通过人社平台签订并存证电子劳动合同',
    path: '/enterprise/contract',
    category: '劳动关系',
    materials: ['企业认证信息', '员工身份信息', '劳动合同模板'],
    flow: ['企业实名认证', '录入合同条款', '双方法人代表/员工电子签名', '平台存证'],
    time: '即时办结',
    dept: '北京市人力资源和社会保障局劳动关系处',
    targetGroups: ['企业HR', '机关事业单位经办人', '个体工商户经营者'],
    scenarios: ['新员工合同签订', '合同续订', '合同变更', '合同解除'],
    timeliness: 'immediate',
    timelinessDesc: '即时签订，平台永久存证，与纸质合同具有同等法律效力',
    conditions: ['企业已完成实名认证', '员工已完成实名认证', '合同条款符合法律法规要求'],
    onlineEntry: '/enterprise/contract',
  },
  {
    id: 'EG004',
    title: '员工社保减员',
    desc: '员工离职办理社会保险停保手续',
    path: '/enterprise/insurance',
    category: '社会保险',
    materials: ['员工身份证复印件', '解除劳动关系证明', '社保减员申报表'],
    flow: ['登录企业网上服务平台', '选择减员员工', '录入减员原因', '上传材料', '系统校验通过'],
    time: '3个工作日',
    dept: '北京市社会保险基金管理中心',
    targetGroups: ['企业HR', '机关事业单位经办人'],
    scenarios: ['员工辞职', '员工辞退', '劳动合同到期终止', '员工退休', '员工死亡'],
    timeliness: 'short',
    timelinessDesc: '每月5-25日办理，当月生效',
    conditions: ['员工已与单位解除劳动关系', '无社保欠费记录', '单位社保账户状态正常'],
    onlineEntry: '/enterprise/insurance',
  },
  {
    id: 'EG005',
    title: '失业金申领预审',
    desc: '企业为离职员工办理失业金申领预审',
    path: '/enterprise/unemployment',
    category: '就业创业',
    materials: ['员工身份证复印件', '解除劳动关系证明', '失业保险缴费证明'],
    flow: ['登录企业网上服务平台', '录入员工信息', '上传材料', '人社部门预审', '员工线上确认申领'],
    time: '5个工作日',
    dept: '北京市人力资源和社会保障局失业保险处',
    targetGroups: ['企业HR', '机关事业单位经办人'],
    scenarios: ['合同到期终止', '员工被辞退', '企业裁员', '企业破产'],
    timeliness: 'short',
    timelinessDesc: '员工离职后15日内办理，员工需在60日内确认申领',
    conditions: ['员工已缴纳失业保险满1年', '非因员工本人意愿中断就业', '员工已办理失业登记'],
    onlineEntry: '/enterprise/unemployment',
  },
  {
    id: 'EG006',
    title: '企业社保缴费基数申报',
    desc: '企业每年申报员工社会保险缴费基数',
    path: '/enterprise/insurance',
    category: '社会保险',
    materials: ['上年度员工工资明细表', '社保缴费基数申报表', '员工签字确认表'],
    flow: ['每年4-6月登录平台', '下载本单位人员信息', '录入缴费基数', '员工签字确认', '提交审核'],
    time: '10个工作日',
    dept: '北京市社会保险基金管理中心',
    targetGroups: ['企业HR', '机关事业单位经办人', '个体工商户经营者'],
    scenarios: ['年度基数申报', '新参保员工基数核定', '基数调整', '基数补缴'],
    timeliness: 'medium',
    timelinessDesc: '每年4-6月申报，7月起按新基数缴费',
    conditions: ['单位社保账户状态正常', '缴费基数符合上下限规定', '员工已签字确认'],
    onlineEntry: '/enterprise/insurance',
  },
  {
    id: 'EG007',
    title: '工伤认定申请',
    desc: '企业为受伤员工申请工伤认定',
    path: '/enterprise/profile',
    category: '社会保险',
    materials: ['工伤认定申请表', '员工身份证', '劳动关系证明', '医疗诊断证明', '事故情况说明'],
    flow: ['事故发生后30日内申请', '提交材料', '人社部门调查核实', '作出工伤认定决定', '送达认定结论'],
    time: '60个工作日',
    dept: '北京市人力资源和社会保障局工伤保险处',
    targetGroups: ['企业HR', '机关事业单位经办人'],
    scenarios: ['工作时间事故伤害', '上下班途中交通事故', '职业病认定', '突发疾病死亡'],
    timeliness: 'medium',
    timelinessDesc: '事故发生后30日内申请，特殊情况可延长至1年',
    conditions: ['员工与单位存在劳动关系', '符合工伤认定情形', '在规定时限内申请'],
    onlineEntry: '/enterprise/profile',
    offlineLocations: [
      { name: '北京市各区人力资源和社会保障局工伤保险科', address: '各区人力社保局工伤保险科' },
    ],
  },
  {
    id: 'EG008',
    title: '企业吸纳就业补贴申请',
    desc: '企业吸纳重点群体就业申请社保补贴和岗位补贴',
    path: '/enterprise/profile',
    category: '就业创业',
    materials: ['企业营业执照', '吸纳人员身份证明', '劳动合同', '社保缴费证明', '工资发放凭证'],
    flow: ['网上申报', '人社部门审核', '公示5日', '补贴拨付至企业账户'],
    time: '20个工作日',
    dept: '北京市人力资源和社会保障局就业促进处',
    targetGroups: ['吸纳就业困难人员企业', '吸纳高校毕业生企业', '吸纳脱贫人口企业', '吸纳退役士兵企业'],
    scenarios: ['吸纳就业困难人员社保补贴', '吸纳高校毕业生岗位补贴', '吸纳退役士兵税收优惠', '脱贫人口就业补贴'],
    timeliness: 'medium',
    timelinessDesc: '每季度第一个月申请上季度补贴，补贴期限最长3年',
    conditions: ['与吸纳人员签订1年以上劳动合同', '按时足额缴纳社会保险', '吸纳人员符合重点群体范围'],
    onlineEntry: '/enterprise/profile',
  },
];

const generateMessages = (): Message[] => {
  const types = ['system', 'business', 'warning', 'policy'] as const;
  const titles = [
    '您的社保转移申请已受理',
    '医保报销审核通过',
    '业务办理即将超时提醒',
    '新政策发布：社保缴费基数调整',
    '电子社保卡激活成功',
    '考试报名审核通过',
    '公积金提取申请已到账',
    '失业金申领已完成审核',
  ];
  
  return titles.map((title, index) => ({
    id: `MSG${(index + 1).toString().padStart(3, '0')}`,
    title,
    content: `${title}，请登录系统查看详情。`,
    type: types[index % types.length],
    isRead: index > 4,
    createTime: new Date(Date.now() - index * 86400000).toISOString(),
    relatedBusinessId: `BIZ${index + 1}`,
    relatedBusinessType: ['insurance', 'medical', 'supervision', 'policy', 'ecard', 'exam', 'housing', 'unemployment'][index % 8],
  }));
};

export const mockMessages = generateMessages();

const generateFaceAuthRecords = (): FaceAuthRecord[] => {
  const names = ['张明华', '李伟', '王芳', '刘强', '陈静', '赵磊', '孙丽', '周涛', '吴敏', '郑浩'];
  const channels: ('app' | 'web' | 'mini_program' | 'terminal')[] = ['app', 'web', 'mini_program', 'terminal'];
  const statuses: ('pending' | 'verifying' | 'success' | 'failed')[] = ['success', 'success', 'success', 'success', 'failed', 'pending'];
  
  return names.map((name, index) => ({
    id: `FA${(index + 1).toString().padStart(5, '0')}`,
    userId: `U${(100 + index).toString().padStart(4, '0')}`,
    userName: name,
    idCard: `110101199${index % 9}${(index * 3) % 12 + 1}${(index * 7) % 28 + 1}${(1000 + index).toString().slice(-4)}`,
    authTime: new Date(Date.now() - index * 3600000).toISOString(),
    authMethod: 'face' as const,
    status: statuses[index % statuses.length],
    similarity: statuses[index % statuses.length] === 'success' ? 92 + Math.random() * 7 : statuses[index % statuses.length] === 'failed' ? 60 + Math.random() * 20 : undefined,
    duration: Math.floor(Math.random() * 8 + 2),
    channel: channels[index % channels.length],
    remark: statuses[index % statuses.length] === 'failed' ? '人脸比对相似度不足' : undefined,
  }));
};

export const mockFaceAuthRecords = generateFaceAuthRecords();

const generateAuthReviewRecords = (): AuthReviewRecord[] => {
  const names = ['张伟', '李娜', '王强', '刘洋', '陈红', '杨明', '赵芳', '周杰', '吴磊', '郑丽',
    '孙浩', '马敏', '朱涛', '胡静', '郭明', '林芳', '何强', '高杰', '罗敏', '梁浩'];
  const authTypes = ['人脸实名认证', '身份证核验', '指纹认证', '社保卡激活', '养老资格认证'];
  const channels: ('app' | 'web' | 'mini_program' | 'terminal')[] = ['app', 'web', 'mini_program', 'terminal'];
  const statuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'pending', 'pending', 'approved', 'approved', 'rejected'];
  
  return names.map((name, index) => {
    const status = statuses[index % statuses.length];
    return {
      id: `AR${(index + 1).toString().padStart(5, '0')}`,
      applicationNo: `RZ${202506}${(1000 + index).toString()}`,
      applicantName: name,
      idCard: `110101199${index % 9}${(index * 3) % 12 + 1}${(index * 7) % 28 + 1}${(1000 + index).toString().slice(-4)}`,
      applyTime: new Date(Date.now() - index * 86400000 / 2).toISOString(),
      authType: authTypes[index % authTypes.length],
      status,
      channel: channels[index % channels.length],
      reviewer: status !== 'pending' ? ['刘经办', '陈主任', '王科员'][index % 3] : undefined,
      reviewTime: status !== 'pending' ? new Date(Date.now() - index * 86400000 / 2 + 3600000).toISOString() : undefined,
      reviewComment: status === 'rejected' ? '提交材料不清晰，请重新上传' : status === 'approved' ? '审核通过' : undefined,
    };
  });
};

export const mockAuthReviewRecords = generateAuthReviewRecords();

export const mockAuthStatistics: AuthStatistics = {
  todayCount: 1256,
  passRate: 94.8,
  avgDuration: 5.2,
  pendingCount: 38,
  trend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    const count = 800 + Math.floor(Math.random() * 600);
    return {
      date: date.toISOString().split('T')[0],
      count,
      successCount: Math.floor(count * (0.9 + Math.random() * 0.08)),
    };
  }),
  methodDistribution: [
    { method: '人脸识别', count: 4520 },
    { method: '指纹识别', count: 2180 },
    { method: '身份证核验', count: 3650 },
    { method: '密码验证', count: 1280 },
  ],
  channelDistribution: [
    { channel: 'APP端', count: 5680 },
    { channel: 'Web端', count: 2340 },
    { channel: '小程序', count: 1890 },
    { channel: '自助终端', count: 1720 },
  ],
  passRateTrend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      date: date.toISOString().split('T')[0],
      rate: parseFloat((90 + Math.random() * 8).toFixed(1)),
    };
  }),
};

export const mockPoliceDbStatus: PoliceDbStatus = {
  name: '公安人口信息库',
  status: 'connected',
  lastSyncTime: new Date().toISOString(),
  responseTime: 128,
  todayQueryCount: 8956,
};

export const mockInsuranceChanges: InsuranceChange[] = [
  { id: 'IC001', employeeName: '李小红', idCard: '110101199505126789', type: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], operationDate: '2025-06-20', effectiveMonth: '2025-07', status: 'completed', operator: '张明华' },
  { id: 'IC002', employeeName: '王建国', idCard: '110101199203154567', type: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], operationDate: '2025-06-18', effectiveMonth: '2025-07', status: 'processing', operator: '张明华' },
  { id: 'IC003', employeeName: '赵晓明', idCard: '110101198806072345', type: 'remove', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], operationDate: '2025-06-15', effectiveMonth: '2025-07', status: 'completed', operator: '张明华', remark: '员工辞职' },
  { id: 'IC004', employeeName: '陈思远', idCard: '110101199710089012', type: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], operationDate: '2025-06-12', effectiveMonth: '2025-06', status: 'completed', operator: '张明华' },
  { id: 'IC005', employeeName: '刘洋', idCard: '110101199401115678', type: 'remove', insuranceTypes: ['养老', '医疗', '失业', '工伤', '生育'], operationDate: '2025-06-10', effectiveMonth: '2025-06', status: 'pending', operator: '张明华', remark: '合同到期不续签' },
  { id: 'IC006', employeeName: '周婷', idCard: '110101199608233456', type: 'add', insuranceTypes: ['养老', '医疗', '失业', '工伤'], operationDate: '2025-06-08', effectiveMonth: '2025-06', status: 'completed', operator: '张明华' },
];

export const mockOperationLogs: OperationLog[] = [
  { id: 'LOG001', time: '2025-06-20 09:15:30', operator: '张明华', type: '业务办理', content: '为员工李小红办理社保增员' },
  { id: 'LOG002', time: '2025-06-18 14:22:45', operator: '张明华', type: '业务办理', content: '为员工王建国办理社保增员' },
  { id: 'LOG003', time: '2025-06-15 11:08:20', operator: '系统', type: '审核通过', content: '员工赵晓明减员申请审核通过' },
  { id: 'LOG004', time: '2025-06-12 16:45:10', operator: '张明华', type: '资料上传', content: '上传员工陈思远入职材料' },
  { id: 'LOG005', time: '2025-06-10 10:30:55', operator: '张明华', type: '业务办理', content: '为员工刘洋办理社保减员' },
  { id: 'LOG006', time: '2025-06-08 09:05:33', operator: '系统', type: '审核通过', content: '员工周婷增员申请审核通过' },
  { id: 'LOG007', time: '2025-06-05 15:20:18', operator: '张明华', type: '信息修改', content: '修改企业地址为北京市朝阳区建国路88号' },
  { id: 'LOG008', time: '2025-06-01 08:50:20', operator: '系统', type: '注册完成', content: '企业账号注册完成' },
];
