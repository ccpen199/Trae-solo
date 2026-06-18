import type {
  User,
  Department,
  ServiceItem,
  ApplicationCase,
  Certificate,
  AuditLog,
  ServiceMonitor,
  StatsOverview,
  PendingApproval,
  HeatmapData,
  ServiceDomain,
} from "@/types";

export const mockUser: User = {
  id: "u001",
  realName: "张伟",
  idCardMasked: "3205**********1234",
  phoneMasked: "138****5678",
  authLevel: "L3",
  userType: "citizen",
};

export const mockAdminUser: User = {
  id: "a001",
  realName: "李主任",
  idCardMasked: "3205**********5678",
  phoneMasked: "139****1234",
  authLevel: "L3",
  userType: "admin",
  departmentId: "d002",
  department: "市数据局",
};

export const mockDepartments: Department[] = [
  { id: "d001", name: "市公安局", code: "GAJ", contactPhone: "0512-57300001", serviceCount: 86 },
  { id: "d002", name: "市数据局", code: "SJJ", contactPhone: "0512-57300002", serviceCount: 42 },
  { id: "d003", name: "市卫生健康委员会", code: "WJW", contactPhone: "0512-57300003", serviceCount: 68 },
  { id: "d004", name: "市交通运输局", code: "JTJ", contactPhone: "0512-57300004", serviceCount: 54 },
  { id: "d005", name: "市教育局", code: "JYJ", contactPhone: "0512-57300005", serviceCount: 72 },
  { id: "d006", name: "市人力资源和社会保障局", code: "RSJ", contactPhone: "0512-57300006", serviceCount: 95 },
  { id: "d007", name: "市民政局", code: "MZJ", contactPhone: "0512-57300007", serviceCount: 38 },
  { id: "d008", name: "市住房和城乡建设局", code: "ZJJ", contactPhone: "0512-57300008", serviceCount: 61 },
  { id: "d009", name: "市市场监督管理局", code: "SCJ", contactPhone: "0512-57300009", serviceCount: 53 },
  { id: "d010", name: "市税务局", code: "SWJ", contactPhone: "0512-57300010", serviceCount: 47 },
];

const domainMap: Record<ServiceDomain, { name: string; sub: string[] }> = {
  livelihood: { name: "民生服务", sub: ["社会保障", "社会救助", "住房保障", "养老服务", "残疾人服务"] },
  government: { name: "办事服务", sub: ["证件办理", "企业开办", "资质认定", "备案登记", "许可审批"] },
  medical: { name: "医疗健康", sub: ["预约挂号", "医保服务", "公共卫生", "健康档案", "疫苗接种"] },
  traffic: { name: "交通出行", sub: ["车辆管理", "驾驶证业务", "公交服务", "停车服务", "出行导航"] },
  education: { name: "教育在线", sub: ["入学报名", "学籍管理", "考试服务", "继续教育", "校园服务"] },
  lifestyle: { name: "生活休闲", sub: ["文旅服务", "体育健身", "便民缴费", "气象服务", "公共设施"] },
};

const deptByDomain: Record<ServiceDomain, string[]> = {
  livelihood: ["d006", "d007", "d008"],
  government: ["d001", "d009", "d010"],
  medical: ["d003"],
  traffic: ["d004", "d001"],
  education: ["d005"],
  lifestyle: ["d007", "d008"],
};

