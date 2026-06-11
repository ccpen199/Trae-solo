export interface ServiceApplication {
  id: string
  type: "household" | "no_criminal_record" | "residence_permit" | "entry_exit" | "other"
  typeName: string
  applicantName: string
  applicantIdCard: string
  status: "pending" | "processing" | "approved" | "rejected" | "completed"
  submitTime: string
  updateTime: string
  currentStep: number
  totalSteps: number
  materials: string[]
}

export interface ServiceGuide {
  id: string
  name: string
  category: string
  description: string
  requiredMaterials: string[]
  processingTime: string
  fees: string
}

export interface ECertificate {
  id: string
  type: "id_card" | "driver_license" | "passport"
  typeName: string
  holderName: string
  holderIdNumber: string
  issueDate: string
  expiryDate: string
  status: "valid" | "expired" | "revoked"
  qrCodeData: string
}

export interface TrafficViolation {
  id: string
  plateNumber: string
  violationType: string
  violationDate: string
  location: string
  fine: number
  points: number
  status: "unpaid" | "paid" | "appealing"
}

export interface AccidentReport {
  id: string
  reporterName: string
  accidentDate: string
  location: string
  description: string
  videoCount: number
  status: "submitted" | "processing" | "resolved"
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
}

export interface Suggestion {
  id: string
  userId: string
  userName: string
  category: string
  tags: string[]
  content: string
  status: "submitted" | "assigned" | "processing" | "completed"
  deadline: string
  assignee: string
  response?: string
  isPublic: boolean
  createdAt: string
  completedAt?: string
}

export interface PublicOpinion {
  id: string
  keyword: string
  source: string
  content: string
  level: "low" | "medium" | "high" | "critical"
  status: "new" | "monitoring" | "responding" | "resolved"
  detectedAt: string
  response?: string
}

export interface Announcement {
  id: string
  title: string
  date: string
  type: "policy" | "notice" | "safety"
  isRead: boolean
}

export const mockServiceGuides: ServiceGuide[] = [
  {
    id: "sg1",
    name: "户籍证明",
    category: "户政",
    description: "申请开具户籍证明，用于各类需要证明户籍信息的场景",
    requiredMaterials: ["身份证原件", "户口簿原件", "申请表"],
    processingTime: "3个工作日",
    fees: "免费",
  },
  {
    id: "sg2",
    name: "无犯罪记录证明",
    category: "治安",
    description: "申请开具无犯罪记录证明，用于就业、出国等场景",
    requiredMaterials: ["身份证原件", "申请表", "1寸照片2张"],
    processingTime: "5个工作日",
    fees: "免费",
  },
  {
    id: "sg3",
    name: "居住证申领",
    category: "户政",
    description: "流动人口申领居住证，享受居住地基本公共服务",
    requiredMaterials: ["身份证原件", "居住证明", "就业证明或就读证明", "申请表"],
    processingTime: "7个工作日",
    fees: "免费",
  },
  {
    id: "sg4",
    name: "护照办理",
    category: "出入境",
    description: "首次申领或换发护照",
    requiredMaterials: ["身份证原件", "户口簿原件", "照片回执", "申请表"],
    processingTime: "10个工作日",
    fees: "120元",
  },
  {
    id: "sg5",
    name: "港澳通行证",
    category: "出入境",
    description: "申领或换发往来港澳通行证",
    requiredMaterials: ["身份证原件", "照片回执", "申请表"],
    processingTime: "7个工作日",
    fees: "60元",
  },
  {
    id: "sg6",
    name: "养犬登记",
    category: "治安",
    description: "个人或单位养犬登记备案",
    requiredMaterials: ["身份证原件", "犬只免疫证明", "居住证明", "申请表"],
    processingTime: "5个工作日",
    fees: "免费",
  },
]

export const mockApplications: ServiceApplication[] = [
  {
    id: "app001",
    type: "no_criminal_record",
    typeName: "无犯罪记录证明",
    applicantName: "张三",
    applicantIdCard: "5221********1234",
    status: "processing",
    submitTime: "2026-05-28 09:30:00",
    updateTime: "2026-06-01 14:20:00",
    currentStep: 2,
    totalSteps: 4,
    materials: ["身份证原件", "申请表", "1寸照片2张"],
  },
  {
    id: "app002",
    type: "household",
    typeName: "户籍证明",
    applicantName: "张三",
    applicantIdCard: "5221********1234",
    status: "completed",
    submitTime: "2026-05-15 10:00:00",
    updateTime: "2026-05-18 16:30:00",
    currentStep: 4,
    totalSteps: 4,
    materials: ["身份证原件", "户口簿原件", "申请表"],
  },
  {
    id: "app003",
    type: "entry_exit",
    typeName: "护照办理",
    applicantName: "张三",
    applicantIdCard: "5221********1234",
    status: "pending",
    submitTime: "2026-06-05 11:20:00",
    updateTime: "2026-06-05 11:20:00",
    currentStep: 1,
    totalSteps: 4,
    materials: ["身份证原件", "户口簿原件", "照片回执", "申请表"],
  },
]

