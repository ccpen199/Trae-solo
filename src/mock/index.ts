import type {
  User,
  ExpressOrder,
  Customer,
  TrackingEvent,
  WaybillTemplate,
  PrintJob,
  BusinessMetrics,
  SplitRule,
  SettlementDetail,
  DashboardSummary,
  TaskItem,
  AuditLogEntry,
  PermissionConfig,
  ComplianceConfig,
  HeatmapPoint,
  Announcement,
} from "@/types";

export const mockUsers: User[] = [
  {
    id: "u-admin-001",
    username: "admin",
    realName: "王建国",
    phone: "138****6821",
    role: "branch_admin",
    branchId: "b-001",
    branchName: "上海市浦东新区张江网点",
    permissions: ["*"],
    avatar: "",
  },
  {
    id: "u-courier-001",
    username: "courier1",
    realName: "李大勇",
    phone: "139****1102",
    role: "courier",
    branchId: "b-001",
    branchName: "上海市浦东新区张江网点",
    permissions: ["order.*", "print.*", "tracking.read", "customer.read"],
  },
  {
    id: "u-courier-002",
    username: "courier2",
    realName: "张小花",
    phone: "137****3344",
    role: "courier",
    branchId: "b-001",
    branchName: "上海市浦东新区张江网点",
    permissions: ["order.*", "print.*", "tracking.read", "customer.read"],
  },
  {
    id: "u-super-001",
    username: "super",
    realName: "赵区域",
    phone: "136****9988",
    role: "regional_supervisor",
    branchId: "r-east",
    branchName: "华东区域（上海-江苏-浙江）",
    permissions: ["*"],
  },
];

export const mockOrderStatusMap = {
  pending_pickup: { label: "待揽收", color: "bg-ember-50 text-ember-600" },
  picked: { label: "已揽收", color: "bg-mint-50 text-mint-600" },
  in_transit: { label: "运输中", color: "bg-ink-50 text-ink-600" },
  delivered: { label: "已签收", color: "bg-ink-50 text-mint-600" },
  exception: { label: "异常件", color: "bg-alert-50 text-alert-600" },
};

const companies = [
  { name: "顺丰速运", code: "SF" },
  { name: "京东物流", code: "JD" },
  { name: "中通快递", code: "ZTO" },
  { name: "圆通速递", code: "YTO" },
  { name: "申通快递", code: "STO" },
  { name: "韵达速递", code: "YD" },
  { name: "极兔速递", code: "JT" },
  { name: "邮政EMS", code: "EMS" },
];

const customerNames = ["陈先生", "李女士", "王总", "刘经理", "赵师傅", "孙小姐", "周先生", "吴女士"];
const districts = ["浦东新区", "徐汇区", "静安区", "黄浦区", "长宁区", "虹口区", "杨浦区", "闵行区"];
const items = ["数码配件", "服装鞋帽", "生鲜食品", "日用百货", "文件资料", "美妆护肤", "母婴用品"];