const serviceNames: Record<ServiceDomain, string[]> = {
  livelihood: [
    "社保卡申领", "养老金资格认证", "低保申请", "公租房申请", "残疾人证办理",
    "老年人优待证办理", "失业登记", "就业困难人员认定", "医疗救助申请", "临时救助",
  ],
  government: [
    "身份证补办", "户籍迁移", "营业执照办理", "食品经营许可证", "不动产权证办理",
    "建筑工程施工许可", "道路运输经营许可", "医疗机构执业许可", "民办学校设立审批", "公章刻制备案",
  ],
  medical: [
    "三甲医院预约挂号", "医保异地就医备案", "健康体检预约", "儿童疫苗接种预约", "医保报销",
    "电子健康档案查询", "慢性病管理申请", "孕产妇保健服务", "精神卫生服务", "职业病诊断",
  ],
  traffic: [
    "机动车号牌选号", "驾驶证期满换证", "违章查询处理", "公交卡充值", "停车费缴纳",
    "网约车驾驶员证办理", "道路运输证年审", "电动自行车上牌", "实时公交查询", "出租车投诉",
  ],
  education: [
    "小学入学报名", "初中入学报名", "高中学籍查询", "成人高考报名", "教师资格认定",
    "普通话水平测试", "自学考试报名", "学历认证", "校园招聘信息", "学生资助申请",
  ],
  lifestyle: [
    "图书馆读者证办理", "体育场馆预订", "水电费缴纳", "燃气费缴纳", "有线电视缴费",
    "旅游年卡办理", "天气预报查询", "社区活动报名", "公共厕所查询", "垃圾分类指导",
  ],
};

function generateServices(): ServiceItem[] {
  const services: ServiceItem[] = [];
  let id = 1;
  (Object.keys(domainMap) as ServiceDomain[]).forEach((domain) => {
    const names = serviceNames[domain];
    const depts = deptByDomain[domain];
    names.forEach((name, idx) => {
      const subIdx = idx % domainMap[domain].sub.length;
      services.push({
        id: `s${String(id).padStart(4, "0")}`,
        name,
        category: domain,
        categoryName: domainMap[domain].name,
        subCategory: domainMap[domain].sub[subIdx],
        department: mockDepartments.find((d) => d.id === depts[idx % depts.length])!.name,
        departmentId: depts[idx % depts.length],
        description: `${name}服务，为昆山市民提供便捷的在线办理渠道。支持全程网办、快递送达，无需跑腿。`,
        handlingTime: `${1 + (idx % 7)}个工作日`,
        fee: idx % 3 === 0 ? "免费" : `${10 + idx * 5}元`,
        materials: [
          { id: `m${id}1`, name: "身份证明材料", required: true, format: "image" as const, description: "身份证正反面照片" },
          { id: `m${id}2`, name: "申请表", required: true, format: "pdf" as const, description: "在线填写后自动生成" },
          ...(idx % 2 === 0
            ? [{ id: `m${id}3`, name: "辅助证明材料", required: false, format: "doc" as const, description: "其他相关证明文件（可选）" }]
            : []),
        ],
        processSteps: [
          { id: `p${id}1`, name: "在线申报", description: "填写申请信息并上传材料", estimatedDays: 0, department: "申请人" },
          { id: `p${id}2`, name: "材料初审", description: "窗口人员对提交材料进行初审", estimatedDays: 1, department: "受理部门" },
          { id: `p${id}3`, name: "业务审核", description: "业务科室进行实质性审查", estimatedDays: 2 + (idx % 3), department: mockDepartments.find((d) => d.id === depts[idx % depts.length])!.name },
          { id: `p${id}4`, name: "结果送达", description: "通过电子证照或邮寄方式送达", estimatedDays: 1, department: "受理部门" },
        ],
        onlineAvailable: true,
        appointmentAvailable: idx % 4 !== 0,
        status: idx % 25 === 0 ? "maintenance" : "online",
        viewCount: 1000 + Math.floor(Math.random() * 50000),
        applyCount: 100 + Math.floor(Math.random() * 10000),
        satisfactionRate: 92 + Math.random() * 7,
      });
      id++;
    });
  });
  return services;
}

export const mockServices: ServiceItem[] = generateServices();

