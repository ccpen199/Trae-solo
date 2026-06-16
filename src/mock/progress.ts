import dayjs from 'dayjs';

export interface MyCampusSession {
  id: string;
  name: string;
  school: string;
  date: string;
  time: string;
  venue: string;
  format: '线上' | '线下' | '混合';
  status: '待参加' | '进行中' | '已结束' | '已取消';
  replayUrl?: string;
  materialsUrl?: string;
  relatedPositions?: string[];
}

export interface MyWrittenExam {
  id: string;
  enterprise: string;
  position: string;
  duration: number;
  questionCount: number;
  deadline: string;
  status: '待开始' | '进行中' | '已完成' | '已截止';
  answeredCount?: number;
  score?: number;
  wrongAnswersUrl?: string;
  instructionsUrl?: string;
  mockTestUrl?: string;
}

export interface MyAIInterview {
  id: string;
  enterprise: string;
  position: string;
  questionCount: number;
  durationPerQuestion: number;
  expressionWeight: number;
  speechWeight: number;
  semanticsWeight: number;
  deadline: string;
  status: '待开始' | '进行中' | '已完成' | '待评分' | '已出分';
  appointmentStatus: '待预约' | '已预约' | '已完成';
  currentQuestionIndex?: number;
  expressionScore?: number;
  speechScore?: number;
  semanticsScore?: number;
  totalScore?: number;
  hrFeedback?: string;
  reportUrl?: string;
}

export interface MyFinalInterview {
  id: string;
  enterprise: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: '线上' | '线下';
  location: string;
  meetingUrl?: string;
  status: '待参加' | '进行中' | '已结束' | 'Offer 已发' | '已拒绝';
  salaryDetail?: string;
  mapUrl?: string;
}

export interface CampusProgress {
  sessions: MyCampusSession[];
  exams: MyWrittenExam[];
  aiInterviews: MyAIInterview[];
  finalInterviews: MyFinalInterview[];
}

export interface MyCourse {
  id: string;
  title: string;
  provider: string;
  type: '自考' | '成考' | '职业资格';
  progress: number;
  totalCredits: number;
  earnedCredits: number;
  status: '进行中' | '已完成' | '待开始';
  lastStudyTime?: string;
  coverColor: string;
}

export interface CreditRecord {
  id: string;
  source: '自考' | '成考' | '职业资格';
  courseTitle: string;
  credits: number;
  earnedAt: string;
}

export interface CertificationProgress {
  targetDegree: string;
  targetMajor: string;
  progressPercent: number;
  estimatedDate: string;
  timeline: {
    title: string;
    description: string;
    time: string;
    color: string;
    done: boolean;
  }[];
}

export interface EducationProgress {
  courses: MyCourse[];
  creditRecords: CreditRecord[];
  certification: CertificationProgress;
}

export const myCampusSessions: MyCampusSession[] = [
  {
    id: 'my_cs1',
    name: '中山市2025届秋季校园招聘会',
    school: '广东工业大学',
    date: '2024-10-15',
    time: '09:00-17:00',
    venue: '大学城校区体育馆',
    format: '线下',
    status: '待参加',
    relatedPositions: ['电气工程师', '机械设计工程师'],
  },
  {
    id: 'my_cs2',
    name: '智能制造专场招聘会',
    school: '华南理工大学',
    date: '2024-10-18',
    time: '14:00-18:00',
    venue: '五山校区就业指导中心',
    format: '线下',
    status: '进行中',
    materialsUrl: '/materials/cs2',
  },
  {
    id: 'my_cs3',
    name: '中山企业线上宣讲会',
    school: '广州大学',
    date: '2024-10-10',
    time: '19:00-21:00',
    venue: '腾讯会议',
    format: '线上',
    status: '已结束',
    replayUrl: '/replay/cs3',
    relatedPositions: ['前端开发工程师', 'Java开发工程师'],
  },
  {
    id: 'my_cs4',
    name: '新能源产业专场宣讲',
    school: '广东技术师范大学',
    date: '2024-10-08',
    time: '14:30-17:30',
    venue: '白云校区综合楼',
    format: '混合',
    status: '已取消',
  },
];

export const myWrittenExams: MyWrittenExam[] = [
  {
    id: 'my_we1',
    enterprise: '中山市明阳电器有限公司',
    position: '电气工程师',
    duration: 90,
    questionCount: 35,
    deadline: '2024-10-16 18:00',
    status: '待开始',
    instructionsUrl: '/instructions/we1',
    mockTestUrl: '/mock/we1',
  },
  {
    id: 'my_we2',
    enterprise: '广东三和管桩股份有限公司',
    position: '结构工程师',
    duration: 120,
    questionCount: 45,
    deadline: '2024-10-15 20:00',
    status: '进行中',
    answeredCount: 28,
  },
  {
    id: 'my_we3',
    enterprise: '中顺洁柔纸业股份有限公司',
    position: '供应链管理岗',
    duration: 60,
    questionCount: 30,
    deadline: '2024-10-12 12:00',
    status: '已完成',
    score: 85,
    wrongAnswersUrl: '/wrong-answers/we3',
  },
  {
    id: 'my_we4',
    enterprise: '中山大洋电机股份有限公司',
    position: '电机研发工程师',
    duration: 100,
    questionCount: 40,
    deadline: '2024-10-10 23:59',
    status: '已截止',
  },
];