function pad(n: number, w = 2) {
  return n.toString().padStart(w, "0");
}
function genTracking(c: string) {
  return `${c}${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOrders(count = 48): ExpressOrder[] {
  const statuses: ExpressOrder["status"][] = [
    "pending_pickup",
    "pending_pickup",
    "picked",
    "in_transit",
    "in_transit",
    "delivered",
    "delivered",
    "delivered",
    "exception",
  ];
  const list: ExpressOrder[] = [];
  for (let i = 0; i < count; i++) {
    const company = rnd(companies);
    const status = rnd(statuses);
    const d = new Date();
    d.setHours(d.getHours() - Math.floor(Math.random() * 36));
    const created = d.toISOString();
    const picked = status !== "pending_pickup" ? new Date(d.getTime() + 3600_000).toISOString() : undefined;
    const delivered = status === "delivered" ? new Date(d.getTime() + 3600_000 * 20).toISOString() : undefined;
    const sender = {
      name: rnd(customerNames),
      phone: `1${3 + Math.floor(Math.random() * 6)}${pad(Math.floor(Math.random() * 99999999), 8)}`,
      address: `上海市${rnd(districts)}${rnd(["张江路", "世纪大道", "南京西路", "淮海中路", "陆家嘴环路"])}${Math.floor(Math.random() * 2000 + 1)}号`,
      province: "上海市",
      city: "上海市",
      district: rnd(districts),
    };
    const receiver = {
      name: rnd(customerNames),
      phone: `1${3 + Math.floor(Math.random() * 6)}${pad(Math.floor(Math.random() * 99999999), 8)}`,
      address: `${rnd(["北京市", "杭州市", "南京市", "深圳市", "广州市", "成都市"])}${rnd(["朝阳区", "西湖区", "玄武区", "南山区", "天河区", "武侯区"])}人民大道${Math.floor(Math.random() * 900 + 100)}号`,
      province: rnd(["北京市", "浙江省", "江苏省", "广东省", "四川省"]),
      city: rnd(["北京市", "杭州市", "南京市", "深圳市", "广州市"]),
      district: rnd(["朝阳区", "西湖区", "玄武区", "南山区", "天河区"]),
    };
    list.push({
      id: `o-${pad(i + 1, 4)}`,
      orderNo: `SY${Date.now().toString().slice(-6)}${pad(i + 1, 3)}`,
      trackingNo: genTracking(company.code),
      expressCompany: company.name,
      expressCompanyCode: company.code,
      branchId: "b-001",
      courierId: Math.random() > 0.5 ? "u-courier-001" : "u-courier-002",
      courierName: Math.random() > 0.5 ? "李大勇" : "张小花",
      customerId: `c-${pad(Math.floor(Math.random() * 18) + 1, 3)}`,
      sender,
      receiver,
      weight: +(Math.random() * 12 + 0.3).toFixed(2),
      items: rnd(items),
      price: +(Math.random() * 60 + 8).toFixed(2),
      status,
      createdAt: created,
      pickedAt: picked,
      deliveredAt: delivered,
    });
  }
  return list;
}

export const mockOrders = generateOrders(48);

export function generateCustomers(count = 24): Customer[] {
  const list: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const isProtocol = Math.random() > 0.7;
    list.push({
      id: `c-${pad(i + 1, 3)}`,
      phone: `1${3 + Math.floor(Math.random() * 6)}${pad(Math.floor(Math.random() * 99999999), 8)}`,
      name: rnd(customerNames),
      branchId: "b-001",
      bindType: Math.random() > 0.5 ? "phone" : "qr_code",
      bindQrCode: `https://syt.ink/c/${pad(i + 1, 3)}`,
      isProtocol,
      protocolInfo: isProtocol
        ? {
            contractNo: `HT${Date.now().toString().slice(-6)}${pad(i, 3)}`,
            priceAgreement: { SF: 9.5, JD: 8.8, ZTO: 4.2, YTO: 4.0 },
            settlementCycle: rnd<"daily" | "weekly" | "monthly">(["daily", "weekly", "monthly"]),
            serviceScope: ["上海市浦东新区", "上海市徐汇区", "上海市静安区"],
            expireDate: new Date(Date.now() + 86400_000 * (30 + Math.floor(Math.random() * 300))).toISOString().slice(0, 10),
          }
        : undefined,
      tags: [rnd(["高频客户", "协议客户", "月结客户", "散客", "生鲜"]), rnd(["VIP", "企业", "个人"])],
      totalOrders: Math.floor(Math.random() * 120 + 3),
      totalAmount: +(Math.random() * 8000 + 200).toFixed(2),
      lastOrderDate: new Date(Date.now() - 86400_000 * Math.floor(Math.random() * 14)).toISOString().slice(0, 10),
      repurchaseRate: +(Math.random() * 0.6 + 0.2).toFixed(4),
      createdAt: new Date(Date.now() - 86400_000 * (60 + Math.floor(Math.random() * 200))).toISOString(),
    });
  }
  return list;
}

export const mockCustomers = generateCustomers(24);

export function generateTracking(trackingNo: string): TrackingEvent[] {
  const events = [
    { status: "快件已揽收", statusCode: "picked", location: "上海市浦东新区张江网点", description: "快递员已上门取件", operator: "李大勇", timestamp: "", isException: false },
    { status: "已发往分拨中心", statusCode: "departure", location: "上海浦东分拨中心", description: "快件已装车发往下一站", operator: "分拣中心", timestamp: "", isException: false },
    { status: "到达分拨中心", statusCode: "arrival", location: "上海虹桥转运中心", description: "快件到达转运中心，等待分拣", operator: "分拣中心", timestamp: "", isException: false },
    { status: "运输中", statusCode: "transit", location: "南京市江宁分拨中心", description: "干线运输途中", operator: "干线运输", timestamp: "", isException: false },
    { status: "到达派件网点", statusCode: "destination", location: "南京市鼓楼网点", description: "快件到达派件网点", operator: "网点", timestamp: "", isException: false },
    { status: "派送中", statusCode: "delivering", location: "南京市鼓楼区", description: "快递员正在派送中", operator: "王派件", timestamp: "", isException: false },
    { status: "已签收", statusCode: "delivered", location: "南京市鼓楼区", description: "收件人已本人签收", operator: "王派件", timestamp: "", isException: false },
  ];
  const base = new Date(Date.now() - 86400_000 * 2);
  return events.map((e, i) => ({
    ...e,
    id: `t-${i}`,
    trackingNo,
    timestamp: new Date(base.getTime() + 3600_000 * 4 * i).toISOString(),
  }));
}

