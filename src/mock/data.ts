import type {
  User,
  Lawyer,
  AdminUser,
  Consultation,
  Evidence,
  Message,
  Evaluation,
  Appeal,
  MonitoringStats,
  LawyerDailyStat
} from '@/types'

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const users: User[] = [
  {
    id: 'user-001',
    role: 'user',
    phone: '13800138000',
    nickname: '张先生',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    realName: '张三',
    idCard: '110101199001010011',
    isVerified: true,
    createdAt: now - 60 * day,
    updatedAt: now - 10 * day
  }
]

export const lawyers: Lawyer[] = [
  {
    id: 'lawyer-001',
    role: 'lawyer',
    phone: '13900139000',
    nickname: '王律师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglawyer',
    realName: '王建国',
    licenseNumber: '11010120100001',
    licenseVerified: true,
    lawFirm: '北京市正义律师事务所',
    practiceYears: 15,
    expertise: ['marriage', 'property', 'contract'],
    regions: ['北京', '天津', '河北'],
    creditScore: 980,
    continuingEducationCredits: 48,
    status: 'active',
    totalCases: 328,
    completedCases: 315,
    avgRating: 4.9,
    responseRate: 96,
    avgResponseTime: 1800,
    lastActiveAt: now - 30 * 60 * 1000,
    createdAt: now - 365 * day,
    updatedAt: now - day
  },
  {
    id: 'lawyer-002',
    role: 'lawyer',
    phone: '13900139002',
    nickname: '李律师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lilawyer',
    realName: '李明华',
    licenseNumber: '31010120150002',
    licenseVerified: true,
    lawFirm: '上海市光明律师事务所',
    practiceYears: 8,
    expertise: ['labor', 'debt', 'traffic'],
    regions: ['上海', '江苏', '浙江'],
    creditScore: 920,
    continuingEducationCredits: 36,
    status: 'active',
    totalCases: 156,
    completedCases: 142,
    avgRating: 4.6,
    responseRate: 82,
    avgResponseTime: 3600,
    lastActiveAt: now - 2 * 60 * 60 * 1000,
    createdAt: now - 200 * day,
    updatedAt: now - 2 * day
  },
  {
    id: 'lawyer-003',
    role: 'lawyer',
    phone: '13900139003',
    nickname: '赵律师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolawyer',
    realName: '赵志远',
    licenseNumber: '44010120080003',
    licenseVerified: true,
    lawFirm: '广州市和谐律师事务所',
    practiceYears: 12,
    expertise: ['criminal', 'contract', 'debt'],
    regions: ['广东', '福建'],
    creditScore: 850,
    continuingEducationCredits: 30,
    status: 'frozen',
    totalCases: 89,
    completedCases: 75,
    avgRating: 4.2,
    responseRate: 45,
    avgResponseTime: 7200,
    lastActiveAt: now - 5 * day,
    createdAt: now - 300 * day,
    updatedAt: now - 3 * day
  }
]

export const admins: AdminUser[] = [
  {
    id: 'admin-001',
    role: 'admin',
    username: 'admin',
    nickname: '系统管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    permissions: ['lawyer_review', 'arbitration', 'monitoring', 'freeze'],
    createdAt: now - 730 * day,
    updatedAt: now - day
  }
]

export const evidences: Evidence[] = [
  {
    id: 'evidence-001',
    consultationId: 'consult-001',
    uploaderId: 'user-001',
    fileName: '劳动合同.pdf',
    fileType: 'pdf',
    fileSize: 204800,
    fileUrl: 'https://example.com/evidence/001.pdf',
    watermarkText: '张三 138****8000',
    createdAt: now - 5 * day
  },
  {
    id: 'evidence-002',
    consultationId: 'consult-001',
    uploaderId: 'user-001',
    fileName: '工资条.jpg',
    fileType: 'image',
    fileSize: 1024000,
    fileUrl: 'https://example.com/evidence/002.jpg',
    watermarkText: '张三 138****8000',
    createdAt: now - 5 * day
  },
  {
    id: 'evidence-003',
    consultationId: 'consult-002',
    uploaderId: 'user-001',
    fileName: '借条.jpg',
    fileType: 'image',
    fileSize: 512000,
    fileUrl: 'https://example.com/evidence/003.jpg',
    watermarkText: '张三 138****8000',
    createdAt: now - 3 * day
  },
  {
    id: 'evidence-004',
    consultationId: 'consult-004',
    uploaderId: 'user-001',
    fileName: '转账记录.png',
    fileType: 'image',
    fileSize: 307200,
    fileUrl: 'https://example.com/evidence/004.png',
    watermarkText: '张三 138****8000',
    createdAt: now - 2 * day
  },
  {
    id: 'evidence-005',
    consultationId: 'consult-005',
    uploaderId: 'user-001',
    fileName: '购房合同.pdf',
    fileType: 'pdf',
    fileSize: 153600,
    fileUrl: 'https://example.com/evidence/005.pdf',
    watermarkText: '张三 138****8000',
    createdAt: now - 6 * 60 * 60 * 1000
  }
]

