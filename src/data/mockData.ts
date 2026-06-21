import type { Listing, Contract, Payment, ServiceRequest, Appointment, FinancialProduct, TimeSlot } from '@/types'

const mockListings: Listing[] = [
  {
    id: 'L001',
    title: '建融家园·金融城精品公寓',
    type: 'ccb_direct',
    address: '上海市浦东新区陆家嘴金融贸易区银城中路168号',
    district: '浦东新区',
    price: 8500,
    area: 68,
    rooms: 2,
    halls: 1,
    floor: '18/32',
    orientation: '南',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20luxury%20apartment%20living%20room%20with%20city%20view%2C%20blue%20accents%2C%20scandinavian%20design%2C%20bright%20natural%20light&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedroom%20with%20large%20window%2C%20minimalist%20design%2C%20soft%20blue%20tones%2C%20cozy%20atmosphere&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '主卧', area: 18 },
        { room: '次卧', area: 12 },
        { room: '客厅', area: 22 },
        { room: '厨房', area: 8 },
        { room: '卫生间', area: 6 },
        { room: '阳台', area: 4 },
      ],
      orientation: '南北通透',
      lightingScore: 92,
      lightingMap: [[9, 8, 7, 6], [8, 9, 8, 7], [7, 8, 9, 8]],
    },
    commuteInfo: {
      metro: [{ station: '陆家嘴站', minutes: 5 }],
      bus: [{ station: '银城中路站', minutes: 3 }],
      drive: [{ destination: '人民广场', minutes: 15 }],
    },
    landlord: { name: '建融家园', type: 'ccb', verified: true, rating: 4.9 },
    amenities: ['空调', '洗衣机', '冰箱', '热水器', '智能门锁', '健身房', '停车位'],
    verification: { directManaged: true, managementStandard: '建融家园直营管理体系V3.0' },
    status: 'available',
  },
  {
    id: 'L002',
    title: '万科泊寓·徐汇滨江社区',
    type: 'partner',
    address: '上海市徐汇区龙腾大道2555号',
    district: '徐汇区',
    price: 6200,
    area: 45,
    rooms: 1,
    halls: 1,
    floor: '12/24',
    orientation: '东南',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20studio%20apartment%20interior%2C%20warm%20lighting%2C%20modern%20furniture%2C%20plant%20decor&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '卧室', area: 15 },
        { room: '客厅', area: 14 },
        { room: '厨房', area: 6 },
        { room: '卫生间', area: 5 },
        { room: '阳台', area: 5 },
      ],
      orientation: '东南朝向',
      lightingScore: 85,
      lightingMap: [[8, 7, 6], [7, 8, 7], [6, 7, 8]],
    },
    commuteInfo: {
      metro: [{ station: '龙华站', minutes: 8 }],
      bus: [{ station: '龙腾大道站', minutes: 2 }],
      drive: [{ destination: '人民广场', minutes: 20 }],
    },
    landlord: { name: '万科泊寓', type: 'partner', verified: true, rating: 4.6 },
    amenities: ['空调', '洗衣机', '冰箱', '公共厨房', '公共客厅', '快递柜'],
    verification: { whitelistQualified: true, whitelistExpiry: '2027-12-31', serviceContractNo: 'SC-2026-0089', serviceContractSigned: true },
    status: 'available',
  },
  {
    id: 'L003',
    title: '静安寺精装两房·个人房东',
    type: 'personal',
    address: '上海市静安区南京西路1788号',
    district: '静安区',
    price: 7800,
    area: 72,
    rooms: 2,
    halls: 1,
    floor: '6/18',
    orientation: '南',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20chinese%20style%20living%20room%2C%20wooden%20furniture%2C%20warm%20tones%2C%20traditional%20modern%20fusion&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '主卧', area: 20 },
        { room: '次卧', area: 14 },
        { room: '客厅', area: 20 },
        { room: '厨房', area: 8 },
        { room: '卫生间', area: 7 },
        { room: '储物间', area: 3 },
      ],
      orientation: '正南朝向',
      lightingScore: 88,
      lightingMap: [[8, 9, 7, 6], [7, 8, 9, 7], [6, 7, 8, 9]],
    },
    commuteInfo: {
      metro: [{ station: '静安寺站', minutes: 3 }],
      bus: [{ station: '南京西路站', minutes: 1 }],
      drive: [{ destination: '人民广场', minutes: 8 }],
    },
    landlord: { name: '张先生', type: 'personal', verified: true, rating: 4.3 },
    amenities: ['空调', '洗衣机', '冰箱', '热水器', '燃气灶'],
    verification: { propertyVerified: true, propertyCertNo: '沪房权证静字第2026001号', faceVerified: true, faceVerifiedAt: '2026-05-20T14:30:00Z' },
    status: 'available',
  },
  {
    id: 'L004',
    title: '建融家园·张江科技公寓',
    type: 'ccb_direct',
    address: '上海市浦东新区张江高科技园区碧波路888号',
    district: '浦东新区',
    price: 5500,
    area: 55,
    rooms: 1,
    halls: 1,
    floor: '22/30',
    orientation: '南',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20apartment%20interior%2C%20smart%20home%20devices%2C%20blue%20LED%20accents%2C%20clean%20design&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '卧室', area: 18 },
        { room: '客厅', area: 16 },
        { room: '厨房', area: 7 },
        { room: '卫生间', area: 6 },
        { room: '阳台', area: 8 },
      ],
      orientation: '南向',
      lightingScore: 90,
      lightingMap: [[9, 8, 7], [8, 9, 8], [7, 8, 9]],
    },
    commuteInfo: {
      metro: [{ station: '张江高科站', minutes: 6 }],
      bus: [{ station: '碧波路站', minutes: 2 }],
      drive: [{ destination: '人民广场', minutes: 30 }],
    },
    landlord: { name: '建融家园', type: 'ccb', verified: true, rating: 4.8 },
    amenities: ['空调', '洗衣机', '冰箱', '智能门锁', '共享办公区', '健身房', '快递柜'],
    verification: { directManaged: true, managementStandard: '建融家园直营管理体系V3.0' },
    status: 'available',
  },
  {
    id: 'L005',
    title: '龙湖冠寓·虹桥商务区',
    type: 'partner',
    address: '上海市闵行区虹桥商务区申虹路36号',
    district: '闵行区',
    price: 4800,
    area: 38,
    rooms: 1,
    halls: 0,
    floor: '8/16',
    orientation: '东',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=compact%20modern%20studio%20apartment%2C%20efficient%20layout%2C%20bright%20east%20facing%20window%2C%20minimalist&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '起居室', area: 18 },
        { room: '厨房', area: 5 },
        { room: '卫生间', area: 5 },
        { room: '阳台', area: 4 },
        { room: '玄关', area: 6 },
      ],
      orientation: '东向',
      lightingScore: 78,
      lightingMap: [[7, 8, 6], [6, 7, 5], [5, 6, 4]],
    },
    commuteInfo: {
      metro: [{ station: '虹桥火车站', minutes: 10 }],
      bus: [{ station: '申虹路站', minutes: 3 }],
      drive: [{ destination: '人民广场', minutes: 25 }],
    },
    landlord: { name: '龙湖冠寓', type: 'partner', verified: true, rating: 4.5 },
    amenities: ['空调', '洗衣机', '公共厨房', '公共客厅', '快递柜'],
    verification: { whitelistQualified: true, whitelistExpiry: '2027-12-31', serviceContractNo: 'SC-2026-0089', serviceContractSigned: true },
    status: 'available',
  },
  {
    id: 'L006',
    title: '黄浦老西门·个人精装三房',
    type: 'personal',
    address: '上海市黄浦区老西门复兴东路555号',
    district: '黄浦区',
    price: 12000,
    area: 95,
    rooms: 3,
    halls: 2,
    floor: '10/22',
    orientation: '南北',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spacious%20three%20bedroom%20apartment%20living%20room%2C%20elegant%20decoration%2C%20natural%20light%2C%20city%20view&image_size=landscape_16_9',
    ],
    floorPlan: '',
    aiAnalysis: {
      areaBreakdown: [
        { room: '主卧', area: 22 },
        { room: '次卧A', area: 15 },
        { room: '次卧B', area: 12 },
        { room: '客厅', area: 25 },
        { room: '餐厅', area: 8 },
        { room: '厨房', area: 7 },
        { room: '卫生间', area: 6 },
      ],
      orientation: '南北通透',
      lightingScore: 86,
      lightingMap: [[8, 9, 8, 7], [7, 8, 9, 8], [6, 7, 8, 9]],
    },
    commuteInfo: {
      metro: [{ station: '老西门站', minutes: 2 }],
      bus: [{ station: '复兴东路站', minutes: 1 }],
      drive: [{ destination: '人民广场', minutes: 5 }],
    },
    landlord: { name: '李女士', type: 'personal', verified: true, rating: 4.1 },
    amenities: ['空调', '洗衣机', '冰箱', '热水器', '燃气灶', '洗碗机'],
    verification: { propertyVerified: true, propertyCertNo: '沪房权证黄字第2026008号', faceVerified: true, faceVerifiedAt: '2026-06-01T09:15:00Z' },
    status: 'available',
  },
]

