import type {
  Engineer,
  ServiceItem,
  WorkOrder,
  WorkOrderStep,
  Part,
  EngineerCredit,
  ContractRecord,
  KnowledgeEntry,
  InspectionRecord,
  DiagnosisResult,
} from '@/types'

export const categories = [
  { key: 'air_conditioner', label: '空调维修', icon: 'Wind' },
  { key: 'water_heater', label: '热水器维修', icon: 'Flame' },
  { key: 'washing_machine', label: '洗衣机维修', icon: 'Waves' },
  { key: 'refrigerator', label: '冰箱维修', icon: 'Snowflake' },
  { key: 'tv', label: '电视维修', icon: 'Monitor' },
  { key: 'other', label: '其他家电', icon: 'Wrench' },
] as const

export const mockEngineers: Engineer[] = [
  { id: 'e1', name: '张明辉', avatar: '', skills: ['空调', '热水器'], rating: 4.9, creditLevel: 'S', completionRate: 98, isOnline: true, distance: 2.3, totalOrders: 1567, matchScore: 96 },
  { id: 'e2', name: '李建国', avatar: '', skills: ['洗衣机', '冰箱'], rating: 4.8, creditLevel: 'A', completionRate: 96, isOnline: true, distance: 3.5, totalOrders: 892, matchScore: 91 },
  { id: 'e3', name: '王大伟', avatar: '', skills: ['空调', '电视'], rating: 4.7, creditLevel: 'A', completionRate: 94, isOnline: false, distance: 5.1, totalOrders: 634, matchScore: 85 },
  { id: 'e4', name: '赵雪松', avatar: '', skills: ['热水器', '冰箱'], rating: 4.6, creditLevel: 'B', completionRate: 92, isOnline: true, distance: 1.8, totalOrders: 445, matchScore: 88 },
  { id: 'e5', name: '陈志强', avatar: '', skills: ['空调', '洗衣机'], rating: 4.5, creditLevel: 'B', completionRate: 90, isOnline: true, distance: 4.2, totalOrders: 312, matchScore: 79 },
]

export const mockServices: ServiceItem[] = [
  {
    id: 's1', name: '空调不制冷检修', category: 'air_conditioner', categoryLabel: '空调维修',
    laborFee: 80, description: '专业检测空调不制冷原因，包含制冷剂检测、压缩机检测、管路检测',
    estimatedDuration: '1-2小时',
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 180, laborFee: 80, partsFee: 100, estimatedArrival: '30分钟', completionRate: 98 },
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 160, laborFee: 80, partsFee: 80, estimatedArrival: '50分钟', completionRate: 94 },
    ],
  },
  {
    id: 's2', name: '热水器漏水维修', category: 'water_heater', categoryLabel: '热水器维修',
    laborFee: 60, description: '热水器漏水检测与维修，包含密封件更换、管路修复',
    estimatedDuration: '1-3小时',
    providers: [
      { id: 'e1', name: '张明辉', avatar: '', rating: 4.9, price: 150, laborFee: 60, partsFee: 90, estimatedArrival: '25分钟', completionRate: 98 },
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 130, laborFee: 60, partsFee: 70, estimatedArrival: '40分钟', completionRate: 92 },
    ],
  },
  {
    id: 's3', name: '洗衣机异响维修', category: 'washing_machine', categoryLabel: '洗衣机维修',
    laborFee: 70, description: '洗衣机异响检测与维修，包含轴承更换、减震器检测',
    estimatedDuration: '1-2小时',
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 170, laborFee: 70, partsFee: 100, estimatedArrival: '35分钟', completionRate: 96 },
      { id: 'e5', name: '陈志强', avatar: '', rating: 4.5, price: 140, laborFee: 70, partsFee: 70, estimatedArrival: '45分钟', completionRate: 90 },
    ],
  },
  {
    id: 's4', name: '冰箱不制冷维修', category: 'refrigerator', categoryLabel: '冰箱维修',
    laborFee: 90, description: '冰箱不制冷检测与维修，包含压缩机检测、制冷剂补充',
    estimatedDuration: '2-3小时',
    providers: [
      { id: 'e2', name: '李建国', avatar: '', rating: 4.8, price: 220, laborFee: 90, partsFee: 130, estimatedArrival: '40分钟', completionRate: 96 },
      { id: 'e4', name: '赵雪松', avatar: '', rating: 4.6, price: 190, laborFee: 90, partsFee: 100, estimatedArrival: '30分钟', completionRate: 92 },
    ],
  },
  {
    id: 's5', name: '电视花屏维修', category: 'tv', categoryLabel: '电视维修',
    laborFee: 100, description: '电视花屏检测与维修，包含主板检测、屏幕检测',
    estimatedDuration: '2-4小时',
    providers: [
      { id: 'e3', name: '王大伟', avatar: '', rating: 4.7, price: 280, laborFee: 100, partsFee: 180, estimatedArrival: '60分钟', completionRate: 94 },
    ],
  },
]