export const mockCertificates: ECertificate[] = [
  {
    id: "cert001",
    type: "id_card",
    typeName: "居民身份证",
    holderName: "张三",
    holderIdNumber: "5221****1234",
    issueDate: "2020-06-15",
    expiryDate: "2040-06-15",
    status: "valid",
    qrCodeData: "ID_ZHANGSAN_5221_2026",
  },
  {
    id: "cert002",
    type: "driver_license",
    typeName: "机动车驾驶证",
    holderName: "张三",
    holderIdNumber: "5221****1234",
    issueDate: "2022-03-20",
    expiryDate: "2028-03-20",
    status: "valid",
    qrCodeData: "DL_ZHANGSAN_5221_2026",
  },
  {
    id: "cert003",
    type: "passport",
    typeName: "中华人民共和国护照",
    holderName: "张三",
    holderIdNumber: "5221****1234",
    issueDate: "2021-09-10",
    expiryDate: "2031-09-10",
    status: "valid",
    qrCodeData: "PP_ZHANGSAN_5221_2026",
  },
  {
    id: "cert004",
    type: "driver_license",
    typeName: "机动车驾驶证",
    holderName: "刘过期",
    holderIdNumber: "5221****5555",
    issueDate: "2016-03-20",
    expiryDate: "2022-03-20",
    status: "expired",
    qrCodeData: "DL_LIUGUOQI_5221_2026",
  },
  {
    id: "cert005",
    type: "id_card",
    typeName: "居民身份证",
    holderName: "赵注销",
    holderIdNumber: "5221****6666",
    issueDate: "2015-06-15",
    expiryDate: "2035-06-15",
    status: "revoked",
    qrCodeData: "ID_ZHAOZHUXIAO_5221_2026",
  },
]

export const mockViolations: TrafficViolation[] = [
  {
    id: "v001",
    plateNumber: "贵A·12345",
    violationType: "超速行驶",
    violationDate: "2026-05-20 14:30:00",
    location: "贵阳市观山湖区金阳大道",
    fine: 200,
    points: 6,
    status: "unpaid",
  },
  {
    id: "v002",
    plateNumber: "贵A·12345",
    violationType: "违章停车",
    violationDate: "2026-05-25 09:15:00",
    location: "贵阳市南明区市西路",
    fine: 150,
    points: 0,
    status: "unpaid",
  },
  {
    id: "v003",
    plateNumber: "贵A·12345",
    violationType: "闯红灯",
    violationDate: "2026-04-10 18:45:00",
    location: "贵阳市云岩区中华北路",
    fine: 200,
    points: 6,
    status: "paid",
  },
]

export const mockAccidents: AccidentReport[] = [
  {
    id: "acc001",
    reporterName: "张三",
    accidentDate: "2026-06-02 15:30:00",
    location: "贵阳市观山湖区金阳大道与林城路交叉口",
    description: "直行时被右侧变道车辆刮擦，右前门受损",
    videoCount: 2,
    status: "processing",
  },
  {
    id: "acc002",
    reporterName: "李四",
    accidentDate: "2026-05-28 10:15:00",
    location: "贵阳市南明区花果园大街",
    description: "追尾事故，前车突然刹车导致碰撞，前车后保险杠受损",
    videoCount: 1,
    status: "resolved",
  },
  {
    id: "acc003",
    reporterName: "王五",
    accidentDate: "2026-06-08 08:45:00",
    location: "贵阳市云岩区北京路",
    description: "左转与直行车辆发生碰撞，双方车辆均有损伤",
    videoCount: 3,
    status: "submitted",
  },
]

export const mockChatHistory: ChatMessage[] = [
  {
    id: "chat001",
    role: "assistant",
    content: "您好！我是贵州公安智能咨询助手，有什么可以帮您的吗？",
    timestamp: "2026-06-09 10:00:00",
  },
]