export const consultations: Consultation[] = [
  {
    id: 'consult-001',
    userId: 'user-001',
    lawyerId: 'lawyer-002',
    caseType: 'labor',
    title: '公司拖欠3个月工资未发放',
    description: '我在公司工作了3年，最近公司因为资金链问题已经连续3个月没有发放工资，我与公司HR沟通未果，想咨询如何通过法律途径维权。',
    region: '上海',
    status: 'completed',
    dispatchMode: 'auto',
    evidences: [evidences[0], evidences[1]],
    createdAt: now - 5 * day,
    dispatchedAt: now - 5 * day + 30 * 60 * 1000,
    acceptedAt: now - 5 * day + 45 * 60 * 1000,
    completedAt: now - 2 * day
  },
  {
    id: 'consult-002',
    userId: 'user-001',
    lawyerId: 'lawyer-001',
    caseType: 'debt',
    title: '朋友借款5万元到期不还',
    description: '朋友一年前向我借款5万元，约定今年1月归还，但至今未还，有借条和转账记录。',
    region: '北京',
    status: 'in_progress',
    dispatchMode: 'grab',
    evidences: [evidences[2]],
    createdAt: now - 3 * day,
    dispatchedAt: now - 3 * day + 20 * 60 * 1000,
    acceptedAt: now - 3 * day + 35 * 60 * 1000
  },
  {
    id: 'consult-003',
    userId: 'user-001',
    caseType: 'marriage',
    title: '离婚财产分割问题咨询',
    description: '我和丈夫结婚5年，因感情不和准备离婚，有一套共同房产和一个3岁孩子，想咨询财产分割和抚养权问题。',
    region: '北京',
    status: 'pending',
    dispatchMode: 'auto',
    evidences: [],
    createdAt: now - 30 * 60 * 1000
  },
  {
    id: 'consult-004',
    userId: 'user-001',
    lawyerId: 'lawyer-002',
    caseType: 'traffic',
    title: '交通事故赔偿纠纷',
    description: '上周开车与电动车发生碰撞，交警判定我全责，对方要求赔偿误工费和营养费共计3万元，但我认为对方要求过高。',
    region: '上海',
    status: 'in_progress',
    dispatchMode: 'manual',
    evidences: [evidences[3]],
    createdAt: now - 2 * day,
    dispatchedAt: now - 2 * day + 1 * 60 * 60 * 1000,
    acceptedAt: now - 2 * day + 1.5 * 60 * 60 * 1000
  },
  {
    id: 'consult-005',
    userId: 'user-001',
    caseType: 'property',
    title: '房产买卖合同纠纷',
    description: '购买二手房，已支付定金，现在房主反悔不卖了，合同约定了双倍返还定金，想咨询能否继续履行合同。',
    region: '广东',
    status: 'pending',
    dispatchMode: 'grab',
    evidences: [evidences[4]],
    createdAt: now - 2 * 60 * 60 * 1000
  }
]