export const mockCases: ApplicationCase[] = [
  {
    id: "c001",
    caseNo: "KS2024061800123",
    serviceId: "s0001",
    serviceName: "社保卡申领",
    applicantId: "u001",
    applicantName: "张伟",
    status: "processing",
    currentNode: "业务审核",
    timeline: [
      { nodeId: "n1", nodeName: "在线申报", status: "completed", handleTime: "2024-06-15 09:30:00", remark: "申请已提交" },
      { nodeId: "n2", nodeName: "材料初审", status: "completed", handler: "王科员", handlerDept: "市人社局", handleTime: "2024-06-15 14:20:00", remark: "材料齐全，初审通过" },
      { nodeId: "n3", nodeName: "业务审核", status: "processing", handlerDept: "市人社局" },
      { nodeId: "n4", nodeName: "结果送达", status: "pending" },
    ],
    materials: [
      { id: "um001", templateId: "m11", name: "身份证明材料", fileName: "身份证.jpg", uploadTime: "2024-06-15 09:28:00", fileSize: 2048000 },
      { id: "um002", templateId: "m12", name: "申请表", fileName: "社保卡申请表.pdf", uploadTime: "2024-06-15 09:29:00", fileSize: 512000 },
    ],
    applyTime: "2024-06-15 09:30:00",
    estimatedFinishTime: "2024-06-20",
  },
  {
    id: "c002",
    caseNo: "KS2024061000089",
    serviceId: "s0021",
    serviceName: "三甲医院预约挂号",
    applicantId: "u001",
    applicantName: "张伟",
    status: "completed",
    currentNode: "已完成",
    timeline: [
      { nodeId: "n1", nodeName: "在线申报", status: "completed", handleTime: "2024-06-10 08:00:00" },
      { nodeId: "n2", nodeName: "材料初审", status: "completed", handleTime: "2024-06-10 08:05:00" },
      { nodeId: "n3", nodeName: "业务审核", status: "completed", handler: "市第一人民医院", handleTime: "2024-06-10 08:10:00" },
      { nodeId: "n4", nodeName: "结果送达", status: "completed", handleTime: "2024-06-10 08:10:00", remark: "预约成功，就诊时间：6月12日上午9:00" },
    ],
    materials: [],
    applyTime: "2024-06-10 08:00:00",
    finishTime: "2024-06-10 08:10:00",
    result: { type: "approval", title: "预约挂号成功凭证", downloadUrl: "#" },
  },
  {
    id: "c003",
    caseNo: "KS2024060500456",
    serviceId: "s0041",
    serviceName: "机动车号牌选号",
    applicantId: "u001",
    applicantName: "张伟",
    status: "pending_material",
    currentNode: "材料补正",
    timeline: [
      { nodeId: "n1", nodeName: "在线申报", status: "completed", handleTime: "2024-06-05 10:15:00" },
      { nodeId: "n2", nodeName: "材料初审", status: "rejected", handler: "赵科员", handlerDept: "市公安局", handleTime: "2024-06-05 15:40:00", remark: "车辆照片不清晰，请重新上传" },
      { nodeId: "n3", nodeName: "业务审核", status: "pending" },
      { nodeId: "n4", nodeName: "结果送达", status: "pending" },
    ],
    materials: [
      { id: "um003", templateId: "m411", name: "身份证明材料", fileName: "身份证.jpg", uploadTime: "2024-06-05 10:12:00", fileSize: 1548000 },
    ],
    applyTime: "2024-06-05 10:15:00",
  },
  {
    id: "c004",
    caseNo: "KS2024052000789",
    serviceId: "s0031",
    serviceName: "身份证补办",
    applicantId: "u001",
    applicantName: "张伟",
    status: "approved",
    currentNode: "审批通过",
    timeline: [
      { nodeId: "n1", nodeName: "在线申报", status: "completed", handleTime: "2024-05-20 11:00:00" },
      { nodeId: "n2", nodeName: "材料初审", status: "completed", handler: "孙科员", handlerDept: "市公安局", handleTime: "2024-05-20 14:00:00" },
      { nodeId: "n3", nodeName: "业务审核", status: "completed", handler: "钱科长", handlerDept: "市公安局", handleTime: "2024-05-21 09:30:00" },
      { nodeId: "n4", nodeName: "结果送达", status: "completed", handleTime: "2024-05-25 10:00:00", remark: "新身份证已制作完成，正在派送" },
    ],
    materials: [
      { id: "um004", templateId: "m311", name: "身份证明材料", fileName: "户口本照片.jpg", uploadTime: "2024-05-20 10:58:00", fileSize: 2400000 },
    ],
    applyTime: "2024-05-20 11:00:00",
    finishTime: "2024-05-25 10:00:00",
    result: { type: "certificate", title: "居民身份证", certificateId: "cert001" },
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: "cert001",
    type: "居民身份证",
    typeCode: "ID_CARD",
    certNo: "3205**********1234",
    holderName: "张伟",
    issueDate: "2024-05-25",
    expireDate: "2044-05-25",
    issueAuthority: "昆山市公安局",
    status: "valid",
    color: "from-gov-600 to-gov-800",
    fields: {
      姓名: "张伟",
      性别: "男",
      民族: "汉族",
      出生: "1990年03月15日",
      住址: "江苏省昆山市玉山镇前进中路123号",
      公民身份号码: "3205**********1234",
    },
    usageHistory: [
      { id: "h1", time: "2024-06-15 14:30:00", verifier: "市人社局窗口", verifierDept: "市人社局", purpose: "社保卡申领核验" },
      { id: "h2", time: "2024-06-10 08:10:00", verifier: "市第一人民医院", verifierDept: "市卫健委", purpose: "挂号身份核验" },
      { id: "h3", time: "2024-06-01 09:00:00", verifier: "中国银行昆山支行", verifierDept: "金融机构", purpose: "银行业务办理" },
    ],
  },
  {
    id: "cert002",
    type: "社会保障卡",
    typeCode: "SOCIAL_CARD",
    certNo: "KSSB**********7890",
    holderName: "张伟",
    issueDate: "2020-03-10",
    expireDate: "2030-03-10",
    issueAuthority: "昆山市人力资源和社会保障局",
    status: "valid",
    color: "from-success-600 to-success-800",
    fields: {
      持卡人姓名: "张伟",
      社会保障号码: "3205**********1234",
      卡号: "KSSB**********7890",
      发卡日期: "2020年03月10日",
      有效期至: "2030年03月10日",
      发卡机构: "昆山市人力资源和社会保障局",
    },
    usageHistory: [
      { id: "h1", time: "2024-06-12 09:15:00", verifier: "市第一人民医院", verifierDept: "市卫健委", purpose: "医保结算" },
      { id: "h2", time: "2024-06-08 16:20:00", verifier: "同德堂药房", verifierDept: "定点零售药店", purpose: "医保购药" },
    ],
  },
  {
    id: "cert003",
    type: "机动车驾驶证",
    typeCode: "DRIVER_LICENSE",
    certNo: "3205**********1234",
    holderName: "张伟",
    issueDate: "2018-07-20",
    expireDate: "2024-07-20",
    issueAuthority: "苏州市公安局交通警察支队",
    status: "expiring",
    color: "from-warning-600 to-warning-800",
    fields: {
      姓名: "张伟",
      性别: "男",
      国籍: "中国",
      住址: "江苏省昆山市玉山镇前进中路123号",
      出生日期: "1990-03-15",
      初次领证日期: "2012-07-20",
      准驾车型: "C1",
      有效期限: "2018-07-20至2024-07-20",
    },
    usageHistory: [
      { id: "h1", time: "2024-06-05 15:40:00", verifier: "市交警大队", verifierDept: "市公安局", purpose: "交通违章处理" },
    ],
  },
  {
    id: "cert004",
    type: "不动产权证书",
    typeCode: "PROPERTY_CERT",
    certNo: "苏(2023)昆山市不动产权第0012345号",
    holderName: "张伟",
    issueDate: "2023-08-15",
    expireDate: "2093-08-14",
    issueAuthority: "昆山市自然资源和规划局",
    status: "valid",
    color: "from-emerald-600 to-emerald-800",
    fields: {
      权利人: "张伟",
      共有情况: "单独所有",
      坐落: "昆山市玉山镇前进花园18栋302室",
      不动产单元号: "320583 001002 GB00012 F00180302",
      权利类型: "国有建设用地使用权/房屋所有权",
      权利性质: "出让/市场化商品房",
      用途: "城镇住宅用地/住宅",
      面积: "120.50平方米",
      使用期限: "2023-08-15起2093-08-14止",
    },
    usageHistory: [
      { id: "h1", time: "2024-05-20 10:30:00", verifier: "建设银行昆山支行", verifierDept: "金融机构", purpose: "抵押贷款核验" },
    ],
  },
];

