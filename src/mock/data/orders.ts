import type { SplitAccountInfo, WorkOrderInfo, EnterpriseInfo, OperationLog } from '@/types';

export interface ProductionNode {
  status: string;
  description: string;
  completedAt?: string;
  estimatedAt?: string;
  completed: boolean;
  remark?: string;
  operationLogs?: OperationLog[];
}

export interface LogisticsInfo {
  company: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  currentLocation?: string;
  updatedAt: string;
  updates: {
    time: string;
    location: string;
    description: string;
  }[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  templateId?: string;
  templateName?: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  spec: string;
  previewImage: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: "pending" | "producing" | "shipped" | "completed" | "cancelled";
  statusText: string;
  isEnterprise: boolean;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  discount: number;
  payableAmount: number;
  paidAmount: number;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
  productionNodes: ProductionNode[];
  logistics?: LogisticsInfo;
  splitAccountInfo?: SplitAccountInfo;
  workOrderInfo?: WorkOrderInfo;
  enterpriseInfo?: EnterpriseInfo;
  receiverInfo: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
  remark?: string;
}

export const orders: Order[] = [
  {
    id: "order-001",
    orderNo: "202506180001",
    status: "producing",
    statusText: "生产中",
    isEnterprise: false,
    items: [
      {
        productId: "album",
        productName: "相册",
        templateId: "tpl-005",
        templateName: "宝宝成长相册",
        materialId: "mat-002",
        materialName: "光面相纸",
        quantity: 1,
        unitPrice: 128,
        subtotal: 128,
        spec: "12寸精装 / 24页",
        previewImage: "https://picsum.photos/seed/order001/200/150",
      },
    ],
    totalAmount: 128,
    shippingFee: 0,
    discount: 10,
    payableAmount: 118,
    paidAmount: 118,
    paymentMethod: "微信支付",
    paidAt: "2025-06-18 10:25:30",
    createdAt: "2025-06-18 10:23:15",
    workOrderInfo: {
      workOrderNo: "WO202506180001",
      factoryId: "FACT-001",
      productionLine: "精装相册生产线A",
      estimatedCompletionTime: "2025-06-22 18:00:00",
      operator: "张师傅",
      qualityRecord: "待检验",
      equipment: "EQ-PR-0012",
    },
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-18 10:23:15",
        completed: true,
        remark: "订单系统自动接收",
        operationLogs: [
          { time: "2025-06-18 10:23:15", operator: "系统", action: "订单创建成功" },
          { time: "2025-06-18 10:23:16", operator: "系统", action: "库存检查完成" },
        ],
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-06-18 10:25:30",
        completed: true,
        remark: "微信支付成功",
        operationLogs: [
          { time: "2025-06-18 10:25:30", operator: "支付网关", action: "支付回调成功" },
          { time: "2025-06-18 10:25:31", operator: "系统", action: "订单状态更新为已支付" },
        ],
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-06-18 14:30:00",
        completed: true,
        remark: "设计师审核通过",
        operationLogs: [
          { time: "2025-06-18 11:00:00", operator: "王设计", action: "开始审核设计稿" },
          { time: "2025-06-18 14:30:00", operator: "王设计", action: "设计稿审核通过，无修改意见" },
        ],
      },
      {
        status: "printing",
        description: "胶片冲洗",
        completedAt: "2025-06-19 09:15:00",
        completed: true,
        remark: "富士胶片冲印，色彩还原度98%",
        operationLogs: [
          { time: "2025-06-18 15:00:00", operator: "张师傅", action: "文件发送至冲印设备", equipment: "EQ-PR-0012" },
          { time: "2025-06-18 15:30:00", operator: "张师傅", action: "开始冲印", equipment: "EQ-PR-0012" },
          { time: "2025-06-19 09:15:00", operator: "张师傅", action: "冲印完成，色彩校准合格", equipment: "EQ-PR-0012" },
        ],
      },
      {
        status: "binding",
        description: "装帧加工",
        estimatedAt: "2025-06-20 18:00:00",
        completed: false,
        remark: "手工精装 / 锁线装订",
        operationLogs: [
          { time: "2025-06-19 10:00:00", operator: "李师傅", action: "开始装帧工序", equipment: "EQ-BD-0008" },
          { time: "2025-06-19 14:00:00", operator: "李师傅", action: "内页锁线装订完成", equipment: "EQ-BD-0008" },
        ],
      },
      {
        status: "quality_check",
        description: "质量检验",
        estimatedAt: "2025-06-21 12:00:00",
        completed: false,
        remark: "质检合格后方可发货",
        operationLogs: [],
      },
      {
        status: "shipping",
        description: "物流配送",
        estimatedAt: "2025-06-22 09:00:00",
        completed: false,
        remark: "顺丰速运 / 全国包邮",
        operationLogs: [],
      },
      {
        status: "delivered",
        description: "已送达",
        estimatedAt: "2025-06-24 18:00:00",
        completed: false,
        remark: "预计送达时间",
        operationLogs: [],
      },
    ],
    receiverInfo: {
      name: "李女士",
      phone: "138****5678",
      province: "浙江省",
      city: "杭州市",
      district: "西湖区",
      address: "文三路 478 号华星时代广场 B 座",
    },
    remark: "请在相册封面加上宝宝名字：小汤圆",
  },
  {
    id: "order-002",
    orderNo: "202506100002",
    status: "shipped",
    statusText: "已发货",
    isEnterprise: false,
    items: [
      {
        productId: "mug",
        productName: "马克杯",
        templateId: "tpl-021",
        templateName: "情侣款马克杯",
        materialId: "mat-008",
        materialName: "高温陶瓷",
        quantity: 2,
        unitPrice: 59,
        subtotal: 118,
        spec: "情侣款一对 / 白色陶瓷",
        previewImage: "https://picsum.photos/seed/order002/200/150",
      },
      {
        productId: "phone-case",
        productName: "手机壳",
        templateId: "tpl-019",
        templateName: "极简风手机壳",
        materialId: "mat-010",
        materialName: "硅胶软壳",
        quantity: 1,
        unitPrice: 39,
        subtotal: 39,
        spec: "iPhone 15 Pro / 全包边",
        previewImage: "https://picsum.photos/seed/order002b/200/150",
      },
    ],
    totalAmount: 157,
    shippingFee: 8,
    discount: 15,
    payableAmount: 150,
    paidAmount: 150,
    paymentMethod: "支付宝",
    paidAt: "2025-06-10 15:42:18",
    createdAt: "2025-06-10 15:40:22",
    workOrderInfo: {
      workOrderNo: "WO202506100002",
      factoryId: "FACT-002",
      productionLine: "日用礼品生产线B",
      estimatedCompletionTime: "2025-06-13 18:00:00",
      actualCompletionTime: "2025-06-13 16:30:00",
      operator: "刘师傅",
      qualityRecord: "质检合格，无瑕疵",
      equipment: "EQ-PR-0025",
    },
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-10 15:40:22",
        completed: true,
        remark: "订单系统自动接收",
        operationLogs: [
          { time: "2025-06-10 15:40:22", operator: "系统", action: "订单创建成功" },
          { time: "2025-06-10 15:40:23", operator: "系统", action: "库存检查完成" },
        ],
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-06-10 15:42:18",
        completed: true,
        remark: "支付宝支付成功",
        operationLogs: [
          { time: "2025-06-10 15:42:18", operator: "支付网关", action: "支付回调成功" },
          { time: "2025-06-10 15:42:19", operator: "系统", action: "订单状态更新为已支付" },
        ],
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-06-11 09:20:00",
        completed: true,
        remark: "设计师审核通过",
        operationLogs: [
          { time: "2025-06-11 09:00:00", operator: "陈设计", action: "开始审核设计稿" },
          { time: "2025-06-11 09:20:00", operator: "陈设计", action: "设计稿审核通过" },
        ],
      },
      {
        status: "printing",
        description: "胶片冲洗",
        completedAt: "2025-06-12 14:30:00",
        completed: true,
        remark: "富士胶片冲印，色彩还原度98%",
        operationLogs: [
          { time: "2025-06-11 10:00:00", operator: "刘师傅", action: "文件发送至印刷设备", equipment: "EQ-PR-0025" },
          { time: "2025-06-12 14:30:00", operator: "刘师傅", action: "印刷完成，色彩校准合格", equipment: "EQ-PR-0025" },
        ],
      },
      {
        status: "binding",
        description: "装帧加工",
        completedAt: "2025-06-13 10:00:00",
        completed: true,
        remark: "手工精装 / 锁线装订",
        operationLogs: [
          { time: "2025-06-12 15:00:00", operator: "赵师傅", action: "开始加工工序", equipment: "EQ-BD-0015" },
          { time: "2025-06-13 10:00:00", operator: "赵师傅", action: "加工制作完成", equipment: "EQ-BD-0015" },
        ],
      },
      {
        status: "quality_check",
        description: "质量检验",
        completedAt: "2025-06-13 16:00:00",
        completed: true,
        remark: "质检合格，无瑕疵",
        operationLogs: [
          { time: "2025-06-13 14:00:00", operator: "质检员小王", action: "开始质量检验" },
          { time: "2025-06-13 16:00:00", operator: "质检员小王", action: "质检通过，产品合格" },
        ],
      },
      {
        status: "shipping",
        description: "物流配送",
        completedAt: "2025-06-14 09:00:00",
        completed: true,
        remark: "顺丰速运 / 全国包邮",
        operationLogs: [
          { time: "2025-06-14 08:00:00", operator: "仓库管理员", action: "商品打包完成" },
          { time: "2025-06-14 09:00:00", operator: "快递员", action: "顺丰速运已揽收" },
        ],
      },
      {
        status: "delivered",
        description: "已送达",
        estimatedAt: "2025-06-16 18:00:00",
        completed: false,
        remark: "预计送达时间",
        operationLogs: [],
      },
    ],
    logistics: {
      company: "顺丰速运",
      trackingNumber: "SF1234567890123",
      status: "运输中",
      estimatedDelivery: "2025-06-16",
      currentLocation: "杭州市",
      updatedAt: "2025-06-15 14:45:00",
      updates: [
        {
          time: "2025-06-14 09:00:00",
          location: "上海市",
          description: "快件已从上海分拣中心发出",
        },
        {
          time: "2025-06-14 18:30:00",
          location: "上海市",
          description: "快件已到达上海航空部",
        },
        {
          time: "2025-06-15 10:20:00",
          location: "杭州市",
          description: "快件已到达杭州转运中心",
        },
        {
          time: "2025-06-15 14:45:00",
          location: "杭州市西湖区",
          description: "快件正在派送中，快递员：王师傅 138****1234",
        },
      ],
    },
    receiverInfo: {
      name: "王先生",
      phone: "139****8765",
      province: "浙江省",
      city: "杭州市",
      district: "西湖区",
      address: "古墩路 666 号龙湖西溪天街公寓",
    },
    remark: "生日礼物，麻烦包装精美一点，谢谢！",
  },
  {
    id: "order-003",
    orderNo: "202505200003",
    status: "completed",
    statusText: "已完成",
    isEnterprise: true,
    items: [
      {
        productId: "calendar-desk",
        productName: "台历",
        templateId: "tpl-007",
        templateName: "简约生活台历",
        materialId: "mat-001",
        materialName: "哑面相纸",
        quantity: 3,
        unitPrice: 49,
        subtotal: 147,
        spec: "8寸横版 / 12页",
        previewImage: "https://picsum.photos/seed/order003/200/150",
      },
    ],
    totalAmount: 147,
    shippingFee: 0,
    discount: 20,
    payableAmount: 127,
    paidAmount: 127,
    paymentMethod: "微信支付",
    paidAt: "2025-05-20 11:20:33",
    createdAt: "2025-05-20 11:18:45",
    enterpriseInfo: {
      companyName: "北京某某科技有限公司",
      taxNumber: "91110105MA008XXXXX",
      bankName: "中国工商银行北京朝阳支行",
      bankAccount: "0200 0010 0923 4567 890",
      invoiceTitle: "北京某某科技有限公司",
    },
    workOrderInfo: {
      workOrderNo: "WO202505200003",
      factoryId: "FACT-001",
      productionLine: "台历印刷生产线C",
      estimatedCompletionTime: "2025-05-23 18:00:00",
      actualCompletionTime: "2025-05-23 16:30:00",
      operator: "周师傅",
      qualityRecord: "质检合格，3本品相完好",
      equipment: "EQ-PR-0008",
    },
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-05-20 11:18:45",
        completed: true,
        remark: "企业订单，已标记优先处理",
        operationLogs: [
          { time: "2025-05-20 11:18:45", operator: "系统", action: "企业订单创建成功" },
          { time: "2025-05-20 11:18:46", operator: "系统", action: "标记为企业订单，优先处理" },
        ],
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-05-20 11:20:33",
        completed: true,
        remark: "微信支付成功",
        operationLogs: [
          { time: "2025-05-20 11:20:33", operator: "支付网关", action: "企业支付回调成功" },
          { time: "2025-05-20 11:20:34", operator: "系统", action: "订单状态更新为已支付" },
        ],
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-05-21 09:30:00",
        completed: true,
        remark: "企业客户确认设计稿",
        operationLogs: [
          { time: "2025-05-20 14:00:00", operator: "李设计", action: "发送设计稿至客户确认" },
          { time: "2025-05-21 09:30:00", operator: "李设计", action: "客户确认设计稿无误" },
        ],
      },
      {
        status: "printing",
        description: "胶片冲洗",
        completedAt: "2025-05-22 14:00:00",
        completed: true,
        remark: "富士胶片冲印，色彩还原度98%",
        operationLogs: [
          { time: "2025-05-21 10:00:00", operator: "周师傅", action: "文件发送至印刷设备", equipment: "EQ-PR-0008" },
          { time: "2025-05-21 14:00:00", operator: "周师傅", action: "开始批量印刷", equipment: "EQ-PR-0008" },
          { time: "2025-05-22 14:00:00", operator: "周师傅", action: "印刷完成，色彩校准合格", equipment: "EQ-PR-0008" },
        ],
      },
      {
        status: "binding",
        description: "装帧加工",
        completedAt: "2025-05-23 10:30:00",
        completed: true,
        remark: "手工精装 / 锁线装订",
        operationLogs: [
          { time: "2025-05-22 15:00:00", operator: "吴师傅", action: "开始装订工序", equipment: "EQ-BD-0005" },
          { time: "2025-05-23 10:30:00", operator: "吴师傅", action: "3本台历装订完成", equipment: "EQ-BD-0005" },
        ],
      },
      {
        status: "quality_check",
        description: "质量检验",
        completedAt: "2025-05-23 16:30:00",
        completed: true,
        remark: "质检合格，无印刷错误",
        operationLogs: [
          { time: "2025-05-23 14:00:00", operator: "质检员小李", action: "开始质量检验" },
          { time: "2025-05-23 16:30:00", operator: "质检员小李", action: "3本全检合格" },
        ],
      },
      {
        status: "shipping",
        description: "物流配送",
        completedAt: "2025-05-24 08:30:00",
        completed: true,
        remark: "顺丰速运 / 全国包邮",
        operationLogs: [
          { time: "2025-05-24 08:00:00", operator: "仓库管理员", action: "企业订单打包完成" },
          { time: "2025-05-24 08:30:00", operator: "快递员", action: "中通快递已揽收" },
        ],
      },
      {
        status: "delivered",
        description: "已送达",
        completedAt: "2025-05-25 15:42:00",
        completed: true,
        remark: "本人签收",
        operationLogs: [
          { time: "2025-05-25 15:42:00", operator: "快递员", action: "本人签收确认" },
        ],
      },
    ],
    logistics: {
      company: "中通快递",
      trackingNumber: "ZT9876543210987",
      status: "已签收",
      currentLocation: "北京市朝阳区",
      updatedAt: "2025-05-25 15:42:00",
      updates: [
        {
          time: "2025-05-24 08:30:00",
          location: "上海市",
          description: "快件已从上海发出",
        },
        {
          time: "2025-05-25 06:00:00",
          location: "北京市",
          description: "快件已到达北京转运中心",
        },
        {
          time: "2025-05-25 09:30:00",
          location: "北京市朝阳区",
          description: "快件正在派送中",
        },
        {
          time: "2025-05-25 15:42:00",
          location: "北京市朝阳区",
          description: "快件已签收，签收人：本人签收",
        },
      ],
    },
    splitAccountInfo: {
      paymentMethod: "wechat",
      paymentMethodName: "微信支付分账",
      status: "completed",
      items: [
        {
          party: "平台",
          amount: 1524,
          ratio: 0.12,
          status: "completed",
          completedAt: "2025-05-26 10:00:00",
        },
        {
          party: "设计师（张小明）",
          amount: 3810,
          ratio: 0.30,
          status: "completed",
          completedAt: "2025-05-26 10:00:00",
        },
        {
          party: "工厂（上海印刷有限公司）",
          amount: 7366,
          ratio: 0.58,
          status: "completed",
          completedAt: "2025-05-26 10:00:00",
        },
      ],
      completedAt: "2025-05-26 10:00:00",
    },
    receiverInfo: {
      name: "张小姐",
      phone: "136****2345",
      province: "北京市",
      city: "北京市",
      district: "朝阳区",
      address: "建国路 88 号 SOHO 现代城 A 座",
    },
  },
  {
    id: "order-004",
    orderNo: "202506200004",
    status: "pending",
    statusText: "待支付",
    isEnterprise: false,
    items: [
      {
        productId: "photo-frame",
        productName: "相框",
        templateId: "tpl-012",
        templateName: "原木风相框",
        materialId: "mat-005",
        materialName: "实木边框",
        quantity: 1,
        unitPrice: 89,
        subtotal: 89,
        spec: "10寸 / 原木色",
        previewImage: "https://picsum.photos/seed/order004/200/150",
      },
    ],
    totalAmount: 89,
    shippingFee: 5,
    discount: 0,
    payableAmount: 94,
    paidAmount: 0,
    paymentMethod: "",
    createdAt: "2025-06-20 09:15:30",
    workOrderInfo: {
      workOrderNo: "WO202506200004",
      factoryId: "FACT-003",
      productionLine: "相框组装生产线D",
      estimatedCompletionTime: "2025-06-25 18:00:00",
      operator: "待分配",
      qualityRecord: "待检验",
      equipment: "EQ-PR-0033",
    },
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-20 09:15:30",
        completed: true,
        remark: "订单系统自动接收，等待支付",
        operationLogs: [
          { time: "2025-06-20 09:15:30", operator: "系统", action: "订单创建成功" },
          { time: "2025-06-20 09:15:31", operator: "系统", action: "库存锁定，等待支付" },
        ],
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        estimatedAt: "2025-06-21 23:59:59",
        completed: false,
        remark: "待用户支付",
        operationLogs: [],
      },
      {
        status: "design_review",
        description: "设计稿审核",
        estimatedAt: "2025-06-22 18:00:00",
        completed: false,
        remark: "支付完成后开始审核",
        operationLogs: [],
      },
      {
        status: "printing",
        description: "胶片冲洗",
        estimatedAt: "2025-06-23 18:00:00",
        completed: false,
        remark: "富士胶片冲印，色彩还原度98%",
        operationLogs: [],
      },
      {
        status: "binding",
        description: "装帧加工",
        estimatedAt: "2025-06-24 18:00:00",
        completed: false,
        remark: "手工精装 / 锁线装订",
        operationLogs: [],
      },
      {
        status: "quality_check",
        description: "质量检验",
        estimatedAt: "2025-06-25 12:00:00",
        completed: false,
        remark: "质检合格后方可发货",
        operationLogs: [],
      },
      {
        status: "shipping",
        description: "物流配送",
        estimatedAt: "2025-06-26 09:00:00",
        completed: false,
        remark: "顺丰速运 / 全国包邮",
        operationLogs: [],
      },
      {
        status: "delivered",
        description: "已送达",
        estimatedAt: "2025-06-28 18:00:00",
        completed: false,
        remark: "预计送达时间",
        operationLogs: [],
      },
    ],
    receiverInfo: {
      name: "陈先生",
      phone: "137****9876",
      province: "广东省",
      city: "深圳市",
      district: "南山区",
      address: "科技园南区 深圳湾创业投资大厦",
    },
  },
  {
    id: "order-005",
    orderNo: "202506010005",
    status: "completed",
    statusText: "已完成",
    isEnterprise: true,
    items: [
      {
        productId: "business-card",
        productName: "名片",
        templateId: "tpl-031",
        templateName: "企业商务名片",
        materialId: "mat-003",
        materialName: "铜版纸",
        quantity: 500,
        unitPrice: 0.15,
        subtotal: 75,
        spec: "300g铜版纸 / 双面彩色 / 500张",
        previewImage: "https://picsum.photos/seed/order005/200/150",
      },
      {
        productId: "flyer",
        productName: "宣传单页",
        templateId: "tpl-035",
        templateName: "产品促销宣传单",
        materialId: "mat-003",
        materialName: "铜版纸",
        quantity: 1000,
        unitPrice: 0.8,
        subtotal: 800,
        spec: "200g铜版纸 / A4双面 / 1000张",
        previewImage: "https://picsum.photos/seed/order005b/200/150",
      },
    ],
    totalAmount: 875,
    shippingFee: 15,
    discount: 50,
    payableAmount: 840,
    paidAmount: 840,
    paymentMethod: "企业月结",
    paidAt: "2025-06-01 14:30:00",
    createdAt: "2025-06-01 14:25:00",
    enterpriseInfo: {
      companyName: "上海某某贸易有限公司",
      taxNumber: "91310115MA1H7XXXXX",
      bankName: "中国建设银行上海浦东分行",
      bankAccount: "3100 1530 1234 5678 901",
      invoiceTitle: "上海某某贸易有限公司",
    },
    workOrderInfo: {
      workOrderNo: "WO202506010005",
      factoryId: "FACT-002",
      productionLine: "商务印刷生产线E",
      estimatedCompletionTime: "2025-06-04 18:00:00",
      actualCompletionTime: "2025-06-04 15:30:00",
      operator: "孙师傅",
      qualityRecord: "质检合格，名片500张、宣传单1000张全数检验通过",
      equipment: "EQ-PR-0018",
    },
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-01 14:25:00",
        completed: true,
        remark: "企业月结订单，已标记优先处理",
        operationLogs: [
          { time: "2025-06-01 14:25:00", operator: "系统", action: "企业订单创建成功" },
          { time: "2025-06-01 14:25:01", operator: "系统", action: "验证企业月结额度，可用额度充足" },
        ],
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-06-01 14:30:00",
        completed: true,
        remark: "企业月结记账成功",
        operationLogs: [
          { time: "2025-06-01 14:30:00", operator: "财务系统", action: "月结账单记账成功" },
          { time: "2025-06-01 14:30:01", operator: "系统", action: "订单状态更新为已支付" },
        ],
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-06-02 10:00:00",
        completed: true,
        remark: "企业客户终审通过",
        operationLogs: [
          { time: "2025-06-01 16:00:00", operator: "赵设计", action: "设计稿初稿完成，发送客户确认" },
          { time: "2025-06-02 09:00:00", operator: "赵设计", action: "根据客户反馈微调Logo位置" },
          { time: "2025-06-02 10:00:00", operator: "赵设计", action: "客户终审确认，开始生产" },
        ],
      },
      {
        status: "printing",
        description: "胶片冲洗",
        completedAt: "2025-06-03 16:00:00",
        completed: true,
        remark: "富士胶片冲印，色彩还原度98%",
        operationLogs: [
          { time: "2025-06-02 11:00:00", operator: "孙师傅", action: "文件拼版处理", equipment: "EQ-PR-0018" },
          { time: "2025-06-02 14:00:00", operator: "孙师傅", action: "开始批量印刷", equipment: "EQ-PR-0018" },
          { time: "2025-06-03 16:00:00", operator: "孙师傅", action: "印刷完成，色彩校准合格", equipment: "EQ-PR-0018" },
        ],
      },
      {
        status: "binding",
        description: "装帧加工",
        completedAt: "2025-06-04 11:00:00",
        completed: true,
        remark: "手工精装 / 锁线装订",
        operationLogs: [
          { time: "2025-06-03 17:00:00", operator: "钱师傅", action: "开始裁切工序", equipment: "EQ-BD-0022" },
          { time: "2025-06-04 09:00:00", operator: "钱师傅", action: "名片裁切完成，圆角处理", equipment: "EQ-BD-0022" },
          { time: "2025-06-04 11:00:00", operator: "钱师傅", action: "宣传单页折叠包装完成", equipment: "EQ-BD-0022" },
        ],
      },
      {
        status: "quality_check",
        description: "质量检验",
        completedAt: "2025-06-04 15:00:00",
        completed: true,
        remark: "全数检验通过，无次品",
        operationLogs: [
          { time: "2025-06-04 13:00:00", operator: "质检员小张", action: "开始质量检验" },
          { time: "2025-06-04 15:00:00", operator: "质检员小张", action: "名片500张、宣传单1000张全检合格" },
        ],
      },
      {
        status: "shipping",
        description: "物流配送",
        completedAt: "2025-06-05 09:00:00",
        completed: true,
        remark: "顺丰速运 / 全国包邮",
        operationLogs: [
          { time: "2025-06-05 08:00:00", operator: "仓库管理员", action: "企业订单打包完成，附发票" },
          { time: "2025-06-05 09:00:00", operator: "快递员", action: "圆通速递已揽收" },
        ],
      },
      {
        status: "delivered",
        description: "已送达",
        completedAt: "2025-06-06 16:30:00",
        completed: true,
        remark: "前台代收",
        operationLogs: [
          { time: "2025-06-06 16:30:00", operator: "快递员", action: "前台签收确认" },
        ],
      },
    ],
    logistics: {
      company: "圆通速递",
      trackingNumber: "YT5678901234567",
      status: "已签收",
      currentLocation: "上海市浦东新区",
      updatedAt: "2025-06-06 16:30:00",
      updates: [
        {
          time: "2025-06-05 09:00:00",
          location: "上海市",
          description: "快件已从上海发出",
        },
        {
          time: "2025-06-06 08:00:00",
          location: "上海市浦东新区",
          description: "快件正在派送中",
        },
        {
          time: "2025-06-06 16:30:00",
          location: "上海市浦东新区",
          description: "快件已签收，签收人：前台代收",
        },
      ],
    },
    splitAccountInfo: {
      paymentMethod: "alipay",
      paymentMethodName: "支付宝分账",
      status: "completed",
      items: [
        {
          party: "平台",
          amount: 10080,
          ratio: 0.12,
          status: "completed",
          completedAt: "2025-06-07 10:00:00",
        },
        {
          party: "设计师（李设计）",
          amount: 25200,
          ratio: 0.30,
          status: "completed",
          completedAt: "2025-06-07 10:00:00",
        },
        {
          party: "工厂（浙江印刷集团）",
          amount: 48720,
          ratio: 0.58,
          status: "completed",
          completedAt: "2025-06-07 10:00:00",
        },
      ],
      completedAt: "2025-06-07 10:00:00",
    },
    receiverInfo: {
      name: "刘经理",
      phone: "135****1234",
      province: "上海市",
      city: "上海市",
      district: "浦东新区",
      address: "陆家嘴金融贸易区 陆家嘴环路 1000 号",
    },
    remark: "企业订单，请提供发票",
  },
];
