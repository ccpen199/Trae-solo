import type { ServiceCategory, SkillTag, Technician, AppUser, RepairTask, Review, ServiceReport, PaymentProof, ServiceNode } from '../types'
import { generateId } from '../utils/crypto'

export const mockCategories: ServiceCategory[] = [
  { id: 'cat-1', name: '家电维修', parentId: null, icon: 'tv' },
  { id: 'cat-1-1', name: '空调维修', parentId: 'cat-1' },
  { id: 'cat-1-2', name: '冰箱维修', parentId: 'cat-1' },
  { id: 'cat-1-3', name: '洗衣机维修', parentId: 'cat-1' },
  { id: 'cat-1-4', name: '电视维修', parentId: 'cat-1' },
  { id: 'cat-2', name: '水电维修', parentId: null, icon: 'zap' },
  { id: 'cat-2-1', name: '电路维修', parentId: 'cat-2' },
  { id: 'cat-2-2', name: '水管维修', parentId: 'cat-2' },
  { id: 'cat-2-3', name: '卫浴安装', parentId: 'cat-2' },
  { id: 'cat-3', name: '装修服务', parentId: null, icon: 'hammer' },
  { id: 'cat-3-1', name: '墙面修补', parentId: 'cat-3' },
  { id: 'cat-3-2', name: '地板维修', parentId: 'cat-3' },
  { id: 'cat-3-3', name: '门窗维修', parentId: 'cat-3' },
  { id: 'cat-4', name: '管道疏通', parentId: null, icon: 'droplets' },
  { id: 'cat-4-1', name: '马桶疏通', parentId: 'cat-4' },
  { id: 'cat-4-2', name: '下水道疏通', parentId: 'cat-4' },
  { id: 'cat-4-3', name: '高压疏通', parentId: 'cat-4' },
]

export const mockSkillTags: SkillTag[] = [
  { id: 'skill-1', name: '变频空调', categoryId: 'cat-1-1' },
  { id: 'skill-2', name: '中央空调', categoryId: 'cat-1-1' },
  { id: 'skill-3', name: '加氟保养', categoryId: 'cat-1-1' },
  { id: 'skill-4', name: '压缩机维修', categoryId: 'cat-1-2' },
  { id: 'skill-5', name: '冰箱除冰', categoryId: 'cat-1-2' },
  { id: 'skill-6', name: '温控器更换', categoryId: 'cat-1-2' },
  { id: 'skill-7', name: '滚筒洗衣机', categoryId: 'cat-1-3' },
  { id: 'skill-8', name: '波轮洗衣机', categoryId: 'cat-1-3' },
  { id: 'skill-9', name: '排水泵维修', categoryId: 'cat-1-3' },
  { id: 'skill-10', name: '液晶屏维修', categoryId: 'cat-1-4' },
  { id: 'skill-11', name: '电路检测', categoryId: 'cat-2-1' },
  { id: 'skill-12', name: '漏电排查', categoryId: 'cat-2-1' },
  { id: 'skill-13', name: '跳闸维修', categoryId: 'cat-2-1' },
  { id: 'skill-14', name: '线路改造', categoryId: 'cat-2-1' },
  { id: 'skill-15', name: '水管焊接', categoryId: 'cat-2-2' },
  { id: 'skill-16', name: '漏水检测', categoryId: 'cat-2-2' },
  { id: 'skill-17', name: 'PPR热熔', categoryId: 'cat-2-2' },
  { id: 'skill-18', name: '马桶安装', categoryId: 'cat-2-3' },
  { id: 'skill-19', name: '花洒安装', categoryId: 'cat-2-3' },
  { id: 'skill-20', name: '浴霸安装', categoryId: 'cat-2-3' },
  { id: 'skill-21', name: '刮腻子', categoryId: 'cat-3-1' },
  { id: 'skill-22', name: '乳胶漆', categoryId: 'cat-3-1' },
  { id: 'skill-23', name: '墙纸修补', categoryId: 'cat-3-1' },
  { id: 'skill-24', name: '实木地板', categoryId: 'cat-3-2' },
  { id: 'skill-25', name: '复合地板', categoryId: 'cat-3-2' },
  { id: 'skill-26', name: '起拱修复', categoryId: 'cat-3-2' },
  { id: 'skill-27', name: '铝合金门窗', categoryId: 'cat-3-3' },
  { id: 'skill-28', name: '塑钢门窗', categoryId: 'cat-3-3' },
  { id: 'skill-29', name: '换纱窗', categoryId: 'cat-3-3' },
  { id: 'skill-30', name: '马桶疏通', categoryId: 'cat-4-1' },
  { id: 'skill-31', name: '蹲便疏通', categoryId: 'cat-4-1' },
  { id: 'skill-32', name: '地漏疏通', categoryId: 'cat-4-2' },
  { id: 'skill-33', name: '厨房下水', categoryId: 'cat-4-2' },
  { id: 'skill-34', name: '高压水射流', categoryId: 'cat-4-3' },
  { id: 'skill-35', name: '化学疏通', categoryId: 'cat-4-3' },
  { id: 'skill-36', name: '主管道疏通', categoryId: 'cat-4-3' },
]

