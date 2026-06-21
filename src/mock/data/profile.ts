import type { UserProfile } from '@/types'

export const mockUserProfile: UserProfile = {
  userId: 'u_001',
  userName: '张三',
  idCard: '362501199001011234',
  phone: '13800138001',
  updateTime: '2024-01-15 08:00:00',
  socialSecurity: {
    insuranceNo: 'SX362501199001011234',
    status: 'normal',
    participateDate: '2015-07-01',
    cumulativeMonths: 102,
    pensionBalance: 58620.50,
    personalAccountBalance: 23448.20,
    records: [
      {
        id: 'ssr_001',
        type: 'pension',
        period: '2024-01',
        base: 6000,
        personalPayment: 480,
        companyPayment: 960,
        status: 'paid',
        payTime: '2024-01-10 09:00:00'
      },
      {
        id: 'ssr_002',
        type: 'medical',
        period: '2024-01',
        base: 6000,
        personalPayment: 120,
        companyPayment: 480,
        status: 'paid',
        payTime: '2024-01-10 09:00:00'
      },
      {
        id: 'ssr_003',
        type: 'unemployment',
        period: '2024-01',
        base: 6000,
        personalPayment: 30,
        companyPayment: 60,
        status: 'paid',
        payTime: '2024-01-10 09:00:00'
      },
      {
        id: 'ssr_004',
        type: 'injury',
        period: '2024-01',
        base: 6000,
        personalPayment: 0,
        companyPayment: 30,
        status: 'paid',
        payTime: '2024-01-10 09:00:00'
      },
      {
        id: 'ssr_005',
        type: 'maternity',
        period: '2024-01',
        base: 6000,
        personalPayment: 0,
        companyPayment: 30,
        status: 'paid',
        payTime: '2024-01-10 09:00:00'
      },
      {
        id: 'ssr_006',
        type: 'pension',
        period: '2023-12',
        base: 5800,
        personalPayment: 464,
        companyPayment: 928,
        status: 'paid',
        payTime: '2023-12-12 10:00:00'
      },
      {
        id: 'ssr_007',
        type: 'pension',
        period: '2023-11',
        base: 5800,
        personalPayment: 464,
        companyPayment: 928,
        status: 'paid',
        payTime: '2023-11-10 09:00:00'
      },
      {
        id: 'ssr_008',
        type: 'pension',
        period: '2023-10',
        base: 5800,
        personalPayment: 464,
        companyPayment: 928,
        status: 'paid',
        payTime: '2023-10-11 09:30:00'
      },
      {
        id: 'ssr_009',
        type: 'pension',
        period: '2023-09',
        base: 5800,
        personalPayment: 464,
        companyPayment: 928,
        status: 'paid',
        payTime: '2023-09-12 08:45:00'
      },
      {
        id: 'ssr_010',
        type: 'pension',
        period: '2023-08',
        base: 5500,
        personalPayment: 440,
        companyPayment: 880,
        status: 'paid',
        payTime: '2023-08-10 09:15:00'
      }
    ]
  },
  medicalInsurance: {
    cardNo: 'YB362501199001011234',
    status: 'normal',
    participateDate: '2015-07-01',
    cumulativeMonths: 102,
    personalAccountBalance: 3256.80,
    overallAccountBalance: 0,
    thisYearReimbursement: 1580.00,
    totalReimbursement: 12560.00,
    records: [
      {
        id: 'mir_001',
        period: '2024-01',
        personalPayment: 120,
        companyPayment: 480,
        reimbursementAmount: 0,
        status: 'paid'
      },
      {
        id: 'mir_002',
        period: '2023-12',
        personalPayment: 116,
        companyPayment: 464,
        reimbursementAmount: 320,
        hospitalLevel: '二级',
        status: 'paid'
      },
      {
        id: 'mir_003',
        period: '2023-11',
        personalPayment: 116,
        companyPayment: 464,
        reimbursementAmount: 0,
        status: 'paid'
      },
      {
        id: 'mir_004',
        period: '2023-10',
        personalPayment: 116,
        companyPayment: 464,
        reimbursementAmount: 560,
        hospitalLevel: '三级',
        status: 'paid'
      },
      {
        id: 'mir_005',
        period: '2023-09',
        personalPayment: 116,
        companyPayment: 464,
        reimbursementAmount: 0,
        status: 'paid'
      },
      {
        id: 'mir_006',
        period: '2023-08',
        personalPayment: 110,
        companyPayment: 440,
        reimbursementAmount: 700,
        hospitalLevel: '一级',
        status: 'paid'
      }
    ]
  },
  education: {
    studentId: 'XJ20150101001',
    name: '张三',
    idCard: '362501199001011234',
    currentSchool: '东华理工大学',
    currentGrade: '硕士研究生二年级',
    currentClass: '计算机科学与技术2班',
    status: 'studying',
    enrollmentDate: '2022-09-01',
    expectedGraduationDate: '2025-06-30',
    educationHistory: [
      {
        id: 'edh_001',
        schoolName: '抚州市第一小学',
        educationLevel: 'primary',
        startTime: '1996-09-01',
        endTime: '2002-06-30',
        status: 'graduated'
      },
      {
        id: 'edh_002',
        schoolName: '抚州市第一中学',
        educationLevel: 'junior',
        startTime: '2002-09-01',
        endTime: '2005-06-30',
        status: 'graduated'
      },
      {
        id: 'edh_003',
        schoolName: '抚州市第一中学',
        educationLevel: 'senior',
        startTime: '2005-09-01',
        endTime: '2008-06-30',
        status: 'graduated'
      },
      {
        id: 'edh_004',
        schoolName: '南昌大学',
        educationLevel: 'university',
        startTime: '2008-09-01',
        endTime: '2012-06-30',
        major: '计算机科学与技术',
        status: 'graduated'
      },
      {
        id: 'edh_005',
        schoolName: '东华理工大学',
        educationLevel: 'university',
        startTime: '2022-09-01',
        endTime: '2025-06-30',
        major: '软件工程',
        status: 'studying'
      }
    ],
    scores: [
      {
        id: 'sc_001',
        semester: '2023-2024学年第一学期',
        subject: '高级软件工程',
        score: 92,
        level: 'excellent',
        classRank: 3,
        gradeRank: 8
      },
      {
        id: 'sc_002',
        semester: '2023-2024学年第一学期',
        subject: '机器学习',
        score: 88,
        level: 'good',
        classRank: 5,
        gradeRank: 15
      },
      {
        id: 'sc_003',
        semester: '2023-2024学年第一学期',
        subject: '分布式系统',
        score: 85,
        level: 'good',
        classRank: 8,
        gradeRank: 22
      },
      {
        id: 'sc_004',
        semester: '2022-2023学年第二学期',
        subject: '算法设计与分析',
        score: 95,
        level: 'excellent',
        classRank: 1,
        gradeRank: 2
      },
      {
        id: 'sc_005',
        semester: '2022-2023学年第二学期',
        subject: '数据库原理',
        score: 90,
        level: 'excellent',
        classRank: 4,
        gradeRank: 10
      }
    ]
  },
  housingFund: {
    accountNo: 'GJJ362501199001011234',
    status: 'normal',
    unitName: '抚州科技有限公司',
    participateDate: '2015-07-01',
    cumulativeMonths: 102,
    monthlyDeposit: 2400,
    personalDepositRatio: 12,
    companyDepositRatio: 12,
    balance: 156800.00,
    lastDepositDate: '2024-01-10',
    loan: {
      loanNo: 'DK20200101001',
      loanType: 'first_home',
      loanAmount: 500000,
      loanTerm: 360,
      interestRate: 3.1,
      monthlyPayment: 2176.03,
      remainingPrincipal: 438520.56,
      paidMonths: 48,
      overdueAmount: 0,
      status: 'normal',
      startDate: '2020-01-20',
      endDate: '2050-01-19'
    },
    records: [
      {
        id: 'hfr_001',
        period: '2024-01',
        type: 'deposit',
        amount: 2400,
        balance: 156800.00,
        description: '2024年1月公积金缴存',
        operator: '抚州科技有限公司',
        time: '2024-01-10 10:00:00'
      },
      {
        id: 'hfr_002',
        period: '2024-01',
        type: 'loan',
        amount: -2176.03,
        balance: 154400.00,
        description: '公积金贷款月供扣款',
        operator: '系统',
        time: '2024-01-20 08:00:00'
      },
      {
        id: 'hfr_003',
        period: '2023-12',
        type: 'deposit',
        amount: 2400,
        balance: 156576.03,
        description: '2023年12月公积金缴存',
        operator: '抚州科技有限公司',
        time: '2023-12-12 09:30:00'
      },
      {
        id: 'hfr_004',
        period: '2023-12',
        type: 'loan',
        amount: -2176.03,
        balance: 154176.03,
        description: '公积金贷款月供扣款',
        operator: '系统',
        time: '2023-12-20 08:00:00'
      },
      {
        id: 'hfr_005',
        period: '2023-11',
        type: 'deposit',
        amount: 2400,
        balance: 156352.06,
        description: '2023年11月公积金缴存',
        operator: '抚州科技有限公司',
        time: '2023-11-10 10:15:00'
      },
      {
        id: 'hfr_006',
        period: '2023-11',
        type: 'loan',
        amount: -2176.03,
        balance: 153952.06,
        description: '公积金贷款月供扣款',
        operator: '系统',
        time: '2023-11-20 08:00:00'
      },
      {
        id: 'hfr_007',
        period: '2023-06',
        type: 'interest',
        amount: 1256.80,
        balance: 151728.09,
        description: '2023年度公积金结息',
        operator: '系统',
        time: '2023-06-30 00:00:00'
      },
      {
        id: 'hfr_008',
        period: '2020-01',
        type: 'withdraw',
        amount: -80000,
        balance: 80000,
        description: '购房首付提取',
        operator: '张三',
        time: '2020-01-15 14:30:00'
      }
    ]
  }
}