export const mockSuggestions: Suggestion[] = [
  {
    id: "sug001",
    userId: "u001",
    userName: "李四",
    category: "交通管理",
    tags: ["红绿灯", "交通设施"],
    content: "建议在观山湖区长岭南路与金朱东路交叉口增设左转信号灯，该路口早晚高峰左转车辆排队严重，影响通行效率。",
    status: "completed",
    deadline: "2026-06-20",
    assignee: "王警官",
    response: "感谢您的建议！经现场调研，该路口确实存在左转通行压力大的问题。已协调交警部门于7月初完成信号灯增设方案设计，预计8月前完成施工。",
    isPublic: true,
    createdAt: "2026-05-15 09:00:00",
    completedAt: "2026-06-10 16:00:00",
  },
  {
    id: "sug002",
    userId: "u002",
    userName: "王五",
    category: "社区安全",
    tags: ["监控", "治安"],
    content: "花溪区清溪路沿线夜间照明不足，存在安全隐患，建议增设路灯和监控设施。",
    status: "processing",
    deadline: "2026-06-25",
    assignee: "陈警官",
    isPublic: true,
    createdAt: "2026-05-28 14:30:00",
  },
  {
    id: "sug003",
    userId: "u003",
    userName: "赵六",
    category: "便民服务",
    tags: ["线上办理", "效率"],
    content: "建议优化居住证线上申办流程，当前需要多次上传相同材料，体验不佳。",
    status: "assigned",
    deadline: "2026-07-05",
    assignee: "刘警官",
    isPublic: true,
    createdAt: "2026-06-01 11:00:00",
  },
  {
    id: "sug004",
    userId: "u004",
    userName: "孙七",
    category: "户籍管理",
    tags: ["户口迁移", "流程简化"],
    content: "建议简化省内户口迁移流程，实现一站式办理，减少群众跑腿次数。",
    status: "submitted",
    deadline: "2026-07-10",
    assignee: "",
    isPublic: false,
    createdAt: "2026-06-05 16:20:00",
  },
]

export const mockPublicOpinions: PublicOpinion[] = [
  {
    id: "po001",
    keyword: "电信诈骗",
    source: "微博",
    content: "多名网友反映近期收到冒充公安的诈骗电话",
    level: "high",
    status: "responding",
    detectedAt: "2026-06-08 22:15:00",
    response: "已发布防骗预警通知，协调三大运营商推送提醒短信",
  },
  {
    id: "po002",
    keyword: "交通拥堵",
    source: "抖音",
    content: "观山湖区金阳大道早高峰拥堵相关视频引发关注",
    level: "medium",
    status: "monitoring",
    detectedAt: "2026-06-09 07:30:00",
  },
  {
    id: "po003",
    keyword: "电动车管理",
    source: "微信",
    content: "社区群内关于电动车违规充电引发火灾的讨论",
    level: "high",
    status: "responding",
    detectedAt: "2026-06-09 08:45:00",
    response: "已部署社区民警入户排查，开展安全教育",
  },
  {
    id: "po004",
    keyword: "户籍办理",
    source: "论坛",
    content: "有群众反映户籍证明办理等待时间过长",
    level: "low",
    status: "new",
    detectedAt: "2026-06-09 09:10:00",
  },
  {
    id: "po005",
    keyword: "禁毒宣传",
    source: "微博",
    content: "禁毒日宣传活动引发积极反响和转发",
    level: "low",
    status: "resolved",
    detectedAt: "2026-06-08 10:00:00",
    response: "持续加大禁毒宣传力度",
  },
  {
    id: "po006",
    keyword: "治安巡逻",
    source: "微信",
    content: "夜间治安巡逻频次降低引发居民担忧",
    level: "critical",
    status: "responding",
    detectedAt: "2026-06-09 06:00:00",
    response: "已增派巡逻警力，调整巡逻路线和时间",
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann001",
    title: "关于开展夏季治安打击整治行动的通告",
    date: "2026-06-09",
    type: "notice",
    isRead: false,
  },
  {
    id: "ann002",
    title: "贵州省公安厅关于简化户籍迁移流程的通知",
    date: "2026-06-07",
    type: "policy",
    isRead: false,
  },
  {
    id: "ann003",
    title: "防范电信网络诈骗安全预警",
    date: "2026-06-05",
    type: "safety",
    isRead: true,
  },
  {
    id: "ann004",
    title: "2026年度贵州省机动车检验新规解读",
    date: "2026-06-03",
    type: "policy",
    isRead: true,
  },
  {
    id: "ann005",
    title: "关于加强电动自行车安全管理的通告",
    date: "2026-06-01",
    type: "notice",
    isRead: true,
  },
]