export const mockTemplates: WaybillTemplate[] = companies.map((c, i) => ({
  id: `tpl-${pad(i + 1, 3)}`,
  name: `${c.name}标准面单`,
  expressCompany: c.name,
  expressCompanyCode: c.code,
  templateType: i % 4 === 0 ? "custom" : "standard",
  paperSize: i % 2 === 0 ? "100x180" : "76x130",
  layout: {
    trackingNo: { x: 10, y: 8, width: 80, height: 18, fontSize: 14 },
    sender: { x: 10, y: 32, width: 80, height: 28, fontSize: 10 },
    receiver: { x: 10, y: 64, width: 80, height: 28, fontSize: 10 },
    qr: { x: 68, y: 30, width: 28, height: 28, fontSize: 0 },
    items: { x: 10, y: 100, width: 80, height: 14, fontSize: 10 },
    barcode: { x: 10, y: 150, width: 80, height: 16, fontSize: 0 },
  },
  isDefault: i === 0,
  createdAt: new Date(Date.now() - 86400_000 * (i + 1)).toISOString(),
}));

export const mockPrintJobs: PrintJob[] = [
  {
    id: "pj-001",
    orderIds: ["o-0001", "o-0002", "o-0003", "o-0004", "o-0005"],
    templateId: "tpl-001",
    templateName: "顺丰速运标准面单",
    printerId: "printer-hp-laser",
    printerType: "pc_browser",
    status: "success",
    totalCount: 5,
    successCount: 5,
    failedCount: 0,
    createdAt: new Date(Date.now() - 3600_000 * 2).toISOString(),
    createdBy: "u-admin-001",
  },
  {
    id: "pj-002",
    orderIds: ["o-0011", "o-0012", "o-0013"],
    templateId: "tpl-003",
    templateName: "中通快递标准面单",
    printerId: "printer-mobile-ble-1",
    printerType: "mobile_bluetooth",
    status: "printing",
    totalCount: 3,
    successCount: 1,
    failedCount: 0,
    createdAt: new Date(Date.now() - 600_000).toISOString(),
    createdBy: "u-courier-001",
  },
  {
    id: "pj-003",
    orderIds: ["o-0021", "o-0022", "o-0023", "o-0024", "o-0025", "o-0026"],
    templateId: "tpl-002",
    templateName: "京东物流标准面单",
    printerId: "printer-wifi-office",
    printerType: "mobile_wifi",
    status: "failed",
    totalCount: 6,
    successCount: 3,
    failedCount: 3,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    createdBy: "u-courier-002",
  },
  {
    id: "pj-004",
    orderIds: ["o-0031", "o-0032"],
    templateId: "tpl-005",
    templateName: "申通快递标准面单",
    printerId: "printer-hp-laser",
    printerType: "pc_browser",
    status: "queued",
    totalCount: 2,
    successCount: 0,
    failedCount: 0,
    createdAt: new Date(Date.now() - 300_000).toISOString(),
    createdBy: "u-admin-001",
  },
];

export function generateMetrics(days = 30): BusinessMetrics[] {
  const list: BusinessMetrics[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const pickup = Math.floor(Math.random() * 140 + 80 + Math.sin(i / 3) * 20);
    list.push({
      date: d.toISOString().slice(0, 10),
      pickupCount: pickup,
      revenue: +(pickup * (Math.random() * 8 + 8)).toFixed(2),
      newCustomers: Math.floor(Math.random() * 8 + 1),
      activeCustomers: Math.floor(pickup * 0.45),
      retentionRate: +(0.55 + Math.random() * 0.3).toFixed(4),
      suppliesUsage: {
        SF: Math.floor(pickup * 0.22),
        JD: Math.floor(pickup * 0.15),
        ZTO: Math.floor(pickup * 0.25),
        YTO: Math.floor(pickup * 0.18),
        STO: Math.floor(pickup * 0.12),
        YD: Math.floor(pickup * 0.08),
      },
    });
  }
  return list;
}