export const mockDiagnosisResult: DiagnosisResult = {
  category: 'air_conditioner',
  categoryLabel: '空调',
  faultType: '制冷剂不足',
  confidence: 92,
  description: '检测到空调可能存在制冷剂泄漏或不足的问题，导致制冷效果下降。建议尽快安排专业工程师上门检测。',
  recommendedServices: [
    { id: 's1', name: '空调不制冷检修', estimatedPrice: { min: 150, max: 300 }, estimatedDuration: '1-2小时', urgency: 'medium' },
    { id: 's6', name: '空调加氟服务', estimatedPrice: { min: 200, max: 400 }, estimatedDuration: '1小时', urgency: 'high' },
  ],
}

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo1', orderId: 'SO2026061001', engineerId: 'e1', userId: 'u1', status: 'pending',
    category: 'air_conditioner', categoryLabel: '空调维修', faultDescription: '空调不制冷，疑似制冷剂不足',
    beforePhotos: [], afterPhotos: [],
    steps: [
      { index: 1, title: '到场确认', description: '确认用户报修问题，检查空调外观', status: 'pending' },
      { index: 2, title: '故障检测', description: '检测制冷系统压力、温度传感器', status: 'pending' },
      { index: 3, title: '维修处理', description: '补充制冷剂或修复泄漏点', status: 'pending' },
      { index: 4, title: '功能测试', description: '开机测试制冷效果，确认恢复正常', status: 'pending' },
    ],
    createdAt: '2026-06-11 09:30', customerName: '刘女士', customerAddress: '阳光花园3栋502', customerPhone: '138****6789',
  },
  {
    id: 'wo2', orderId: 'SO2026061002', engineerId: 'e1', userId: 'u2', status: 'in_progress',
    category: 'water_heater', categoryLabel: '热水器维修', faultDescription: '热水器漏水，需要更换密封件',
    beforePhotos: [], afterPhotos: [],
    steps: [
      { index: 1, title: '到场确认', description: '确认漏水位置和程度', status: 'done' },
      { index: 2, title: '故障检测', description: '检测漏水原因，确认密封件损坏', status: 'done' },
      { index: 3, title: '维修处理', description: '更换密封件，修复管路连接', status: 'doing' },
      { index: 4, title: '功能测试', description: '通水测试，确认不再漏水', status: 'pending' },
    ],
    createdAt: '2026-06-11 08:00', customerName: '王先生', customerAddress: '翠湖花园12栋301', customerPhone: '139****1234',
  },
  {
    id: 'wo3', orderId: 'SO2026060905', engineerId: 'e1', userId: 'u3', status: 'signed',
    category: 'washing_machine', categoryLabel: '洗衣机维修', faultDescription: '洗衣机异响，需要更换轴承',
    beforePhotos: [], afterPhotos: [],
    steps: [
      { index: 1, title: '到场确认', description: '确认异响情况', status: 'done' },
      { index: 2, title: '故障检测', description: '检测轴承磨损情况', status: 'done' },
      { index: 3, title: '维修处理', description: '更换轴承', status: 'done' },
      { index: 4, title: '功能测试', description: '试运行确认无异响', status: 'done' },
    ],
    createdAt: '2026-06-09 14:00', completedAt: '2026-06-09 16:30', signedAt: '2026-06-09 16:35',
    customerName: '张女士', customerAddress: '金地华府8栋1801', customerPhone: '137****5678',
  },
]

