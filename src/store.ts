import { create } from 'zustand'

export interface VerificationReview {
  time: string
  reviewer: string
  result: 'approved' | 'rejected' | 'pending'
  comment: string
  reviewType: 'first' | 'recheck'
}

export interface User {
  id: string
  name: string
  phone: string
  company: string
  role: 'buyer' | 'factory' | 'supplier' | 'designer' | 'admin'
  verified: boolean
  avatar: string
  qualificationType?: string
  qualificationDoc?: string
  industryQualification?: string
  factoryLicenseDoc?: string
  designerPortfolio?: string
  verificationReviews?: VerificationReview[]
  reVerificationCount?: number
}

export interface ProcurementRequest {
  id: string
  title: string
  category: string
  craftType: string[]
  quantity: number
  unit: string
  deliveryDate: string
  budget: { min: number; max: number }
  location: string
  description: string
  status: 'open' | 'matched' | 'closed'
  publisherId: string
  createdAt: string
}

export interface ProcessingOrder {
  id: string
  title: string
  craftType: string[]
  quantity: number
  deadline: string
  factoryType: string
  location: string
  description?: string
  budget: { min: number; max: number }
  status: 'open' | 'in_progress' | 'completed'
  publisherId: string
  createdAt: string
}

export interface AccessorySupply {
  id: string
  name: string
  category: string
  material: string
  specs: string
  price: number
  unit: string
  minOrder: number
  stock: number
  supplierId: string
  location: string
  description?: string
  images: string[]
}

export interface Supplier {
  id: string
  name: string
  type: 'factory' | 'accessory_supplier' | 'designer'
  location: string
  creditScore: number
  fulfillmentRate: number
  complaintRate: number
  qcPassRate: number
  crafts: string[]
  capacity: { current: number; max: number; available: number }
  certifications: string[]
  description: string
  isOnline: boolean
  historicalPrices?: { category: string; avgPrice: number; lastDealDate: string }[]
  sampleShippingStatus?: 'none' | 'requested' | 'shipped' | 'received'
  depositStatus?: 'none' | 'pending' | 'paid'
}

export interface LogisticsNode {
  status: string
  location: string
  timestamp: string
  description: string
}

export interface Order {
  id: string
  type: 'procurement' | 'processing'
  title: string
  buyerId: string
  supplierId: string
  amount: number
  depositAmount: number
  depositStatus: 'unpaid' | 'paid' | 'refunded'
  status: 'pending' | 'deposit_paid' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'disputed'
  logistics: LogisticsNode[]
  createdAt: string
}

export interface NewsArticle {
  id: string
  title: string
  category: 'industry' | 'policy' | 'report'
  summary: string
  content: string
  publishDate: string
  source: string
  tags: string[]
}

export interface RegionData {
  region: string
  factoryCount: number
  capacityUtilization: number
  orderVolume: number
  supplyDemandRatio: number
  mainCrafts: string[]
  topSuppliers: string[]
}

export interface MatchResult {
  supplierId: string
  score: number
  dimensions: {
    locationScore: number
    capacityScore: number
    craftScore: number
    priceScore: number
  }
}

export interface MatchWeights {
  location: number
  capacity: number
  craft: number
  price: number
}

export interface QuarterlyReport {
  id: string
  quarter: string
  year: number
  summary: string
  supplyDemandBalance: number
  capacityTrend: { month: string; supply: number; demand: number }[]
  topRegions: string[]
  priceIndex: { category: string; current: number; change: number }[]
}

export interface BomItem {
  name: string
  qty: number
  unit: string
  quote?: number
}

export interface BomQuoteItem {
  name: string
  unitPrice: number
}

export interface BomSupplierQuote {
  supplierId: string
  supplierName: string
  items: BomQuoteItem[]
  totalQuote: number
}

export interface SampleLogisticsNode {
  status: string
  location: string
  time: string
}

export interface SampleShipping {
  status: 'none' | 'requested' | 'shipped' | 'received'
  logistics?: SampleLogisticsNode[]
  needSample?: boolean
  sampleQuantity?: number
  address?: string
  freightCollect?: boolean
  estimatedDelivery?: string
}

export interface FactoryInspection {
  scheduled: boolean
  date?: string
  completed: boolean
  reportUrl?: string
  needInspection?: boolean
  inspectionType?: 'video' | 'vr' | 'onsite'
  expectedTime?: string
}

export interface DepositInfo {
  amount: number
  status: 'none' | 'pending' | 'paid' | 'refunded'
  paidDate?: string
  ratio?: number
  guaranteeType?: 'platform' | 'bank' | 'letter'
}

export interface TimelineNode {
  time: string
  step: string
  status: 'pending' | 'done' | 'current'
  description?: string
}

export interface Inquiry {
  id: string
  fromUserId: string
  toSupplierId: string
  toSupplierName?: string
  type: 'procurement' | 'processing' | 'accessory'
  title: string
  content: string
  quantity: number
  budget: { min: number; max: number }
  deliveryDate: string
  status: 'sent' | 'replied' | 'quoted' | 'sample_requested' | 'sample_shipped' | 'inspection_scheduled' | 'inspection_completed' | 'deposit_pending' | 'deposit_paid' | 'closed'
  createdAt: string
  bomItems?: BomItem[]
  bomSupplierQuotes?: BomSupplierQuote[]
  selectedSupplierId?: string
  supplierId?: string
  sampleShipping?: SampleShipping
  inspection?: FactoryInspection
  deposit?: DepositInfo
  timeline?: TimelineNode[]
}