const generateTimeSlots = (baseDate: Date): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let d = 0; d < 7; d++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
    times.forEach((time, idx) => {
      slots.push({
        date: dateStr,
        time,
        available: !(d === 0 && idx < 3) && !(d === 2 && idx >= 4),
      })
    })
  }
  return slots
}

const mockAppointments: Appointment[] = [
  {
    id: 'A001',
    listingId: 'L001',
    tenantId: 'U001',
    agentId: 'AG001',
    agentName: '王经理',
    agentAvatar: '',
    agentRating: 4.8,
    slots: generateTimeSlots(new Date()),
    selectedSlot: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    confirmHistory: [{ action: '创建预约', timestamp: new Date().toISOString(), by: '租客' }],
  },
]

const mockContracts: Contract[] = [
  {
    id: 'C001',
    listingId: 'L001',
    tenantId: 'U001',
    tenantName: '张明',
    landlordId: 'LL001',
    landlordName: '建融家园',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    monthlyRent: 8500,
    deposit: 17000,
    status: 'signing',
    bankCertificate: {
      certificateNo: 'JRCB-2026-000001',
      hash: '0x7a3f...e9b2',
      timestamp: '2026-06-15T10:30:00Z',
    },
    filingInfo: {
      filingNo: '',
      status: 'pending',
      filedAt: '',
      reviewComments: '',
    },
    signatures: {
      tenant: { signed: false, timestamp: '' },
      landlord: { signed: true, timestamp: '2026-06-15T10:35:00Z' },
    },
  },
]

