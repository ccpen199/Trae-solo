export interface ProductionNode {
  status: string;
  description: string;
  completedAt?: string;
  estimatedAt?: string;
  completed: boolean;
}

export interface LogisticsInfo {
  company: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  currentLocation?: string;
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
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-18 10:23:15",
        completed: true,
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-06-18 10:25:30",
        completed: true,
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-06-18 14:30:00",
        completed: true,
      },
      {
        status: "printing",
        description: "正在印刷",
        completedAt: "2025-06-19 09:15:00",
        completed: true,
      },
      {
        status: "binding",
        description: "装帧加工",
        estimatedAt: "2025-06-20",
        completed: false,
      },
      {
        status: "quality_check",
        description: "质量检验",
        estimatedAt: "2025-06-21",
        completed: false,
      },
      {
        status: "shipping",
        description: "发货配送",
        estimatedAt: "2025-06-22",
        completed: false,
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
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-06-10 15:40:22",
        completed: true,
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-06-10 15:42:18",
        completed: true,
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-06-11 09:20:00",
        completed: true,
      },
      {
        status: "printing",
        description: "正在印刷",
        completedAt: "2025-06-12 14:30:00",
        completed: true,
      },
      {
        status: "binding",
        description: "加工制作",
        completedAt: "2025-06-13 10:00:00",
        completed: true,
      },
      {
        status: "quality_check",
        description: "质量检验",
        completedAt: "2025-06-13 16:00:00",
        completed: true,
      },
      {
        status: "shipping",
        description: "发货配送",
        completedAt: "2025-06-14 09:00:00",
        completed: true,
      },
    ],
    logistics: {
      company: "顺丰速运",
      trackingNumber: "SF1234567890123",
      status: "运输中",
      estimatedDelivery: "2025-06-16",
      currentLocation: "杭州市",
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
    productionNodes: [
      {
        status: "order_received",
        description: "订单已提交",
        completedAt: "2025-05-20 11:18:45",
        completed: true,
      },
      {
        status: "payment_confirmed",
        description: "支付确认",
        completedAt: "2025-05-20 11:20:33",
        completed: true,
      },
      {
        status: "design_review",
        description: "设计稿审核",
        completedAt: "2025-05-21 09:30:00",
        completed: true,
      },
      {
        status: "printing",
        description: "正在印刷",
        completedAt: "2025-05-22 14:00:00",
        completed: true,
      },
      {
        status: "binding",
        description: "装订成册",
        completedAt: "2025-05-23 10:30:00",
        completed: true,
      },
      {
        status: "quality_check",
        description: "质量检验",
        completedAt: "2025-05-23 16:30:00",
        completed: true,
      },
      {
        status: "shipping",
        description: "发货配送",
        completedAt: "2025-05-24 08:30:00",
        completed: true,
      },
    ],
    logistics: {
      company: "中通快递",
      trackingNumber: "ZT9876543210987",
      status: "已签收",
      currentLocation: "北京市朝阳区",
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
    receiverInfo: {
      name: "张小姐",
      phone: "136****2345",
      province: "北京市",
      city: "北京市",
      district: "朝阳区",
      address: "建国路 88 号 SOHO 现代城 A 座",
    },
  },
];