export const mockMetrics = generateMetrics(30);

export const mockSplitRules: SplitRule[] = [
  {
    id: "sr-001",
    courierId: "u-courier-001",
    courierName: "李大勇",
    ruleName: "标准提成-李大勇",
    type: "tiered",
    value: 0,
    tierConfig: [
      { min: 0, max: 80, rate: 1.8 },
      { min: 81, max: 150, rate: 2.2 },
      { min: 151, max: 9999, rate: 2.8 },
    ],
    effectiveDate: "2026-01-01",
    expireDate: "2026-12-31",
  },
  {
    id: "sr-002",
    courierId: "u-courier-002",
    courierName: "张小花",
    ruleName: "固定提成-张小花",
    type: "fixed",
    value: 2.5,
    effectiveDate: "2026-02-01",
  },
  {
    id: "sr-003",
    courierId: "u-courier-001",
    courierName: "李大勇",
    ruleName: "协议客户额外返点",
    type: "percentage",
    value: 0.03,
    effectiveDate: "2026-03-01",
    expireDate: "2026-06-30",
  },
];

export function generateSettlements(periods = 8): SettlementDetail[] {
  const list: SettlementDetail[] = [];
  for (let i = 0; i < periods; i++) {
    const isCourier1 = i % 2 === 0;
    const base = +(Math.random() * 4000 + 1800).toFixed(2);
    const split = +(base * (isCourier1 ? 0.28 : 0.22)).toFixed(2);
    const deduction = +(Math.random() * 80).toFixed(2);
    const statusPool: SettlementDetail["status"][] = ["pending", "confirmed", "paid", "paid", "paid"];
    list.push({
      id: `st-${pad(i + 1, 4)}`,
      period: `2026年${pad(i + 1, 2)}月第${(i % 4) + 1}周`,
      courierId: isCourier1 ? "u-courier-001" : "u-courier-002",
      courierName: isCourier1 ? "李大勇" : "张小花",
      orderCount: Math.floor(Math.random() * 260 + 120),
      baseAmount: base,
      splitAmount: split,
      deduction,
      netAmount: +(split - deduction).toFixed(2),
      status: statusPool[i % statusPool.length],
      paidAt: statusPool[i % statusPool.length] === "paid" ? new Date().toISOString() : undefined,
      createdAt: new Date(Date.now() - 86400_000 * (i * 7)).toISOString(),
    });
  }
  return list;
}

export const mockSettlements = generateSettlements(8);

export const mockSummary: DashboardSummary = {
  todayPickup: 186,
  todayPickupDelta: 12.4,
  pendingTasks: 23,
  exceptions: 4,
  todayRevenue: 3842.6,
  todayRevenueDelta: 8.7,
  activeCouriers: 6,
  suppliesWarning: 2,
};

export const mockTasks: TaskItem[] = [
  { id: "tk-01", type: "pickup", title: "上门揽收-陈先生", desc: "浦东新区张江路88号 · 3件服装", priority: "high", orderId: "o-0001", dueAt: new Date(Date.now() + 3600_000).toISOString() },
  { id: "tk-02", type: "pickup", title: "上门揽收-王总", desc: "徐汇区世纪大道100号 · 12kg生鲜", priority: "high", orderId: "o-0002", dueAt: new Date(Date.now() + 3600_000 * 1.5).toISOString() },
  { id: "tk-03", type: "print", title: "批量打印-京东面单", desc: "待打印 16 张面单", priority: "normal", dueAt: new Date(Date.now() + 3600_000 * 3).toISOString() },
  { id: "tk-04", type: "entry", title: "OCR补录-8份运单", desc: "识别置信度不足，需人工确认", priority: "normal", dueAt: new Date(Date.now() + 3600_000 * 5).toISOString() },
  { id: "tk-05", type: "delivery", title: "异常件处理", desc: "o-0021 收件人电话不通", priority: "high", orderId: "o-0021", dueAt: new Date(Date.now() + 3600_000 * 0.5).toISOString() },
  { id: "tk-06", type: "pickup", title: "上门揽收-孙小姐", desc: "静安区南京西路1266号 · 文件", priority: "low", orderId: "o-0007", dueAt: new Date(Date.now() + 3600_000 * 8).toISOString() },
];

