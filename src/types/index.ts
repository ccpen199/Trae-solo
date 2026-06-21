/**
 * 通用响应接口
 */

/** 基础API响应 */
export interface ApiResponse<T = unknown> {
  /** 响应码，0表示成功 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 响应时间戳 */
  timestamp: number;
}

/** 分页响应 */
export interface PagedResponse<T = unknown> {
  /** 数据列表 */
  list: T[];
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 房东准入模块
 */

/** 房东准入审核状态 */
export type LandlordApplicationStatus =
  | 'pending'       // 待审核
  | 'verifying'     // 审核中
  | 'approved'      // 已通过
  | 'rejected'      // 已拒绝
  | 'cancelled';    // 已取消

/** 房东准入申请 */
export interface LandlordApplication {
  /** 申请ID */
  id: string;
  /** 申请编号 */
  applyNo: string;
  /** 房东姓名 */
  landlordName: string;
  /** 房东手机号 */
  landlordPhone: string;
  /** 房东身份证号 */
  landlordIdCard: string;
  /** 房源地址 */
  propertyAddress: string;
  /** 房源所在城市 */
  city: string;
  /** 房源所在区域 */
  district: string;
  /** 房源面积(㎡) */
  area: number;
  /** 户型：室 */
  bedrooms: number;
  /** 户型：厅 */
  livingRooms: number;
  /** 户型：卫 */
  bathrooms: number;
  /** 期望月租(元) */
  expectedRent: number;
  /** 房产证明图片URL数组 */
  propertyCertImages: string[];
  /** 房东手持身份证照片URL */
  idCardHoldingImage: string;
  /** 申请状态 */
  status: LandlordApplicationStatus;
  /** 审核进度百分比 */
  progress: number;
  /** 当前审核步骤 */
  currentStep: number;
  /** 总审核步骤数 */
  totalSteps: number;
  /** 房产核验结果 */
  propertyVerifyResult?: PropertyVerifyResult;
  /** 房产核验结果（别名，兼容旧版字段名） */
  propertyVerify?: PropertyVerifyResult;
  /** 人脸核验结果 */
  faceVerifyResult?: FaceVerifyResult;
  /** 人脸核验结果（别名，兼容旧版字段名） */
  faceVerify?: FaceVerifyResult;
  /** 最终审核结果 */
  verifyResult?: VerifyResult;
  /** 拒绝/失败原因 */
  rejectReason?: string;
  /** 申请提交时间 */
  submitTime: string;
  /** 审核完成时间 */
  completeTime?: string;
  /** 审核人员ID */
  auditorId?: string;
  /** 审核人员姓名 */
  auditorName?: string;
}

/** 审核最终结果 */
export interface VerifyResult {
  /** 是否通过 */
  passed: boolean;
  /** 综合评分(0-100) */
  score: number;
  /** 风险等级：低/中/高 */
  riskLevel: 'low' | 'medium' | 'high';
  /** 风险标签列表 */
  riskTags: string[];
  /** 审核意见 */
  opinion: string;
  /** 审核时间 */
  verifyTime: string;
}

/** 房产权属核验结果 */
export interface PropertyVerifyResult {
  /** 核验状态 */
  status: 'pending' | 'processing' | 'passed' | 'failed';
  /** 产权人姓名是否匹配 */
  ownerNameMatched: boolean;
  /** 产权证件号是否匹配 */
  ownerCertNoMatched: boolean;
  /** 不动产单元号验证 */
  propertyUnitNoValid: boolean;
  /** 是否存在抵押 */
  hasMortgage: boolean;
  /** 是否存在查封 */
  hasSeizure: boolean;
  /** 是否存在异议登记 */
  hasObjection: boolean;
  /** 核验来源 */
  verifySource: 'manual' | 'government_api' | 'third_party';
  /** 核验报告URL */
  reportUrl?: string;
  /** 核验时间 */
  verifyTime?: string;
  /** 备注 */
  remark?: string;
}

/** 人脸核验结果 */
export interface FaceVerifyResult {
  /** 核验状态 */
  status: 'pending' | 'processing' | 'passed' | 'failed';
  /** 人脸相似度(0-100) */
  similarity: number;
  /** 是否活体检测通过 */
  livenessPassed: boolean;
  /** 身份证照片人脸URL */
  idCardFaceUrl?: string;
  /** 实时抓拍人脸URL */
  liveFaceUrl?: string;
  /** 核验渠道 */
  channel: 'alipay' | 'wechat' | 'ctid' | 'bank';
  /** 核验会话ID */
  sessionId?: string;
  /** 核验时间 */
  verifyTime?: string;
  /** 失败原因 */
  failReason?: string;
}

/**
 * 房源模块
 */

/** 房源核验状态 */
export type VerifyState =
  | 'unverified'      // 未核验
  | 'verifying'       // 核验中
  | 'verified'        // 已核验
  | 'verification_failed'; // 核验失败

/** 房源状态 */
export type PropertyStatus =
  | 'draft'           // 草稿
  | 'pending'         // 待上架
  | 'on_shelf'        // 已上架
  | 'off_shelf'       // 已下架
  | 'rented'          // 已出租
  | 'maintenance'     // 维修中
  | 'violation';      // 违规下架

/** 房源类型 */
export type PropertyType = 'apartment' | 'house' | 'villa' | 'loft' | 'shop' | 'office';

/** 朝向 */
export type Orientation = 'east' | 'south' | 'west' | 'north' | 'southeast' | 'southwest' | 'northeast' | 'northwest';

/** 装修程度 */
export type DecorationLevel = 'rough' | 'simple' | 'standard' | 'fine' | 'luxury';

/** 房源 */
export interface Property {
  /** 房源ID */
  id: string;
  /** 房源编号 */
  propertyNo: string;
  /** 房源标题 */
  title: string;
  /** 房东ID */
  landlordId: string;
  /** 房东姓名 */
  landlordName: string;
  /** 房东联系电话 */
  landlordPhone: string;
  /** 房源类型 */
  propertyType: PropertyType;
  /** 房源地址 */
  address: string;
  /** 城市 */
  city: string;
  /** 行政区 */
  district: string;
  /** 商圈/板块 */
  businessArea: string;
  /** 小区名称 */
  communityName: string;
  /** 楼栋 */
  building?: string;
  /** 单元 */
  unit?: string;
  /** 门牌号 */
  roomNo?: string;
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
  /** 建筑面积(㎡) */
  buildingArea: number;
  /** 套内面积(㎡) */
  usableArea: number;
  /** 室 */
  bedrooms: number;
  /** 厅 */
  livingRooms: number;
  /** 卫 */
  bathrooms: number;
  /** 厨房 */
  kitchens: number;
  /** 阳台 */
  balconies: number;
  /** 总楼层 */
  totalFloor: number;
  /** 所在楼层 */
  floor: number;
  /** 是否有电梯 */
  hasElevator: boolean;
  /** 朝向 */
  orientation: Orientation;
  /** 装修程度 */
  decoration: DecorationLevel;
  /** 装修程度中文描述 */
  decorationText: string;
  /** 视频核验状态 */
  videoVerify: VerifyState;
  /** VR核验状态 */
  vrVerify: VerifyState;
  /** 实地核验状态 */
  onsiteVerify: VerifyState;
  /** 建成年份 */
  buildYear: number;
  /** 月租金(元) */
  monthlyRent: number;
  /** 押金月数 */
  depositMonths: number;
  /** 押金金额(元) */
  depositAmount: number;
  /** 付款方式 */
  paymentType: string;
  /** 可入住日期 */
  availableDate: string;
  /** 最短租期(月) */
  minLeaseTerm: number;
  /** 核验状态 */
  verifyState: VerifyState;
  /** 房源状态 */
  status: PropertyStatus;
  /** 封面图URL */
  coverImage: string;
  /** 房源图片URL列表 */
  images: string[];
  /** 户型图URL */
  floorPlanUrl?: string;
  /** 配套设施标签 */
  facilities: string[];
  /** 房源亮点标签 */
  highlights: string[];
  /** 房源描述 */
  description?: string;
  /** 价格指数数据 */
  priceIndex?: PriceIndexData;
  /** 通勤信息 */
  commuteInfo?: CommuteInfo;
  /** 浏览次数 */
  viewCount: number;
  /** 收藏次数 */
  favoriteCount: number;
  /** 预约看房次数 */
  appointmentCount: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 上架时间 */
  onShelfTime?: string;
}

/** 价格指数数据 */
export interface PriceIndexData {
  /** 小区均价(元/㎡) */
  communityAvgPrice: number;
  /** 商圈均价(元/㎡) */
  areaAvgPrice: number;
  /** 区域均价(元/㎡) */
  districtAvgPrice: number;
  /** 价格评分(0-10) */
  priceScore: number;
  /** 同比涨跌幅(%) */
  yearOnYear: number;
  /** 环比涨跌幅(%) */
  monthOnMonth: number;
  /** 近6个月价格趋势数据点 */
  trend: {
    /** 月份，如2024-01 */
    month: string;
    /** 均价 */
    price: number;
  }[];
}

/** 通勤信息 */
export interface CommuteInfo {
  /** 到最近地铁站距离(m) */
  nearestMetroDistance: number;
  /** 最近地铁站名称 */
  nearestMetroName: string;
  /** 到最近地铁站步行时间(分钟) */
  metroWalkTime: number;
  /** 到市中心距离(km) */
  cityCenterDistance: number;
  /** 到市中心驾车时间(分钟) */
  cityCenterDriveTime: number;
  /** 附近公交站数量 */
  nearbyBusStops: number;
  /** 附近共享单车停放点数量 */
  nearbyBikeStations: number;
}

/**
 * 合同模块
 */

/** 合同状态 */
export type ContractStatus =
  | 'draft'           // 草稿
  | 'pending_sign'    // 待签署
  | 'signing'         // 签署中
  | 'active'          // 履行中
  | 'expiring_soon'   // 即将到期
  | 'expired'         // 已到期
  | 'terminated'      // 已终止
  | 'cancelled';      // 已取消

/** 合同类型 */
export type ContractType = 'standard' | 'short_term' | 'long_term' | 'renewal';

/** 合同 */
export interface Contract {
  /** 合同ID */
  id: string;
  /** 合同编号 */
  contractNo: string;
  /** 合同类型 */
  contractType: ContractType;
  /** 合同名称/标题 */
  title: string;
  /** 关联房源ID */
  propertyId: string;
  /** 房源名称/标题 */
  propertyTitle: string;
  /** 房源地址 */
  propertyAddress: string;
  /** 房东ID */
  landlordId: string;
  /** 房东姓名 */
  landlordName: string;
  /** 房东手机号 */
  landlordPhone: string;
  /** 租客ID */
  tenantId: string;
  /** 租客姓名 */
  tenantName: string;
  /** 租客手机号 */
  tenantPhone: string;
  /** 租客身份证号 */
  tenantIdCard: string;
  /** 月租金(元) */
  monthlyRent: number;
  /** 押金金额(元) */
  depositAmount: number;
  /** 押金减免比例(0-1) */
  depositReductionRatio: number;
  /** 实际押金(元) */
  actualDepositAmount: number;
  /** 付款方式 */
  paymentType: string;
  /** 付款周期说明 */
  paymentCycle: string;
  /** 起租日期 */
  startDate: string;
  /** 到期日期 */
  endDate: string;
  /** 租期(月) */
  leaseMonths: number;
  /** 合同状态 */
  status: ContractStatus;
  /** CA签署信息 */
  caSignInfo?: CASignInfo;
  /** 合同文件URL */
  contractFileUrl?: string;
  /** 租金结算计划 */
  settlementPlan: SettlementPlanItem[];
  /** 结算记录 */
  settlementRecords: SettlementRecord[];
  /** 信用免押是否启用 */
  creditDepositWaiver: boolean;
  /** 租客信用分 */
  tenantCreditScore: number;
  /** 履约保障方案 */
  guaranteePlan: 'basic' | 'standard' | 'premium';
  /** 保障费用(元) */
  guaranteeFee: number;
  /** 提前退租违约金比例(月租金倍数) */
  earlyTerminationPenalty: number;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime: string;
  /** 签署完成时间 */
  signTime?: string;
  /** 生效时间 */
  effectiveTime?: string;
  /** 终止时间 */
  terminateTime?: string;
}

/** CA电子签章信息 */
export interface CASignInfo {
  /** 签署任务ID */
  taskId: string;
  /** CA机构名称 */
  caProvider: string;
  /** 房东签署状态 */
  landlordSignStatus: 'pending' | 'signed' | 'rejected';
  /** 房东签署时间 */
  landlordSignTime?: string;
  /** 租客签署状态 */
  tenantSignStatus: 'pending' | 'signed' | 'rejected';
  /** 租客签署时间 */
  tenantSignTime?: string;
  /** 平台签署状态 */
  platformSignStatus: 'pending' | 'signed' | 'rejected';
  /** 平台签署时间 */
  platformSignTime?: string;
  /** 合同哈希值(SHA256) */
  contractHash?: string;
  /** 合同存证编号 */
  evidenceNo?: string;
  /** 区块链存证交易ID */
  blockchainTxId?: string;
  /** 验签地址URL */
  verifyUrl?: string;
}

/** 租金结算计划项 */
export interface SettlementPlanItem {
  /** 计划项ID */
  id: string;
  /** 期数(第N期) */
  period: number;
  /** 应缴日期 */
  dueDate: string;
  /** 应缴金额(元) */
  amount: number;
  /** 租金起始日期 */
  rentStartDate: string;
  /** 租金截止日期 */
  rentEndDate: string;
  /** 结算状态 */
  status: 'pending' | 'paid' | 'overdue' | 'exempt';
  /** 实际缴费日期 */
  paidDate?: string;
  /** 实际缴费金额 */
  paidAmount?: number;
  /** 逾期天数 */
  overdueDays?: number;
  /** 滞纳金(元) */
  lateFee?: number;
}

/** 结算记录 */
export interface SettlementRecord {
  /** 记录ID */
  id: string;
  /** 关联结算计划项ID */
  planItemId?: string;
  /** 结算类型 */
  type: 'rent' | 'deposit' | 'late_fee' | 'maintenance' | 'refund' | 'other';
  /** 结算金额(元)，正数=收入，负数=支出 */
  amount: number;
  /** 支付方式 */
  paymentMethod: 'alipay' | 'wechat' | 'bank_transfer' | 'cash' | 'balance';
  /** 支付流水号 */
  transactionId?: string;
  /** 结算状态 */
  status: 'pending' | 'success' | 'failed' | 'refunded';
  /** 结算说明 */
  remark?: string;
  /** 操作人 */
  operatorName?: string;
  /** 创建时间 */
  createTime: string;
  /** 支付完成时间 */
  paidTime?: string;
}

/**
 * 信用分模块
 */

/** 信用等级 */
export type CreditLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';

/** 信用事件类型 */
export type CreditEventType =
  | 'register'            // 注册认证
  | 'id_verify'           // 实名认证
  | 'face_verify'         // 人脸认证
  | 'contract_sign'       // 签署合同
  | 'rent_on_time'        // 按时交租
  | 'rent_overdue'        // 逾期交租
  | 'contract_breach'     // 违约行为
  | 'contract_complete'   // 合同履约完成
  | 'maintenance_abuse'   // 恶意报修
  | 'complaint'           // 被投诉
  | 'positive_review'     // 好评
  | 'negative_review'     // 差评
  | 'appeal_result'       // 申诉结果
  | 'manual_adjust';      // 人工调整

/** 信用维度 */
export interface CreditDimensions {
  /** 身份信用(0-100) */
  identity: number;
  /** 行为信用(0-100) */
  behavior: number;
  /** 履约能力(0-100) */
  performance: number;
  /** 历史评价(0-100) */
  reputation: number;
  /** 社交关系(0-100) */
  social: number;
}

/** 信用档案 */
export interface CreditProfile {
  /** 档案ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 用户类型：landlord/tenant */
  userType: 'landlord' | 'tenant';
  /** 用户姓名 */
  userName: string;
  /** 手机号 */
  phone: string;
  /** 当前信用总分(0-1000) */
  totalScore: number;
  /** 信用等级 */
  level: CreditLevel;
  /** 各维度得分 */
  dimensions: CreditDimensions;
  /** 各维度权重 */
  weights: CreditDimensions;
  /** 押金减免比例(0-1) */
  depositReductionRatio: number;
  /** 信用额度(元) */
  creditLimit: number;
  /** 已用额度(元) */
  usedLimit: number;
  /** 累计守约次数 */
  totalKeptPromises: number;
  /** 累计违约次数 */
  totalBreaches: number;
  /** 签约合同数 */
  totalContracts: number;
  /** 履约率(%) */
  fulfillmentRate: number;
  /** 是否实名认证 */
  idVerified: boolean;
  /** 是否人脸认证 */
  faceVerified: boolean;
  /** 认证时间 */
  verifiedTime?: string;
  /** 信用分更新时间 */
  updateTime: string;
  /** 最近信用事件 */
  recentEvents?: CreditEvent[];
}

/** 信用事件记录 */
export interface CreditEvent {
  /** 事件ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 事件类型 */
  type: CreditEventType;
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description: string;
  /** 分数变动值(正为加，负为减) */
  scoreDelta: number;
  /** 变动前分数 */
  scoreBefore: number;
  /** 变动后分数 */
  scoreAfter: number;
  /** 关联业务类型 */
  relatedBizType?: string;
  /** 关联业务ID */
  relatedBizId?: string;
  /** 关联合同编号 */
  relatedContractNo?: string;
  /** 事件时间 */
  eventTime: string;
  /** 操作来源 */
  source: 'system' | 'manual' | 'appeal';
  /** 操作人 */
  operatorName?: string;
  /** 影响维度 */
  affectedDimensions?: (keyof CreditDimensions)[];
}

/**
 * 服务工单模块
 */

/** 工单类型 */
export type WorkOrderType =
  | 'repair'            // 维修报修
  | 'cleaning'          // 保洁服务
  | 'move'              // 搬家服务
  | 'complaint'         // 投诉建议
  | 'consult'           // 咨询问题
  | 'dispute'           // 纠纷调解
  | 'checkout'          // 退租验房
  | 'checkin';          // 入住交接

/** 工单状态 */
export type WorkOrderStatus =
  | 'pending'           // 待受理
  | 'accepted'          // 已受理
  | 'assigned'          // 已派单
  | 'processing'        // 处理中
  | 'scheduled'         // 已预约
  | 'completed'         // 已完成
  | 'to_rate'           // 待评价
  | 'closed'            // 已关闭
  | 'cancelled';        // 已取消

/** 工单紧急程度 */
export type WorkOrderUrgency = 'low' | 'medium' | 'high' | 'urgent';

/** 服务工单 */
export interface ServiceWorkOrder {
  /** 工单ID */
  id: string;
  /** 工单编号 */
  orderNo: string;
  /** 工单类型 */
  type: WorkOrderType;
  /** 工单标题 */
  title: string;
  /** 工单描述 */
  description: string;
  /** 提交人ID */
  submitterId: string;
  /** 提交人姓名 */
  submitterName: string;
  /** 提交人电话 */
  submitterPhone: string;
  /** 提交人角色 */
  submitterRole: 'tenant' | 'landlord' | 'staff';
  /** 关联房源ID */
  propertyId?: string;
  /** 房源地址 */
  propertyAddress?: string;
  /** 报修位置GPS-纬度 */
  latitude?: number;
  /** 报修位置GPS-经度 */
  longitude?: number;
  /** 关联合同ID */
  contractId?: string;
  /** 合同编号 */
  contractNo?: string;
  /** 工单状态 */
  status: WorkOrderStatus;
  /** 紧急程度 */
  urgency: WorkOrderUrgency;
  /** 图片/凭证附件URL列表 */
  attachments: string[];
  /** 工单标签 */
  tags: string[];
  /** 工程师/处理人ID */
  assigneeEngineerId?: string;
  /** 工程师姓名 */
  assigneeEngineerName?: string;
  /** 工程师电话 */
  assigneeEngineerPhone?: string;
  /** 派单方式 */
  dispatchMode?: 'auto' | 'manual' | 'grab';
  /** 派单时间 */
  dispatchTime?: string;
  /** 客户期望上门时间 */
  expectedVisitTime?: string;
  /** 实际上门时间 */
  actualVisitTime?: string;
  /** 完成时间 */
  completeTime?: string;
  /** 预计工时(分钟) */
  estimatedDuration?: number;
  /** 实际耗时(分钟) */
  actualDuration?: number;
  /** 是否需要支付费用 */
  needPayment: boolean;
  /** 预估费用(元) */
  estimatedCost?: number;
  /** 实际费用(元) */
  actualCost?: number;
  /** 费用承担方 */
  costPayer?: 'tenant' | 'landlord' | 'platform' | 'shared';
  /** 故障/问题分类 */
  category?: string;
  /** 故障原因判定 */
  rootCause?: string;
  /** 处理方案描述 */
  solution?: string;
  /** 用户评分(1-5星) */
  userRating?: number;
  /** 用户评价内容 */
  userComment?: string;
  /** SLA响应时限(分钟) */
  slaResponseTime: number;
  /** SLA处理时限(分钟) */
  slaHandleTime: number;
  /** 首次响应时间(分钟) */
  firstResponseTime?: number;
  /** 是否SLA达标 */
  slaMet?: boolean;
  /** 是否涉及应急安置 */
  needEmergencyPlacement: boolean;
  /** 关联应急安置ID */
  emergencyPlacementId?: string;
  /** 工单时间线 */
  timeline: OrderTimelineItem[];
  /** 提交时间 */
  createTime: string;
  /** 关闭时间 */
  closeTime?: string;
}

/** 工单时间线节点 */
export interface OrderTimelineItem {
  /** 节点ID */
  id: string;
  /** 时间 */
  time: string;
  /** 节点类型 */
  type: 'create' | 'accept' | 'dispatch' | 'visit' | 'process' | 'complete' | 'rate' | 'close' | 'comment' | 'other';
  /** 节点标题 */
  title: string;
  /** 详细描述 */
  description?: string;
  /** 操作人ID */
  operatorId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 操作人角色 */
  operatorRole?: string;
  /** 图片附件 */
  images?: string[];
}

/** 应急安置状态 */
export type EmergencyPlacementStatus =
  | 'pending'           // 待安排
  | 'arranging'         // 安排中
  | 'placed'            // 已安置
  | 'extended'          // 已续住
  | 'returned'          // 已退房
  | 'settled'           // 已结算
  | 'cancelled';        // 已取消

/** 应急安置 */
export interface EmergencyPlacement {
  /** 安置ID */
  id: string;
  /** 安置编号 */
  placementNo: string;
  /** 关联工单ID */
  workOrderId: string;
  /** 工单编号 */
  workOrderNo: string;
  /** 申请人 */
  applicantName: string;
  /** 申请人电话 */
  applicantPhone: string;
  /** 原房源ID */
  originalPropertyId: string;
  /** 原房源地址 */
  originalPropertyAddress: string;
  /** 原房源位置-纬度 */
  originalLatitude: number;
  /** 原房源位置-经度 */
  originalLongitude: number;
  /** 安置原因 */
  reason: string;
  /** 安置状态 */
  status: EmergencyPlacementStatus;
  /** 安置人数 */
  personCount: number;
  /** 安置酒店/公寓名称 */
  hotelName: string;
  /** 安置地址 */
  hotelAddress: string;
  /** 安置位置-纬度 */
  hotelLatitude: number;
  /** 安置位置-经度 */
  hotelLongitude: number;
  /** 酒店星级(1-5) */
  hotelStars: number;
  /** 房型 */
  roomType: string;
  /** 房号 */
  roomNo?: string;
  /** 入住时间 */
  checkInTime: string;
  /** 预计退房时间 */
  expectedCheckOutTime: string;
  /** 实际退房时间 */
  actualCheckOutTime?: string;
  /** 入住天数 */
  stayDays: number;
  /** 续住次数 */
  extendCount: number;
  /** 预估费用(元) */
  estimatedCost: number;
  /** 实际费用(元) */
  actualCost?: number;
  /** 费用承担方 */
  costPayer: 'landlord' | 'platform' | 'shared' | 'insurance';
  /** 保险理赔单号 */
  insuranceClaimNo?: string;
  /** 入住凭证URL */
  checkInVoucherUrl?: string;
  /** 退房凭证URL */
  checkOutVoucherUrl?: string;
  /** 安置时间线 */
  timeline: EmergencyTimelineItem[];
  /** 创建时间 */
  createTime: string;
  /** 结算时间 */
  settlementTime?: string;
}

/** 应急安置时间线节点 */
export interface EmergencyTimelineItem {
  /** 节点ID */
  id: string;
  /** 时间 */
  time: string;
  /** 节点类型 */
  type: 'apply' | 'approve' | 'arrange' | 'checkin' | 'extend' | 'checkout' | 'settle' | 'other';
  /** 节点标题 */
  title: string;
  /** 详细描述 */
  description?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 费用变更 */
  costChange?: number;
}

/**
 * 审计日志模块
 */

/** 操作类型 */
export type AuditActionType =
  | 'create'      // 新增
  | 'update'      // 修改
  | 'delete'      // 删除
  | 'query'       // 查询
  | 'export'      // 导出
  | 'import'      // 导入
  | 'approve'     // 审批通过
  | 'reject'      // 审批拒绝
  | 'sign'        // 签署
  | 'login'       // 登录
  | 'logout'      // 登出
  | 'pay'         // 支付
  | 'refund'      // 退款
  | 'assign'      // 派单
  | 'settle';     // 结算

/** 数据变更详情项 */
export interface DataChangeItem {
  /** 字段名 */
  field: string;
  /** 字段中文描述 */
  fieldLabel: string;
  /** 变更前值 */
  oldValue: unknown;
  /** 变更后值 */
  newValue: unknown;
  /** 变更类型 */
  changeType: 'add' | 'modify' | 'remove';
}

/** 审计日志 */
export interface AuditLog {
  /** 日志ID */
  id: string;
  /** 追踪ID(用于链路追踪) */
  traceId: string;
  /** 操作时间 */
  operateTime: string;
  /** 操作人ID */
  operatorId: string;
  /** 操作人姓名 */
  operatorName: string;
  /** 操作人角色 */
  operatorRole: string;
  /** 操作人部门 */
  operatorDept?: string;
  /** 操作人IP */
  operatorIp: string;
  /** 操作人客户端信息(UA) */
  operatorUserAgent?: string;
  /** 操作人地理位置 */
  operatorLocation?: string;
  /** 所属模块 */
  module: string;
  /** 业务类型 */
  bizType: string;
  /** 操作类型 */
  actionType: AuditActionType;
  /** 操作描述 */
  actionDesc: string;
  /** 关联业务ID */
  bizId?: string;
  /** 关联业务编号 */
  bizNo?: string;
  /** 请求URL */
  requestUrl?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** 请求参数(脱敏后) */
  requestParams?: string;
  /** 响应结果摘要 */
  responseSummary?: string;
  /** 数据变更详情 */
  dataChanges?: DataChangeItem[];
  /** 操作是否成功 */
  success: boolean;
  /** 错误信息 */
  errorMsg?: string;
  /** 执行耗时(ms) */
  duration?: number;
}

/**
 * 数据看板模块
 */

/** 看板指标 */
export interface DashboardMetrics {
  /** 今日数据 */
  today: {
    /** 新增申请数 */
    newApplications: number;
    /** 新增合同数 */
    newContracts: number;
    /** 新增工单数 */
    newWorkOrders: number;
    /** 今日租金流水(元) */
    rentTurnover: number;
  };
  /** 本周环比(%) */
  weekOverWeek: {
    /** 申请数环比 */
    applications: number;
    /** 合同数环比 */
    contracts: number;
    /** 工单数环比 */
    workOrders: number;
    /** 租金流水环比 */
    rentTurnover: number;
  };
  /** 总体统计 */
  totals: {
    /** 在租房源数 */
    activeProperties: number;
    /** 进行中合同数 */
    activeContracts: number;
    /** 累计服务人次 */
    totalServices: number;
    /** 累计租金总额(元) */
    totalRentTurnover: number;
  };
  /** 房源核验 */
  verification: {
    /** 待审核申请数 */
    pendingApplications: number;
    /** 核验通过率(%) */
    passRate: number;
    /** 平均审核时长(小时) */
    avgAuditHours: number;
  };
  /** 合同履约 */
  contractPerformance: {
    /** 合同履约率(%) */
    fulfillmentRate: number;
    /** 当期租金收缴率(%) */
    rentCollectionRate: number;
    /** 逾期合同数 */
    overdueContracts: number;
  };
  /** 工单服务 */
  workOrderService: {
    /** 待处理工单数 */
    pendingOrders: number;
    /** 工单平均响应时长(分钟) */
    avgResponseMinutes: number;
    /** 工单好评率(%) */
    praiseRate: number;
    /** SLA达标率(%) */
    slaComplianceRate: number;
  };
  /** 信用免押 */
  creditDeposit: {
    /** 享受免押用户数 */
    waiverUsers: number;
    /** 累计减免押金(元) */
    totalWaiverAmount: number;
    /** 坏账率(%) */
    badDebtRate: number;
  };
  /** 应急安置 */
  emergency: {
    /** 进行中安置数 */
    activePlacements: number;
    /** 累计安置人次 */
    totalPlacements: number;
    /** 30分钟响应率(%) */
    responseWithin30Rate: number;
  };
  /** 指标卡片列表 */
  metricCards: MetricCard[];
}

/** 指标卡片 */
export interface MetricCard {
  /** 卡片ID */
  id: string;
  /** 指标编码 */
  key: string;
  /** 指标名称 */
  title: string;
  /** 指标数值 */
  value: number | string;
  /** 指标单位 */
  unit?: string;
  /** 数值类型 */
  valueType: 'number' | 'money' | 'percent' | 'time' | 'text';
  /** 环比/同比变化值 */
  change?: number;
  /** 变化类型：up/down/neutral */
  changeType?: 'up' | 'down' | 'neutral';
  /** 变化是否利好 */
  changePositive?: boolean;
  /** 变化描述 */
  changeLabel?: string;
  /** 图标名(lucide图标) */
  icon?: string;
  /** 主题色 */
  theme?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  /** 排序 */
  sortOrder: number;
}

/** 地图热力图点 */
export interface MapHeatmapPoint {
  /** 点ID */
  id: string;
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
  /** 权重值(影响热力颜色深度) */
  weight: number;
  /** 分类：房源/工单/合同/维修 */
  category: 'property' | 'workorder' | 'contract' | 'repair';
  /** 城市 */
  city: string;
  /** 区域 */
  district?: string;
  /** 数量(聚合后) */
  count?: number;
  /** 关联名称 */
  name?: string;
  /** 地址 */
  address?: string;
}

/**
 * 地图与通勤模块
 */

/** 共享单车热力栅格单元 */
export interface BikeHeatmapCell {
  /** 栅格中心纬度 */
  lat: number;
  /** 栅格中心经度 */
  lng: number;
  /** 栅格边长(m) */
  gridSize: number;
  /** 可用车辆数 */
  availableBikes: number;
  /** 停车桩位数 */
  totalSlots: number;
  /** 时段：如早高峰/晚高峰/平峰 */
  timeSlot: 'morning_peak' | 'evening_peak' | 'off_peak';
  /** 日期类别：工作日/周末 */
  dayType: 'workday' | 'weekend' | 'holiday';
  /** 数据采集时间 */
  collectTime: string;
}

/** 通勤等值区域 */
export interface CommuteIsoline {
  /** 等值线ID */
  id: string;
  /** 起点纬度 */
  originLat: number;
  /** 起点经度 */
  originLng: number;
  /** 通勤方式 */
  mode: 'walk' | 'bike' | 'drive' | 'metro' | 'transit';
  /** 时间阈值(分钟) */
  timeThreshold: number;
  /** 等值线边界点(有序多边形) */
  points: IsolinePoint[];
  /** 覆盖区域面积(km²) */
  area: number;
  /** 区域内房源数 */
  propertyCount?: number;
  /** 区域内平均租金(元/㎡) */
  avgRent?: number;
  /** 区域内均价(元/㎡) */
  avgPrice?: number;
  /** 数据生成时间 */
  createTime: string;
}

/** 等值线坐标点 */
export interface IsolinePoint {
  /** 点序号(多边形顶点顺序) */
  index: number;
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
}