export const messages: Message[] = [
  {
    id: 'msg-001',
    consultationId: 'consult-001',
    senderId: 'user-001',
    senderType: 'user',
    type: 'text',
    messageType: 'text',
    content: '律师您好，我公司拖欠了我3个月工资，我该怎么办？',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 5 * day + 1 * 60 * 60 * 1000
  },
  {
    id: 'msg-002',
    consultationId: 'consult-001',
    senderId: 'lawyer-002',
    senderType: 'lawyer',
    type: 'text',
    messageType: 'text',
    content: '您好，请先保留好劳动合同和工资发放记录等证据材料，您可以先向劳动监察大队投诉，或者申请劳动仲裁。',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 5 * day + 1.1 * 60 * 60 * 1000
  },
  {
    id: 'msg-003',
    consultationId: 'consult-001',
    senderId: 'user-001',
    senderType: 'user',
    type: 'text',
    messageType: 'text',
    content: '我有劳动合同和工资条',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: true,
    burnAfterRead: true,
    burnDuration: 300,
    selfDestructAfter: 300,
    createdAt: now - 5 * day + 1.2 * 60 * 60 * 1000
  },
  {
    id: 'msg-004',
    consultationId: 'consult-001',
    senderId: 'lawyer-002',
    senderType: 'lawyer',
    type: 'image',
    messageType: 'image',
    content: '',
    fileUrl: 'https://example.com/chat/001.jpg',
    fileName: '劳动仲裁申请书模板.jpg',
    fileSize: 204800,
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 5 * day + 1.5 * 60 * 60 * 1000
  },
  {
    id: 'msg-005',
    consultationId: 'consult-001',
    senderId: 'lawyer-002',
    senderType: 'lawyer',
    type: 'text',
    messageType: 'text',
    content: '这是劳动仲裁申请书模板，您可以参考填写。建议同时主张拖欠的工资以及25%的经济补偿金。',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 5 * day + 1.6 * 60 * 60 * 1000
  },
  {
    id: 'msg-006',
    consultationId: 'consult-002',
    senderId: 'user-001',
    senderType: 'user',
    type: 'text',
    messageType: 'text',
    content: '律师好，朋友欠我钱不还怎么办？',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 3 * day + 2 * 60 * 60 * 1000
  },
  {
    id: 'msg-007',
    consultationId: 'consult-002',
    senderId: 'lawyer-001',
    senderType: 'lawyer',
    type: 'text',
    messageType: 'text',
    content: '您好，请问有借条和转账记录吗？',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 3 * day + 2.1 * 60 * 60 * 1000
  },
  {
    id: 'msg-008',
    consultationId: 'consult-002',
    senderId: 'user-001',
    senderType: 'user',
    type: 'text',
    messageType: 'text',
    content: '有的，我已经上传证据了，借条和转账记录都有',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: true,
    burnAfterRead: true,
    burnDuration: 600,
    selfDestructAfter: 600,
    createdAt: now - 3 * day + 2.2 * 60 * 60 * 1000
  },
  {
    id: 'msg-009',
    consultationId: 'consult-002',
    senderId: 'lawyer-001',
    senderType: 'lawyer',
    type: 'text',
    messageType: 'text',
    content: '证据很充分，您可以向法院起诉，同时可以申请财产保全，查封对方的银行账户等。',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 3 * day + 2.5 * 60 * 60 * 1000
  },
  {
    id: 'msg-010',
    consultationId: 'consult-001',
    senderId: 'system',
    senderType: 'system',
    type: 'text',
    messageType: 'system',
    content: '咨询已结案，感谢您使用本平台！',
    isEncrypted: true,
    encrypted: true,
    isSelfDestruct: false,
    burnAfterRead: false,
    createdAt: now - 2 * day
  }
]

export const evaluations: Evaluation[] = [
  {
    id: 'eval-001',
    consultationId: 'consult-001',
    userId: 'user-001',
    lawyerId: 'lawyer-002',
    rating: 5,
    content: '李律师非常专业，解答详细，帮我顺利拿到了拖欠的工资，非常感谢！',
    tags: ['专业细致', '响应及时', '态度友好'],
    createdAt: now - 2 * day
  },
  {
    id: 'eval-002',
    consultationId: 'consult-001',
    userId: 'user-001',
    lawyerId: 'lawyer-001',
    rating: 4,
    content: '王律师回复比较专业，但是有时候回复稍慢',
    tags: ['专业'],
    createdAt: now - day
  }
]

export const appeals: Appeal[] = [
  {
    id: 'appeal-001',
    consultationId: 'consult-001',
    appellantId: 'user-001',
    respondentId: 'lawyer-003',
    reason: '律师未及时回复',
    description: '律师接单后超过24小时未回复任何消息，导致我错过了最佳维权时机',
    evidences: [],
    status: 'pending',
    createdAt: now - day
  }
]

const generateDailyStats = (): LawyerDailyStat[] => {
  const stats: LawyerDailyStat[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * day)
    const dateStr = date.toISOString().split('T')[0]

    stats.push(
      {
        date: dateStr,
        lawyerId: 'lawyer-001',
        receivedCount: Math.floor(Math.random() * 5) + 3,
        acceptedCount: Math.floor(Math.random() * 4) + 2,
        completedCount: Math.floor(Math.random() * 3) + 1,
        avgResponseTime: Math.floor(Math.random() * 30) + 10,
        messageCount: Math.floor(Math.random() * 50) + 20
      },
      {
        date: dateStr,
        lawyerId: 'lawyer-002',
        receivedCount: Math.floor(Math.random() * 4) + 2,
        acceptedCount: Math.floor(Math.random() * 3) + 1,
        completedCount: Math.floor(Math.random() * 2) + 1,
        avgResponseTime: Math.floor(Math.random() * 60) + 30,
        messageCount: Math.floor(Math.random() * 30) + 10
      },
      {
        date: dateStr,
        lawyerId: 'lawyer-003',
        receivedCount: Math.floor(Math.random() * 2),
        acceptedCount: 0,
        completedCount: Math.floor(Math.random() * 1),
        avgResponseTime: 0,
        messageCount: Math.floor(Math.random() * 5)
      }
    )
  }
  return stats
}

const last7DaysStats = generateDailyStats()

export const monitoringStats: MonitoringStats = {
  totalConsultations: 573,
  todayConsultations: 42,
  pendingCount: 28,
  inProgressCount: 156,
  completedCount: 389,
  activeLawyers: 12,
  frozenLawyers: 1,
  avgResponseTime: 18,
  avgRating: 4.7,
  dailyStats: last7DaysStats,
}
