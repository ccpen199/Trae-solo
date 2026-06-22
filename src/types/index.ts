/**
 * 用户角色类型
 * - normal: 普通用户
 * - enterprise: 企业用户
 * - designer: 设计师
 * - admin: 管理员
 * - factory: 工厂
 */
export type UserRole = 'normal' | 'enterprise' | 'designer' | 'admin' | 'factory';

/**
 * 隐私设置类型
 * - public: 公开
 * - private: 私密
 * - friends: 仅好友可见
 */
export type PrivacyType = 'public' | 'private' | 'friends';

/**
 * 模板分类类型
 * - minimal: 简约风
 * - vintage: 复古风
 * - cute: 可爱风
 * - business: 商务风
 */
export type TemplateCategory = 'minimal' | 'vintage' | 'cute' | 'business';

/**
 * 编辑器图层类型
 * - image: 图片图层
 * - text: 文字图层
 * - shape: 形状图层
 * - mask: 蒙版图层
 * - sticker: 贴纸图层
 * - background: 背景图层
 */
export type LayerType = 'image' | 'text' | 'shape' | 'mask' | 'sticker' | 'background';

/**
 * 订单状态类型
 */
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'pending_production'
  | 'producing'
  | 'pending_shipment'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/**
 * 审核状态类型
 */
export type AuditStatus = 'pending' | 'approved' | 'rejected';

/**
 * 素材类型
 */
export type MaterialType = 'image' | 'template' | 'sticker' | 'font' | 'illustration';

/**
 * AI 处理参数
 */
export interface AIParams {
  /** 画质增强 */
  qualityEnhance: {
    enabled: boolean;
    intensity: number;
  };
  /** 肤色校正 */
  skinCorrection: {
    enabled: boolean;
    intensity: number;
  };
  /** 背景虚化 */
  backgroundBlur: {
    enabled: boolean;
    intensity: number;
  };
}

/**
 * 图片数据
 */