export const myAIInterviews: MyAIInterview[] = [
  {
    id: 'my_ai1',
    enterprise: '中山市木林森股份有限公司',
    position: 'LED研发工程师',
    questionCount: 5,
    durationPerQuestion: 120,
    expressionWeight: 25,
    speechWeight: 35,
    semanticsWeight: 40,
    deadline: '2024-10-18 23:59',
    status: '待开始',
    appointmentStatus: '已预约',
  },
  {
    id: 'my_ai2',
    enterprise: '广东长青（集团）股份有限公司',
    position: '热能工程师',
    questionCount: 5,
    durationPerQuestion: 90,
    expressionWeight: 20,
    speechWeight: 40,
    semanticsWeight: 40,
    deadline: '2024-10-16 18:00',
    status: '进行中',
    appointmentStatus: '已预约',
    currentQuestionIndex: 3,
  },
  {
    id: 'my_ai3',
    enterprise: '中山华帝燃具股份有限公司',
    position: '产品设计师',
    questionCount: 6,
    durationPerQuestion: 150,
    expressionWeight: 30,
    speechWeight: 30,
    semanticsWeight: 40,
    deadline: '2024-10-14 12:00',
    status: '待评分',
    appointmentStatus: '已完成',
  },
  {
    id: 'my_ai4',
    enterprise: '广东顶固集创家居股份有限公司',
    position: '结构设计师',
    questionCount: 5,
    durationPerQuestion: 120,
    expressionWeight: 25,
    speechWeight: 35,
    semanticsWeight: 40,
    deadline: '2024-10-10 23:59',
    status: '已出分',
    appointmentStatus: '已完成',
    expressionScore: 88,
    speechScore: 92,
    semanticsScore: 85,
    totalScore: 88,
    hrFeedback: '表现优秀，逻辑清晰，建议进入终面',
    reportUrl: '/report/ai4',
  },
];

export const myFinalInterviews: MyFinalInterview[] = [
  {
    id: 'my_fi1',
    enterprise: '中山市格兰仕集团有限公司',
    position: '硬件研发工程师',
    interviewer: '李经理（HR总监）',
    date: '2024-10-16',
    time: '10:00-11:00',
    type: '线上',
    location: '腾讯会议ID: 856-234-901',
    meetingUrl: 'https://meeting.tencent.com/dm/example',
    status: '待参加',
  },
  {
    id: 'my_fi2',
    enterprise: '广东奥马电器股份有限公司',
    position: '制冷工程师',
    interviewer: '王总（技术总监）',
    date: '2024-10-18',
    time: '14:30-15:30',
    type: '线下',
    location: '中山市南头镇东福北路58号奥马工业园行政楼3楼会议室',
    status: '待参加',
    mapUrl: 'https://maps.google.com/?q=奥马工业园',
  },
  {
    id: 'my_fi3',
    enterprise: '中山中炬高新技术实业股份有限公司',
    position: '项目管理岗',
    interviewer: '张女士（人力资源部）',
    date: '2024-10-12',
    time: '09:30-10:30',
    type: '线上',
    location: '腾讯会议ID: 428-765-132',
    meetingUrl: 'https://meeting.tencent.com/dm/example2',
    status: 'Offer 已发',
    salaryDetail: '年薪18-22万，五险一金，年终奖3-6个月',
  },
  {
    id: 'my_fi4',
    enterprise: '广东通宇通讯股份有限公司',
    position: '射频工程师',
    interviewer: '刘经理（研发部）',
    date: '2024-10-08',
    time: '15:00-16:00',
    type: '线下',
    location: '中山市火炬开发区东镇东二路1号',
    status: '已拒绝',
  },
];

export const campusProgress: CampusProgress = {
  sessions: myCampusSessions,
  exams: myWrittenExams,
  aiInterviews: myAIInterviews,
  finalInterviews: myFinalInterviews,
};

export const myCourses: MyCourse[] = [
  {
    id: 'my_c1',
    title: '机电一体化技术大专班 - 电工基础',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 75,
    totalCredits: 4,
    earnedCredits: 3,
    status: '进行中',
    lastStudyTime: '2024-10-10 20:30',
    coverColor: 'from-industrial-blue-500 to-industrial-blue-600',
  },
  {
    id: 'my_c2',
    title: '机电一体化技术大专班 - 机械设计基础',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 50,
    totalCredits: 4,
    earnedCredits: 2,
    status: '进行中',
    lastStudyTime: '2024-10-08 19:00',
    coverColor: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'my_c3',
    title: '机电一体化技术大专班 - 机械制图',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 100,
    totalCredits: 4,
    earnedCredits: 4,
    status: '已完成',
    lastStudyTime: '2024-06-15 15:00',
    coverColor: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'my_c4',
    title: '工业机器人操作与编程认证',
    provider: '中山市技师学院',
    type: '职业资格',
    progress: 100,
    totalCredits: 6,
    earnedCredits: 6,
    status: '已完成',
    lastStudyTime: '2024-08-20 16:30',
    coverColor: 'from-vital-orange-500 to-vital-orange-600',
  },
];

export const creditRecords: CreditRecord[] = [
  {
    id: 'cr1',
    source: '自考',
    courseTitle: '机械制图',
    credits: 4,
    earnedAt: '2024-06-15',
  },
  {
    id: 'cr2',
    source: '职业资格',
    courseTitle: '工业机器人操作与编程',
    credits: 6,
    earnedAt: '2024-08-20',
  },
  {
    id: 'cr3',
    source: '自考',
    courseTitle: '电工基础（部分）',
    credits: 2,
    earnedAt: '2024-09-10',
  },
];