export interface PlatformStats {
  registeredCompanies: number
  transactionAmount: number
  matchSuccessRate: number
  lastUpdated: string
}

const mockSuppliers: Supplier[] = [
  {
    id: 's1', name: '濮院华锦毛衫厂', type: 'factory', location: '濮院', creditScore: 92,
    fulfillmentRate: 96.5, complaintRate: 1.2, qcPassRate: 98.3,
    crafts: ['横机编织', '提花', '缝盘', '洗水'],
    capacity: { current: 8500, max: 12000, available: 3500 },
    certifications: ['ISO9001', 'OEKO-TEX'], description: '专注中高端毛衫20年', isOnline: true,
    historicalPrices: [
      { category: '羊毛衫', avgPrice: 95, lastDealDate: '2026-05-28' },
      { category: '混纺毛衫', avgPrice: 78, lastDealDate: '2026-06-02' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
  {
    id: 's2', name: '大朗鑫达针织有限公司', type: 'factory', location: '大朗', creditScore: 88,
    fulfillmentRate: 94.2, complaintRate: 2.1, qcPassRate: 97.1,
    crafts: ['圆机编织', '横机编织', '整烫'],
    capacity: { current: 6000, max: 10000, available: 4000 },
    certifications: ['ISO9001'], description: '大朗镇标杆企业', isOnline: true,
    historicalPrices: [
      { category: '针织衫', avgPrice: 55, lastDealDate: '2026-06-01' },
      { category: '开衫', avgPrice: 62, lastDealDate: '2026-05-25' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
  {
    id: 's3', name: '义乌辅料交易中心', type: 'accessory_supplier', location: '义乌', creditScore: 85,
    fulfillmentRate: 92.8, complaintRate: 3.5, qcPassRate: 95.6,
    crafts: [], capacity: { current: 0, max: 0, available: 0 },
    certifications: [], description: '辅料一站式供应', isOnline: false,
    historicalPrices: [
      { category: '拉链', avgPrice: 2.4, lastDealDate: '2026-05-30' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
  {
    id: 's4', name: '温州纽扣饰品厂', type: 'accessory_supplier', location: '温州', creditScore: 78,
    fulfillmentRate: 89.5, complaintRate: 4.2, qcPassRate: 93.8,
    crafts: [], capacity: { current: 0, max: 0, available: 0 },
    certifications: ['ISO14001'], description: '专业纽扣及饰品制造', isOnline: false,
    historicalPrices: [
      { category: '纽扣', avgPrice: 0.85, lastDealDate: '2026-05-20' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
  {
    id: 's5', name: '桐乡锦华纱线有限公司', type: 'accessory_supplier', location: '桐乡', creditScore: 90,
    fulfillmentRate: 95.8, complaintRate: 1.8, qcPassRate: 97.5,
    crafts: [], capacity: { current: 0, max: 0, available: 0 },
    certifications: ['OEKO-TEX', 'GRS'], description: '高品质纱线供应商', isOnline: true,
    historicalPrices: [
      { category: '羊绒纱线', avgPrice: 275, lastDealDate: '2026-06-03' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
  {
    id: 's6', name: '苏州锦绣服饰加工厂', type: 'factory', location: '苏州', creditScore: 82,
    fulfillmentRate: 91.0, complaintRate: 3.0, qcPassRate: 94.5,
    crafts: ['圆机编织', '缝盘', '整烫', '缩绒'],
    capacity: { current: 7200, max: 9000, available: 1800 },
    certifications: ['ISO9001'], description: '苏州老牌服装加工', isOnline: true,
    historicalPrices: [
      { category: '针织衫', avgPrice: 48, lastDealDate: '2026-05-15' },
    ],
    sampleShippingStatus: 'none', depositStatus: 'none',
  },
]

const mockProcurements: ProcurementRequest[] = [
  { id: 'p1', title: '秋季羊绒混纺毛衣采购', category: '毛衣', craftType: ['横机编织', '提花'], quantity: 5000, unit: '件', deliveryDate: '2026-08-15', budget: { min: 80, max: 120 }, location: '杭州', description: '含30%羊绒，圆领款', status: 'open', publisherId: 'u1', createdAt: '2026-06-01' },
  { id: 'p2', title: '冬季加厚拉链衫批量采购', category: '拉链衫', craftType: ['圆机编织', '缝盘'], quantity: 3000, unit: '件', deliveryDate: '2026-09-01', budget: { min: 60, max: 90 }, location: '濮院', description: '加厚款，需防风处理', status: 'open', publisherId: 'u1', createdAt: '2026-06-02' },
  { id: 'p3', title: '春季轻薄开衫寻源', category: '开衫', craftType: ['横机编织'], quantity: 8000, unit: '件', deliveryDate: '2026-07-20', budget: { min: 45, max: 70 }, location: '大朗', description: '薄款春夏过渡', status: 'matched', publisherId: 'u2', createdAt: '2026-05-28' },
  { id: 'p4', title: '高领打底毛衣采购', category: '毛衣', craftType: ['横机编织', '缩绒'], quantity: 10000, unit: '件', deliveryDate: '2026-08-30', budget: { min: 50, max: 80 }, location: '桐乡', description: '贴身舒适款', status: 'open', publisherId: 'u3', createdAt: '2026-06-03' },
  { id: 'p5', title: '童装卡通毛衣采购', category: '毛衣', craftType: ['提花', '绣花'], quantity: 6000, unit: '件', deliveryDate: '2026-09-10', budget: { min: 35, max: 55 }, location: '汕头', description: '3-8岁儿童款', status: 'open', publisherId: 'u1', createdAt: '2026-06-04' },
]

const mockProcessingOrders: ProcessingOrder[] = [
  { id: 'o1', title: '羊绒衫整单加工', craftType: ['横机编织', '缝盘', '洗水'], quantity: 5000, deadline: '2026-08-10', factoryType: '横机厂', location: '濮院', budget: { min: 25, max: 40 }, status: 'open', publisherId: 'u1', createdAt: '2026-06-01' },
  { id: 'o2', title: '提花毛衣加工接单', craftType: ['提花', '缝盘'], quantity: 3000, deadline: '2026-07-25', factoryType: '提花厂', location: '大朗', budget: { min: 30, max: 50 }, status: 'open', publisherId: 'u2', createdAt: '2026-05-30' },
  { id: 'o3', title: '拉链衫批量加工', craftType: ['圆机编织', '缝盘', '整烫'], quantity: 8000, deadline: '2026-09-15', factoryType: '圆机厂', location: '苏州', budget: { min: 20, max: 35 }, status: 'in_progress', publisherId: 'u3', createdAt: '2026-05-25' },
]

const mockAccessories: AccessorySupply[] = [
  { id: 'a1', name: '高弹力涤纶拉链', category: '拉链', material: '涤纶', specs: '5号闭尾', price: 2.5, unit: '条', minOrder: 1000, stock: 50000, supplierId: 's3', location: '义乌', images: [] },
  { id: 'a2', name: '仿珍珠纽扣', category: '纽扣', material: '树脂', specs: '14mm四孔', price: 0.8, unit: '颗', minOrder: 5000, stock: 200000, supplierId: 's4', location: '温州', images: [] },
  { id: 'a3', name: '羊绒混纺纱线', category: '纱线', material: '羊绒/羊毛/锦纶', specs: '2/48Nm', price: 280, unit: 'kg', minOrder: 50, stock: 800, supplierId: 's5', location: '桐乡', images: [] },
  { id: 'a4', name: '丝绸织带', category: '织带', material: '丝绸', specs: '15mm宽', price: 1.2, unit: '米', minOrder: 2000, stock: 30000, supplierId: 's3', location: '绍兴', images: [] },
]

const mockOrders: Order[] = [
  { id: 'ord1', type: 'procurement', title: '春季羊绒混纺毛衣', buyerId: 'u1', supplierId: 's1', amount: 450000, depositAmount: 90000, depositStatus: 'paid', status: 'in_production', logistics: [{ status: '已下单', location: '杭州', timestamp: '2026-05-15 10:30', description: '订单确认，等待定金' }, { status: '生产中', location: '濮院', timestamp: '2026-05-20 14:00', description: '已进入生产流程' }], createdAt: '2026-05-15' },
  { id: 'ord2', type: 'processing', title: '提花毛衣加工', buyerId: 'u1', supplierId: 's2', amount: 180000, depositAmount: 36000, depositStatus: 'paid', status: 'quality_check', logistics: [{ status: '已下单', location: '杭州', timestamp: '2026-05-10 09:00', description: '加工订单确认' }, { status: '生产完成', location: '大朗', timestamp: '2026-06-05 16:00', description: '生产完成，质检中' }], createdAt: '2026-05-10' },
  { id: 'ord3', type: 'procurement', title: '拉链衫批量采购', buyerId: 'u1', supplierId: 's6', amount: 320000, depositAmount: 64000, depositStatus: 'unpaid', status: 'pending', logistics: [], createdAt: '2026-06-08' },
  { id: 'ord4', type: 'procurement', title: '童装卡通毛衣', buyerId: 'u1', supplierId: 's1', amount: 280000, depositAmount: 56000, depositStatus: 'paid', status: 'shipped', logistics: [{ status: '已发货', location: '濮院', timestamp: '2026-06-06 08:00', description: '物流发出' }, { status: '运输中', location: '杭州中转', timestamp: '2026-06-07 12:00', description: '到达杭州中转站' }], createdAt: '2026-05-20' },
  { id: 'ord5', type: 'processing', title: '开衫整单加工', buyerId: 'u2', supplierId: 's2', amount: 560000, depositAmount: 112000, depositStatus: 'paid', status: 'completed', logistics: [{ status: '已签收', location: '杭州', timestamp: '2026-06-01 10:00', description: '买家确认签收' }], createdAt: '2026-04-01' },
]

const mockInquiries: Inquiry[] = [
  {
    id: 'inq_1001', fromUserId: 'u1', toSupplierId: 's1', toSupplierName: '濮院华锦毛衫厂',
    type: 'procurement', title: '秋季羊绒混纺毛衣询价', content: '30%羊绒含量，圆领基础款，需要5个色',
    quantity: 5000, budget: { min: 80, max: 120 }, deliveryDate: '2026-08-15',
    status: 'quoted', createdAt: '2026-06-05T10:00:00Z',
    bomItems: [
      { name: '羊绒混纺纱线', qty: 1500, unit: 'kg', quote: 0 },
      { name: '圆机编织加工费', qty: 5000, unit: '件', quote: 0 },
      { name: '洗水整烫', qty: 5000, unit: '件', quote: 0 },
    ],
    bomSupplierQuotes: [
      { supplierId: 's1', supplierName: '濮院华锦毛衫厂', totalQuote: 510000, items: [{ name: '羊绒混纺纱线', unitPrice: 260 }, { name: '圆机编织加工费', unitPrice: 28 }, { name: '洗水整烫', unitPrice: 8 }] },
      { supplierId: 's2', supplierName: '大朗鑫达针织', totalQuote: 485000, items: [{ name: '羊绒混纺纱线', unitPrice: 250 }, { name: '圆机编织加工费', unitPrice: 26 }, { name: '洗水整烫', unitPrice: 7 }] },
      { supplierId: 's6', supplierName: '苏州锦绣服饰', totalQuote: 532000, items: [{ name: '羊绒混纺纱线', unitPrice: 275 }, { name: '圆机编织加工费', unitPrice: 27 }, { name: '洗水整烫', unitPrice: 9 }] },
    ],
    sampleShipping: { status: 'none' },
    inspection: { scheduled: false, completed: false },
    deposit: { amount: 0, status: 'none' },
    timeline: [
      { time: '06-05', step: '询价单已发送', status: 'done' },
      { time: '06-06', step: '等待供应商报价', status: 'done' },
      { time: '06-08', step: 'BOM比价确认', status: 'current' },
      { time: '', step: '样品寄送申请', status: 'pending' },
      { time: '', step: '在线验厂预约', status: 'pending' },
      { time: '', step: '定金担保支付', status: 'pending' },
      { time: '', step: '询价完成', status: 'pending' },
    ],
  },
  {
    id: 'inq_1002', fromUserId: 'u1', toSupplierId: 's2', toSupplierName: '大朗鑫达针织有限公司',
    type: 'processing', title: '提花毛衣加工询价', content: '复杂提花图案，来料加工模式',
    quantity: 3000, budget: { min: 30, max: 50 }, deliveryDate: '2026-07-25',
    status: 'sample_shipped', createdAt: '2026-06-02T09:00:00Z',
    bomItems: [
      { name: '提花编织', qty: 3000, unit: '件', quote: 0 },
      { name: '缝盘', qty: 3000, unit: '件', quote: 0 },
    ],
    bomSupplierQuotes: [
      { supplierId: 's2', supplierName: '大朗鑫达针织', totalQuote: 129000, items: [{ name: '提花编织', unitPrice: 32 }, { name: '缝盘', unitPrice: 11 }] },
    ],
    sampleShipping: {
      status: 'shipped',
      logistics: [
        { status: '样品已寄出', location: '大朗', time: '2026-06-07 10:00' },
        { status: '运输中', location: '东莞中转', time: '2026-06-08 14:30' },
        { status: '派送中', location: '杭州', time: '2026-06-09 09:15' },
      ],
    },
    inspection: { scheduled: false, completed: false },
    deposit: { amount: 0, status: 'none' },
    timeline: [
      { time: '06-02', step: '询价单已发送', status: 'done' },
      { time: '06-03', step: '等待供应商报价', status: 'done' },
      { time: '06-04', step: 'BOM比价确认', status: 'done' },
      { time: '06-06', step: '样品寄送申请', status: 'done' },
      { time: '06-07', step: '样品已发出', status: 'current' },
      { time: '', step: '定金担保支付', status: 'pending' },
      { time: '', step: '询价完成', status: 'pending' },
    ],
  },
  {
    id: 'inq_1003', fromUserId: 'u1', toSupplierId: 's5', toSupplierName: '桐乡锦华纱线有限公司',
    type: 'accessory', title: '羊绒纱线批量采购询价', content: '2/48Nm 30%羊绒70%羊毛混纺，需要色卡',
    quantity: 2000, budget: { min: 260, max: 300 }, deliveryDate: '2026-07-01',
    status: 'deposit_paid', createdAt: '2026-05-28T08:30:00Z',
    bomItems: [
      { name: '羊绒混纺纱线', qty: 2000, unit: 'kg', quote: 0 },
      { name: '染色费', qty: 2000, unit: 'kg', quote: 0 },
    ],
    bomSupplierQuotes: [
      { supplierId: 's5', supplierName: '桐乡锦华纱线', totalQuote: 568000, items: [{ name: '羊绒混纺纱线', unitPrice: 275 }, { name: '染色费', unitPrice: 9 }] },
    ],
    sampleShipping: { status: 'received' },
    inspection: { scheduled: true, date: '2026-06-12', completed: true, reportUrl: '/reports/insp_001.pdf' },
    deposit: { amount: 113600, status: 'paid', paidDate: '2026-06-06' },
    timeline: [
      { time: '05-28', step: '询价单已发送', status: 'done' },
      { time: '05-29', step: '等待供应商报价', status: 'done' },
      { time: '05-31', step: 'BOM比价确认', status: 'done' },
      { time: '06-02', step: '样品寄送申请', status: 'done' },
      { time: '06-05', step: '在线验厂预约', status: 'done' },
      { time: '06-06', step: '定金担保支付', status: 'done' },
      { time: '', step: '询价完成', status: 'current' },
    ],
  },
]

const mockNews: NewsArticle[] = [
  { id: 'n1', title: '2026年秋冬毛衫流行趋势：简约与复古并存', category: 'industry', summary: '国际时尚周发布最新趋势，简约线条搭配复古纹理将成为本季毛衫设计主流...', content: '', publishDate: '2026-06-09', source: '中国纺织报', tags: ['趋势', '毛衫'] },
  { id: 'n2', title: '工信部出台新规：纺织业数字化转型补贴政策解读', category: 'policy', summary: '新政策对纺织企业数字化改造提供最高30%的补贴，涉及智能生产、供应链协同等领域...', content: '', publishDate: '2026-06-08', source: '工信部官网', tags: ['政策', '数字化'] },
  { id: 'n3', title: '濮院毛衫产业集群Q2产能报告发布', category: 'report', summary: '第二季度濮院地区毛衫产能利用率达87.3%，同比增长5.2%，订单量持续攀升...', content: '', publishDate: '2026-06-07', source: '濮院毛衫协会', tags: ['报告', '濮院'] },
  { id: 'n4', title: '羊绒原材料价格波动预警：下半年或迎上涨', category: 'industry', summary: '受全球气候影响，今年羊绒产量预计下降8%，原材料价格或将在Q3开始上扬...', content: '', publishDate: '2026-06-06', source: '中国毛纺织行业协会', tags: ['价格', '羊绒'] },
  { id: 'n5', title: '大朗针织产业智能化升级成效显著', category: 'industry', summary: '大朗镇首批数字化改造工厂产能提升22%，不良率下降至2%以下...', content: '', publishDate: '2026-05-05', source: '南方日报', tags: ['大朗', '智能化'] },
  { id: 'n6', title: '跨境电商新政助力纺织出口企业', category: 'policy', summary: '海关总署发布新规，简化纺织品类跨境电商出口流程，通关时间缩短40%...', content: '', publishDate: '2026-06-04', source: '海关总署', tags: ['政策', '出口'] },
]

const mockRegionData: RegionData[] = [
  { region: '濮院', factoryCount: 3280, capacityUtilization: 87.3, orderVolume: 15600, supplyDemandRatio: 1.15, mainCrafts: ['横机编织', '提花', '缝盘', '洗水'], topSuppliers: ['s1'] },
  { region: '大朗', factoryCount: 4120, capacityUtilization: 82.5, orderVolume: 18900, supplyDemandRatio: 1.08, mainCrafts: ['圆机编织', '横机编织', '整烫'], topSuppliers: ['s2'] },
  { region: '汕头', factoryCount: 2650, capacityUtilization: 79.8, orderVolume: 12400, supplyDemandRatio: 0.95, mainCrafts: ['横机编织', '绣花', '印花'], topSuppliers: [] },
  { region: '苏州', factoryCount: 1890, capacityUtilization: 76.2, orderVolume: 9800, supplyDemandRatio: 0.88, mainCrafts: ['圆机编织', '缝盘', '缩绒'], topSuppliers: ['s6'] },
  { region: '杭州', factoryCount: 1560, capacityUtilization: 71.5, orderVolume: 8200, supplyDemandRatio: 0.82, mainCrafts: ['设计打样', '小批量生产'], topSuppliers: [] },
  { region: '宁波', factoryCount: 1340, capacityUtilization: 74.8, orderVolume: 7100, supplyDemandRatio: 0.90, mainCrafts: ['横机编织', '整烫', '质检'], topSuppliers: [] },
  { region: '绍兴', factoryCount: 2100, capacityUtilization: 80.1, orderVolume: 11200, supplyDemandRatio: 1.02, mainCrafts: ['面料生产', '圆机编织', '印染'], topSuppliers: [] },
  { region: '桐乡', factoryCount: 2480, capacityUtilization: 85.6, orderVolume: 13500, supplyDemandRatio: 1.10, mainCrafts: ['纱线生产', '横机编织', '缩绒'], topSuppliers: ['s5'] },
]

const mockQuarterlyReport: QuarterlyReport = {
  id: 'qr1', quarter: 'Q2', year: 2026,
  summary: '2026年Q2毛衫产业供需整体平稳，产能利用率回升',
  supplyDemandBalance: 1.05,
  capacityTrend: [
    { month: '1月', supply: 85000, demand: 78000 },
    { month: '2月', supply: 72000, demand: 65000 },
    { month: '3月', supply: 92000, demand: 88000 },
    { month: '4月', supply: 98000, demand: 95000 },
    { month: '5月', supply: 105000, demand: 102000 },
    { month: '6月', supply: 112000, demand: 108000 },
  ],
  topRegions: ['濮院', '大朗', '桐乡', '绍兴', '汕头'],
  priceIndex: [
    { category: '羊绒纱线', current: 285, change: 3.2 },
    { category: '羊毛纱线', current: 168, change: -1.5 },
    { category: '混纺纱线', current: 95, change: 0.8 },
    { category: '拉链辅料', current: 2.6, change: 1.2 },
    { category: '纽扣辅料', current: 0.9, change: -0.3 },
  ],
}

const CACHED_STATS_KEY = 'zhilian_platform_stats'

function loadCachedStats(): PlatformStats | null {
  try {
    const raw = localStorage.getItem(CACHED_STATS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlatformStats
    if (Date.now() - new Date(parsed.lastUpdated).getTime() < 86400000) return parsed
    return null
  } catch { return null }
}

function cacheStats(stats: PlatformStats) {
  try { localStorage.setItem(CACHED_STATS_KEY, JSON.stringify(stats)) } catch { /* ignore */ }
}

const defaultStats: PlatformStats = loadCachedStats() || {
  registeredCompanies: 12680,
  transactionAmount: 8.7,
  matchSuccessRate: 96.5,
  lastUpdated: new Date().toISOString(),
}

interface AppState {
  isLoggedIn: boolean
  currentUser: User | null
  procurements: ProcurementRequest[]
  processingOrders: ProcessingOrder[]
  accessories: AccessorySupply[]
  suppliers: Supplier[]
  orders: Order[]
  newsArticles: NewsArticle[]
  regionData: RegionData[]
  quarterlyReport: QuarterlyReport
  matchResults: MatchResult[]
  matchWeights: MatchWeights
  inquiries: Inquiry[]
  platformStats: PlatformStats
  statsAnimated: boolean
  lastMatchContext: { supplierId: string; supplierName: string; dimensions: MatchResult['dimensions']; score: number } | null
  lastMatchRequirements: { location?: string; crafts?: string[]; quantity?: number; budgetRange?: [number, number] } | null
  login: (phone: string, password: string) => boolean
  register: (data: { name: string; phone: string; password: string; company: string; role: User['role']; qualificationType: string }) => boolean
  logout: () => void
  submitVerification: (qualificationType: string, docUrl: string) => void
  submitReVerification: (data: { docName: string; docUrl: string; remark: string }) => void
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status' | 'timeline'>) => void
  updateInquiryStatus: (id: string, status: Inquiry['status']) => void
  requestSample: (inquiryId: string) => void
  scheduleInspection: (inquiryId: string, date: string) => void
  payDeposit: (inquiryId: string, amount: number) => void
  addBomQuote: (inquiryId: string, supplierId: string, supplierName: string, items: { name: string; unitPrice: number }[]) => void
  updateSupplierSampleStatus: (supplierId: string, status: Supplier['sampleShippingStatus']) => void
  updateSupplierDepositStatus: (supplierId: string, status: Supplier['depositStatus']) => void
  setPlatformStatsAnimated: (v: boolean) => void
  fetchProcurements: () => Promise<void>
  fetchProcessingOrders: () => Promise<void>
  fetchAccessories: () => Promise<void>
  fetchSuppliers: () => Promise<void>
  fetchOrders: () => Promise<void>
  fetchNews: () => Promise<void>
  fetchRegionData: () => Promise<void>
  setMatchWeights: (weights: MatchWeights) => void
  setLastMatchContext: (ctx: { supplierId: string; supplierName: string; dimensions: MatchResult['dimensions']; score: number } | null) => void
  runMatch: (type: string, requirements: Record<string, unknown>) => Promise<void>
  addProcurement: (data: Omit<ProcurementRequest, 'id' | 'status' | 'publisherId' | 'createdAt'>) => void
  addProcessingOrder: (data: Omit<ProcessingOrder, 'id' | 'status' | 'publisherId' | 'createdAt'>) => void
  addAccessory: (data: Omit<AccessorySupply, 'id' | 'supplierId' | 'images'>) => void
}

export const useStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  currentUser: null,
  procurements: mockProcurements,
  processingOrders: mockProcessingOrders,
  accessories: mockAccessories,
  suppliers: mockSuppliers,
  orders: mockOrders,
  newsArticles: mockNews,
  regionData: mockRegionData,
  quarterlyReport: mockQuarterlyReport,
  matchResults: [
    { supplierId: 's1', score: 94, dimensions: { locationScore: 95, capacityScore: 88, craftScore: 97, priceScore: 92 } },
    { supplierId: 's2', score: 87, dimensions: { locationScore: 80, capacityScore: 92, craftScore: 85, priceScore: 90 } },
    { supplierId: 's6', score: 78, dimensions: { locationScore: 72, capacityScore: 76, craftScore: 82, priceScore: 80 } },
    { supplierId: 's5', score: 71, dimensions: { locationScore: 88, capacityScore: 60, craftScore: 65, priceScore: 70 } },
  ],
  matchWeights: { location: 30, capacity: 25, craft: 25, price: 20 },
  inquiries: mockInquiries,
  platformStats: defaultStats,
  statsAnimated: false,
  lastMatchContext: null,
  lastMatchRequirements: null,
  login: (phone, _password) => {
    const user: User = {
      id: 'u1', name: '李明远', phone, company: '杭州锦衣服饰有限公司',
      role: 'buyer', verified: true, avatar: '',
      qualificationType: '营业执照',
      industryQualification: '进出口经营许可证',
      verificationReviews: [
        { time: '2026-05-20 14:30', reviewer: '王审核', result: 'approved', comment: '材料齐全，符合采购商资质要求', reviewType: 'first' },
        { time: '2026-05-28 09:15', reviewer: '系统复查', result: 'approved', comment: '营业执照年审通过，资质有效', reviewType: 'recheck' },
      ],
      reVerificationCount: 0,
    }
    set({ isLoggedIn: true, currentUser: user })
    return true
  },
  register: (data) => {
    const roleQMap: Record<string, string> = {
      buyer: '营业执照', factory: '工厂执照', supplier: '营业执照', designer: '作品集',
    }
    const user: User = {
      id: 'u_new', name: data.name, phone: data.phone, company: data.company,
      role: data.role, verified: false, avatar: '',
      qualificationType: data.qualificationType || roleQMap[data.role],
    }
    set({ isLoggedIn: true, currentUser: user })
    return true
  },
  logout: () => {
    set({ isLoggedIn: false, currentUser: null })
  },
  submitVerification: (qualificationType, docUrl) => {
    const user = get().currentUser
    if (!user) return
    const newReviews: VerificationReview[] = [
      ...(user.verificationReviews || []),
      { time: new Date().toLocaleString('zh-CN'), reviewer: '系统', result: 'pending', comment: '材料已提交，等待审核', reviewType: 'first' },
    ]
    set({
      currentUser: { ...user, verified: true, qualificationType, qualificationDoc: docUrl, verificationReviews: newReviews },
    })
  },
  submitReVerification: (data) => {
    const user = get().currentUser
    if (!user) return
    const newCount = (user.reVerificationCount || 0) + 1
    const newReview: VerificationReview = {
      time: new Date().toLocaleString('zh-CN'),
      reviewer: '待审核',
      result: 'pending',
      comment: `重新提交：${data.docName} - ${data.remark || '补充材料'}`,
      reviewType: 'recheck',
    }
    set({
      currentUser: {
        ...user,
        reVerificationCount: newCount,
        verificationReviews: [...(user.verificationReviews || []), newReview],
      },
    })
  },
  addInquiry: (inquiry) => {
    const today = new Date().toISOString().slice(5, 10)

    const convertedBomItems: BomItem[] | undefined = inquiry.bomItems?.map((b: any) => ({
      name: b.name,
      qty: b.qty ?? b.quantity ?? 0,
      unit: b.unit,
      quote: b.quote,
    }))

    const convertedBomQuotes: BomSupplierQuote[] | undefined = inquiry.bomSupplierQuotes?.map((q: any) => {
      const items: BomQuoteItem[] = q.items?.map((it: any) => {
        if (it.name !== undefined) {
          return { name: it.name, unitPrice: it.unitPrice }
        }
        const bomItem = convertedBomItems?.[it.bomIndex]
        return { name: bomItem?.name || '', unitPrice: it.unitPrice }
      }) || []
      return {
        supplierId: q.supplierId,
        supplierName: q.supplierName,
        items,
        totalQuote: q.totalQuote ?? q.totalPrice ?? 0,
      }
    })

    const sampleShipping: SampleShipping = {
      status: 'none',
      needSample: inquiry.sampleShipping?.needSample,
      sampleQuantity: inquiry.sampleShipping?.sampleQuantity,
      address: inquiry.sampleShipping?.address,
      freightCollect: inquiry.sampleShipping?.freightCollect,
      estimatedDelivery: inquiry.sampleShipping?.estimatedDelivery,
    }

    const inspection: FactoryInspection = {
      scheduled: false,
      completed: false,
      needInspection: inquiry.inspection?.needInspection,
      inspectionType: inquiry.inspection?.inspectionType,
      expectedTime: inquiry.inspection?.expectedTime,
    }

    const deposit: DepositInfo = {
      amount: inquiry.deposit?.amount ?? 0,
      status: 'none',
      ratio: inquiry.deposit?.ratio,
      guaranteeType: inquiry.deposit?.guaranteeType,
    }

    const timeline: TimelineNode[] = [
      { time: today, step: '询价单已发送', status: 'done' },
      { time: '+1天', step: '等待供应商报价', status: 'current' },
      { time: '', step: 'BOM比价确认', status: 'pending' },
      { time: '', step: '样品寄送申请', status: 'pending' },
      { time: '', step: '在线验厂预约', status: 'pending' },
      { time: '', step: '定金担保支付', status: 'pending' },
      { time: '', step: '询价完成', status: 'pending' },
    ]

    const newInquiry: Inquiry = {
      ...inquiry,
      id: 'inq_' + Date.now(),
      status: 'sent',
      createdAt: new Date().toISOString(),
      bomItems: convertedBomItems,
      bomSupplierQuotes: convertedBomQuotes,
      sampleShipping,
      inspection,
      deposit,
      timeline,
    }
    const supplierId = inquiry.toSupplierId
    set((s) => ({
      inquiries: [...s.inquiries, newInquiry],
      suppliers: s.suppliers.map((sup) =>
        sup.id === supplierId ? sup : sup
      ),
    }))
  },
  updateInquiryStatus: (id, status) => {
    set((s) => ({
      inquiries: s.inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq)),
    }))
  },
  requestSample: (inquiryId) => {
    const today = new Date().toISOString().slice(5, 10)
    set((s) => ({
      inquiries: s.inquiries.map((inq) => {
        if (inq.id !== inquiryId) return inq
        const timeline = (inq.timeline || []).map((t) => ({ ...t }))
        const curIdx = timeline.findIndex((t) => t.status === 'current')
        const sampleIdx = timeline.findIndex((t) => t.step === '样品寄送申请')
        if (curIdx >= 0) {
          timeline[curIdx].status = 'done'
          if (!timeline[curIdx].time) timeline[curIdx].time = today
        }
        if (sampleIdx >= 0) {
          timeline[sampleIdx].status = 'current'
          timeline[sampleIdx].time = today
        }
        return {
          ...inq,
          status: 'sample_requested',
          sampleShipping: { ...(inq.sampleShipping || { status: 'none' }), status: 'requested' },
          timeline,
        }
      }),
    }))
  },
  scheduleInspection: (inquiryId, date) => {
    const today = new Date().toISOString().slice(5, 10)
    set((s) => ({
      inquiries: s.inquiries.map((inq) => {
        if (inq.id !== inquiryId) return inq
        const timeline = (inq.timeline || []).map((t) => ({ ...t }))
        const curIdx = timeline.findIndex((t) => t.status === 'current')
        const inspIdx = timeline.findIndex((t) => t.step === '在线验厂预约')
        if (curIdx >= 0) {
          timeline[curIdx].status = 'done'
          if (!timeline[curIdx].time) timeline[curIdx].time = today
        }
        if (inspIdx >= 0) {
          timeline[inspIdx].status = 'current'
          timeline[inspIdx].time = today
        }
        return {
          ...inq,
          status: 'inspection_scheduled',
          inspection: { scheduled: true, date, completed: false },
          timeline,
        }
      }),
    }))
  },
  payDeposit: (inquiryId, amount) => {
    const today = new Date().toISOString().slice(5, 10)
    const paidDate = new Date().toISOString().slice(0, 10)
    set((s) => ({
      inquiries: s.inquiries.map((inq) => {
        if (inq.id !== inquiryId) return inq
        const timeline = (inq.timeline || []).map((t) => ({ ...t }))
        const curIdx = timeline.findIndex((t) => t.status === 'current')
        const depIdx = timeline.findIndex((t) => t.step === '定金担保支付')
        if (curIdx >= 0) {
          timeline[curIdx].status = 'done'
          if (!timeline[curIdx].time) timeline[curIdx].time = today
        }
        if (depIdx >= 0) {
          timeline[depIdx].status = 'current'
          timeline[depIdx].time = today
        }
        return {
          ...inq,
          status: 'deposit_paid',
          deposit: { amount, status: 'paid', paidDate },
          timeline,
        }
      }),
    }))
  },
  addBomQuote: (inquiryId, supplierId, supplierName, items) => {
    const today = new Date().toISOString().slice(5, 10)
    set((s) => ({
      inquiries: s.inquiries.map((inq) => {
        if (inq.id !== inquiryId) return inq
        const totalQuote = items.reduce((sum, it) => {
          const bomItem = inq.bomItems?.find((b) => b.name === it.name)
          return sum + it.unitPrice * (bomItem?.qty || 1)
        }, 0)
        const newQuote = { supplierId, supplierName, totalQuote, items }
        const existingQuotes = inq.bomSupplierQuotes || []
        const filtered = existingQuotes.filter((q) => q.supplierId !== supplierId)
        const bomSupplierQuotes = [...filtered, newQuote]
        const timeline = (inq.timeline || []).map((t) => ({ ...t }))
        const curIdx = timeline.findIndex((t) => t.status === 'current')
        const bomIdx = timeline.findIndex((t) => t.step === 'BOM比价确认')
        if (curIdx >= 0 && curIdx < bomIdx) {
          timeline[curIdx].status = 'done'
          if (!timeline[curIdx].time) timeline[curIdx].time = today
        }
        if (bomIdx >= 0 && timeline[bomIdx].status === 'pending') {
          timeline[bomIdx].status = 'current'
          timeline[bomIdx].time = today
        }
        return {
          ...inq,
          status: 'quoted',
          bomSupplierQuotes,
          timeline,
        }
      }),
    }))
  },
  updateSupplierSampleStatus: (supplierId, status) => {
    set((s) => ({
      suppliers: s.suppliers.map((sup) =>
        sup.id === supplierId ? { ...sup, sampleShippingStatus: status } : sup
      ),
    }))
  },
  updateSupplierDepositStatus: (supplierId, status) => {
    set((s) => ({
      suppliers: s.suppliers.map((sup) =>
        sup.id === supplierId ? { ...sup, depositStatus: status } : sup
      ),
    }))
  },
  setPlatformStatsAnimated: (v) => set({ statsAnimated: v }),
  fetchProcurements: async () => {
    try {
      const res = await fetch('/api/procurements')
      if (res.ok) { const json = await res.json(); set({ procurements: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchProcessingOrders: async () => {
    try {
      const res = await fetch('/api/processing-orders')
      if (res.ok) { const json = await res.json(); set({ processingOrders: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchAccessories: async () => {
    try {
      const res = await fetch('/api/accessories')
      if (res.ok) { const json = await res.json(); set({ accessories: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchSuppliers: async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) { const json = await res.json(); set({ suppliers: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchOrders: async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) { const json = await res.json(); set({ orders: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchNews: async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) { const json = await res.json(); set({ newsArticles: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  fetchRegionData: async () => {
    try {
      const res = await fetch('/api/map/regions')
      if (res.ok) { const json = await res.json(); set({ regionData: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  setMatchWeights: (weights) => set({ matchWeights: weights }),
  setLastMatchContext: (ctx) => set({ lastMatchContext: ctx }),
  runMatch: async (_type, _requirements) => {
    set({ lastMatchRequirements: _requirements as AppState['lastMatchRequirements'] })
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: _type, requirements: _requirements, weights: useStore.getState().matchWeights }),
      })
      if (res.ok) { const json = await res.json(); set({ matchResults: json.data || json }) }
    } catch { /* keep mock data */ }
  },
  addProcurement: (data) => {
    const state = get()
    const newItem: ProcurementRequest = {
      ...data,
      id: 'p_' + Date.now(),
      status: 'open',
      publisherId: state.currentUser?.id || 'u1',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    set((s) => ({ procurements: [newItem, ...s.procurements] }))
  },
  addProcessingOrder: (data) => {
    const state = get()
    const newItem: ProcessingOrder = {
      ...data,
      id: 'o_' + Date.now(),
      status: 'open',
      publisherId: state.currentUser?.id || 'u1',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    set((s) => ({ processingOrders: [newItem, ...s.processingOrders] }))
  },
  addAccessory: (data) => {
    const state = get()
    const suppliers = state.suppliers.filter((s) => s.type === 'accessory_supplier')
    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const newItem: AccessorySupply = {
      ...data,
      id: 'a_' + Date.now(),
      supplierId: randomSupplier?.id || 's3',
      images: [],
    }
    set((s) => ({ accessories: [newItem, ...s.accessories] }))
  },
}))

export { cacheStats, CACHED_STATS_KEY }