export const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    name: '张师傅',
    phone: '138****1234',
    skillTags: ['skill-1', 'skill-2', 'skill-3', 'skill-11', 'skill-12', 'skill-13'],
    serviceRadius: 10,
    rating: 4.8,
    reviewCount: 156,
    certificates: [
      {
        id: 'cert-1',
        name: '电工特种作业操作证',
        imageUrl: '',
        ocrData: '电工特种作业操作证（低压），证号：T51012419850315XXXX，作业类别：电工作业，准操项目：低压电工作业，初领日期：2015-06-15，有效期至：2028-06-15，核发机关：上海市应急管理局',
        verified: true,
        verifiedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'cert-2',
        name: '制冷设备维修工',
        imageUrl: '',
        ocrData: '制冷设备维修工职业资格证书（中级），证号：RZ201803120XXX，等级：四级/中级技能，职业：制冷设备维修工，发证日期：2018-03-12，发证机关：上海市人力资源和社会保障局',
        verified: true,
        verifiedAt: '2024-02-20T09:30:00Z',
      },
    ],
    location: { lat: 31.2304, lng: 121.4737 },
    frozen: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tech-2',
    name: '李师傅',
    phone: '139****5678',
    skillTags: ['skill-4', 'skill-5', 'skill-6', 'skill-7', 'skill-8', 'skill-9', 'skill-10'],
    serviceRadius: 8,
    rating: 4.9,
    reviewCount: 89,
    certificates: [
      {
        id: 'cert-3',
        name: '家用电器维修证',
        imageUrl: '',
        ocrData: '家用电器产品维修工职业技能等级证书（高级），证号：JD201908050XXX，职业：家用电器产品维修工，等级：三级/高级工，发证日期：2019-08-05',
        verified: true,
        verifiedAt: '2024-03-10T14:00:00Z',
      },
    ],
    location: { lat: 31.2350, lng: 121.4800 },
    frozen: false,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'tech-3',
    name: '王师傅',
    phone: '137****9012',
    skillTags: ['skill-11', 'skill-12', 'skill-13', 'skill-14', 'skill-15', 'skill-16', 'skill-17', 'skill-18', 'skill-19', 'skill-20'],
    serviceRadius: 15,
    rating: 4.5,
    reviewCount: 42,
    certificates: [],
    location: { lat: 31.2400, lng: 121.4650 },
    frozen: false,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'tech-4',
    name: '赵师傅',
    phone: '136****3456',
    skillTags: ['skill-15', 'skill-16', 'skill-30', 'skill-31', 'skill-32', 'skill-33', 'skill-34', 'skill-35', 'skill-36'],
    serviceRadius: 5,
    rating: 4.2,
    reviewCount: 15,
    certificates: [
      {
        id: 'cert-4',
        name: '管道工资格证',
        imageUrl: '',
        ocrData: '管道工职业技能等级证书（中级），证号：GD202011200XXX，职业：管道工，等级：四级/中级工，从事给排水管道安装维修8年经验',
        verified: false,
        verifiedAt: undefined,
      },
    ],
    location: { lat: 31.2250, lng: 121.4900 },
    frozen: true,
    frozenReason: '客户差评：维修马桶后仍漏水，联系不上师傅',
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'tech-5',
    name: '刘师傅',
    phone: '135****7890',
    skillTags: ['skill-21', 'skill-22', 'skill-23', 'skill-24', 'skill-25', 'skill-26', 'skill-27', 'skill-28', 'skill-29'],
    serviceRadius: 12,
    rating: 4.7,
    reviewCount: 67,
    certificates: [
      {
        id: 'cert-5',
        name: '装饰装修工',
        imageUrl: '',
        ocrData: '装饰装修工职业技能等级证书（高级），证号：ZS201705180XXX，职业：装饰装修工，等级：三级/高级工，从事室内装修12年',
        verified: true,
        verifiedAt: '2024-01-28T11:20:00Z',
      },
      {
        id: 'cert-6',
        name: '高处作业证',
        imageUrl: '',
        ocrData: '高处作业特种作业操作证，证号：G51012419820812XXXX，作业类别：高处作业，准操项目：登高架设作业，有效期至2027-04-10',
        verified: true,
        verifiedAt: '2024-02-14T16:45:00Z',
      },
    ],
    location: { lat: 31.2280, lng: 121.4680 },
    frozen: false,
    createdAt: '2024-01-15T00:00:00Z',
  },
]