export const certificationProgress: CertificationProgress = {
  targetDegree: '大专',
  targetMajor: '机电一体化技术',
  progressPercent: 45,
  estimatedDate: '2026年09月',
  timeline: [
    {
      title: '报名注册',
      description: '提交报名材料，完成学籍注册',
      time: '2024-03-01',
      color: '#00B42A',
      done: true,
    },
    {
      title: '课程学习',
      description: '完成规定学分课程学习',
      time: '2024-03-15 ~ 至今',
      color: '#165DFF',
      done: true,
    },
    {
      title: '学分银行对接',
      description: '已修课程学分同步至学分银行',
      time: '进行中',
      color: '#FF7D00',
      done: false,
    },
    {
      title: '毕业审核',
      description: '学分达到要求，提交毕业申请',
      time: '预计 2026-06',
      color: '#C9CDD4',
      done: false,
    },
    {
      title: '学历认证',
      description: '学信网学历认证，颁发毕业证书',
      time: '预计 2026-09',
      color: '#C9CDD4',
      done: false,
    },
  ],
};

export const educationProgress: EducationProgress = {
  courses: myCourses,
  creditRecords,
  certification: certificationProgress,
};

export const getCampusHomeBadge = () => {
  const pendingInterviews = myAIInterviews.filter((i) => i.status === '待开始').length;
  const reservedSessions = myCampusSessions.filter((s) => s.status === '待参加' || s.status === '进行中').length;
  if (pendingInterviews > 0) {
    return {
      text: `${pendingInterviews} 个待面试`,
      tooltip: myAIInterviews.map((i) => `${i.enterprise} - ${i.position}`).join('\n'),
    };
  }
  if (reservedSessions > 0) {
    const latest = myCampusSessions[0];
    return {
      text: `${reservedSessions} 场宣讲预约成功`,
      tooltip: `${latest.name}\n${dayjs(latest.date).format('MM-DD')} ${latest.time}`,
    };
  }
  return null;
};

export const getEducationHomeBadge = () => {
  const learningCourses = myCourses.filter((c) => c.status === '进行中').length;
  const totalCredits = creditRecords.reduce((sum, c) => sum + c.credits, 0);
  if (learningCourses > 0) {
    return {
      text: `${learningCourses} 门学习中`,
      tooltip: myCourses
        .filter((c) => c.status === '进行中')
        .map((c) => `${c.title} (${c.progress}%)`)
        .join('\n'),
    };
  }
  if (totalCredits > 0) {
    return {
      text: `已获 ${totalCredits} 学分`,
      tooltip: `累计获得 ${totalCredits} 学分\n目标：${certificationProgress.targetDegree} ${certificationProgress.targetMajor}`,
    };
  }
  return null;
};

export const countdownText = (deadline: string) => {
  const now = dayjs();
  const end = dayjs(deadline);
  const diffHours = end.diff(now, 'hour');
  if (diffHours < 0) return '已截止';
  if (diffHours < 24) return `剩余 ${diffHours} 小时`;
  return `剩余 ${Math.floor(diffHours / 24)} 天 ${diffHours % 24} 小时`;
};

export const getTotalEarnedCredits = () => {
  return creditRecords.reduce((sum, c) => sum + c.credits, 0);
};

export const getCreditDistribution = () => {
  const distribution: Record<string, number> = {
    自考: 0,
    成考: 0,
    职业资格: 0,
  };
  creditRecords.forEach((r) => {
    distribution[r.source] += r.credits;
  });
  return distribution;
};

export interface RPOProcessStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
  completedAt?: string;
}

export interface BackgroundCheckDetail {
  project: string;
  result: '通过' | '不通过' | '待核查';
  description: string;
}

export interface BackgroundCheck {
  authorized: boolean;
  authorizedAt?: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  resultLevel?: '优秀' | '良好' | '合格' | '不合格';
  items: BackgroundCheckDetail[];
}

export interface ApplicationOperationRecord {
  time: string;
  operator: string;
  remark: string;
}

export interface ApplicationHRFeedback {
  time: string;
  content: string;
}

export interface DownloadableDocument {
  name: string;
  type: '面试邀请' | 'Offer' | '入职通知' | '其他';
  url: string;
  uploadedAt: string;
}

export interface MyApplication {
  id: string;
  positionId: string;
  positionTitle: string;
  enterpriseName: string;
  township: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  status: '处理中' | '面试中' | 'Offer' | '已入职' | '未通过';
  subStatus?: string;
  appliedAt: string;
  lastUpdatedAt: string;
  rpoStages: RPOProcessStep[];
  currentStageIndex: number;
  operationRecords: ApplicationOperationRecord[];
  backgroundCheck?: BackgroundCheck;
  hrFeedbacks: ApplicationHRFeedback[];
  documents: DownloadableDocument[];
  probationProgress?: number;
  offerDeadline?: string;
}

export interface AvailableSubsidy {
  id: string;
  type: SubsidyType;
  name: string;
  icon: string;
  amountRange: string;
  description: string;
  conditions: string[];
  requiredMaterials: string[];
  color: string;
  bgColor: string;
}