const mockPayments: Payment[] = [
  {
    id: 'P001',
    contractId: 'C001',
    amount: 8500,
    method: 'ccb_card',
    status: 'completed',
    createdAt: '2026-07-01T09:00:00Z',
    auditTrail: [
      { from: '租客建行卡 ****8888', to: '建融家园资金监管账户', amount: 8500, intermediateAccounts: ['建行中间清算账户'], timestamp: '2026-07-01T09:00:01Z' },
      { from: '建融家园资金监管账户', to: '房东建行卡 ****6666', amount: 8500, intermediateAccounts: [], timestamp: '2026-07-01T09:00:03Z' },
    ],
  },
  {
    id: 'P002',
    contractId: 'C001',
    amount: 8500,
    method: 'ccb_card',
    status: 'pending',
    createdAt: '2026-08-01T09:00:00Z',
    auditTrail: [],
  },
  {
    id: 'P003',
    contractId: 'C001',
    amount: 17000,
    method: 'ccb_card',
    status: 'completed',
    createdAt: '2026-06-20T14:30:00Z',
    auditTrail: [
      { from: '租客建行卡 ****8888', to: '建融家园押金监管账户', amount: 17000, intermediateAccounts: ['建行中间清算账户'], timestamp: '2026-06-20T14:30:01Z' },
    ],
  },
]

const mockServiceRequests: ServiceRequest[] = [
  {
    id: 'S001',
    contractId: 'C001',
    type: 'plumbing',
    urgency: 'medium',
    description: '卫生间水龙头漏水，需要维修',
    images: [],
    status: 'dispatched',
    assignedProvider: { id: 'SP001', name: '万达物业维修', rating: 4.5, completionRate: 96, avgResponseTime: '2h' },
    dispatchHistory: [
      { status: 'submitted', timestamp: '2026-06-18T10:00:00Z' },
      { status: 'dispatched', timestamp: '2026-06-18T10:02:00Z' },
    ],
  },
  {
    id: 'S002',
    contractId: 'C001',
    type: 'electrical',
    urgency: 'high',
    description: '卧室电路跳闸，无法正常用电',
    images: [],
    status: 'completed',
    assignedProvider: { id: 'SP002', name: '中建物业', rating: 4.7, completionRate: 98, avgResponseTime: '1.5h' },
    dispatchHistory: [
      { status: 'submitted', timestamp: '2026-06-10T08:00:00Z' },
      { status: 'dispatched', timestamp: '2026-06-10T08:05:00Z' },
      { status: 'in_progress', timestamp: '2026-06-10T09:00:00Z' },
      { status: 'completed', timestamp: '2026-06-10T11:30:00Z' },
    ],
    rating: { score: 5, comment: '响应迅速，维修专业', ratedAt: '2026-06-12T16:00:00Z' },
  },
]

const mockFinancialProducts: FinancialProduct[] = [
  {
    id: 'FP001',
    name: '租金分期',
    type: 'installment',
    description: '季付/半年付/年付灵活选择，利率低至3.6%',
    rate: '3.6%',
    term: '3-12个月',
    icon: 'credit-card',
  },
  {
    id: 'FP002',
    name: '押金贷',
    type: 'deposit_loan',
    description: '信用即押金，免押金入住，月供低至1.5%',
    rate: '1.5%',
    term: '6-24个月',
    icon: 'shield',
  },
  {
    id: 'FP003',
    name: '租房保险',
    type: 'insurance',
    description: '财产保障+意外保障，全方位守护租住生活',
    rate: '¥15/月',
    term: '按月',
    icon: 'heart-pulse',
  },
]

export { mockListings, mockAppointments, mockContracts, mockPayments, mockServiceRequests, mockFinancialProducts }