export const mockUsers: AppUser[] = [
  {
    id: 'user-1',
    role: 'user',
    name: '陈先生',
    phone: '135****7890',
  },
]

export const getSubCategories = (parentId: string | null): ServiceCategory[] => {
  return mockCategories.filter(c => c.parentId === parentId)
}

export const getCategoryById = (id: string): ServiceCategory | undefined => {
  return mockCategories.find(c => c.id === id)
}

export const getCategoryPath = (categoryId: string): ServiceCategory[] => {
  const path: ServiceCategory[] = []
  let current: ServiceCategory | undefined = getCategoryById(categoryId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? getCategoryById(current.parentId) : undefined
  }
  return path
}

interface DemoDataResult {
  tasks: RepairTask[]
  reviews: Review[]
  reports: ServiceReport[]
  payments: PaymentProof[]
}

export const generateDemoData = (): DemoDataResult => {
  const now = Date.now()
  const hours = (h: number) => new Date(now - h * 3600 * 1000).toISOString()

  const task1: RepairTask = {
    id: generateId('task'),
    userId: 'user-1',
    categoryId: 'cat-2-1',
    title: '客厅电路频繁跳闸',
    description: '客厅空调和电热水器同时开启时就跳闸，单独开没问题。怀疑是空开容量不够或线路有漏电，需要师傅上门检测排查。配电箱在进门玄关处。',
    images: [],
    address: '上海市黄浦区人民大道200号3号楼1202室',
    location: { lat: 31.2330, lng: 121.4770 },
    expectedResponseTime: 30,
    status: 'broadcasting',
    checkins: [],
    bids: [],
    createdAt: hours(0.5),
  }

  const task2Checkins: { node: ServiceNode; timestamp: string; location: { lat: number; lng: number }; note?: string }[] = [
    { node: 'door_arrival', timestamp: hours(20), location: { lat: 31.2304, lng: 121.4737 }, note: '已到小区门口，客户电话联系中' },
    { node: 'start_work', timestamp: hours(19), location: { lat: 31.2304, lng: 121.4737 }, note: '开始拆检，空开C16，已建议更换C25' },
    { node: 'completed', timestamp: hours(18), location: { lat: 31.2304, lng: 121.4737 }, note: '更换空开完成，测试双设备同时运行正常' },
  ]

  const task2: RepairTask = {
    id: generateId('task'),
    userId: 'user-1',
    categoryId: 'cat-4-1',
    title: '马桶堵塞下水慢',
    description: '家里马桶冲水后下水很慢，有时还会溢水，用了管道疏通剂没效果。需要专业师傅上门处理。',
    images: [],
    address: '上海市黄浦区南京东路100号5号楼801室',
    location: { lat: 31.2304, lng: 121.4737 },
    expectedResponseTime: 60,
    status: 'reviewed',
    technicianId: 'tech-4',
    checkins: task2Checkins,
    bids: [],
    createdAt: hours(24),
    acceptedAt: hours(23),
    completedAt: hours(18),
    paymentProofId: generateId('payment'),
    serviceReportId: generateId('report'),
    userReviewId: generateId('review'),
    technicianReviewId: generateId('review'),
  }

  const task3Checkins: { node: ServiceNode; timestamp: string; location: { lat: number; lng: number }; note?: string }[] = [
    { node: 'door_arrival', timestamp: hours(5), location: { lat: 31.2304, lng: 121.4737 }, note: '准时到达' },
    { node: 'start_work', timestamp: hours(4.5), location: { lat: 31.2304, lng: 121.4737 }, note: '检测到空调压缩机启动电容失效' },
  ]

  const task3: RepairTask = {
    id: generateId('task'),
    userId: 'user-1',
    categoryId: 'cat-1-1',
    title: '客厅空调不制冷',
    description: '格力3匹变频柜机，开机后出风不冷，室外机风扇正常运转但压缩机不启动。去年加过氟，这次可能是电路问题。',
    images: [],
    address: '上海市黄浦区淮海中路888号恒隆广场公寓A栋1603',
    location: { lat: 31.2280, lng: 121.4650 },
    expectedResponseTime: 30,
    status: 'in_progress',
    technicianId: 'tech-1',
    checkins: task3Checkins,
    bids: [],
    createdAt: hours(8),
    acceptedAt: hours(7),
  }

  const task4: RepairTask = {
    id: generateId('task'),
    userId: 'user-1',
    categoryId: 'cat-3-1',
    title: '卧室墙面渗水发霉',
    description: '主卧靠窗墙面出现渗水痕迹，约1平米，涂层脱落发霉，需要铲除修补并重新刷漆。',
    images: [],
    address: '上海市徐汇区衡山路10号1号楼601室',
    location: { lat: 31.2100, lng: 121.4400 },
    expectedResponseTime: 120,
    status: 'completed',
    technicianId: 'tech-5',
    checkins: [
      { node: 'door_arrival', timestamp: hours(36), location: { lat: 31.2100, lng: 121.4400 } },
      { node: 'start_work', timestamp: hours(35), location: { lat: 31.2100, lng: 121.4400 }, note: '开始铲墙，渗水原因：窗户密封胶老化' },
      { node: 'completed', timestamp: hours(10), location: { lat: 31.2100, lng: 121.4400 }, note: '铲墙3遍腻子+底漆1遍+面漆2遍，等待完全干透' },
    ],
    bids: [],
    createdAt: hours(48),
    acceptedAt: hours(46),
    completedAt: hours(10),
    serviceReportId: generateId('report'),
  }

  const report1: ServiceReport = {
    id: task2.serviceReportId!,
    taskId: task2.id,
    technicianId: 'tech-4',
    diagnosis: '马桶主排污口被塑料瓶标签和头发混合物堵塞，造成排水不畅。用弹簧式疏通器深入1.2米处完全打通，经3次大量冲水测试排水恢复正常，无溢水现象。',
    parts: [
      { name: '马桶法兰密封圈', quantity: 1, unitPrice: 35 },
      { name: '管道疏通剂（强力型）', quantity: 1, unitPrice: 28 },
      { name: '玻璃胶（中性防霉）', quantity: 1, unitPrice: 45 },
    ],
    warrantyMonths: 6,
    createdAt: hours(18),
  }

  const report2: ServiceReport = {
    id: task4.serviceReportId!,
    taskId: task4.id,
    technicianId: 'tech-5',
    diagnosis: '外窗台密封胶老化开裂导致雨水渗入内墙，墙体受潮后腻子粉化发霉。已铲除1.5平米受损墙面至水泥层，重新做防水处理、3遍腻子找平、底漆1遍+面漆2遍涂刷，并重新打外墙密封胶。',
    parts: [
      { name: '外墙耐候密封胶', quantity: 2, unitPrice: 68 },
      { name: '防水腻子粉', quantity: 1, unitPrice: 85 },
      { name: '抗碱封闭底漆', quantity: 1, unitPrice: 120 },
      { name: '乳胶漆（立邦净味）', quantity: 1, unitPrice: 195 },
    ],
    warrantyMonths: 24,
    createdAt: hours(10),
  }

  const payment1: PaymentProof = {
    id: task2.paymentProofId!,
    taskId: task2.id,
    amount: 308,
    imageUrl: '',
    uploadedAt: hours(17),
  }

  const review1: Review = {
    id: task2.userReviewId!,
    taskId: task2.id,
    fromUserId: 'user-1',
    toUserId: 'tech-4',
    fromRole: 'user',
    rating: 2,
    content: '维修后第二天又开始慢慢堵了，而且现在冲水声音很大，师傅电话打不通，微信也不回。花了300多修了等于没修，非常失望！',
    createdAt: hours(16),
  }

  const review2: Review = {
    id: task2.technicianReviewId!,
    taskId: task2.id,
    fromUserId: 'tech-4',
    toUserId: 'user-1',
    fromRole: 'technician',
    rating: 4,
    content: '客户沟通顺畅，现场条件良好，马桶比较脏但处理好了。客户付款及时，好评。',
    createdAt: hours(16.5),
  }

  return {
    tasks: [task1, task2, task3, task4],
    reviews: [review1, review2],
    reports: [report1, report2],
    payments: [payment1],
  }
}