export interface MySubsidyApplication {
  id: string;
  type: SubsidyType;
  typeName: string;
  amount: number;
  appliedAt: string;
  status: '草稿' | '已提交' | '审核中' | '已通过' | '已拒绝' | '已发放';
  currentStep: number;
  totalSteps: number;
  auditTrail: {
    step: string;
    operator: string;
    comment?: string;
    status: '待审核' | '审核中' | '通过' | '驳回';
    operatedAt: string;
  }[];
  progressPercent: number;
  rejectReason?: string;
  paidAt?: string;
}

export type SubsidyType = 'GRADUATE_EMPLOY' | 'SKILL_UPGRADE' | 'SOCIAL_INSURANCE' | 'HOUSING';

export const AVAILABLE_SUBSIDIES: AvailableSubsidy[] = [
  {
    id: 'subsidy-graduate',
    type: 'GRADUATE_EMPLOY',
    name: '高校毕业生就业补贴',
    icon: '🎓',
    amountRange: '3000-5000元',
    description: '中山就业满6个月可申请一次性就业补贴',
    conditions: [
      '毕业2年内高校毕业生',
      '在中山市企业就业',
      '签订1年以上劳动合同',
      '连续缴纳社保满6个月',
      '申请时仍在岗',
    ],
    requiredMaterials: [
      '身份证',
      '毕业证书',
      '劳动合同',
      '社保缴费证明',
      '工资发放凭证',
    ],
    color: 'text-vital-orange-600',
    bgColor: 'bg-vital-orange-100',
  },
  {
    id: 'subsidy-skill',
    type: 'SKILL_UPGRADE',
    name: '技能提升补贴',
    icon: '🔧',
    amountRange: '1000-3000元',
    description: '取得职业资格证书后可申请技能提升补贴',
    conditions: [
      '在中山市就业并缴纳社保',
      '取得中级及以上职业资格证书',
      '证书核发之日起12个月内申请',
      '证书工种与岗位匹配',
    ],
    requiredMaterials: [
      '身份证',
      '职业资格证书',
      '社保缴费证明',
      '劳动合同',
    ],
    color: 'text-industrial-blue-600',
    bgColor: 'bg-industrial-blue-100',
  },
  {
    id: 'subsidy-social',
    type: 'SOCIAL_INSURANCE',
    name: '灵活就业社保补贴',
    icon: '🛡️',
    amountRange: '300-500元/月',
    description: '灵活就业人员社保补贴，按月发放',
    conditions: [
      '中山市户籍就业困难人员',
      '以灵活就业形式缴纳社保',
      '办理灵活就业登记',
      '按月足额缴纳社保费',
    ],
    requiredMaterials: [
      '身份证',
      '户口本',
      '灵活就业登记证明',
      '社保缴费凭证',
    ],
    color: 'text-success-600',
    bgColor: 'bg-success-100',
  },
  {
    id: 'subsidy-housing',
    type: 'HOUSING',
    name: '新引进人才住房补贴',
    icon: '🏠',
    amountRange: '200-500元/月',
    description: '新引进人才住房补贴，最长补贴36个月',
    conditions: [
      '35周岁以下全日制本科及以上学历',
      '毕业2年内新引进到中山市企业工作',
      '在中山市无自有住房',
      '签订1年以上劳动合同并缴纳社保',
    ],
    requiredMaterials: [
      '身份证',
      '毕业证书',
      '劳动合同',
      '社保缴费证明',
      '无房证明',
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

export const myApplications: MyApplication[] = [
  {
    id: 'app-1',
    positionId: 'pos-1',
    positionTitle: '高级电气工程师',
    enterpriseName: '中山市明阳电器有限公司',
    township: '火炬开发区',
    salaryMin: 15,
    salaryMax: 25,
    matchScore: 92,
    status: '已入职',
    subStatus: '保用期第2个月',
    appliedAt: '2024-08-15',
    lastUpdatedAt: '2024-10-08',
    probationProgress: 67,
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-08-16' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-08-18' },
      { name: '初筛', status: 'completed', completedAt: '2024-08-22' },
      { name: '推荐', status: 'completed', completedAt: '2024-08-25' },
      { name: '面试', status: 'completed', completedAt: '2024-09-05' },
      { name: 'Offer', status: 'completed', completedAt: '2024-09-10' },
      { name: '入职', status: 'completed', completedAt: '2024-09-15' },
      { name: '保用期', status: 'current' },
    ],
    currentStageIndex: 7,
    operationRecords: [
      { time: '2024-08-16 10:30', operator: '系统', remark: '投递成功，进入RPO流程' },
      { time: '2024-08-18 14:20', operator: 'RPO顾问-李娜', remark: '简历初筛通过，安排AI初筛' },
      { time: '2024-08-22 16:45', operator: 'AI系统', remark: 'AI初筛评分88分，进入HR初面' },
      { time: '2024-08-25 09:15', operator: 'RPO顾问-李娜', remark: '已推荐至企业HR' },
      { time: '2024-09-01 10:00', operator: '企业HR-张明', remark: '邀请参加技术面试' },
      { time: '2024-09-05 15:30', operator: '技术总监-王工', remark: '技术面试通过，评分优秀' },
      { time: '2024-09-08 14:00', operator: '企业HR-张明', remark: 'HR终面通过，准备发Offer' },
      { time: '2024-09-10 09:00', operator: '系统', remark: 'Offer已发送，待确认' },
      { time: '2024-09-12 16:30', operator: '求职者', remark: '已接受Offer' },
      { time: '2024-09-15 08:30', operator: '企业HR-张明', remark: '已办理入职手续' },
    ],
    backgroundCheck: {
      authorized: true,
      authorizedAt: '2024-09-08',
      progress: 100,
      totalItems: 5,
      completedItems: 5,
      resultLevel: '优秀',
      items: [
        { project: '学历验证', result: '通过', description: '本科毕业证书验证通过' },
        { project: '工作经历', result: '通过', description: '前两家公司工作经历核实无误' },
        { project: '社保记录', result: '通过', description: '社保缴费连续，无异常' },
        { project: '不良记录', result: '通过', description: '无犯罪记录、无失信记录' },
        { project: '职业资格', result: '通过', description: '电气工程师资格证验证通过' },
      ],
    },
    hrFeedbacks: [
      { time: '2024-08-22', content: '您的AI初筛表现优秀，我们将尽快安排HR面试，请保持电话畅通。' },
      { time: '2024-09-05', content: '技术面试反馈：专业基础扎实，项目经验丰富，非常适合我们的岗位需求。' },
      { time: '2024-09-10', content: '恭喜您通过所有面试！我们已发送正式Offer，请查收邮件。' },
    ],
    documents: [
      { name: 'Offer通知书.pdf', type: 'Offer', url: '/docs/offer-1.pdf', uploadedAt: '2024-09-10' },
      { name: '入职须知.pdf', type: '入职通知', url: '/docs/onboard-1.pdf', uploadedAt: '2024-09-12' },
    ],
  },
  {
    id: 'app-2',
    positionId: 'pos-2',
    positionTitle: '机械设计工程师',
    enterpriseName: '中山大洋电机股份有限公司',
    township: '西区街道',
    salaryMin: 12,
    salaryMax: 20,
    matchScore: 88,
    status: '面试中',
    subStatus: '待HR终面',
    appliedAt: '2024-09-20',
    lastUpdatedAt: '2024-10-10',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-21' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-09-23' },
      { name: '初筛', status: 'completed', completedAt: '2024-09-28' },
      { name: '推荐', status: 'completed', completedAt: '2024-10-01' },
      { name: '面试', status: 'current' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 4,
    operationRecords: [
      { time: '2024-09-21 09:00', operator: '系统', remark: '投递成功' },
      { time: '2024-09-23 15:30', operator: 'RPO顾问-王芳', remark: '简历筛选通过' },
      { time: '2024-09-28 11:00', operator: 'AI系统', remark: 'AI初筛评分85分，通过' },
      { time: '2024-10-01 10:00', operator: 'RPO顾问-王芳', remark: '已推荐至企业' },
      { time: '2024-10-08 14:00', operator: '企业HR-刘经理', remark: '技术面试已安排' },
    ],
    backgroundCheck: {
      authorized: false,
      progress: 0,
      totalItems: 5,
      completedItems: 0,
      items: [
        { project: '学历验证', result: '待核查', description: '' },
        { project: '工作经历', result: '待核查', description: '' },
        { project: '社保记录', result: '待核查', description: '' },
        { project: '不良记录', result: '待核查', description: '' },
        { project: '职业资格', result: '待核查', description: '' },
      ],
    },
    hrFeedbacks: [
      { time: '2024-09-28', content: 'AI初筛通过！您的专业背景与岗位高度匹配，我们已安排技术面试。' },
      { time: '2024-10-08', content: '技术面试时间：10月12日 14:00，请提前准备好项目介绍。' },
    ],
    documents: [
      { name: '面试邀请.pdf', type: '面试邀请', url: '/docs/interview-2.pdf', uploadedAt: '2024-10-08' },
    ],
  },
  {
    id: 'app-3',
    positionId: 'pos-3',
    positionTitle: 'LED研发工程师',
    enterpriseName: '中山市木林森股份有限公司',
    township: '小榄镇',
    salaryMin: 18,
    salaryMax: 30,
    matchScore: 85,
    status: 'Offer',
    subStatus: '待确认',
    appliedAt: '2024-09-01',
    lastUpdatedAt: '2024-10-08',
    offerDeadline: '2024-10-15',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-02' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-09-05' },
      { name: '初筛', status: 'completed', completedAt: '2024-09-10' },
      { name: '推荐', status: 'completed', completedAt: '2024-09-12' },
      { name: '面试', status: 'completed', completedAt: '2024-09-25' },
      { name: 'Offer', status: 'current' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 5,
    operationRecords: [
      { time: '2024-09-02 10:00', operator: '系统', remark: '投递成功' },
      { time: '2024-09-05 14:20', operator: 'RPO顾问-李强', remark: '简历筛选通过' },
      { time: '2024-09-10 16:00', operator: 'AI系统', remark: 'AI初筛评分82分，通过' },
      { time: '2024-09-12 09:30', operator: 'RPO顾问-李强', remark: '已推荐至企业' },
      { time: '2024-09-20 10:00', operator: '企业HR-陈小姐', remark: '面试安排已发送' },
      { time: '2024-09-25 17:00', operator: '技术总监-林总', remark: '面试通过，建议录用' },
      { time: '2024-10-08 09:00', operator: '系统', remark: 'Offer已发送' },
    ],
    backgroundCheck: {
      authorized: true,
      authorizedAt: '2024-09-28',
      progress: 60,
      totalItems: 5,
      completedItems: 3,
      items: [
        { project: '学历验证', result: '通过', description: '硕士学历验证通过' },
        { project: '工作经历', result: '通过', description: '工作经历核实无误' },
        { project: '社保记录', result: '通过', description: '社保记录正常' },
        { project: '不良记录', result: '待核查', description: '核查中' },
        { project: '职业资格', result: '待核查', description: '核查中' },
      ],
    },
    hrFeedbacks: [
      { time: '2024-09-25', content: '面试表现优秀！您的研发经验正是我们需要的。' },
      { time: '2024-10-08', content: '恭喜！我们已发出录用通知，期待您的加入。请在10月15日前确认。' },
    ],
    documents: [
      { name: 'Offer通知书.pdf', type: 'Offer', url: '/docs/offer-3.pdf', uploadedAt: '2024-10-08' },
    ],
  },
  {
    id: 'app-4',
    positionId: 'pos-4',
    positionTitle: 'CNC操作员',
    enterpriseName: '中山市五金制品有限公司',
    township: '东凤镇',
    salaryMin: 7,
    salaryMax: 10,
    matchScore: 78,
    status: '处理中',
    subStatus: '简历筛选中',
    appliedAt: '2024-10-05',
    lastUpdatedAt: '2024-10-08',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-10-06' },
      { name: '简历筛选', status: 'current' },
      { name: '初筛', status: 'pending' },
      { name: '推荐', status: 'pending' },
      { name: '面试', status: 'pending' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 1,
    operationRecords: [
      { time: '2024-10-06 09:00', operator: '系统', remark: '投递成功' },
      { time: '2024-10-07 14:30', operator: 'RPO顾问-张伟', remark: '正在筛选简历' },
    ],
    hrFeedbacks: [],
    documents: [],
  },
  {
    id: 'app-5',
    positionId: 'pos-5',
    positionTitle: '品质检验员',
    enterpriseName: '中顺洁柔纸业股份有限公司',
    township: '东升镇',
    salaryMin: 5,
    salaryMax: 8,
    matchScore: 72,
    status: '未通过',
    subStatus: '简历筛选未通过',
    appliedAt: '2024-09-25',
    lastUpdatedAt: '2024-10-02',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-26' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-10-02' },
      { name: '初筛', status: 'pending' },
      { name: '推荐', status: 'pending' },
      { name: '面试', status: 'pending' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 1,
    operationRecords: [
      { time: '2024-09-26 10:00', operator: '系统', remark: '投递成功' },
      { time: '2024-10-02 15:30', operator: '企业HR-李小姐', remark: '简历筛选未通过' },
    ],
    hrFeedbacks: [
      { time: '2024-10-02', content: '感谢您的申请，经过综合评估，您的经历与岗位要求存在一定差距，我们已将您的简历存入人才库，后续有合适岗位会再联系您。' },
    ],
    documents: [],
  },
  {
    id: 'app-6',
    positionId: 'pos-6',
    positionTitle: '前端开发工程师',
    enterpriseName: '中山智慧科技有限公司',
    township: '东区街道',
    salaryMin: 12,
    salaryMax: 18,
    matchScore: 90,
    status: '面试中',
    subStatus: '待技术面试',
    appliedAt: '2024-09-28',
    lastUpdatedAt: '2024-10-09',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-29' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-10-01' },
      { name: '初筛', status: 'completed', completedAt: '2024-10-05' },
      { name: '推荐', status: 'completed', completedAt: '2024-10-07' },
      { name: '面试', status: 'current' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 4,
    operationRecords: [
      { time: '2024-09-29 09:00', operator: '系统', remark: '投递成功' },
      { time: '2024-10-01 11:30', operator: 'RPO顾问-黄晓', remark: '简历筛选通过' },
      { time: '2024-10-05 16:00', operator: 'AI系统', remark: 'AI初筛评分90分，优秀' },
      { time: '2024-10-07 10:00', operator: 'RPO顾问-黄晓', remark: '已推荐至企业' },
      { time: '2024-10-09 14:00', operator: '企业HR-周经理', remark: '技术面试时间待确认' },
    ],
    backgroundCheck: {
      authorized: false,
      progress: 0,
      totalItems: 5,
      completedItems: 0,
      items: [
        { project: '学历验证', result: '待核查', description: '' },
        { project: '工作经历', result: '待核查', description: '' },
        { project: '社保记录', result: '待核查', description: '' },
        { project: '不良记录', result: '待核查', description: '' },
        { project: '职业资格', result: '待核查', description: '' },
      ],
    },
    hrFeedbacks: [
      { time: '2024-10-05', content: 'AI初筛表现优秀！您的React和TypeScript经验非常符合我们的需求。' },
    ],
    documents: [],
  },
  {
    id: 'app-7',
    positionId: 'pos-7',
    positionTitle: '模具设计师',
    enterpriseName: '广东三和管桩股份有限公司',
    township: '板芙镇',
    salaryMin: 10,
    salaryMax: 16,
    matchScore: 82,
    status: '处理中',
    subStatus: 'RPO推荐中',
    appliedAt: '2024-10-02',
    lastUpdatedAt: '2024-10-10',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-10-03' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-10-05' },
      { name: '初筛', status: 'completed', completedAt: '2024-10-08' },
      { name: '推荐', status: 'current' },
      { name: '面试', status: 'pending' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 3,
    operationRecords: [
      { time: '2024-10-03 10:00', operator: '系统', remark: '投递成功' },
      { time: '2024-10-05 14:00', operator: 'RPO顾问-陈静', remark: '简历筛选通过' },
      { time: '2024-10-08 11:00', operator: 'AI系统', remark: 'AI初筛评分78分，通过' },
      { time: '2024-10-09 16:30', operator: 'RPO顾问-陈静', remark: '正在与企业沟通推荐' },
    ],
    hrFeedbacks: [
      { time: '2024-10-08', content: '您的模具设计经验与岗位匹配度较高，我们正在积极向企业推荐。' },
    ],
    documents: [],
  },
  {
    id: 'app-8',
    positionId: 'pos-8',
    positionTitle: '自动化设备维护',
    enterpriseName: '中山市格兰仕集团有限公司',
    township: '黄圃镇',
    salaryMin: 8,
    salaryMax: 12,
    matchScore: 76,
    status: '处理中',
    subStatus: 'AI初筛中',
    appliedAt: '2024-10-08',
    lastUpdatedAt: '2024-10-10',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-10-08' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-10-09' },
      { name: '初筛', status: 'current' },
      { name: '推荐', status: 'pending' },
      { name: '面试', status: 'pending' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 2,
    operationRecords: [
      { time: '2024-10-08 16:00', operator: '系统', remark: '投递成功' },
      { time: '2024-10-09 09:30', operator: 'RPO顾问-刘强', remark: '简历筛选通过' },
      { time: '2024-10-09 14:00', operator: '系统', remark: 'AI初筛已安排，请完成' },
    ],
    hrFeedbacks: [
      { time: '2024-10-09', content: '请在24小时内完成AI初筛面试，链接已发送至您的邮箱。' },
    ],
    documents: [],
  },
  {
    id: 'app-9',
    positionId: 'pos-9',
    positionTitle: '工业机器人编程',
    enterpriseName: '中山机器人产业园',
    township: '翠亨新区',
    salaryMin: 14,
    salaryMax: 22,
    matchScore: 94,
    status: '面试中',
    subStatus: '背调中',
    appliedAt: '2024-09-10',
    lastUpdatedAt: '2024-10-10',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-11' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-09-13' },
      { name: '初筛', status: 'completed', completedAt: '2024-09-18' },
      { name: '推荐', status: 'completed', completedAt: '2024-09-20' },
      { name: '面试', status: 'current' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 4,
    operationRecords: [
      { time: '2024-09-11 10:00', operator: '系统', remark: '投递成功' },
      { time: '2024-09-13 15:00', operator: 'RPO顾问-周敏', remark: '简历筛选通过' },
      { time: '2024-09-18 11:00', operator: 'AI系统', remark: 'AI初筛评分92分，优秀' },
      { time: '2024-09-20 09:00', operator: 'RPO顾问-周敏', remark: '已推荐至企业' },
      { time: '2024-09-28 14:00', operator: '企业HR-吴总', remark: '所有面试通过，进入背调阶段' },
      { time: '2024-10-01 10:00', operator: '系统', remark: '背调已启动' },
    ],
    backgroundCheck: {
      authorized: true,
      authorizedAt: '2024-09-29',
      progress: 80,
      totalItems: 5,
      completedItems: 4,
      resultLevel: '良好',
      items: [
        { project: '学历验证', result: '通过', description: '本科学历验证通过' },
        { project: '工作经历', result: '通过', description: '工作经历核实无误' },
        { project: '社保记录', result: '通过', description: '社保缴费正常' },
        { project: '不良记录', result: '通过', description: '无不良记录' },
        { project: '职业资格', result: '待核查', description: '工业机器人证书核查中' },
      ],
    },
    hrFeedbacks: [
      { time: '2024-09-28', content: '恭喜通过所有面试！我们将启动背景调查，请您授权。' },
      { time: '2024-10-01', content: '背调已启动，预计3个工作日完成。' },
    ],
    documents: [],
  },
  {
    id: 'app-10',
    positionId: 'pos-10',
    positionTitle: '仓管员',
    enterpriseName: '广东长虹电子有限公司',
    township: '南头镇',
    salaryMin: 4,
    salaryMax: 6,
    matchScore: 70,
    status: '未通过',
    subStatus: '面试未通过',
    appliedAt: '2024-09-15',
    lastUpdatedAt: '2024-09-28',
    rpoStages: [
      { name: '需求确认', status: 'completed', completedAt: '2024-09-16' },
      { name: '简历筛选', status: 'completed', completedAt: '2024-09-18' },
      { name: '初筛', status: 'completed', completedAt: '2024-09-20' },
      { name: '推荐', status: 'completed', completedAt: '2024-09-22' },
      { name: '面试', status: 'completed', completedAt: '2024-09-28' },
      { name: 'Offer', status: 'pending' },
      { name: '入职', status: 'pending' },
      { name: '保用期', status: 'pending' },
    ],
    currentStageIndex: 4,
    operationRecords: [
      { time: '2024-09-16 10:00', operator: '系统', remark: '投递成功' },
      { time: '2024-09-18 11:00', operator: 'RPO顾问-赵丽', remark: '简历筛选通过' },
      { time: '2024-09-20 15:00', operator: 'AI系统', remark: 'AI初筛评分70分，通过' },
      { time: '2024-09-22 09:00', operator: 'RPO顾问-赵丽', remark: '已推荐至企业' },
      { time: '2024-09-25 14:00', operator: '企业HR-孙先生', remark: '面试已安排' },
      { time: '2024-09-28 17:00', operator: '企业HR-孙先生', remark: '面试未通过' },
    ],
    hrFeedbacks: [
      { time: '2024-09-28', content: '感谢您参加面试，经过综合评估，我们决定录用其他候选人。您的简历已存入我们的人才库，后续有合适机会会再联系。' },
    ],
    documents: [],
  },
];

export const mySubsidyApplications: MySubsidyApplication[] = [
  {
    id: 'sub-app-1',
    type: 'GRADUATE_EMPLOY',
    typeName: '高校毕业生就业补贴',
    amount: 3000,
    appliedAt: '2024-09-15',
    status: '审核中',
    currentStep: 2,
    totalSteps: 4,
    progressPercent: 50,
    auditTrail: [
      { step: '提交申请', operator: '求职者', status: '通过', operatedAt: '2024-09-15 10:30' },
      { step: '材料初审', operator: '镇街人社分局', status: '通过', operatedAt: '2024-09-18 14:20' },
      { step: '资格复核', operator: '市人社局', status: '审核中', operatedAt: '2024-09-20 09:00' },
      { step: '补贴发放', operator: '财政局', status: '待审核', operatedAt: '' },
    ],
  },
  {
    id: 'sub-app-2',
    type: 'SKILL_UPGRADE',
    typeName: '技能提升补贴',
    amount: 2000,
    appliedAt: '2024-08-10',
    status: '已发放',
    currentStep: 4,
    totalSteps: 4,
    progressPercent: 100,
    paidAt: '2024-09-05',
    auditTrail: [
      { step: '提交申请', operator: '求职者', status: '通过', operatedAt: '2024-08-10 11:00' },
      { step: '材料初审', operator: '镇街人社分局', status: '通过', operatedAt: '2024-08-12 15:30' },
      { step: '资格复核', operator: '市人社局', status: '通过', operatedAt: '2024-08-20 10:00' },
      { step: '补贴发放', operator: '财政局', status: '通过', operatedAt: '2024-09-05 09:00' },
    ],
  },
  {
    id: 'sub-app-3',
    type: 'SOCIAL_INSURANCE',
    typeName: '灵活就业社保补贴',
    amount: 400,
    appliedAt: '2024-10-01',
    status: '已提交',
    currentStep: 1,
    totalSteps: 4,
    progressPercent: 25,
    auditTrail: [
      { step: '提交申请', operator: '求职者', status: '通过', operatedAt: '2024-10-01 16:00' },
      { step: '材料初审', operator: '镇街人社分局', status: '待审核', operatedAt: '' },
      { step: '资格复核', operator: '市人社局', status: '待审核', operatedAt: '' },
      { step: '补贴发放', operator: '财政局', status: '待审核', operatedAt: '' },
    ],
  },
  {
    id: 'sub-app-4',
    type: 'HOUSING',
    typeName: '新引进人才住房补贴',
    amount: 300,
    appliedAt: '2024-07-20',
    status: '已拒绝',
    currentStep: 2,
    totalSteps: 4,
    progressPercent: 50,
    rejectReason: '在中山市已有自有住房，不符合补贴条件',
    auditTrail: [
      { step: '提交申请', operator: '求职者', status: '通过', operatedAt: '2024-07-20 10:00' },
      { step: '材料初审', operator: '镇街人社分局', status: '驳回', operatedAt: '2024-07-25 14:30', comment: '在中山市已有自有住房，不符合补贴条件' },
      { step: '资格复核', operator: '市人社局', status: '待审核', operatedAt: '' },
      { step: '补贴发放', operator: '财政局', status: '待审核', operatedAt: '' },
    ],
  },
];

export const getApplicationsHomeBadge = () => {
  const processingCount = myApplications.filter(
    (app) => app.status === '处理中' || app.status === '面试中'
  ).length;
  if (processingCount > 0) {
    return {
      text: `${processingCount} 个处理中`,
      tooltip: myApplications
        .filter((app) => app.status === '处理中' || app.status === '面试中')
        .map((app) => `${app.positionTitle} - ${app.subStatus || app.status}`)
        .join('\n'),
    };
  }
  return null;
};

export const getSubsidyHomeBadge = () => {
  const availableCount = AVAILABLE_SUBSIDIES.length;
  if (availableCount > 0) {
    return {
      text: `${availableCount} 项可申请`,
      tooltip: AVAILABLE_SUBSIDIES.map((s) => `${s.icon} ${s.name}`).join('\n'),
    };
  }
  return null;
};

export const getApplicationStats = () => {
  const total = myApplications.length;
  const processing = myApplications.filter((app) => app.status === '处理中').length;
  const interviewing = myApplications.filter((app) => app.status === '面试中').length;
  const offer = myApplications.filter((app) => app.status === 'Offer').length;
  const onboarded = myApplications.filter((app) => app.status === '已入职').length;
  const rejected = myApplications.filter((app) => app.status === '未通过').length;
  return { total, processing, interviewing, offer, onboarded, rejected };
};

export const getSubsidyStats = () => {
  const available = AVAILABLE_SUBSIDIES.length;
  const applying = mySubsidyApplications.filter(
    (app) => app.status === '已提交' || app.status === '审核中'
  ).length;
  const approved = mySubsidyApplications.filter(
    (app) => app.status === '已通过' || app.status === '已发放'
  ).length;
  const totalAmount = mySubsidyApplications
    .filter((app) => app.status === '已发放')
    .reduce((sum, app) => sum + app.amount, 0);
  return { available, applying, approved, totalAmount };
};