export const mockParts: Part[] = [
  { id: 'p1', name: '空调压缩机', category: 'air_conditioner', supplierId: 'sp1', price: 580, stock: 23, qrCode: 'QR-AC-COMP-001', verified: true, image: '' },
  { id: 'p2', name: '制冷剂R410A', category: 'air_conditioner', supplierId: 'sp1', price: 120, stock: 56, qrCode: 'QR-AC-REF-001', verified: true, image: '' },
  { id: 'p3', name: '热水器密封件套装', category: 'water_heater', supplierId: 'sp2', price: 35, stock: 120, qrCode: 'QR-WH-SEAL-001', verified: true, image: '' },
  { id: 'p4', name: '洗衣机轴承', category: 'washing_machine', supplierId: 'sp2', price: 85, stock: 45, qrCode: 'QR-WM-BRG-001', verified: true, image: '' },
  { id: 'p5', name: '冰箱温控器', category: 'refrigerator', supplierId: 'sp3', price: 65, stock: 8, qrCode: 'QR-RF-CTRL-001', verified: false, image: '' },
]

export const mockCredits: EngineerCredit[] = [
  {
    engineerId: 'e1', name: '张明辉', avatar: '', score: 96, level: 'S', totalOrders: 1567,
    completionRate: 98, avgRating: 4.9, aiInspectionPassRate: 97,
    creditHistory: [
      { date: '2026-06-10', event: '服务好评+5分', scoreChange: 5, currentScore: 96 },
      { date: '2026-06-08', event: 'AI质检通过+2分', scoreChange: 2, currentScore: 91 },
      { date: '2026-06-05', event: '超时扣分-3分', scoreChange: -3, currentScore: 89 },
      { date: '2026-06-01', event: '服务好评+5分', scoreChange: 5, currentScore: 92 },
      { date: '2026-05-28', event: '连续10单好评+10分', scoreChange: 10, currentScore: 87 },
    ],
  },
  {
    engineerId: 'e2', name: '李建国', avatar: '', score: 88, level: 'A', totalOrders: 892,
    completionRate: 96, avgRating: 4.8, aiInspectionPassRate: 94,
    creditHistory: [
      { date: '2026-06-09', event: '服务好评+5分', scoreChange: 5, currentScore: 88 },
      { date: '2026-06-06', event: 'AI质检通过+2分', scoreChange: 2, currentScore: 83 },
      { date: '2026-06-02', event: '客户投诉-8分', scoreChange: -8, currentScore: 81 },
    ],
  },
  {
    engineerId: 'e3', name: '王大伟', avatar: '', score: 78, level: 'B', totalOrders: 634,
    completionRate: 94, avgRating: 4.7, aiInspectionPassRate: 90,
    creditHistory: [
      { date: '2026-06-07', event: '服务好评+5分', scoreChange: 5, currentScore: 78 },
      { date: '2026-06-03', event: '超时扣分-3分', scoreChange: -3, currentScore: 73 },
    ],
  },
]

