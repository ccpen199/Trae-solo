export const mockUser = {
  id: "u001",
  name: "李明",
  role: "citizen",
  avatar: "",
  location: { city: "南宁", lat: 22.82, lng: 108.37 },
  preferences: ["医疗", "交通", "文旅"],
};

export const mockIdentityProviders = [
  { provider: "govcloud", label: "广西政务云", status: "connected", lastAuth: "2026-06-17 09:30" },
  { provider: "unionpay", label: "银联认证", status: "connected", lastAuth: "2026-06-16 14:20" },
  { provider: "wechat", label: "微信", status: "connected", lastAuth: "2026-06-17 08:15" },
  { provider: "alipay", label: "支付宝", status: "expired", lastAuth: "2026-05-20 16:45" },
];

export const mockServices = [
  { id: "s1", title: "公文智能摘要", description: "AI自动提取公文核心要点", icon: "FileText", color: "primary", roles: ["official"], link: "/gov" },
  { id: "s2", title: "会议纪要生成", description: "智能生成会议纪要与待办", icon: "Users", color: "primary", roles: ["official"], link: "/gov" },
  { id: "s3", title: "任务督办看板", description: "任务进度实时追踪", icon: "ClipboardList", color: "primary", roles: ["official"], link: "/gov" },
  { id: "s4", title: "电子营业执照", description: "在线调用电子营业执照", icon: "Building2", color: "gold", roles: ["enterprise"], link: "/identity" },
  { id: "s5", title: "政策精准推送", description: "基于企业画像的政策匹配", icon: "Target", color: "gold", roles: ["enterprise"], link: "/monitor" },
  { id: "s6", title: "医保电子凭证", description: "全国通用医保扫码支付", icon: "HeartPulse", color: "emerald", roles: ["citizen"], link: "/livelihood" },
  { id: "s7", title: "社保查询", description: "社保余额缴费一键查", icon: "ShieldCheck", color: "emerald", roles: ["citizen"], link: "/livelihood" },
  { id: "s8", title: "高龄补贴申领", description: "自动核验一键申领", icon: "HandCoins", color: "emerald", roles: ["citizen"], link: "/livelihood" },
  { id: "s9", title: "新生儿免证办", description: "出生即入户免交材料", icon: "Baby", color: "emerald", roles: ["citizen"], link: "/livelihood" },
  { id: "s10", title: "异地就医备案", description: "自动同步全国医保平台", icon: "Plane", color: "emerald", roles: ["citizen"], link: "/livelihood" },
  { id: "s11", title: "景区预约", description: "限流预警智能预约", icon: "Mountain", color: "emerald", roles: ["tourist", "citizen"], link: "/tour" },
  { id: "s12", title: "AI路线规划", description: "小众路线个性化定制", icon: "Route", color: "emerald", roles: ["tourist"], link: "/tour" },
  { id: "s13", title: "跨境支付", description: "支持多币种便捷支付", icon: "CreditCard", color: "gold", roles: ["tourist"], link: "/identity" },
  { id: "s14", title: "多语种导览", description: "中英越泰四语导览", icon: "Languages", color: "emerald", roles: ["tourist"], link: "/tour" },
  { id: "s15", title: "跨市公交码", description: "一码通行广西十四市", icon: "Bus", color: "primary", roles: ["citizen", "tourist"], link: "/livelihood" },
  { id: "s16", title: "文旅投诉直连", description: "投诉直达文旅局", icon: "MessageSquareWarning", color: "gold", roles: ["tourist", "citizen"], link: "/tour" },
];

export const mockDocuments = [
  { id: "d1", title: "关于推进数字广西建设的实施意见", summary: "提出到2027年基本建成数字广西，实现政务服务100%网上办理，数字产业增加值占GDP比重超15%。重点推进5G网络全覆盖、数据中心集群建设、跨境数字贸易平台搭建。", keywords: ["数字广西", "5G", "数据中心"], status: "approved", createdAt: "2026-06-14", source: "自治区人民政府" },
  { id: "d2", title: "广西壮族自治区文旅融合发展三年行动方案", summary: "规划2026-2028年文旅融合路线图，打造10个国家级文旅示范区，培育50条精品旅游线路，实现文旅产业总收入突破8000亿元。", keywords: ["文旅融合", "示范区", "精品线路"], status: "reviewing", createdAt: "2026-06-12", source: "文旅厅" },
  { id: "d3", title: "关于完善异地就医直接结算机制的通知", summary: "扩大异地就医直接结算覆盖范围，2026年底前实现全区14个地级市全覆盖，将门诊慢性病纳入跨省结算。简化备案流程，推行承诺制备案。", keywords: ["异地就医", "直接结算", "备案"], status: "approved", createdAt: "2026-06-10", source: "医保局" },
  { id: "d4", title: "广西惠企政策精准推送平台建设规范", summary: "统一企业画像标签体系，建设政策-企业智能匹配引擎，实现政策100%精准触达，企业申领补贴平均时间缩短60%。", keywords: ["惠企政策", "精准推送", "企业画像"], status: "draft", createdAt: "2026-06-08", source: "工信厅" },
];