export const mockAuditLogs: AuditLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: `log${String(i + 1).padStart(3, "0")}`,
  userId: i % 3 === 0 ? "a001" : "u001",
  userName: i % 3 === 0 ? "李主任" : "张伟",
  action: [
    "用户登录",
    "查看服务详情",
    "提交办件申请",
    "上传材料",
    "亮证操作",
    "下载证照",
    "修改个人信息",
    "服务评价",
    "审批通过",
    "审批驳回",
  ][i % 10],
  resource: ["用户", "服务项", "办件", "材料", "电子证照", "个人信息", "服务评价", "审批事项"][i % 8],
  resourceId: `r${String(i + 100).padStart(4, "0")}`,
  ip: `192.168.${i % 255}.${(i * 3) % 255}`,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  result: i % 7 === 0 ? "failed" : "success",
  createdAt: `2024-06-${String(10 + (i % 8)).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
}));

export const mockServiceMonitors: ServiceMonitor[] = mockServices.slice(0, 12).map((s, i) => ({
  serviceId: s.id,
  serviceName: s.name,
  uptime: i % 11 === 0 ? 95.2 + Math.random() * 2 : 99.5 + Math.random() * 0.5,
  avgResponseTime: 80 + Math.floor(Math.random() * 420),
  status: i % 11 === 0 ? "error" : i % 7 === 0 ? "warning" : "normal",
  lastCheck: `2024-06-18 ${String(8 + (i % 8)).padStart(2, "0")}:30:00`,
  errorCount: i % 11 === 0 ? 23 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 3),
}));

export const mockStatsOverview: StatsOverview = {
  todayCases: 3847,
  todayCasesChange: 12.5,
  totalServices: 486,
  activeServices: 478,
  totalCertificates: 1287563,
  todayCertUsage: 8924,
  avgProcessingTime: 2.8,
  satisfactionRate: 96.8,
  satisfactionRateChange: 0.5,
  departmentRanking: [
    { department: "市人社局", cases: 856, avgTime: 2.1, satisfaction: 97.5 },
    { department: "市公安局", cases: 742, avgTime: 1.8, satisfaction: 98.2 },
    { department: "市卫健委", cases: 534, avgTime: 3.2, satisfaction: 96.1 },
    { department: "市教育局", cases: 468, avgTime: 2.5, satisfaction: 95.8 },
    { department: "市住建局", cases: 389, avgTime: 3.8, satisfaction: 94.5 },
    { department: "市交通局", cases: 356, avgTime: 2.3, satisfaction: 96.3 },
  ],
  weeklyTrend: Array.from({ length: 7 }, (_, i) => ({
    date: `06-${String(12 + i).padStart(2, "0")}`,
    cases: 3000 + Math.floor(Math.random() * 1500),
    completed: 2800 + Math.floor(Math.random() * 1400),
  })),
  serviceDomainStats: [
    { domain: "livelihood", domainName: "民生服务", count: 1256, percentage: 32.7 },
    { domain: "government", domainName: "办事服务", count: 987, percentage: 25.7 },
    { domain: "medical", domainName: "医疗健康", count: 654, percentage: 17.0 },
    { domain: "education", domainName: "教育在线", count: 478, percentage: 12.4 },
    { domain: "traffic", domainName: "交通出行", count: 312, percentage: 8.1 },
    { domain: "lifestyle", domainName: "生活休闲", count: 160, percentage: 4.1 },
  ],
};

export const mockPendingApprovals: PendingApproval[] = [
  { id: "pa001", caseNo: "KS2024061800156", serviceName: "公租房申请", applicantName: "王芳", submitTime: "2024-06-18 09:15:00", deadline: "2024-06-25", priority: "high", currentDept: "市住建局", requiredDepts: ["市住建局", "市民政局"] },
  { id: "pa002", caseNo: "KS2024061800145", serviceName: "食品经营许可证变更", applicantName: "美味餐饮有限公司", submitTime: "2024-06-18 08:50:00", deadline: "2024-06-28", priority: "medium", currentDept: "市市场监管局", requiredDepts: ["市市场监管局"] },
  { id: "pa003", caseNo: "KS2024061700890", serviceName: "建筑工程施工许可", applicantName: "昆山建设集团", submitTime: "2024-06-17 16:30:00", deadline: "2024-07-02", priority: "high", currentDept: "市住建局", requiredDepts: ["市住建局", "市环保局", "市消防大队"] },
  { id: "pa004", caseNo: "KS2024061700856", serviceName: "民办学校设立审批", applicantName: "启智教育培训中心", submitTime: "2024-06-17 14:20:00", deadline: "2024-07-05", priority: "medium", currentDept: "市教育局", requiredDepts: ["市教育局", "市消防大队"] },
  { id: "pa005", caseNo: "KS2024061700789", serviceName: "道路运输经营许可", applicantName: "顺达物流有限公司", submitTime: "2024-06-17 10:45:00", deadline: "2024-06-27", priority: "low", currentDept: "市交通局", requiredDepts: ["市交通局", "市公安局"] },
];

const kunshanDistricts = [
  "玉山镇", "巴城镇", "周市镇", "陆家镇", "花桥镇", "淀山湖镇",
  "张浦镇", "周庄镇", "千灯镇", "锦溪镇", "开发区", "高新区",
];

export const mockHeatmapData: HeatmapData[] = Array.from({ length: 300 }, () => {
  const domains: ServiceDomain[] = ["livelihood", "government", "medical", "traffic", "education", "lifestyle"];
  return {
    area: kunshanDistricts[Math.floor(Math.random() * kunshanDistricts.length)],
    areaCode: `KS${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    hour: Math.floor(Math.random() * 24),
    count: 10 + Math.floor(Math.random() * 500),
    serviceCategory: domains[Math.floor(Math.random() * domains.length)],
  };
});