export const mockContracts: ContractRecord[] = [
  {
    id: 'ct1', orderId: 'SO2026060905', customerName: '张女士', engineerName: '张明辉',
    templateId: 'tpl-standard', status: 'archived', signedAt: '2026-06-09 16:35',
    archiveHash: '0x7a3f8b2c1d9e4f6a8b0c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9e',
    evidenceChain: [
      { type: 'contract', hash: '0x1a2b...', timestamp: '2026-06-09 14:00', description: '服务合同签署' },
      { type: 'photo_before', hash: '0x3c4d...', timestamp: '2026-06-09 14:10', description: '维修前照片' },
      { type: 'photo_after', hash: '0x5e6f...', timestamp: '2026-06-09 16:25', description: '维修后照片' },
      { type: 'signature', hash: '0x7a8b...', timestamp: '2026-06-09 16:35', description: '用户签字确认' },
      { type: 'inspection', hash: '0x9c0d...', timestamp: '2026-06-09 18:00', description: 'AI质检通过' },
    ],
  },
  {
    id: 'ct2', orderId: 'SO2026061002', customerName: '王先生', engineerName: '张明辉',
    templateId: 'tpl-standard', status: 'pending_sign',
    evidenceChain: [
      { type: 'contract', hash: '0xaa1b...', timestamp: '2026-06-11 08:00', description: '服务合同待签' },
    ],
  },
  {
    id: 'ct3', orderId: 'SO2026061003', customerName: '赵先生', engineerName: '李建国',
    templateId: 'tpl-standard', status: 'signed', signedAt: '2026-06-10 17:20',
    archiveHash: '0x8b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    evidenceChain: [
      { type: 'contract', hash: '0xbb2c...', timestamp: '2026-06-10 09:00', description: '服务合同签署' },
      { type: 'photo_before', hash: '0xcc3d...', timestamp: '2026-06-10 09:15', description: '维修前照片' },
      { type: 'photo_after', hash: '0xdd4e...', timestamp: '2026-06-10 17:00', description: '维修后照片' },
      { type: 'signature', hash: '0xee5f...', timestamp: '2026-06-10 17:20', description: '用户签字确认' },
    ],
  },
]

export const mockKnowledge: KnowledgeEntry[] = [
  { id: 'k1', title: '格力空调E1故障代码处理', category: 'air_conditioner', brand: '格力', content: 'E1代码表示压缩机高压保护，需检查室外机散热、制冷剂充注量...', lastUpdated: '2026-06-01' },
  { id: 'k2', title: '美的热水器E5故障代码处理', category: 'water_heater', brand: '美的', content: 'E5代码表示出水温度传感器故障，需更换温度传感器...', lastUpdated: '2026-05-28' },
  { id: 'k3', title: '海尔洗衣机F8故障代码处理', category: 'washing_machine', brand: '海尔', content: 'F8代码表示水位传感器异常，需检查水位传感器及连接线...', lastUpdated: '2026-05-20' },
  { id: 'k4', title: '西门子冰箱常见故障排查', category: 'refrigerator', brand: '西门子', content: '常见故障包括不制冷、异响、漏水等，排查步骤...', lastUpdated: '2026-06-05' },
  { id: 'k5', title: 'TCL电视背光故障维修指南', category: 'tv', brand: 'TCL', content: '背光故障表现为画面暗或无显示，需检测背光板和灯条...', lastUpdated: '2026-05-15' },
]

export const mockInspections: InspectionRecord[] = [
  { id: 'ins1', orderId: 'SO2026060905', engineerName: '张明辉', status: 'pass', aiScore: 96, checkDate: '2026-06-09', issues: [] },
  { id: 'ins2', orderId: 'SO2026060903', engineerName: '李建国', status: 'pass', aiScore: 91, checkDate: '2026-06-08', issues: [] },
  { id: 'ins3', orderId: 'SO2026060901', engineerName: '王大伟', status: 'fail', aiScore: 62, checkDate: '2026-06-07', issues: ['完工照片与维修项目不匹配', '用户签字模糊'] },
  { id: 'ins4', orderId: 'SO2026060808', engineerName: '赵雪松', status: 'pass', aiScore: 88, checkDate: '2026-06-06', issues: [] },
  { id: 'ins5', orderId: 'SO2026060805', engineerName: '陈志强', status: 'pending', aiScore: 0, checkDate: '2026-06-11', issues: [] },
]

export const liveSteps: WorkOrderStep[] = [
  { index: 1, title: '到场确认', description: '确认漏水位置和程度', status: 'done' },
  { index: 2, title: '故障检测', description: '检测漏水原因，确认密封件损坏', status: 'done' },
  { index: 3, title: '维修处理', description: '更换密封件，修复管路连接', status: 'doing' },
  { index: 4, title: '功能测试', description: '通水测试，确认不再漏水', status: 'pending' },
]

export const mockBarrageMessages = [
  '师傅手艺真好！',
  '这个配件我也换过',
  '请问这个故障一般要修多久？',
  '看得很清楚，感谢直播',
  '我家空调也是这个问题',
  '配件看起来很新',
  '维修过程很规范',
  '工程师很专业！',
  '这样操作安全吗？',
  '请问费用大概多少？',
]