export interface ImageLayerData {
  src: string;
  originalWidth: number;
  originalHeight: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

/**
 * 文字数据
 */
export interface TextLayerData {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

/**
 * 形状数据
 */
export interface ShapeLayerData {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon';
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius?: number;
}

/**
 * 用户信息接口
 */
export interface User {
  /** 用户 ID */
  id: string;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** 手机号 */
  phone: string;
  /** 用户角色 */
  role: UserRole;
  /** 企业信息（企业用户才有） */
  enterpriseInfo?: {
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    businessLicense?: string;
  };
  /** 创建时间 */
  createdAt: string;
}

/**
 * 照片与 AI 处理接口
 */
export interface Photo {
  /** 照片 ID */
  id: string;
  /** 处理后图片 URL */
  url: string;
  /** 原图 URL */
  originalUrl: string;
  /** 缩略图 URL */
  thumbnailUrl: string;
  /** 图片宽度（像素） */
  width: number;
  /** 图片高度（像素） */
  height: number;
  /** 文件大小（字节） */
  size: number;
  /** 图片格式 */
  format: string;
  /** 是否已 AI 增强 */
  aiEnhanced: boolean;
  /** AI 处理参数 */
  aiParams: AIParams;
  /** 隐私设置 */
  privacy: PrivacyType;
  /** 可见好友 ID 列表（隐私为 friends 时有效） */
  visibleFriendIds: string[];
  /** 上传时间 */
  uploadedAt: string;
}

/**
 * 材质规格选项
 */
export interface MaterialOption {
  /** 材质名称 */
  name: string;
  /** 价格（分） */
  price: number;
  /** 材质描述 */
  description: string;
  /** 材质图片 */
  image: string;
}

/**
 * 产品特点
 */
export interface ProductFeature {
  /** 图标 */
  icon: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
}

/**
 * 产品分类接口
 */
export interface ProductCategory {
  /** 分类 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类图标 */
  icon: string;
  /** 分类描述 */
  description: string;
  /** 价格区间 */
  priceRange: {
    min: number;
    max: number;
  };
  /** 月销量 */
  monthlySales: number;
  /** 标签列表 */
  tags: string[];
  /** 模板数量 */
  templateCount: number;
  /** 可编辑能力 */
  editableFeatures: string[];
  /** 材质规格选项 */
  materialOptions: MaterialOption[];
  /** 装帧选项 */
  bindingOptions: string[];
  /** 尺寸规格 */
  sizeOptions: string[];
  /** 隐私支持 */
  privacySupport: string[];
  /** 生产周期 */
  productionDays: string;
  /** 产品封面图 */
  coverImage: string;
  /** 详情页轮播图 */
  detailImages: string[];
  /** 产品特点列表 */
  features: ProductFeature[];
}

/**
 * 模板接口
 */
export interface Template {
  /** 模板 ID */
  id: string;
  /** 关联产品 ID */
  productId: string;
  /** 模板名称 */
  name: string;
  /** 缩略图 URL */
  thumbnailUrl: string;
  /** 预览图 URL 列表 */
  previewUrls: string[];
  /** 模板分类 */
  category: TemplateCategory;
  /** 场景标签 */
  sceneTags: string[];
  /** 设计师 ID */
  designerId: string;
  /** 设计师名称 */
  designerName: string;
  /** 是否免费 */
  isFree: boolean;
  /** 模板价格（分） */
  price: number;
  /** 使用次数 */
  usageCount: number;
  /** 画布宽度 */
  canvasWidth: number;
  /** 画布高度 */
  canvasHeight: number;
  /** 图层列表 */
  layers: EditorLayer[];
  /** 创建时间 */
  createdAt: string;
}

/**
 * 编辑器图层接口
 */
export interface EditorLayer {
  /** 图层 ID */
  id: string;
  /** 图层类型 */
  type: LayerType;
  /** 图层名称 */
  name: string;
  /** 是否可见 */
  visible: boolean;
  /** 是否锁定 */
  locked: boolean;
  /** 图层排序（值越小越靠上） */
  order: number;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 旋转角度（度） */
  rotation: number;
  /** 不透明度（0-1） */
  opacity: number;
  /** 图片数据（type 为 image 时有效） */
  imageData?: ImageLayerData;
  /** 文字数据（type 为 text 时有效） */
  textData?: TextLayerData;
  /** 形状数据（type 为 shape 时有效） */
  shapeData?: ShapeLayerData;
}

/**
 * SKU 材质接口
 */
export interface SKUMaterial {
  /** 材质 ID */
  id: string;
  /** 材质编码 */
  code: string;
  /** 材质名称 */
  name: string;
  /** 材质分类 */
  category: string;
  /** 规格 */
  specification: string;
  /** 成本价（分） */
  costPrice: number;
  /** 销售价（分） */
  salePrice: number;
  /** 供应商 */
  supplier: string;
  /** 库存数量 */
  stock: number;
  /** 库存预警阈值 */
  stockWarningThreshold: number;
  /** 材质描述 */
  description: string;
  /** 样品图 URL */
  sampleImage: string;
}

/**
 * 购物车项接口
 */
export interface CartItem {
  /** 购物车项 ID */
  id: string;
  /** 模板 ID */
  templateId: string;
  /** 模板名称 */
  templateName: string;
  /** 模板缩略图 */
  templateThumbnail: string;
  /** 产品 ID */
  productId: string;
  /** 产品名称 */
  productName: string;
  /** 材质 ID */
  materialId: string;
  /** 材质名称 */
  materialName: string;
  /** 数量 */
  quantity: number;
  /** 单价（分） */
  unitPrice: number;
  /** 编辑器快照数据 */
  editorSnapshot: string;
  /** 渲染预览图 URL */
  renderedPreview: string;
}

/**
 * 分账明细项
 */
export interface SplitAccountItem {
  /** 分账方 */
  party: string;
  /** 分账金额（分） */
  amount: number;
  /** 分账比例 */
  ratio: number;
  /** 分账状态 */
  status: 'pending' | 'completed' | 'failed';
  /** 分账完成时间 */
  completedAt?: string;
}

/**
 * 分账信息
 */
export interface SplitAccountInfo {
  /** 支付方式 */
  paymentMethod: 'wechat' | 'alipay' | 'other';
  /** 支付方式名称 */
  paymentMethodName: string;
  /** 分账状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 分账明细 */
  items: SplitAccountItem[];
  /** 分账完成时间 */
  completedAt?: string;
}

/**
 * 订单金额拆分明细
 */
export interface OrderSplitDetails {
  /** 平台服务费 */
  platformFee: number;
  /** 设计师分成 */
  designerRoyalty: number;
  /** 工厂成本 */
  factoryCost: number;
  /** 微信支付手续费 */
  wechatFee?: number;
  /** 支付宝手续费 */
  alipayFee?: number;
  /** 支付渠道 */
  paymentChannel?: 'wechat' | 'alipay' | 'bank' | 'monthly';
}

/**
 * 收货地址
 */
export interface ShippingAddress {
  /** 收货人姓名 */
  name: string;
  /** 收货人电话 */
  phone: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  detail: string;
  /** 邮政编码 */
  zipCode?: string;
}

/**
 * 订单接口
 */
export interface Order {
  /** 订单 ID */
  id: string;
  /** 订单编号 */
  orderNo: string;
  /** 用户 ID */
  userId: string;
  /** 是否企业订单 */
  isEnterprise: boolean;
  /** 订单商品列表 */
  items: CartItem[];
  /** 商品总金额（分） */
  totalAmount: number;
  /** 运费（分） */
  shippingFee: number;
  /** 优惠金额（分） */
  discountAmount: number;
  /** 应付金额（分） */
  payableAmount: number;
  /** 支付方式 */
  paymentMethod: string;
  /** 金额拆分明细 */
  splitDetails: OrderSplitDetails;
  /** 分账信息（企业订单） */
  splitAccountInfo?: SplitAccountInfo;
  /** 收货地址 */
  shippingAddress: ShippingAddress;
  /** 订单状态 */
  status: OrderStatus;
  /** 生产节点列表 */
  productionNodes: ProductionNode[];
  /** 物流信息 */
  logisticsInfo?: LogisticsInfo;
  /** 创建时间 */
  createdAt: string;
  /** 支付时间 */
  paidAt?: string;
  /** 生产开始时间 */
  productionStartedAt?: string;
  /** 发货时间 */
  shippedAt?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 取消时间 */
  cancelledAt?: string;
}

/**
 * 生产节点接口
 */
export interface ProductionNode {
  /** 节点 ID */
  id: string;
  /** 节点标识 */
  nodeKey: string;
  /** 节点名称 */
  nodeName: string;
  /** 节点状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** 时间戳 */
  timestamp: string;
  /** 操作人 */
  operator: string;
  /** 备注 */
  remark?: string;
}

/**
 * 物流轨迹
 */
export interface LogisticsTrack {
  /** 时间 */
  time: string;
  /** 轨迹描述 */
  description: string;
  /** 地点 */
  location?: string;
}

/**
 * 物流信息接口
 */
export interface LogisticsInfo {
  /** 物流公司 */
  company: string;
  /** 运单号 */
  trackingNo: string;
  /** 物流状态 */
  status: 'pending' | 'transit' | 'delivered' | 'failed';
  /** 预计送达时间 */
  estimatedDelivery?: string;
  /** 快递员姓名 */
  courierName?: string;
  /** 快递员电话 */
  courierPhone?: string;
  /** 物流轨迹列表 */
  tracks: LogisticsTrack[];
}

/**
 * 设计师接口
 */
export interface Designer {
  /** 设计师 ID */
  id: string;
  /** 关联用户 ID */
  userId: string;
  /** 真实姓名 */
  realName: string;
  /** 作品集链接 */
  portfolioUrl: string;
  /** 审核状态 */
  auditStatus: AuditStatus;
  /** 审核备注 */
  auditRemark?: string;
  /** 分成比例（0-1） */
  royaltyRate: number;
  /** 已结算金额（分） */
  settledAmount: number;
  /** 待结算金额（分） */
  pendingAmount: number;
  /** 申请时间 */
  appliedAt: string;
  /** 审核时间 */
  auditedAt?: string;
}

/**
 * 审核记录
 */
export interface AuditRecord {
  /** 审核时间 */
  time: string;
  /** 审核人 */
  auditor: string;
  /** 审核结果 */
  result: AuditStatus;
  /** 审核备注 */
  remark?: string;
}

/**
 * 素材版权接口
 */
export interface MaterialAsset {
  /** 素材 ID */
  id: string;
  /** 设计师 ID */
  designerId: string;
  /** 素材类型 */
  type: MaterialType;
  /** 素材名称 */
  name: string;
  /** 预览图 URL */
  previewUrl: string;
  /** 文件 URL */
  fileUrl: string;
  /** 标签列表 */
  tags: string[];
  /** 是否免费 */
  isFree: boolean;
  /** 素材价格（分） */
  price: number;
  /** 版权证明文件 URL */
  copyrightProof: string;
  /** 审核状态 */
  auditStatus: AuditStatus;
  /** 审核历史记录 */
  auditHistory: AuditRecord[];
  /** 使用次数 */
  usageCount: number;
  /** 上传时间 */
  uploadedAt: string;
}

/**
 * 运费规则接口
 */
export interface ShippingRule {
  /** 规则 ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 适用地区列表 */
  regions: string[];
  /** 基础运费（分） */
  baseFee: number;
  /** 每公斤额外费用（分） */
  perKgFee: number;
  /** 包邮门槛金额（分），0 表示不包邮 */
  freeShippingThreshold: number;
  /** 优先级（值越大优先级越高） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 社区作品接口
 */
export interface CommunityWork {
  /** 作品 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户头像 */
  userAvatar: string;
  /** 作品标题 */
  title: string;
  /** 作品描述 */
  description: string;
  /** 封面图 URL */
  coverUrl: string;
  /** 点赞数 */
  likesCount: number;
  /** 评论数 */
  commentsCount: number;
  /** 是否已点赞 */
  isLiked: boolean;
  /** 隐私设置 */
  privacy: PrivacyType;
  /** 创建时间 */
  createdAt: string;
  /** 标签数组 */
  tags: string[];
  /** 产品类型 */
  productType: string;
  /** 瀑布流高度类 */
  heightClass?: 'tall' | 'normal' | 'short';
}
