export interface Metric {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}

export interface UnionMember {
  id: string;
  idCard: string;
  employeeNo: string;
  name: string;
  gender: string;
  phone: string;
  unionLevel: string;
  unionName: string;
  parentUnionId: string;
  membershipStatus: string;
  verifiedAt: string;
  memberPoints: number;
  welfareBalance: number;
}

export interface UnionOrg {
  id: string;
  name: string;
  level: '全国' | '省级' | '市级' | '区县' | '基层';
  parentId: string;
  memberCount: number;
  adminName: string;
  status: string;
}

export interface WelfareBudget {
  id: string;
  unionId: string;
  unionName: string;
  year: number;
  quarter: number;
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  status: '待审批' | '已批准' | '已驳回' | '已执行';
  approver: string;
  approvedAt: string;
  description: string;
}

export interface WelfareCoupon {
  id: string;
  code: string;
  name: string;
  type: '农产品券' | '餐饮券' | '电影券' | '图书券' | '节日福利';
  value: number;
  memberId: string;
  memberName: string;
  status: '未使用' | '已使用' | '已过期';
  validFrom: string;
  validTo: string;
  usedAt: string;
  orderId: string;
}

export interface PointsAccount {
  id: string;
  memberId: string;
  memberName: string;
  totalPoints: number;
  availablePoints: number;
  frozenPoints: number;
  lastUpdated: string;
}

export interface PointsRecord {
  id: string;
  accountId: string;
  type: '获取' | '消费' | '冻结' | '解冻';
  points: number;
  description: string;
  orderId: string;
  createdAt: string;
}

export interface UnionCard {
  id: string;
  cardNo: string;
  memberId: string;
  memberName: string;
  bankName: string;
  balance: number;
  status: '正常' | '冻结' | '挂失';
  bindAt: string;
}

export interface SupplierAssessment {
  id: string;
  supplierId: string;
  supplierName: string;
  period: string;
  qualityScore: number;
  priceScore: number;
  deliveryScore: number;
  serviceScore: number;
  totalScore: number;
  level: 'A' | 'B' | 'C' | 'D';
  assessor: string;
  assessedAt: string;
  status: '优秀' | '合格' | '整改' | '淘汰';
}

export interface MemberBenefit {
  id: string;
  name: string;
  category: '农产品' | '出行' | '医疗' | '教育' | '法律' | '文娱';
  description: string;
  value: string;
  pointsRequired: number;
  stock: number;
  imageUrl: string;
  status: '上架' | '下架';
}

export interface TravelBooking {
  id: string;
  memberId: string;
  memberName: string;
  type: '高铁' | '飞机' | '酒店';
  travelDate: string;
  departure: string;
  destination: string;
  price: number;
  status: '待支付' | '已支付' | '已取消' | '已完成';
  bookedAt: string;
}

export interface LegalConsult {
  id: string;
  memberId: string;
  memberName: string;
  category: '劳动纠纷' | '合同纠纷' | '婚姻家庭' | '知识产权' | '其他';
  title: string;
  content: string;
  lawyerName: string;
  reply: string;
  status: '待处理' | '处理中' | '已回复' | '已关闭';
  createdAt: string;
  repliedAt: string;
}

export interface FunnelAnalysis {
  stage: string;
  userCount: number;
  conversionRate: number;
}

export interface TraceBatch {
  id: string;
  traceCode: string;
  productName: string;
  category: string;
  specification: string;
  producer: string;
  origin: string;
  productionDate: string;
  shelfLife: number;
  status: string;
  blockchainHash: string;
  blockHeight: number;
  qualityResult: string;
}

export interface TimelineItem {
  id: string;
  stage: string;
  operator: string;
  eventTime: string;
  location: string;
  description: string;
  temperature?: number;
  humidity?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  wholesalePrice: number;
  moq: number;
  specification: string;
  traceCode: string;
  seller: string;
  origin: string;
  stock: number;
  sales: number;
  imageUrl: string;
  channel: 'b2b' | 'b2c';
}