export const serviceDomains = [
  { code: "livelihood" as ServiceDomain, name: "民生服务", icon: "HeartHandshake", color: "from-rose-500 to-pink-600", bgColor: "bg-rose-50", textColor: "text-rose-600" },
  { code: "government" as ServiceDomain, name: "办事服务", icon: "FileCheck", color: "from-gov-500 to-gov-700", bgColor: "bg-gov-50", textColor: "text-gov-600" },
  { code: "medical" as ServiceDomain, name: "医疗健康", icon: "Stethoscope", color: "from-emerald-500 to-teal-600", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
  { code: "traffic" as ServiceDomain, name: "交通出行", icon: "Car", color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50", textColor: "text-amber-600" },
  { code: "education" as ServiceDomain, name: "教育在线", icon: "GraduationCap", color: "from-violet-500 to-purple-600", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  { code: "lifestyle" as ServiceDomain, name: "生活休闲", icon: "Coffee", color: "from-cyan-500 to-sky-600", bgColor: "bg-cyan-50", textColor: "text-cyan-600" },
];

export const statusTextMap: Record<string, { text: string; badge: string }> = {
  draft: { text: "草稿", badge: "badge-gray" },
  submitted: { text: "已提交", badge: "badge-primary" },
  accepted: { text: "已受理", badge: "badge-primary" },
  processing: { text: "办理中", badge: "badge-warning" },
  pending_material: { text: "待补材料", badge: "badge-danger" },
  approved: { text: "已通过", badge: "badge-success" },
  rejected: { text: "已驳回", badge: "badge-danger" },
  completed: { text: "已完成", badge: "badge-success" },
};