export const mockMeetings = [
  { id: "m1", title: "数字广西建设领导小组第12次会议", date: "2026-06-15", attendees: 32, minutes: "会议听取了数字广西建设进展汇报，审议通过《数据要素市场化配置改革方案》，要求年底前完成自治区级数据交换平台升级。", actionItems: ["完成数据交换平台升级方案", "制定数据要素流通规则", "开展数据资产登记试点"], status: "completed" },
  { id: "m2", title: "全区文旅安全工作部署会议", date: "2026-06-14", attendees: 56, minutes: "部署暑期旅游安全工作，要求4A以上景区6月底前完成预约限流系统对接，建立客流实时监测和预警机制。", actionItems: ["景区预约系统对接", "客流监测预警上线"], status: "completed" },
  { id: "m3", title: "医保信息化标准化建设推进会", date: "2026-06-13", attendees: 28, minutes: "", actionItems: [], status: "generating" },
  { id: "m4", title: "跨境电子商务综合试验区建设专题会", date: "2026-06-12", attendees: 18, minutes: "", actionItems: [], status: "pending" },
];

export const mockTasks = [
  { id: "t1", title: "完成数据交换平台升级方案", assignee: "张伟", status: "in_progress", priority: "high", deadline: "2026-06-20", overdue: false },
  { id: "t2", title: "景区预约系统对接验收", assignee: "陈芳", status: "todo", priority: "high", deadline: "2026-06-30", overdue: false },
  { id: "t3", title: "制定数据要素流通规则", assignee: "王磊", status: "todo", priority: "medium", deadline: "2026-07-15", overdue: false },
  { id: "t4", title: "异地就医备案承诺制上线", assignee: "刘洋", status: "done", priority: "high", deadline: "2026-06-10", overdue: false },
  { id: "t5", title: "企业画像标签体系V2发布", assignee: "赵敏", status: "in_progress", priority: "medium", deadline: "2026-06-18", overdue: false },
  { id: "t6", title: "跨境支付接口联调测试", assignee: "黄海", status: "todo", priority: "medium", deadline: "2026-06-15", overdue: true },
  { id: "t7", title: "多语种导览内容更新", assignee: "周琳", status: "done", priority: "low", deadline: "2026-06-08", overdue: false },
  { id: "t8", title: "高龄补贴自动核验规则更新", assignee: "吴婷", status: "in_progress", priority: "high", deadline: "2026-06-16", overdue: true },
];

