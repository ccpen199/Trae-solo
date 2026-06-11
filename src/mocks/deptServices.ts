import type { DeptService, ServiceRecord, OfflinePackage } from "@/types"

export const deptServices: DeptService[] = [
  {
    deptId: "d1", deptName: "人社局", deptIcon: "Shield", deptColor: "#1A56DB",
    services: [
      { id: "ss1", name: "社保缴费查询", description: "查询个人社保缴费记录及缴费状态", category: "社保", materials: ["身份证"], steps: ["登录认证", "选择查询年份", "查看缴费明细"], duration: "即时", fee: "免费", onlineAvailable: true },
      { id: "ss2", name: "社保参保证明", description: "生成社保参保电子证明", category: "社保", materials: ["身份证"], steps: ["登录认证", "选择证明类型", "生成证明", "下载打印"], duration: "即时", fee: "免费", onlineAvailable: true },
      { id: "ss3", name: "养老保险待遇申领", description: "申领基本养老保险待遇", category: "社保", materials: ["身份证", "退休证", "银行卡"], steps: ["提交申请", "资格审核", "待遇核定", "发放待遇"], duration: "30个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d2", deptName: "公积金中心", deptIcon: "Building2", deptColor: "#7C3AED",
    services: [
      { id: "hf1", name: "公积金提取", description: "住房消费、退休等情形公积金提取", category: "公积金", materials: ["身份证", "银行卡", "提取原因证明"], steps: ["选择提取原因", "上传材料", "审核", "资金到账"], duration: "3个工作日", fee: "免费", onlineAvailable: true },
      { id: "hf2", name: "公积金贷款申请", description: "住房公积金贷款办理", category: "公积金", materials: ["身份证", "购房合同", "收入证明", "征信报告"], steps: ["提交申请", "贷款审批", "签订合同", "放款"], duration: "15个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d3", deptName: "公安局", deptIcon: "FileText", deptColor: "#DC2626",
    services: [
      { id: "ps1", name: "居住证办理", description: "非本市户籍人员居住证申领", category: "户籍", materials: ["身份证", "居住证明", "就业证明"], steps: ["在线填报", "材料审核", "制证", "邮寄送达"], duration: "7个工作日", fee: "免费", onlineAvailable: true },
      { id: "ps2", name: "新生儿落户", description: "新生儿户口登记（一件事联办）", category: "户籍", materials: ["出生医学证明", "父母身份证", "结婚证"], steps: ["填报信息", "户籍登记", "医保参保", "社保卡申领"], duration: "5个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d4", deptName: "医保局", deptIcon: "HeartPulse", deptColor: "#059669",
    services: [
      { id: "mi1", name: "医保报销", description: "门诊及住院医疗费用报销", category: "医疗", materials: ["医保卡", "医疗费用清单", "诊断证明"], steps: ["提交报销申请", "费用审核", "报销款到账"], duration: "15个工作日", fee: "免费", onlineAvailable: true },
      { id: "mi2", name: "异地就医备案", description: "异地就医直接结算备案登记", category: "医疗", materials: ["身份证", "医保卡", "居住证明"], steps: ["在线备案", "选择就医地", "备案生效"], duration: "即时", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d5", deptName: "教育局", deptIcon: "GraduationCap", deptColor: "#D97706",
    services: [
      { id: "ed1", name: "义务教育入学报名", description: "适龄儿童义务教育入学报名", category: "教育", materials: ["户口本", "房产证/租房合同", "出生证明"], steps: ["信息填报", "学区审核", "录取通知"], duration: "30个工作日", fee: "免费", onlineAvailable: true },
      { id: "ed2", name: "教师资格认定", description: "中小学教师资格认定", category: "教育", materials: ["身份证", "学历证明", "普通话证书", "体检表"], steps: ["在线申报", "材料审核", "认定发证"], duration: "20个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d6", deptName: "交警支队", deptIcon: "Car", deptColor: "#0891B2",
    services: [
      { id: "tr1", name: "车辆年检预约", description: "机动车年度检验预约", category: "交通", materials: ["行驶证", "交强险保单"], steps: ["选择检测站", "预约时间", "到站检验", "领取标志"], duration: "1个工作日", fee: "检测费", onlineAvailable: true },
      { id: "tr2", name: "驾驶证换证", description: "驾驶证期满/损毁换证", category: "交通", materials: ["身份证", "原驾驶证", "体检表", "照片"], steps: ["在线申请", "体检", "制证", "邮寄"], duration: "3个工作日", fee: "工本费10元", onlineAvailable: true },
    ],
  },
  {
    deptId: "d7", deptName: "自然资源局", deptIcon: "Home", deptColor: "#B45309",
    services: [
      { id: "nr1", name: "不动产登记", description: "房屋等不动产登记办理", category: "住建", materials: ["身份证", "购房合同", "契税完税证明"], steps: ["提交申请", "权属审核", "登簿", "发证"], duration: "5个工作日", fee: "登记费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d8", deptName: "税务局", deptIcon: "Receipt", deptColor: "#4338CA",
    services: [
      { id: "tx1", name: "个人所得税申报", description: "年度个人所得税汇算清缴", category: "税务", materials: ["身份证", "收入证明", "专项附加扣除凭证"], steps: ["登录申报", "填写信息", "计算税额", "提交申报"], duration: "即时", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d9", deptName: "民政局", deptIcon: "Heart", deptColor: "#E11D48",
    services: [
      { id: "ca1", name: "婚姻登记预约", description: "结婚/离婚登记预约", category: "民政", materials: ["身份证", "户口本", "照片"], steps: ["在线预约", "到现场办理", "领取证书"], duration: "1个工作日", fee: "免费", onlineAvailable: true },
      { id: "ca2", name: "低保申请", description: "城乡居民最低生活保障申请", category: "民政", materials: ["身份证", "收入证明", "家庭财产申报"], steps: ["提交申请", "入户调查", "民主评议", "审批公示"], duration: "30个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
  {
    deptId: "d10", deptName: "市场监管局", deptIcon: "Briefcase", deptColor: "#65A30D",
    services: [
      { id: "mk1", name: "营业执照办理", description: "企业/个体工商户营业执照", category: "商务", materials: ["身份证", "经营场所证明", "公司章程"], steps: ["名称预审", "提交材料", "审核发证"], duration: "3个工作日", fee: "免费", onlineAvailable: true },
    ],
  },
]

export const serviceRecords: ServiceRecord[] = [
  { id: "r1", serviceName: "社保缴费查询", dept: "人社局", status: "completed", date: "2026-06-08", category: "社保" },
  { id: "r2", serviceName: "公积金提取", dept: "公积金中心", status: "processing", date: "2026-06-07", category: "公积金" },
  { id: "r3", serviceName: "居住证续签", dept: "公安局", status: "completed", date: "2026-06-05", category: "户籍" },
  { id: "r4", serviceName: "医保报销", dept: "医保局", status: "completed", date: "2026-06-01", category: "医疗" },
  { id: "r5", serviceName: "车辆年检预约", dept: "交警支队", status: "failed", date: "2026-05-28", category: "交通" },
  { id: "r6", serviceName: "营业执照年审", dept: "市场监管局", status: "processing", date: "2026-05-25", category: "商务" },
  { id: "r7", serviceName: "不动产登记", dept: "自然资源局", status: "completed", date: "2026-05-20", category: "住建" },
  { id: "r8", serviceName: "个税汇算清缴", dept: "税务局", status: "completed", date: "2026-05-15", category: "税务" },
]

export const offlinePackages: OfflinePackage[] = [
  { id: "off1", name: "社保参保证明", description: "离线查看社保参保电子证明", size: "2.3MB", version: "v2.1", updatedAt: "2026-06-01", downloaded: true },
  { id: "off2", name: "公积金办事指南", description: "公积金提取、贷款等办事指南", size: "1.8MB", version: "v3.0", updatedAt: "2026-05-28", downloaded: true },
  { id: "off3", name: "户籍办理指南", description: "落户、居住证、身份证等办理指南", size: "3.1MB", version: "v1.5", updatedAt: "2026-05-20", downloaded: false },
  { id: "off4", name: "医保报销手册", description: "医保报销流程及材料清单", size: "2.7MB", version: "v2.0", updatedAt: "2026-05-15", downloaded: false },
]