export const mockAuditLog: AuditLogEntry[] = Array.from({ length: 30 }).map((_, i) => {
  const modules = ["订单", "客户", "打印", "分账", "权限", "合规", "轨迹"];
  const operations = [
    "创建订单", "修改订单", "确认揽收", "删除订单",
    "新增客户", "绑定客户", "修改协议",
    "批量打印", "模板编辑",
    "生成分账", "确认结算", "支付结算",
    "修改权限", "导出日志",
    "修改合规策略",
  ];
  const user = rnd(mockUsers);
  return {
    id: `log-${pad(i + 1, 5)}`,
    userId: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role,
    module: rnd(modules),
    operation: rnd(operations),
    ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 3600_000 * (i * 0.8 + 0.3)).toISOString(),
  };
});

export const mockPermissions: PermissionConfig[] = [
  {
    role: "courier",
    roleName: "快递员",
    description: "执行揽收、面单打印、轨迹查询等一线作业",
    permissions: {
      "order.read": true,
      "order.create": true,
      "order.update": true,
      "order.pickup": true,
      "order.delete": false,
      "print.read": true,
      "print.create": true,
      "customer.read": true,
      "customer.bind": true,
      "customer.update": false,
      "tracking.read": true,
      "analytics.read": false,
      "finance.read": false,
      "settings.read": false,
      "settings.update": false,
      "audit.read": false,
    },
  },
  {
    role: "branch_admin",
    roleName: "网点管理员",
    description: "负责网点日常运营、客户与员工管理、经营分析",
    permissions: {
      "order.read": true,
      "order.create": true,
      "order.update": true,
      "order.pickup": true,
      "order.delete": true,
      "print.read": true,
      "print.create": true,
      "print.template": true,
      "customer.read": true,
      "customer.bind": true,
      "customer.update": true,
      "customer.protocol": true,
      "tracking.read": true,
      "analytics.read": true,
      "finance.read": true,
      "finance.update": true,
      "settings.read": true,
      "settings.update": true,
      "audit.read": true,
    },
  },
  {
    role: "regional_supervisor",
    roleName: "区域主管",
    description: "跨网点经营对比、区域热力分析、合规审计",
    permissions: {
      "order.read": true,
      "order.create": false,
      "order.update": false,
      "order.pickup": false,
      "order.delete": false,
      "print.read": true,
      "print.create": false,
      "print.template": true,
      "customer.read": true,
      "customer.bind": false,
      "customer.update": false,
      "customer.protocol": true,
      "tracking.read": true,
      "analytics.read": true,
      "finance.read": true,
      "finance.update": false,
      "settings.read": true,
      "settings.update": true,
      "audit.read": true,
      "audit.export": true,
      "compliance.update": true,
    },
  },
];

export const mockCompliance: ComplianceConfig = {
  dataRetentionMonths: 36,
  enablePiiMasking: true,
  maskingFields: { phone: true, address: true, name: false },
  enableAuditTrail: true,
};

export function generateHeatmap(): HeatmapPoint[] {
  const areas = [
    { name: "张江", lng: 121.59, lat: 31.21 },
    { name: "陆家嘴", lng: 121.50, lat: 31.24 },
    { name: "金桥", lng: 121.60, lat: 31.26 },
    { name: "北蔡", lng: 121.56, lat: 31.16 },
    { name: "唐镇", lng: 121.65, lat: 31.23 },
    { name: "世纪公园", lng: 121.54, lat: 31.22 },
    { name: "川沙", lng: 121.69, lat: 31.19 },
    { name: "康桥", lng: 121.57, lat: 31.14 },
    { name: "徐汇滨江", lng: 121.46, lat: 31.17 },
    { name: "静安寺", lng: 121.45, lat: 31.22 },
  ];
  return areas.map((a) => ({ ...a, value: Math.floor(Math.random() * 100 + 10) }));
}

export const mockAnnouncements: Announcement[] = [
  { id: "a-01", type: "success", title: "系统升级完成", content: "支持极兔速递、邮政EMS新增128家合作快递公司面单模板", date: "2026-06-12" },
  { id: "a-02", type: "warning", title: "顺丰速运价格调整", content: "6月15日起上海发往新疆、西藏区域首重价格上调2元", date: "2026-06-11" },
  { id: "a-03", type: "info", title: "数据合规提醒", content: "请网点管理员定期核查客户敏感信息脱敏配置是否开启", date: "2026-06-08" },
  { id: "a-04", type: "warning", title: "面单耗材预警", content: "中通快递面单库存低于阈值（36张），请及时补货", date: "2026-06-13" },
];