export const adminDashboardStats = {
  pendingReviews: 23,
  certificatesToAudit: 15,
  suggestionsToAssign: 8,
  publicOpinionAlerts: 4,
  todayApplications: 47,
  weeklyTrend: [
    { day: "周一", applications: 38, completed: 32 },
    { day: "周二", applications: 45, completed: 40 },
    { day: "周三", applications: 52, completed: 44 },
    { day: "周四", applications: 41, completed: 36 },
    { day: "周五", applications: 55, completed: 48 },
    { day: "周六", applications: 22, completed: 20 },
    { day: "周日", applications: 18, completed: 16 },
  ],
}

export interface CertVerificationRecord {
  id: string
  certType: string
  holderName: string
  verifierName: string
  verifierType: "hotel" | "internet_cafe" | "airport" | "bank" | "other"
  verifierLocation: string
  verifiedAt: string
  result: "pass" | "fail"
}

export const mockVerificationRecords: CertVerificationRecord[] = [
  {
    id: "vr001",
    certType: "居民身份证",
    holderName: "张三",
    verifierName: "贵阳凯宾斯基酒店",
    verifierType: "hotel",
    verifierLocation: "贵阳市南明区",
    verifiedAt: "2026-06-09 08:30:00",
    result: "pass",
  },
  {
    id: "vr002",
    certType: "居民身份证",
    holderName: "李四",
    verifierName: "星空网吧",
    verifierType: "internet_cafe",
    verifierLocation: "贵阳市云岩区",
    verifiedAt: "2026-06-09 09:15:00",
    result: "pass",
  },
  {
    id: "vr003",
    certType: "居民身份证",
    holderName: "王五",
    verifierName: "贵阳龙洞堡机场",
    verifierType: "airport",
    verifierLocation: "贵阳市南明区",
    verifiedAt: "2026-06-09 07:00:00",
    result: "pass",
  },
  {
    id: "vr004",
    certType: "机动车驾驶证",
    holderName: "赵六",
    verifierName: "贵阳交警执法点",
    verifierType: "other",
    verifierLocation: "贵阳市观山湖区",
    verifiedAt: "2026-06-08 22:10:00",
    result: "fail",
  },
  {
    id: "vr005",
    certType: "居民身份证",
    holderName: "孙七",
    verifierName: "如家酒店",
    verifierType: "hotel",
    verifierLocation: "贵阳市花溪区",
    verifiedAt: "2026-06-08 21:45:00",
    result: "pass",
  },
  {
    id: "vr006",
    certType: "中华人民共和国护照",
    holderName: "周八",
    verifierName: "贵阳龙洞堡机场",
    verifierType: "airport",
    verifierLocation: "贵阳市南明区",
    verifiedAt: "2026-06-08 14:30:00",
    result: "pass",
  },
]

export interface CertAuditRecord {
  id: string
  certType: string
  applicantName: string
  applicantIdNumber: string
  applyDate: string
  status: "pending" | "approved" | "rejected"
  auditor?: string
  auditDate?: string
  rejectReason?: string
}

export const mockCertAuditRecords: CertAuditRecord[] = [
  {
    id: "ca001",
    certType: "居民身份证",
    applicantName: "陈九",
    applicantIdNumber: "5221****5678",
    applyDate: "2026-06-08",
    status: "pending",
  },
  {
    id: "ca002",
    certType: "机动车驾驶证",
    applicantName: "吴十",
    applicantIdNumber: "5221****9012",
    applyDate: "2026-06-07",
    status: "pending",
  },
  {
    id: "ca003",
    certType: "居民身份证",
    applicantName: "郑冬",
    applicantIdNumber: "5221****3456",
    applyDate: "2026-06-06",
    status: "approved",
    auditor: "李警官",
    auditDate: "2026-06-07",
  },
  {
    id: "ca004",
    certType: "中华人民共和国护照",
    applicantName: "冯夏",
    applicantIdNumber: "5221****7890",
    applyDate: "2026-06-05",
    status: "rejected",
    auditor: "张警官",
    auditDate: "2026-06-06",
    rejectReason: "照片不符合规范，需重新提交",
  },
  {
    id: "ca005",
    certType: "机动车驾驶证",
    applicantName: "何春",
    applicantIdNumber: "5221****2345",
    applyDate: "2026-06-04",
    status: "approved",
    auditor: "王警官",
    auditDate: "2026-06-05",
  },
]
