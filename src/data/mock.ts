import type {
  SocialCard,
  BenefitStatement,
  UnemploymentPrecheck,
  CityConfig,
  KnowledgeEntry,
  FundAlert,
  UserInfo,
  CardProgressNode,
} from '@/types';

export const mockUser: UserInfo = {
  id: 'U20240001',
  name: '张伟',
  idNumber: '130102199001011234',
  phone: '138****5678',
  role: 'user',
  cityCode: '130100',
  cityName: '石家庄市',
};

export const mockCardProgress: CardProgressNode[] = [
  {
    stage: 'collected',
    label: '已采集信息',
    timestamp: '2024-03-15 09:30:00',
    description: '个人信息已采集并提交至省制卡中心',
    completed: true,
  },
  {
    stage: 'manufactured',
    label: '已制卡',
    timestamp: '2024-03-18 14:20:00',
    description: '社保卡已制作完成，封装金融账户',
    completed: true,
  },
  {
    stage: 'shipped',
    label: '已邮寄',
    timestamp: '2024-03-20 10:15:00',
    description: '卡片已通过EMS寄出，单号：SF1234567890',
    completed: true,
  },
  {
    stage: 'delivered',
    label: '签收',
    timestamp: '2024-03-22 16:45:00',
    description: '本人已签收，社保卡激活可用',
    completed: true,
  },
];

export const mockSocialCard: SocialCard = {
  id: 'SC130100202403150001',
  cardNumber: '130102199001011234',
  holderName: '张伟',
  idNumber: '130102199001011234',
  status: 'normal',
  issuedDate: '2024-03-22',
  validUntil: '2034-03-22',
  bankName: '中国工商银行河北省分行',
  bankAccount: '6222 **** **** 8888',
  progress: mockCardProgress,
};

export const mockBenefitStatement: BenefitStatement = {
  id: 'BS20240601001',
  generatedAt: '2024-06-01 10:30:00',
  period: '截至 2024年5月',
  holderName: '张伟',
  idNumber: '130102199001011234',
  records: [
    {
      type: 'pension',
      typeName: '养老保险',
      totalMonths: 156,
      accountBalance: 128650.8,
      lastPaymentDate: '2024-05-25',
      status: 'normal',
    },
    {
      type: 'medical',
      typeName: '医疗保险',
      totalMonths: 148,
      accountBalance: 32580.5,
      lastPaymentDate: '2024-05-25',
      status: 'normal',
    },
    {
      type: 'injury',
      typeName: '工伤保险',
      totalMonths: 152,
      accountBalance: 8860.0,
      lastPaymentDate: '2024-05-25',
      status: 'normal',
    },
  ],
  totalContributionMonths: 456,
  totalBalance: 170091.3,
};

export const mockUnemploymentPrecheck: UnemploymentPrecheck = {
  id: 'UP2024060001',
  name: '张伟',
  idNumber: '130102199001011234',
  stopReason: '合同到期/协商解除',
  stopReasonCode: 'TERMINATION',
  contributionMonths: 156,
  isLocalResident: true,
  eligible: true,
  estimatedBenefit: 1680,
  estimatedMonths: 18,
  reasons: [
    '缴费年限满13年（≥1年），符合申领条件',
    '非本人意愿中断就业（合同到期），符合申领条件',
    '已进行失业登记，有求职要求',
  ],
};

export const mockCityConfigs: CityConfig[] = [
  {
    id: 'CITY-130100',
    cityCode: '130100',
    cityName: '石家庄市',
    updatedAt: '2024-05-28 15:20:00',
    updatedBy: 'admin_sjz',
    localizedServices: [
      {
        id: 'LS-001',
        name: '公积金提取',
        description: '石家庄市住房公积金线上提取服务',
        linkUrl: 'https://gjj.sjz.gov.cn/extract',
        icon: 'home',
        enabled: true,
      },
      {
        id: 'LS-002',
        name: '人才补贴申报',
        description: '石家庄市人才绿卡B卡补贴申请',
        linkUrl: 'https://rc.sjz.gov.cn/subside',
        icon: 'award',
        enabled: true,
      },
    ],
  },
  {
    id: 'CITY-130200',
    cityCode: '130200',
    cityName: '唐山市',
    updatedAt: '2024-05-20 09:15:00',
    updatedBy: 'admin_ts',
    localizedServices: [
      {
        id: 'LS-101',
        name: '海港开发区社保',
        description: '海港经济开发区专属社保服务',
        linkUrl: 'https://hg.ts.gov.cn/social',
        icon: 'anchor',
        enabled: true,
      },
    ],
  },
];