export const mockScenicSpots = [
  { id: "sp1", name: "桂林漓江风景区", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Li%20River%20Guilin%20karst%20mountains%20sunset%20scenic%20landscape%20photography&image_size=landscape_4_3", level: "5A", currentVisitors: 8200, maxCapacity: 12000, heatLevel: "medium", availableSlots: [{ time: "08:00-10:00", remaining: 320 }, { time: "10:00-12:00", remaining: 150 }, { time: "14:00-16:00", remaining: 280 }, { time: "16:00-18:00", remaining: 410 }] },
  { id: "sp2", name: "德天跨国瀑布", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Detian%20waterfall%20Vietnam%20border%20magnificent%20cascading%20water&image_size=landscape_4_3", level: "5A", currentVisitors: 5400, maxCapacity: 8000, heatLevel: "medium", availableSlots: [{ time: "08:00-10:00", remaining: 200 }, { time: "10:00-12:00", remaining: 80 }, { time: "14:00-16:00", remaining: 160 }, { time: "16:00-18:00", remaining: 340 }] },
  { id: "sp3", name: "北海银滩", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Beihai%20silver%20beach%20tropical%20coastline%20palm%20trees%20blue%20sea&image_size=landscape_4_3", level: "4A", currentVisitors: 9800, maxCapacity: 15000, heatLevel: "high", availableSlots: [{ time: "08:00-10:00", remaining: 100 }, { time: "10:00-12:00", remaining: 30 }, { time: "14:00-16:00", remaining: 80 }, { time: "16:00-18:00", remaining: 250 }] },
  { id: "sp4", name: "龙胜龙脊梯田", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Longsheng%20Dragon%20Back%20rice%20terraces%20morning%20mist%20layers%20green&image_size=landscape_4_3", level: "4A", currentVisitors: 3200, maxCapacity: 6000, heatLevel: "low", availableSlots: [{ time: "06:00-09:00", remaining: 450 }, { time: "09:00-12:00", remaining: 380 }, { time: "14:00-17:00", remaining: 420 }, { time: "17:00-19:00", remaining: 500 }] },
  { id: "sp5", name: "黄姚古镇", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Huangyao%20ancient%20town%20traditional%20architecture%20stone%20bridge%20stream&image_size=landscape_4_3", level: "4A", currentVisitors: 4800, maxCapacity: 5000, heatLevel: "full", availableSlots: [{ time: "08:00-10:00", remaining: 0 }, { time: "10:00-12:00", remaining: 10 }, { time: "14:00-16:00", remaining: 0 }, { time: "16:00-18:00", remaining: 50 }] },
];

export const mockTourRoutes = [
  { id: "r1", name: "秘境边关线", spots: ["德天跨国瀑布", "明仕田园", "友谊关"], duration: "3天2晚", difficulty: "easy", description: "沿中越边境线探索壮美山水，体验边关风情与异国文化交融的独特魅力。" },
  { id: "r2", name: "瑶寨深度线", spots: ["龙脊梯田", "金坑大寨", "黄洛瑶寨"], duration: "2天1晚", difficulty: "moderate", description: "深入龙胜山区，探访千年瑶寨，体验梯田农耕文化与红瑶长发习俗。" },
  { id: "r3", name: "桂北秘境线", spots: ["猫儿山", "八角寨", "天湖"], duration: "3天2晚", difficulty: "challenging", description: "穿越华南之巅猫儿山，探秘丹霞奇观八角寨，适合户外探险爱好者。" },
];

export const mockComplaints = [
  { id: "c1", title: "景区停车收费不合理", content: "黄姚古镇停车场收费50元/次，远超周边景区标准，且无公示价目表。", status: "processing", createdAt: "2026-06-14" },
  { id: "c2", title: "导游强制购物", content: "参加漓江一日游时，导游多次将团队带至指定购物点，停留时间超过景点游览时间。", status: "resolved", createdAt: "2026-06-10", reply: "经核查情况属实，已对涉事旅行社进行处罚并责令整改，退还游客购物款项。感谢您的监督！" },
  { id: "c3", title: "景区卫生间不足", content: "银滩景区夏季客流高峰时卫生间排队超30分钟，建议增设移动卫生间。", status: "submitted", createdAt: "2026-06-17" },
];

export const mockSubsidies = [
  {
    id: "sub1", type: "elderly", applicant: "韦秀兰", status: "disbursed", amount: 1200,
    timeline: [
      { step: "资格自动核验", date: "2026-06-01", status: "completed" },
      { step: "一键申领", date: "2026-06-01", status: "completed" },
      { step: "审批通过", date: "2026-06-03", status: "completed" },
      { step: "补贴到账", date: "2026-06-10", status: "completed" },
    ],
  },
  {
    id: "sub2", type: "newborn", applicant: "陈小明", status: "approved", amount: 3000,
    timeline: [
      { step: "出生登记", date: "2026-06-12", status: "completed" },
      { step: "户口自动办理", date: "2026-06-12", status: "completed" },
      { step: "医保自动参保", date: "2026-06-12", status: "completed" },
      { step: "社保自动开户", date: "2026-06-13", status: "completed" },
      { step: "补贴审批中", date: "2026-06-14", status: "current" },
    ],
  },
  {
    id: "sub3", type: "elderly", applicant: "黄阿婆", status: "eligible", amount: 1500,
    timeline: [
      { step: "资格自动核验", date: "2026-06-17", status: "current" },
      { step: "一键申领", date: "", status: "pending" },
      { step: "审批通过", date: "", status: "pending" },
      { step: "补贴到账", date: "", status: "pending" },
    ],
  },
];

export const mockMedicalInsurance = {
  balance: 12856.5,
  monthlyDeposit: 680,
  lastPayment: "2026-06-01",
  crossRegionStatus: "active",
  crossRegionRecords: [
    { hospital: "广州中山大学附属第一医院", date: "2026-05-20", amount: 2340 },
    { hospital: "湖南省人民医院", date: "2026-04-15", amount: 1560 },
    { hospital: "深圳市人民医院", date: "2026-03-08", amount: 890 },
  ],
};

export const mockSLAMetrics = [
  { department: "民政厅", api: "婚姻登记查询", avgResponseTime: 120, p99ResponseTime: 350, slaTarget: 500, complianceRate: 99.2, status: "healthy" },
  { department: "医保局", api: "医保余额查询", avgResponseTime: 200, p99ResponseTime: 480, slaTarget: 500, complianceRate: 97.8, status: "healthy" },
  { department: "交通厅", api: "实时路况", avgResponseTime: 85, p99ResponseTime: 280, slaTarget: 300, complianceRate: 99.5, status: "healthy" },
  { department: "文旅厅", api: "景区预约", avgResponseTime: 450, p99ResponseTime: 850, slaTarget: 800, complianceRate: 92.3, status: "warning" },
  { department: "公安厅", api: "身份核验", avgResponseTime: 150, p99ResponseTime: 420, slaTarget: 400, complianceRate: 98.1, status: "warning" },
  { department: "人社厅", api: "社保查询", avgResponseTime: 180, p99ResponseTime: 390, slaTarget: 500, complianceRate: 99.6, status: "healthy" },
  { department: "住建厅", api: "公积金查询", avgResponseTime: 680, p99ResponseTime: 1200, slaTarget: 800, complianceRate: 85.4, status: "critical" },
  { department: "市场监管局", api: "营业执照查询", avgResponseTime: 230, p99ResponseTime: 520, slaTarget: 500, complianceRate: 96.7, status: "warning" },
];

export const mockPolicyFulfillments = [
  { policyName: "中小企业数字化转型补贴", targetEnterprises: 5000, reachedEnterprises: 4350, totalAmount: 21750, avgDisbursementDays: 12, complianceRate: 87.0 },
  { policyName: "高新技术企业研发费用加计扣除", targetEnterprises: 1200, reachedEnterprises: 1180, totalAmount: 59000, avgDisbursementDays: 8, complianceRate: 98.3 },
  { policyName: "文旅产业恢复发展专项补助", targetEnterprises: 800, reachedEnterprises: 620, totalAmount: 9300, avgDisbursementDays: 18, complianceRate: 77.5 },
  { policyName: "制造业中长期贷款贴息", targetEnterprises: 3000, reachedEnterprises: 2850, totalAmount: 42750, avgDisbursementDays: 10, complianceRate: 95.0 },
  { policyName: "跨境电子商务扶持资金", targetEnterprises: 600, reachedEnterprises: 420, totalAmount: 8400, avgDisbursementDays: 22, complianceRate: 70.0 },
];

export const mockNews = [
  { id: "n1", category: "policy", title: "广西发布稳经济一揽子政策措施", summary: "涵盖减税降费、金融支持、稳岗扩岗等6大方面42条具体措施", time: "10分钟前" },
  { id: "n2", category: "transport", title: "南宁地铁6号线一期开工", summary: "连接五象新区与兴宁区，预计2029年建成通车", time: "30分钟前" },
  { id: "n3", category: "medical", title: "异地就医直接结算覆盖全区", summary: "14个地级市全面开通，门诊慢性病纳入跨省结算", time: "1小时前" },
  { id: "n4", category: "culture", title: "壮族三月三文化活动周启动", summary: "全区200余场民俗活动，线上直播同步进行", time: "2小时前" },
  { id: "n5", category: "finance", title: "数字人民币试点扩至广西全区", summary: "覆盖零售、文旅、交通等场景，累计交易额突破50亿", time: "3小时前" },
];

export const mockSLAHistory = [
  { time: "00:00", 民政厅: 130, 医保局: 210, 交通厅: 90, 文旅厅: 460, 住建厅: 700 },
  { time: "04:00", 民政厅: 110, 医保局: 190, 交通厅: 80, 文旅厅: 420, 住建厅: 650 },
  { time: "08:00", 民政厅: 150, 医保局: 250, 交通厅: 100, 文旅厅: 520, 住建厅: 750 },
  { time: "10:00", 民政厅: 140, 医保局: 230, 交通厅: 95, 文旅厅: 490, 住建厅: 720 },
  { time: "12:00", 民政厅: 125, 医保局: 200, 交通厅: 88, 文旅厅: 470, 住建厅: 690 },
  { time: "14:00", 民政厅: 135, 医保局: 220, 交通厅: 92, 文旅厅: 510, 住建厅: 740 },
  { time: "16:00", 民政厅: 120, 医保局: 205, 交通厅: 85, 文旅厅: 450, 住建厅: 680 },
  { time: "20:00", 民政厅: 115, 医保局: 195, 交通厅: 82, 文旅厅: 430, 住建厅: 660 },
];
