import type {
  User,
  Lawyer,
  Consultation,
  ChatMessage,
  ServiceEvaluation,
  MonitorStats,
  EvidenceFile,
  ConsultationDraft,
  DispatchBasis,
  MatchedLawyer,
  LegalOpinion,
  CaseCategory,
} from '../../types';
import { getCategoryLabel } from '../../utils/format';

const now = new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

export const mockUsers: User[] = [
  {
    id: 'user-1',
    role: 'user',
    phone: '13800138001',
    nickname: '张三',
    realName: '张三',
    idCard: '110101199001011234',
    region: '北京市朝阳区',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: 'user-2',
    role: 'user',
    phone: '13800138002',
    nickname: '李四',
    realName: '李四',
    region: '上海市浦东新区',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: 'user-3',
    role: 'user',
    phone: '13800138003',
    nickname: '王五',
    region: '广州市天河区',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
  {
    id: 'admin-1',
    role: 'admin',
    phone: '13800138000',
    nickname: '平台管理员',
    createdAt: daysAgo(100),
    updatedAt: daysAgo(1),
  },
];

export const mockLawyers: Lawyer[] = [
  {
    id: 'lawyer-1',
    userId: 'lawyer-user-1',
    licenseNumber: '1101012020001',
    licenseImage: '/mock/license/lawyer-1.jpg',
    firmName: '北京正义律师事务所',
    practiceYears: 8,
    specialties: ['marriage', 'labor'],
    verifyStatus: 'approved',
    creditScore: 95,
    consultationCount: 156,
    averageRating: 4.8,
    continuingEducationCredits: 45,
    createdAt: daysAgo(180),
    verifiedAt: daysAgo(170),
  },
  {
    id: 'lawyer-2',
    userId: 'lawyer-user-2',
    licenseNumber: '3101012019002',
    licenseImage: '/mock/license/lawyer-2.jpg',
    firmName: '上海公正律师事务所',
    practiceYears: 12,
    specialties: ['debt', 'traffic'],
    verifyStatus: 'approved',
    creditScore: 98,
    consultationCount: 289,
    averageRating: 4.9,
    continuingEducationCredits: 60,
    createdAt: daysAgo(365),
    verifiedAt: daysAgo(360),
  },
  {
    id: 'lawyer-3',
    userId: 'lawyer-user-3',
    licenseNumber: '4401012021003',
    licenseImage: '/mock/license/lawyer-3.jpg',
    firmName: '广州光明律师事务所',
    practiceYears: 3,
    specialties: ['criminal', 'other'],
    verifyStatus: 'pending',
    creditScore: 80,
    consultationCount: 45,
    averageRating: 4.5,
    continuingEducationCredits: 30,
    createdAt: daysAgo(15),
  },
  {
    id: 'lawyer-4',
    userId: 'lawyer-user-4',
    licenseNumber: '4401012018004',
    licenseImage: '/mock/license/lawyer-4.jpg',
    firmName: '深圳法治律师事务所',
    practiceYears: 6,
    specialties: ['labor', 'debt'],
    verifyStatus: 'approved',
    creditScore: 88,
    consultationCount: 98,
    averageRating: 4.6,
    continuingEducationCredits: 52,
    createdAt: daysAgo(200),
    verifiedAt: daysAgo(195),
  },
  {
    id: 'lawyer-5',
    userId: 'lawyer-user-5',
    licenseNumber: '1101012022005',
    licenseImage: '/mock/license/lawyer-5.jpg',
    firmName: '北京和谐律师事务所',
    practiceYears: 2,
    specialties: ['marriage'],
    verifyStatus: 'frozen',
    frozenReason: '连续多次零响应，违反平台服务规范',
    creditScore: 45,
    consultationCount: 12,
    averageRating: 3.2,
    continuingEducationCredits: 18,
    createdAt: daysAgo(90),
    verifiedAt: daysAgo(85),
  },
];

export const mockEvidenceFiles: EvidenceFile[] = [
  {
    id: 'evidence-1',
    consultationId: 'consultation-1',
    uploaderId: 'user-1',
    fileName: 'contract-abc123.pdf',
    originalName: '劳动合同.pdf',
    fileType: 'document',
    fileSize: 1024000,
    fileUrl: '/mock/evidence/contract.pdf',
    watermarkEnabled: true,
    uploadedAt: daysAgo(1),
  },
  {
    id: 'evidence-2',
    consultationId: 'consultation-1',
    uploaderId: 'user-1',
    fileName: 'salary-def456.png',
    originalName: '工资条截图.png',
    fileType: 'image',
    fileSize: 512000,
    fileUrl: '/mock/evidence/salary.png',
    watermarkEnabled: true,
    uploadedAt: daysAgo(1),
  },
];

export const mockConsultations: Consultation[] = [
  {
    id: 'consultation-1',
    userId: 'user-1',
    lawyerId: 'lawyer-1',
    category: 'labor',
    title: '公司拖欠工资三个月',
    description:
      '我所在的公司已经连续三个月没有发放工资，多次与公司沟通无果，想咨询一下如何通过法律途径维权。',
    region: '北京市朝阳区',
    urgency: 'high',
    status: 'chatting',
    evidenceFiles: mockEvidenceFiles.filter((e) => e.consultationId === 'consultation-1'),
    matchedAt: hoursAgo(47),
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(12),
  },
  {
    id: 'consultation-2',
    userId: 'user-1',
    category: 'marriage',
    title: '离婚财产分割问题',
    description: '准备与配偶协议离婚，但对共同财产的分割存在分歧，想了解相关法律规定。',
    region: '北京市朝阳区',
    urgency: 'medium',
    status: 'pending',
    evidenceFiles: [],
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'consultation-3',
    userId: 'user-2',
    lawyerId: 'lawyer-2',
    category: 'traffic',
    title: '交通事故责任认定',
    description: '上周发生一起交通事故，对交警的责任认定有异议，想咨询如何申请复核。',
    region: '上海市浦东新区',
    urgency: 'low',
    status: 'closed',
    evidenceFiles: [],
    matchedAt: daysAgo(7),
    closedAt: daysAgo(3),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(3),
  },
  {
    id: 'consultation-4',
    userId: 'user-3',
    category: 'debt',
    title: '朋友借款不还',
    description: '借给朋友十万元，约定一年归还，但现在已逾期半年，多次催讨无果。',
    region: '广州市天河区',
    urgency: 'high',
    status: 'pending',
    evidenceFiles: [],
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'consultation-5',
    userId: 'user-2',
    lawyerId: 'lawyer-1',
    category: 'labor',
    title: '试用期被辞退补偿问题',
    description: '在试用期内被公司无故辞退，想了解是否可以要求经济补偿。',
    region: '上海市浦东新区',
    urgency: 'medium',
    status: 'matched',
    evidenceFiles: [],
    matchedAt: hoursAgo(8),
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(8),
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  'consultation-1': [
    {
      id: 'msg-1',
      consultationId: 'consultation-1',
      senderId: 'user-1',
      senderRole: 'user',
      content: '赵律师您好，我想咨询一下关于拖欠工资的问题。',
      messageType: 'text',
      isEncrypted: true,
      isRead: true,
      burnAfterReading: false,
      readAt: hoursAgo(46),
      createdAt: hoursAgo(47),
    },
    {
      id: 'msg-2',
      consultationId: 'consultation-1',
      senderId: 'lawyer-1',
      senderRole: 'lawyer',
      content: '您好，请详细说明一下情况，包括入职时间、劳动合同签订情况、拖欠工资的具体金额和时间等。',
      messageType: 'text',
      isEncrypted: true,
      isRead: true,
      burnAfterReading: false,
      readAt: hoursAgo(46),
      createdAt: hoursAgo(46),
    },
    {
      id: 'msg-3',
      consultationId: 'consultation-1',
      senderId: 'user-1',
      senderRole: 'user',
      content: '我是2022年3月入职的，签了三年劳动合同，每月工资8000元。从今年3月开始就没有发过工资了，现在已经三个月了。',
      messageType: 'text',
      isEncrypted: true,
      isRead: true,
      burnAfterReading: true,
      burnDuration: 30,
      readAt: hoursAgo(45),
      createdAt: hoursAgo(45),
    },
    {
      id: 'msg-4',
      consultationId: 'consultation-1',
      senderId: 'lawyer-1',
      senderRole: 'lawyer',
      content: '了解了。根据《劳动合同法》第三十条，用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。您可以先向当地劳动监察部门投诉，或者直接申请劳动仲裁。建议您准备好劳动合同、工资条、考勤记录等证据材料。',
      messageType: 'text',
      isEncrypted: true,
      isRead: false,
      burnAfterReading: false,
      createdAt: hoursAgo(12),
    },
  ],
};

export const mockEvaluations: ServiceEvaluation[] = [
  {
    id: 'eval-1',
    consultationId: 'consultation-3',
    userId: 'user-2',
    lawyerId: 'lawyer-2',
    rating: 5,
    content: '钱律师非常专业，解答清晰，帮我理清了复核的流程和需要准备的材料，非常感谢！',
    isComplaint: false,
    disputeStage: 'resolved',
    createdAt: daysAgo(2),
    resolvedAt: daysAgo(2),
  },
  {
    id: 'eval-2',
    consultationId: 'consultation-closed-2',
    userId: 'user-1',
    lawyerId: 'lawyer-5',
    rating: 2,
    content: '响应速度太慢，咨询过程中经常很久不回复。',
    isComplaint: true,
    disputeStage: 'appeal',
    createdAt: daysAgo(5),
    disputedAt: daysAgo(4),
  },
];

export const mockMonitorStats: MonitorStats = {
  totalConsultations: 1256,
  pendingConsultations: 38,
  activeLawyers: 23,
  totalLawyers: 45,
  averageResponseTime: 18,
  averageRating: 4.7,
  zeroResponseLawyers: 2,
  consultationsPerLawyer: 54.6,
  serviceSaturation: 72,
  periodStart: daysAgo(7),
  periodEnd: now,
};

export const mockLegalOpinions: LegalOpinion[] = [
  {
    id: 'opinion-1',
    consultationId: 'consultation-3',
    lawyerId: 'lawyer-2',
    title: '交通事故责任认定复核法律意见',
    caseSummary:
      '咨询人于上周发生一起交通事故，对交警部门出具的责任认定书存在异议，希望了解申请复核的程序和注意事项。',
    legalAnalysis:
      '根据《道路交通事故处理程序规定》第七十一条，当事人对道路交通事故认定或者出具道路交通事故证明有异议的，可以自道路交通事故认定书或者道路交通事故证明送达之日起三日内提出书面复核申请。复核申请应当载明复核请求及其理由和主要证据。同一事故的复核以一次为限。',
    suggestions:
      '1. 在收到认定书之日起3日内向上一级公安机关交通管理部门提出书面复核申请；2. 准备能够支持您主张的证据材料，如现场照片、行车记录仪视频、证人证言等；3. 复核申请书中需明确指出原认定书中存在的事实认定错误或法律适用错误；4. 如复核结果仍不满意，可在后续诉讼中请求法院不予采信该事故认定书。',
    relatedLaws: [
      '《道路交通事故处理程序规定》第七十一条、第七十二条、第七十三条',
      '《中华人民共和国道路交通安全法》第七十三条',
      '《最高人民法院关于审理道路交通事故损害赔偿案件适用法律若干问题的解释》第二十四条',
    ],
    riskAssessment:
      '如果没有充分的相反证据，复核成功的概率相对较低。建议同时准备好相关证据，以便在后续可能的民事诉讼中维护自身权益。',
    createdAt: daysAgo(3),
  },
];

export const mockDrafts: ConsultationDraft[] = [
  {
    id: 'draft-1',
    userId: 'user-1',
    draftNumber: 'DR202606150001',
    category: 'contract',
    title: '房屋租赁合同纠纷',
    description: '房东提前收回房屋，拒绝退还押金和剩余租金...',
    province: '北京市',
    city: '朝阳区',
    region: '北京市朝阳区',
    urgency: 'medium',
    evidenceFiles: [
      {
        id: 'draft-evidence-1',
        consultationId: 'draft-1',
        uploaderId: 'user-1',
        fileName: 'contract-abc.pdf',
        originalName: '房屋租赁合同.pdf',
        fileType: 'document',
        fileSize: 524288,
        fileUrl: '/mock/evidence/draft-contract.pdf',
        watermarkEnabled: true,
        uploadedAt: daysAgo(4),
      },
    ],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: 'draft-2',
    userId: 'user-1',
    draftNumber: 'DR202606180002',
    category: 'labor',
    title: '',
    description: '公司要裁员，N+1赔偿方案是否合理？',
    province: '北京市',
    city: '海淀区',
    urgency: 'high',
    evidenceFiles: [],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'draft-3',
    userId: 'user-2',
    draftNumber: 'DR202606170003',
    category: 'debt',
    title: '信用卡逾期协商',
    description: '',
    province: '上海市',
    city: '浦东新区',
    evidenceFiles: [],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

function generateMatchedLawyers(category: CaseCategory, region?: string): MatchedLawyer[] {
  const approved = mockLawyers.filter((l) => l.verifyStatus === 'approved');
  return approved
    .map((lawyer) => {
      const hasSpecialty = lawyer.specialties.includes(category);
      let score = hasSpecialty ? 60 + Math.floor(Math.random() * 30) : 30 + Math.floor(Math.random() * 30);
      if (region && lawyer.firmName.includes(region.slice(0, 2))) {
        score += 10;
      }
      return {
        lawyerId: lawyer.id,
        name: lawyer.firmName.startsWith('北京') ? '李淑芬' : lawyer.firmName.startsWith('上海') ? '王建国' : '陈雨晴',
        firmName: lawyer.firmName,
        specialty: lawyer.specialties,
        specialtyLabels: lawyer.specialties.map((s) => getCategoryLabel(s)),
        matchScore: Math.min(score, 98),
        practiceYears: lawyer.practiceYears,
        averageRating: lawyer.averageRating,
        consultationCount: lawyer.consultationCount,
        region: lawyer.firmName.slice(0, 2) + '市',
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

export function generateDispatchBasis(consultation: Consultation): DispatchBasis {
  const specialtyMatches = [
    {
      category: consultation.category,
      label: getCategoryLabel(consultation.category),
      score: 85 + Math.floor(Math.random() * 15),
    },
  ];

  const recommendedLawyers = generateMatchedLawyers(consultation.category, consultation.region);
  const regionMatch = consultation.region
    ? recommendedLawyers.some((l) => l.region?.includes(consultation.region.slice(0, 2)))
    : false;

  const overallScore = Math.round(
    (specialtyMatches.reduce((sum, s) => sum + s.score, 0) / specialtyMatches.length) * 0.6 +
      (regionMatch ? 90 : 50) * 0.2 +
      (recommendedLawyers[0]?.matchScore || 60) * 0.2
  );

  return {
    caseCategoryMatch: true,
    caseCategoryLabel: getCategoryLabel(consultation.category),
    regionMatch,
    regionLabel: consultation.region,
    specialtyMatches,
    overallScore,
    recommendedLawyers,
  };
}

export const mockConsultationsWithExtra: Consultation[] = mockConsultations.map((c) => {
  const extra: Partial<Consultation> = {};

  if (c.id === 'consultation-2') {
    extra.dispatchBasis = generateDispatchBasis(c);
    extra.lastMessage = '正在为您匹配最合适的婚姻家庭律师...';
    extra.lastMessageTime = hoursAgo(5);
  }
  if (c.id === 'consultation-4') {
    extra.dispatchBasis = generateDispatchBasis(c);
    extra.lastMessage = '系统已找到3位匹配律师，请查看详情';
    extra.lastMessageTime = hoursAgo(2);
    extra.hasUnread = true;
    extra.unreadCount = 1;
  }
  if (c.id === 'consultation-1') {
    extra.lastMessage = '李律师：建议您先收集劳动合同、考勤记录、工资条等证据材料...';
    extra.lastMessageTime = hoursAgo(12);
    extra.hasUnread = true;
    extra.unreadCount = 2;
  }
  if (c.id === 'consultation-5') {
    extra.dispatchBasis = generateDispatchBasis(c);
    extra.lastMessage = '已为您匹配李淑芬律师，可开始咨询';
    extra.lastMessageTime = hoursAgo(8);
  }
  if (c.id === 'consultation-3') {
    extra.lastMessage = '王律师：如果后续还有问题，随时可以咨询。祝您顺利！';
    extra.lastMessageTime = daysAgo(3);
    extra.evaluation = mockEvaluations.find((e) => e.consultationId === 'consultation-3');
    extra.legalOpinion = mockLegalOpinions.find((o) => o.consultationId === 'consultation-3');
  }

  return { ...c, ...extra };
});