export const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: 'K-001',
    question: '失业人员可以领取多长时间的失业保险金？',
    answer:
      '失业人员失业前所在单位和本人按照规定累计缴费时间满1年不足5年的，领取失业保险金的期限最长为12个月；累计缴费时间满5年不足10年的，领取失业保险金的期限最长为18个月；累计缴费时间10年以上的，领取失业保险金的期限最长为24个月。',
    sourceLaw: '河北省失业保险条例',
    sourceArticle: '第十七条',
    keywords: ['失业保险', '领取期限', '缴费年限'],
    views: 12856,
    updatedAt: '2024-05-10',
  },
  {
    id: 'K-002',
    question: '申领失业保险金需要满足什么条件？',
    answer:
      '具备下列条件的失业人员，可以领取失业保险金：\n（一）按照规定参加失业保险，所在单位和本人已按照规定履行缴费义务满1年的；\n（二）非因本人意愿中断就业的；\n（三）已办理失业登记，并有求职要求的。',
    sourceLaw: '河北省失业保险条例',
    sourceArticle: '第十四条',
    keywords: ['失业保险', '申领条件', '非本人意愿'],
    views: 28941,
    updatedAt: '2024-05-10',
  },
  {
    id: 'K-003',
    question: '失业保险金的标准是多少？',
    answer:
      '失业保险金的标准，按照低于当地最低工资标准、高于城市居民最低生活保障标准的水平，由省、自治区、直辖市人民政府确定。河北省目前失业保险金标准为当地最低工资标准的80%。',
    sourceLaw: '河北省失业保险条例',
    sourceArticle: '第十八条',
    keywords: ['失业保险', '标准', '最低工资'],
    views: 9672,
    updatedAt: '2024-06-01',
  },
  {
    id: 'K-004',
    question: '社保卡丢失了怎么办？',
    answer:
      '社保卡丢失后，持卡人应立即办理挂失手续。可通过本平台线上挂失（需人脸识别+短信验证），或拨打12333服务热线挂失，也可持本人身份证到社保卡服务网点现场挂失。挂失后可申请补卡。',
    sourceLaw: '河北省社会保障卡管理办法',
    sourceArticle: '第二十三条',
    keywords: ['社保卡', '挂失', '补卡'],
    views: 35218,
    updatedAt: '2024-04-20',
  },
];

export const mockFundAlerts: FundAlert[] = [
  {
    id: 'FA-20240611-001',
    alertType: 'withdrawal_spike',
    alertLevel: 'danger',
    title: '单日大额提现频次突增告警',
    description: '石家庄市当日社保基金大额提现（≥50万）达23笔，较日均增长320%，请关注是否存在异常。',
    city: '石家庄市',
    amount: 18600000,
    count: 23,
    triggeredAt: '2024-06-11 09:45:00',
    isHandled: false,
  },
  {
    id: 'FA-20240611-002',
    alertType: 'abnormal_pattern',
    alertLevel: 'warning',
    title: '医保基金异常报销模式',
    description: '唐山市某定点医疗机构近7日单次报销金额分布异常偏离基线，疑似过度医疗。',
    city: '唐山市',
    count: 156,
    triggeredAt: '2024-06-11 08:30:00',
    isHandled: false,
  },
  {
    id: 'FA-20240610-003',
    alertType: 'balance_warning',
    alertLevel: 'info',
    title: '失业保险基金余额预警',
    description: '张家口市失业保险基金可支撑月数降至6.2个月，低于安全阈值8个月。',
    city: '张家口市',
    amount: 82000000,
    triggeredAt: '2024-06-10 17:20:00',
    isHandled: true,
  },
];

export const mockFundTrend = [
  { date: '1月', pension: 15200, medical: 8600, unemployment: 2100, injury: 380 },
  { date: '2月', pension: 14800, medical: 8400, unemployment: 2200, injury: 360 },
  { date: '3月', pension: 15600, medical: 8900, unemployment: 2400, injury: 410 },
  { date: '4月', pension: 16100, medical: 9200, unemployment: 2300, injury: 390 },
  { date: '5月', pension: 15900, medical: 9000, unemployment: 2600, injury: 430 },
  { date: '6月', pension: 16500, medical: 9400, unemployment: 2800, injury: 450 },
];
