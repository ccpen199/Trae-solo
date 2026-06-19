import type {
  User,
  Department,
  ServiceItem,
  ApplicationCase,
  Certificate,
  AuditLog,
  ServiceMonitor,
  HeatmapData,
  StatsOverview,
  PendingApproval,
  CertCategory,
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
  { id: "d011", name: "市自然资源和规划局", code: "ZRJ", contactPhone: "0512-57300011", serviceCount: 52 },
  { id: "d012", name: "市生态环境局", code: "HBJ", contactPhone: "0512-57300012", serviceCount: 35 },
  { id: "d013", name: "市农业农村局", code: "NYJ", contactPhone: "0512-57300013", serviceCount: 28 },
  { id: "d014", name: "市水务局", code: "SWUJ", contactPhone: "0512-57300014", serviceCount: 24 },
  { id: "d015", name: "市商务局", code: "SWU2J", contactPhone: "0512-57300015", serviceCount: 30 },
  { id: "d016", name: "市文化广电和旅游局", code: "WLJ", contactPhone: "0512-57300016", serviceCount: 26 },
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
  government: ["d001", "d009", "d010", "d011", "d008", "d004", "d003", "d005", "d012", "d013", "d014", "d015", "d016"],
  medical: ["d003"],
  traffic: ["d004", "d001"],
  education: ["d005"],
  lifestyle: ["d007", "d008"],
};

const govServiceDeptMap: Record<string, string> = {
  "身份证补办": "d001", "身份证首次申领": "d001", "临时身份证办理": "d001",
  "户籍迁移": "d001", "居住证签注": "d001", "户口簿补办": "d001", "户口登记项目变更": "d001",
  "出生登记": "d001", "死亡注销": "d001", "迁出登记": "d001", "迁入登记": "d001", "分户立户": "d001",
  "公章刻制备案": "d001", "公章刻制审批": "d001", "保安服务许可": "d001",
  "旅馆业特种许可": "d001", "网吧经营许可": "d001", "印刷经营许可": "d001",

  "营业执照办理": "d009", "企业设立登记": "d009", "企业变更登记": "d009", "企业注销登记": "d009",
  "个体工商户注册": "d009", "农民专业合作社登记": "d009",
  "食品经营许可证": "d009", "餐饮服务许可": "d009", "药品经营许可": "d009",
  "医疗器械经营许可": "d009", "化妆品生产许可": "d009", "特种设备使用登记": "d009",
  "民非单位登记": "d009", "社会组织评估": "d009", "基金会设立审批": "d009",
  "慈善信托备案": "d009", "志愿者注册": "d009",
  "典当行设立审批": "d009", "拍卖企业设立审批": "d009",
  "劳务派遣许可": "d009", "人力资源服务许可": "d009",
  "出版物零售许可": "d009",

  "进出口经营权": "d010", "外商投资备案": "d010", "跨境电商备案": "d010",
  "对外贸易经营者备案": "d010", "加工贸易审批": "d010",

  "不动产权证办理": "d011", "不动产抵押登记": "d011", "不动产变更登记": "d011",
  "不动产注销登记": "d011", "不动产查封登记": "d011", "不动产预告登记": "d011",
  "林木采伐许可": "d011", "采矿权审批": "d011",

  "建筑工程施工许可": "d008", "商品房预售许可": "d008", "房屋租赁备案": "d008",
  "物业资质审批": "d008", "房地产估价机构备案": "d008", "测绘资质审批": "d008",
  "建筑工程规划许可": "d008", "施工图审查": "d008", "竣工验收备案": "d008",
  "消防设计审查": "d008", "消防验收": "d008",

  "道路运输经营许可": "d004", "客运经营许可": "d004", "货运经营许可": "d004",
  "驾校经营许可": "d004", "港口经营许可": "d004", "水路运输许可": "d004",

  "医疗机构执业许可": "d003", "诊所设立审批": "d003", "中医诊所备案": "d003",
  "药店开设审批": "d003", "母婴保健服务许可": "d003", "放射诊疗许可": "d003",

  "民办学校设立审批": "d005", "培训机构审批": "d005", "校车使用许可": "d005",
  "幼儿园设立审批": "d005", "留学中介资质": "d005",

  "环评审批": "d012", "排污许可": "d012", "危险废物经营许可": "d012",
  "辐射安全许可": "d012", "建设项目环保验收": "d012",

  "取水许可": "d014", "河道采砂许可": "d014", "水域滩涂养殖证": "d014",

  "宗教活动场所登记": "d007",
};

const serviceNames: Record<ServiceDomain, string[]> = {
  livelihood: [
    "社保卡申领", "养老金资格认证", "低保申请", "公租房申请", "残疾人证办理",
    "老年人优待证办理", "失业登记", "就业困难人员认定", "医疗救助申请", "临时救助",
    "住房公积金提取", "住房公积金贷款", "住房补贴申请", "经济适用房申请", "廉租房申请",
    "生育登记", "独生子女证补办", "孤儿基本生活保障", "特困人员供养", "受灾人员救助",
    "流浪乞讨人员救助", "法律援助申请", "慈善捐赠登记", "志愿服务登记", "社区服务登记",
    "社保关系转移", "社保缴费证明", "工伤保险认定", "生育保险报销", "大病医保申请",
    "长期护理保险", "居家养老服务", "养老机构入住申请", "适老化改造申请", "养老补贴申领",
    "残疾人康复服务", "残疾人就业帮扶", "无障碍设施改造", "残疾人辅助器具", "精神障碍社区康复",
    "优抚对象认定", "退役军人安置", "退役军人创业贷款", "军属优待", "烈士褒扬",
    "儿童福利申请", "收养登记", "婚姻登记", "殡葬服务", "社会工作者登记",
    "社工考试报名", "社会组织登记", "慈善组织认定", "募捐资格申请", "福利企业认定",
    "流浪犬管理", "社区矫治", "安置帮教", "人民调解", "公证服务预约",
    "司法鉴定预约", "劳动仲裁申请", "劳动监察投诉", "农民工工资维权", "信访登记",
    "低保边缘家庭认定", "支出型贫困认定", "困难职工帮扶", "职工医疗互助", "职工大病补助",
    "人才公寓申请", "新市民积分管理", "居住证申领", "积分入户", "积分入学",
    "就业创业证办理", "创业担保贷款", "创业补贴申领", "就业见习申请", "公益性岗位申请",
    "职业技能鉴定", "职业培训补贴", "技能提升补贴", "稳岗返还申请", "失业保险金申领",
  ],
  government: [
    "身份证补办", "户籍迁移", "营业执照办理", "食品经营许可证", "不动产权证办理",
    "建筑工程施工许可", "道路运输经营许可", "医疗机构执业许可", "民办学校设立审批", "公章刻制备案",
    "身份证首次申领", "临时身份证办理", "居住证签注", "户口簿补办", "户口登记项目变更",
    "出生登记", "死亡注销", "迁出登记", "迁入登记", "分户立户",
    "企业设立登记", "企业变更登记", "企业注销登记", "个体工商户注册", "农民专业合作社登记",
    "餐饮服务许可", "药品经营许可", "医疗器械经营许可", "化妆品生产许可", "特种设备使用登记",
    "不动产抵押登记", "不动产变更登记", "不动产注销登记", "不动产查封登记", "不动产预告登记",
    "商品房预售许可", "房屋租赁备案", "物业资质审批", "房地产估价机构备案", "测绘资质审批",
    "建筑工程规划许可", "施工图审查", "竣工验收备案", "消防设计审查", "消防验收",
    "客运经营许可", "货运经营许可", "驾校经营许可", "港口经营许可", "水路运输许可",
    "诊所设立审批", "中医诊所备案", "药店开设审批", "母婴保健服务许可", "放射诊疗许可",
    "民非单位登记", "培训机构审批", "校车使用许可", "幼儿园设立审批", "留学中介资质",
    "保安服务许可", "典当行设立审批", "拍卖企业设立审批", "劳务派遣许可", "人力资源服务许可",
    "旅馆业特种许可", "公章刻制审批", "网吧经营许可", "印刷经营许可", "出版物零售许可",
    "进出口经营权", "外商投资备案", "跨境电商备案", "对外贸易经营者备案", "加工贸易审批",
    "环评审批", "排污许可", "危险废物经营许可", "辐射安全许可", "建设项目环保验收",
    "林木采伐许可", "采矿权审批", "取水许可", "河道采砂许可", "水域滩涂养殖证",
    "宗教活动场所登记", "社会组织评估", "基金会设立审批", "慈善信托备案", "志愿者注册",
  ],
  medical: [
    "三甲医院预约挂号", "医保异地就医备案", "健康体检预约", "儿童疫苗接种预约", "医保报销",
    "电子健康档案查询", "慢性病管理申请", "孕产妇保健服务", "精神卫生服务", "职业病诊断",
    "社区卫生中心挂号", "中医医院预约", "口腔医院预约", "眼科医院预约", "妇幼保健院预约",
    "医保个人账户查询", "医保门诊报销", "医保住院报销", "医保大病报销", "医保异地结算",
    "医保关系转移", "医保退休办理", "医保缴费补缴", "医保门特申请", "医保门慢申请",
    "出生证办理", "预防接种证补办", "疫苗查询", "狂犬疫苗预约", "HPV疫苗预约",
    "流感疫苗预约", "新冠疫苗接种", "老年人免费体检", "儿童健康检查", "产前筛查",
    "新生儿筛查", "婚前检查预约", "产前检查预约", "孕前优生检查", "计划生育服务",
    "心理咨询预约", "精神障碍门诊", "药物维持治疗", "心理危机干预", "睡眠障碍门诊",
    "职业病健康检查", "职业病史查询", "工伤康复申请", "劳动能力鉴定", "伤残等级评定",
    "家庭医生签约", "慢病随访管理", "高血压管理", "糖尿病管理", "冠心病管理",
    "脑卒中管理", "慢阻肺管理", "肿瘤筛查预约", "两癌筛查", "大肠癌筛查",
    "120急救呼叫", "急救知识培训", "AED网点查询", "无偿献血预约", "造血干细胞登记",
    "器官捐献登记", "遗体捐献登记", "中医体质辨识", "膏方门诊预约", "针灸推拿预约",
    "康复治疗预约", "康复评定", "残疾评定", "护理院预约", "临终关怀预约",
    "处方查询", "检查报告查询", "住院日清单查询", "门诊费用查询", "医保目录查询",
    "药品价格查询", "医疗机构查询", "医生资质查询", "护士执业注册查询", "医疗事故鉴定",
  ],
  traffic: [
    "机动车号牌选号", "驾驶证期满换证", "违章查询处理", "公交卡充值", "停车费缴纳",
    "网约车驾驶员证办理", "道路运输证年审", "电动自行车上牌", "实时公交查询", "出租车投诉",
    "机动车注册登记", "机动车变更登记", "机动车转移登记", "机动车注销登记", "机动车年检",
    "补领机动车号牌", "换领机动车号牌", "补领行驶证", "换领行驶证", "机动车抵押登记",
    "驾驶证初次申领", "驾驶证增加准驾", "驾驶证补证", "驾驶证审验", "驾驶证降级换证",
    "满分学习申请", "交通违法罚款缴纳", "交通违法申诉", "事故快速理赔", "事故责任认定",
    "公交IC卡办理", "公交IC卡挂失", "公交路线查询", "地铁卡充值", "地铁站点查询",
    "停车场查询", "停车费包月", "路侧停车缴费", "充电桩查询", "加油站查询",
    "出租车从业资格", "网约车运输证", "出租车服务质量投诉", "黑车举报", "交通拥堵查询",
    "客运站购票", "火车票查询", "航班查询", "轮渡时刻表", "长途客运查询",
    "道路运输从业资格证", "货运车辆年审", "客运车辆年审", "危险品运输许可", "超限运输许可",
    "校车标牌核发", "教练车标识", "驾校报名查询", "科目考试预约", "考试成绩查询",
    "高速公路通行费", "ETC办理", "ETC充值", "ETC发票", "高速路况查询",
    "交通管制公告", "道路施工信息", "限行信息查询", "单行道查询", "禁停区查询",
    "交通事故理赔", "车辆保险查询", "交强险缴纳", "商业险投保", "车辆过户保险",
    "非机动车登记", "共享单车查询", "电动自行车充电", "电动自行车保险", "滑板车合规查询",
  ],
  education: [
    "小学入学报名", "初中入学报名", "高中学籍查询", "成人高考报名", "教师资格认定",
    "普通话水平测试", "自学考试报名", "学历认证", "校园招聘信息", "学生资助申请",
    "幼儿园入园报名", "幼升小信息采集", "小升初报名", "中考报名", "高考报名",
    "中考成绩查询", "高考成绩查询", "中考录取查询", "高考录取查询", "学业水平考试",
    "研究生考试报名", "公务员考试报名", "事业单位招聘", "教师招聘报名", "社区工作者招聘",
    "职业院校报名", "技工学校报名", "中专招生报名", "函授教育报名", "网络教育报名",
    "学籍异动办理", "转学申请", "休学申请", "复学申请", "退学申请",
    "毕业证书查询", "学位证书查询", "成绩单查询", "学历验证报告", "学位验证报告",
    "校园卡充值", "图书馆借阅", "校历查询", "课程表查询", "成绩查询",
    "奖学金申请", "助学金申请", "助学贷款申请", "勤工助学申请", "困难补助申请",
    "教育费减免", "学费减免申请", "住宿费减免", "教材费补贴", "交通补贴申请",
    "校外培训备案", "培训机构查询", "培训合同备案", "培训费用监管", "培训退费申请",
    "英语四六级报名", "计算机等级报名", "会计职称报名", "建造师报名", "护士执业报名",
    "执业医师报名", "执业药师报名", "法律职业资格报名", "注册会计师报名", "教师资格证报名",
    "心理咨询师报名", "营养师报名", "消防工程师报名", "安全工程师报名", "监理工程师报名",
    "书法等级考试", "美术等级考试", "音乐等级考试", "舞蹈等级考试", "编程等级考试",
  ],
  lifestyle: [
    "图书馆读者证办理", "体育场馆预订", "水电费缴纳", "燃气费缴纳", "有线电视缴费",
    "旅游年卡办理", "天气预报查询", "社区活动报名", "公共厕所查询", "垃圾分类指导",
    "文化馆活动报名", "博物馆预约参观", "美术馆预约参观", "科技馆预约", "图书馆座位预约",
    "游泳馆购票", "篮球场预订", "足球场预订", "羽毛球馆预订", "网球场预订",
    "健身房年卡办理", "瑜伽课程报名", "武术培训报名", "太极拳培训", "广场舞活动",
    "电费缴纳", "水费缴纳", "宽带费缴纳", "物业费缴纳", "暖气费缴纳",
    "公园门票预约", "古镇景区预约", "周庄古镇门票", "锦溪古镇门票", "千灯古镇门票",
    "亭林园门票", "阳澄湖旅游预约", "淀山湖旅游预约", "花桥游预约", "乡村游预约",
    "结婚登记预约", "婚前辅导预约", "婚姻家庭咨询", "亲子活动报名", "老年大学报名",
    "志愿者注册", "志愿活动报名", "志愿时长查询", "慈善捐赠", "公益项目参与",
    "宠物登记", "疫苗接种点查询", "发热门诊查询", "核酸检测点查询", "健康证办理",
    "房屋修缮申请", "管道维修预约", "家电维修预约", "开锁服务预约", "搬家服务预约",
    "快递代收点查询", "邮政服务查询", "银行网点查询", "ATM机查询", "社保卡挂失",
    "身份证拍照点", "证件照拍摄", "翻译服务预约", "复印打印服务", "快递寄送服务",
    "超市团购", "农贸市场查询", "菜价查询", "药品配送", "外卖服务查询",
    "24小时自助服务", "市民卡充值", "市民卡挂失", "市民卡查询", "公共自行车租借",
    "共享汽车租借", "充电宝租借", "共享雨伞租借", "停车场月卡", "路侧停车优惠",
  ],
};

function generateServices(): ServiceItem[] {
  const districts = [
    "全市通办", "昆山开发区", "昆山高新区", "花桥经济开发区", "张浦镇", "周市镇", "陆家镇", "巴城镇", "千灯镇", "淀山湖镇", "周庄镇", "锦溪镇",
  ];
  const services: ServiceItem[] = [];
  let id = 1;
  (Object.keys(domainMap) as ServiceDomain[]).forEach((domain) => {
    const names = serviceNames[domain];
    const depts = deptByDomain[domain];
    names.forEach((name, idx) => {
      const subIdx = idx % domainMap[domain].sub.length;
      let deptId: string;
      if (domain === "government" && govServiceDeptMap[name]) {
        deptId = govServiceDeptMap[name];
      } else {
        deptId = depts[idx % depts.length];
      }
      const authRand = idx % 10;
      const authLevel: "L1" | "L2" | "L3" =
        authRand < 4 ? "L1" : authRand < 8 ? "L2" : "L3";
      const userTypes: ("citizen" | "enterprise" | "admin")[] =
        domain === "government"
          ? (idx % 3 === 0 ? ["enterprise"] : idx % 3 === 1 ? ["citizen", "enterprise"] : ["citizen"])
          : domain === "lifestyle"
          ? (idx % 2 === 0 ? ["citizen"] : ["citizen", "enterprise"])
          : ["citizen"];
      const district = idx % 12 === 0
        ? ["全市通办"]
        : ["全市通办", districts[(idx * 3) % (districts.length - 1) + 1], districts[(idx * 5 + 2) % (districts.length - 1) + 1]];
      services.push({
        id: `s${String(id).padStart(4, "0")}`,
        name,
        category: domain,
        categoryName: domainMap[domain].name,
        subCategory: domainMap[domain].sub[subIdx],
        department: mockDepartments.find((d) => d.id === deptId)!.name,
        departmentId: deptId,
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
          { id: `p${id}3`, name: "业务审核", description: "业务科室进行实质性审查", estimatedDays: 2 + (idx % 3), department: mockDepartments.find((d) => d.id === deptId)!.name },
          { id: `p${id}4`, name: "结果送达", description: "通过电子证照或邮寄方式送达", estimatedDays: 1, department: "受理部门" },
        ],
        onlineAvailable: true,
        appointmentAvailable: idx % 4 !== 0,
        status: idx % 25 === 0 ? "maintenance" : "online",
        viewCount: 1000 + Math.floor(Math.random() * 50000),
        applyCount: 100 + Math.floor(Math.random() * 10000),
        satisfactionRate: 92 + Math.random() * 7,
        authLevel,
        userType: userTypes,
        district,
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

export const certificateCategories: CertCategory[] = [
  { code: "ID", name: "身份证件类", group: "identity", count: 23, description: "居民身份证、户口本、护照、港澳台居住证等身份凭证", requiredAuthLevel: "L3", canDelegate: false },
  { code: "FAM", name: "家庭亲属类", group: "family", count: 46, description: "结婚证、离婚证、出生医学证明、收养登记证、亲属关系证明等", requiredAuthLevel: "L3", canDelegate: false },
  { code: "HOU", name: "住房不动产类", group: "housing", count: 52, description: "不动产权证书、房屋所有权证、宅基地证、不动产登记证明等", requiredAuthLevel: "L3", canDelegate: true },
  { code: "SOC", name: "社会保障类", group: "social", count: 67, description: "社会保障卡、养老保险、医疗保险、失业保险、公积金证明等", requiredAuthLevel: "L2", canDelegate: true },
  { code: "EDU", name: "学历学位类", group: "education", count: 35, description: "毕业证、学位证、学历认证报告、教师资格证、职业资格证书等", requiredAuthLevel: "L2", canDelegate: true },
  { code: "MED", name: "医疗健康类", group: "medical", count: 41, description: "执业医师证、护士执业证、出生证、死亡证明、预防接种证等", requiredAuthLevel: "L2", canDelegate: true },
  { code: "TRA", name: "交通运输类", group: "traffic", count: 48, description: "机动车行驶证、驾驶证、道路运输证、船舶登记证、网约车证等", requiredAuthLevel: "L2", canDelegate: true },
  { code: "BUS", name: "市场主体类", group: "business", count: 58, description: "营业执照、食品经营许可证、药品经营许可证、统一社会信用代码证等", requiredAuthLevel: "L2", canDelegate: true },
  { code: "FIN", name: "税务金融类", group: "finance", count: 21, description: "税务登记证、完税证明、社保缴纳证明、银行开户许可证等", requiredAuthLevel: "L3", canDelegate: true },
  { code: "OTH", name: "其他证照类", group: "other", count: 16, description: "各类专项许可证、涉外证件、临时性审批文件等", requiredAuthLevel: "L2", canDelegate: true },
];

export const certificateCatalog = (() => {
  const list: {
    typeName: string;
    typeCode: string;
    categoryCode: CertCategory["code"];
    issueAuthority: string;
    handlingTime: string;
    permissionScope: "private" | "government" | "public";
  }[] = [];
  const samples: Record<string, string[][]> = {
    ID: [["居民身份证", "ID_CARD", "昆山市公安局"], ["居民户口簿", "HOUSEHOLD", "昆山市公安局"], ["中华人民共和国护照", "PASSPORT", "江苏省公安厅"], ["港澳居民来往内地通行证", "HOMETOWN", "国家移民管理局"], ["台湾居民来往大陆通行证", "TAIWAN", "国家移民管理局"], ["外国人永久居留身份证", "FOREIGN_PERM", "国家移民管理局"], ["居住证", "RESIDENCE", "昆山市公安局"]],
    FAM: [["结婚证", "MARRIAGE", "昆山市民政局"], ["离婚证", "DIVORCE", "昆山市民政局"], ["出生医学证明", "BIRTH_CERT", "昆山市卫健委"], ["收养登记证", "ADOPTION", "昆山市民政局"], ["独生子女父母光荣证", "ONLY_CHILD", "昆山市卫健委"], ["亲属关系公证书", "KINSHIP", "昆山市公证处"]],
    HOU: [["不动产权证书", "REAL_ESTATE", "昆山市自然资源和规划局"], ["国有土地使用证", "LAND_USE", "昆山市自然资源和规划局"], ["房屋所有权证", "HOUSE_OWNERSHIP", "昆山市住建局"], ["宅基地使用证", "HOUSESITE", "昆山市农业农村局"], ["商品房预售许可证", "PRE_SALE", "昆山市住建局"], ["房屋租赁登记备案证明", "RENTAL_REG", "昆山市住建局"]],
    SOC: [["中华人民共和国社会保障卡", "SOCIAL_SEC_CARD", "昆山市人社局"], ["职工基本养老保险参保缴费凭证", "PENSION_PROOF", "昆山市人社局"], ["基本医疗保险参保凭证", "MEDICAL_PROOF", "昆山市医保局"], ["住房公积金缴存证明", "HOUSING_FUND", "苏州市住房公积金中心昆山分中心"], ["失业保险金领取证明", "UNEMPLOY_PROOF", "昆山市人社局"], ["工伤认定决定书", "WORK_INJURY", "昆山市人社局"]],
    EDU: [["普通高等学校毕业证书", "GRADUATE_CERT", "教育部"], ["学士学位证书", "BACHELOR", "教育部"], ["教师资格证书", "TEACHER_QUAL", "江苏省教育厅"], ["注册会计师证书", "CPA", "财政部"], ["法律职业资格证书", "LAW_BAR", "司法部"], ["普通话水平测试等级证书", "PUTONGHUA", "国家语委"]],
    MED: [["医师资格证书", "DOCTOR_QUAL", "国家卫健委"], ["医师执业证书", "DOCTOR_LICENSE", "昆山市卫健委"], ["护士执业证书", "NURSE_LICENSE", "昆山市卫健委"], ["出生医学证明副页", "BIRTH_COPY", "昆山市卫健委"], ["预防接种证", "VACCINE", "昆山市疾控中心"], ["死亡医学证明", "DEATH_CERT", "昆山市卫健委"]],
    TRA: [["中华人民共和国机动车驾驶证", "DRIVER_LICENSE", "苏州市公安局交通警察支队"], ["机动车行驶证", "VEHICLE_LICENSE", "苏州市公安局交通警察支队"], ["道路运输经营许可证", "ROAD_TRANS", "昆山市交通运输局"], ["网络预约出租汽车运输证", "RIDE_HAIL", "昆山市交通运输局"], ["船舶登记证书", "SHIP_REG", "江苏省海事局"], ["机动车登记证书", "VEHICLE_REG", "苏州市公安局交通警察支队"]],
    BUS: [["营业执照", "BUSINESS_LICENSE", "昆山市市场监督管理局"], ["食品经营许可证", "FOOD_BIZ", "昆山市市场监督管理局"], ["药品经营许可证", "DRUG_BIZ", "昆山市市场监督管理局"], ["医疗器械经营许可证", "MED_DEVICE", "江苏省药监局"], ["民办非企业单位登记证书", "NGO", "昆山市民政局"], ["烟草专卖零售许可证", "TOBACCO", "苏州市烟草专卖局"]],
    FIN: [["税务登记证", "TAX_REG", "国家税务总局昆山市税务局"], ["个人所得税完税证明", "TAX_PROOF", "国家税务总局昆山市税务局"], ["增值税一般纳税人资格登记表", "VAT_GEN", "国家税务总局昆山市税务局"], ["银行开户许可证", "BANK_OPEN", "中国人民银行"], ["单位社会保险费缴费证明", "UNIT_SOCIAL", "昆山市人社局"], ["企业征信报告", "CREDIT", "中国人民银行征信中心"]],
    OTH: [["中华人民共和国残疾人证", "DISABLED", "昆山市残联"], ["军人残疾证", "SOLDIER_DIS", "退役军人事务部"], ["老年优待证", "ELDER", "昆山市老龄办"], ["无偿献血证", "BLOOD_DONOR", "苏州市中心血站"], ["志愿者服务记录证", "VOLUNTEER", "昆山市文明办"], ["电子驾驶证明", "E_DRIVER_PROOF", "苏州市公安局"]],
  };
  const defaultTimes = ["1个工作日", "3个工作日", "5个工作日", "7个工作日", "10个工作日", "15个工作日", "20个工作日", "即办"];
  const scopes: ("private" | "government" | "public")[] = ["private", "private", "government", "government", "private", "public"];
  let seed = 1;
  for (const cat of certificateCategories) {
    const rows = samples[cat.code] || [];
    for (let i = 0; i < rows.length; i++) {
      const [n, c, a] = rows[i];
      list.push({
        typeName: n,
        typeCode: c,
        categoryCode: cat.code,
        issueAuthority: a,
        handlingTime: defaultTimes[(seed + i) % defaultTimes.length],
        permissionScope: scopes[(seed + i) % scopes.length],
      });
      seed++;
    }
  }
  return list;
})();

export const mockCertificates: Certificate[] = [
  {
    id: "cert001",
    type: "居民身份证",
    typeCode: "ID_CARD",
    categoryCode: "ID",
    certNo: "3205**********1234",
    holderName: "张伟",
    issueDate: "2024-05-25",
    expireDate: "2044-05-25",
    issueAuthority: "昆山市公安局",
    issuerCode: "KS_GAJ_001",
    status: "valid",
    color: "from-gov-600 to-gov-800",
    authLevel: "L3",
    permission: {
      scope: "government",
      description: "仅限政府部门在办理政务服务时核验公民身份",
      allowedDepts: ["昆山市公安局", "昆山市人社局", "昆山市医保局", "昆山市自然资源和规划局", "昆山市市场监督管理局"],
      requireConsent: true,
      expireHours: 2,
    },
    verificationCount: 128,
    lastVerifiedAt: "2024-06-16 14:32:10",
    delegateCount: 0,
    fields: {
      姓名: "张伟",
      性别: "男",
      民族: "汉族",
      "出生日期": "1988年03月15日",
      住址: "江苏省昆山市玉山镇前进中路888号",
      签发机关: "昆山市公安局",
      有效期限: "2024.05.25-2044.05.25",
    },
    usageHistory: [
      { id: "ur1", time: "2024-06-16 14:32:10", verifier: "王审核员", verifierDept: "昆山市人社局", purpose: "办理社保增员核验公民身份", authMethod: "face", result: "success", ip: "10.28.67.12", scope: "verify" },
      { id: "ur2", time: "2024-06-10 09:15:42", verifier: "孙受理", verifierDept: "昆山市不动产登记中心", purpose: "不动产权属转移身份证明", authMethod: "sso", result: "success", ip: "10.35.18.201", scope: "verify" },
      { id: "ur3", time: "2024-06-01 16:08:15", verifier: "李柜员", verifierDept: "苏州商业银行昆山支行", purpose: "个人账户开户身份核验", authMethod: "sms", result: "success", ip: "180.108.144.28", scope: "verify" },
      { id: "ur4", time: "2024-05-28 11:50:33", verifier: "赵审核", verifierDept: "昆山市医保局", purpose: "医疗保险异地就医备案核验", authMethod: "face", result: "success", ip: "10.15.77.88", scope: "read" },
      { id: "ur5", time: "2024-05-20 10:22:08", verifier: "钱科员", verifierDept: "昆山市公安局", purpose: "补办身份证人像比对", authMethod: "face", result: "success", ip: "10.12.5.14", scope: "verify" },
      { id: "ur6", time: "2024-05-01 02:15:47", verifier: "未知IP", verifierDept: "非授权访问", purpose: "异常读取尝试", authMethod: "password", result: "denied", ip: "45.134.22.109", scope: "read" },
    ],
  },
  {
    id: "cert002",
    type: "社会保障卡",
    typeCode: "SOCIAL_CARD",
    categoryCode: "SOC",
    certNo: "KSSB**********7890",
    holderName: "张伟",
    issueDate: "2020-03-10",
    expireDate: "2030-03-10",
    issueAuthority: "昆山市人力资源和社会保障局",
    issuerCode: "KS_RSJ_002",
    status: "valid",
    color: "from-success-600 to-success-800",
    authLevel: "L2",
    permission: {
      scope: "government",
      description: "人力资源和社会保障服务事项核验使用",
      allowedDepts: ["昆山市人社局", "昆山市医保局", "定点医疗机构", "定点零售药店"],
      requireConsent: true,
      expireHours: 4,
    },
    verificationCount: 342,
    lastVerifiedAt: "2024-06-17 10:12:35",
    delegateCount: 0,
    fields: {
      持卡人姓名: "张伟",
      社会保障号码: "3205**********1234",
      卡号: "KSSB**********7890",
      发卡日期: "2020年03月10日",
      有效期至: "2030年03月10日",
      发卡机构: "昆山市人力资源和社会保障局",
    },
    usageHistory: [
      { id: "c2h1", time: "2024-06-17 10:12:35", verifier: "市第一人民医院", verifierDept: "昆山市第一人民医院", purpose: "门诊医保实时结算", authMethod: "sso", result: "success", ip: "10.8.12.45", scope: "verify" },
      { id: "c2h2", time: "2024-06-15 14:45:20", verifier: "同德堂药房", verifierDept: "定点零售药店", purpose: "医保个人账户购药", authMethod: "sms", result: "success", ip: "10.45.80.221", scope: "verify" },
      { id: "c2h3", time: "2024-06-10 08:30:10", verifier: "市社保中心", verifierDept: "昆山市人社局", purpose: "养老保险资格认证", authMethod: "face", result: "success", ip: "10.22.6.88", scope: "verify" },
      { id: "c2h4", time: "2024-06-05 16:02:18", verifier: "市医保中心", verifierDept: "昆山市医保局", purpose: "异地就医备案核验", authMethod: "sso", result: "success", ip: "10.77.15.6", scope: "read" },
    ],
  },
  {
    id: "cert003",
    type: "机动车驾驶证",
    typeCode: "DRIVER_LICENSE",
    categoryCode: "TRA",
    certNo: "3205**********1234",
    holderName: "张伟",
    issueDate: "2018-07-20",
    expireDate: "2024-07-20",
    issueAuthority: "苏州市公安局交通警察支队",
    issuerCode: "SZ_GJJ_003",
    status: "expiring",
    color: "from-warning-600 to-warning-800",
    authLevel: "L3",
    permission: {
      scope: "government",
      description: "交通管理及运输服务核验",
      allowedDepts: ["苏州市公安局交警支队", "昆山市公安局", "昆山市交通运输局", "保险公司"],
      requireConsent: true,
      expireHours: 1,
    },
    verificationCount: 87,
    lastVerifiedAt: "2024-06-16 11:38:14",
    delegateCount: 0,
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
      { id: "c3h1", time: "2024-06-16 11:38:14", verifier: "中华财险", verifierDept: "中华联合财产保险", purpose: "车辆投保驾驶人资质核验", authMethod: "sso", result: "success", ip: "61.132.88.120", scope: "verify" },
      { id: "c3h2", time: "2024-06-05 15:40:00", verifier: "市交警大队", verifierDept: "昆山市公安局", purpose: "交通违章处理", authMethod: "face", result: "success", ip: "10.55.3.14", scope: "verify" },
    ],
  },
  {
    id: "cert004",
    type: "不动产权证书",
    typeCode: "PROPERTY_CERT",
    categoryCode: "HOU",
    certNo: "苏(2023)昆山市不动产权第0012345号",
    holderName: "张伟",
    issueDate: "2023-08-15",
    expireDate: "2093-08-14",
    issueAuthority: "昆山市自然资源和规划局",
    issuerCode: "KS_GTJ_004",
    status: "valid",
    color: "from-emerald-600 to-emerald-800",
    authLevel: "L3",
    permission: {
      scope: "private",
      description: "涉及财产权，仅本人或公证授权后允许核验",
      allowedDepts: ["昆山市自然资源和规划局", "昆山市住建局", "税务局", "公证机构", "授权银行"],
      requireConsent: true,
      expireHours: 1,
    },
    verificationCount: 15,
    lastVerifiedAt: "2024-05-20 10:30:00",
    delegateCount: 2,
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
      { id: "c4h1", time: "2024-05-20 10:30:00", verifier: "建设银行昆山支行", verifierDept: "中国建设银行昆山分行", purpose: "住房抵押贷款产权核验", authMethod: "face", result: "success", ip: "221.224.15.66", scope: "verify" },
      { id: "c4h2", time: "2024-04-18 09:10:28", verifier: "不动产登记中心", verifierDept: "昆山市自然资源和规划局", purpose: "户口迁移住所核验", authMethod: "sso", result: "success", ip: "10.88.12.4", scope: "read" },
    ],
  },
  {
    id: "cert005",
    type: "营业执照",
    typeCode: "BUSINESS_LICENSE",
    categoryCode: "BUS",
    certNo: "91320583MA11223344",
    holderName: "张伟 (昆山市顺达贸易有限公司)",
    issueDate: "2021-04-01",
    expireDate: "长期",
    issueAuthority: "昆山市市场监督管理局",
    issuerCode: "KS_SCJ_005",
    status: "valid",
    color: "from-blue-600 to-blue-800",
    authLevel: "L2",
    permission: {
      scope: "public",
      description: "市场主体登记信息公开查询，企业年报公示数据",
      allowedDepts: ["所有政府部门", "金融机构", "社会公众查询"],
      requireConsent: false,
    },
    verificationCount: 568,
    lastVerifiedAt: "2024-06-18 09:56:42",
    delegateCount: 3,
    fields: {
      统一社会信用代码: "91320583MA11223344",
      企业名称: "昆山市顺达贸易有限公司",
      类型: "有限责任公司(自然人投资或控股)",
      法定代表人: "张伟",
      注册资本: "500万元整",
      成立日期: "2021年04月01日",
      营业期限: "2021年04月01日至******",
      经营范围: "日用百货、五金交电、建材销售；商务咨询服务。",
    },
    usageHistory: [
      { id: "c5h1", time: "2024-06-18 09:56:42", verifier: "供应商系统", verifierDept: "供应商B2B平台", purpose: "供应商入驻资质核验", authMethod: "sso", result: "success", ip: "120.26.45.180", scope: "read" },
      { id: "c5h2", time: "2024-06-15 15:22:08", verifier: "工商银行", verifierDept: "工商银行昆山分行", purpose: "对公账户年检", authMethod: "sso", result: "success", ip: "101.230.88.14", scope: "verify" },
      { id: "c5h3", time: "2024-06-10 11:04:50", verifier: "市税务局", verifierDept: "国家税务总局昆山市税务局", purpose: "一般纳税人资质复核", authMethod: "sso", result: "success", ip: "10.10.8.201", scope: "read" },
      { id: "c5h4", time: "2024-06-03 14:18:33", verifier: "市监局", verifierDept: "昆山市市场监督管理局", purpose: "双随机一公开检查", authMethod: "sso", result: "success", ip: "10.30.66.18", scope: "read" },
    ],
  },
  {
    id: "cert006",
    type: "出生医学证明",
    typeCode: "BIRTH_CERT",
    categoryCode: "FAM",
    certNo: "M320185674",
    holderName: "张小宝",
    issueDate: "2022-05-10",
    expireDate: "长期",
    issueAuthority: "昆山市妇幼保健院",
    issuerCode: "KS_FY_006",
    status: "valid",
    color: "from-pink-500 to-rose-600",
    authLevel: "L3",
    permission: {
      scope: "private",
      description: "未成年人敏感证件，仅限监护人持授权核验",
      allowedDepts: ["公安户籍部门", "卫健系统", "医保部门", "学校", "公证处"],
      requireConsent: true,
      expireHours: 2,
    },
    verificationCount: 8,
    lastVerifiedAt: "2024-06-02 15:06:00",
    delegateCount: 1,
    fields: {
      新生儿姓名: "张小宝",
      性别: "男",
      出生时间: "2022年05月10日15时20分",
      出生地点: "江苏省昆山市妇幼保健院",
      母亲姓名: "王芳",
      母亲身份证号: "3205**********5678",
      父亲姓名: "张伟",
      父亲身份证号: "3205**********1234",
    },
    usageHistory: [
      { id: "c6h1", time: "2024-06-02 15:06:00", verifier: "玉山镇派出所", verifierDept: "昆山市公安局", purpose: "出生落户户籍核验", authMethod: "face", result: "success", ip: "10.8.12.14", scope: "verify" },
      { id: "c6h2", time: "2023-09-01 08:45:30", verifier: "实验幼儿园", verifierDept: "昆山市教育局", purpose: "入园资格核验", authMethod: "sso", result: "success", ip: "10.60.88.55", scope: "read" },
    ],
  },
  {
    id: "cert007",
    type: "结婚证",
    typeCode: "MARRIAGE",
    categoryCode: "FAM",
    certNo: "苏苏结字012345678",
    holderName: "张伟 / 王芳",
    issueDate: "2015-10-01",
    expireDate: "长期",
    issueAuthority: "昆山市民政局",
    issuerCode: "KS_MZJ_007",
    status: "valid",
    color: "from-rose-500 to-red-600",
    authLevel: "L3",
    permission: {
      scope: "private",
      description: "婚姻登记信息，双方授权或公检法司依法调用",
      allowedDepts: ["民政系统", "公检法司", "银行贷款", "不动产登记", "公证机构"],
      requireConsent: true,
      expireHours: 2,
    },
    verificationCount: 22,
    lastVerifiedAt: "2024-05-20 10:30:00",
    delegateCount: 0,
    fields: {
      男方姓名: "张伟",
      男方身份证号: "3205**********1234",
      女方姓名: "王芳",
      女方身份证号: "3205**********5678",
      登记日期: "2015年10月01日",
      登记机关: "昆山市民政局婚姻登记处",
      结婚证字号: "苏苏结字012345678",
    },
    usageHistory: [
      { id: "c7h1", time: "2024-05-20 10:30:00", verifier: "建设银行", verifierDept: "中国建设银行昆山分行", purpose: "夫妻双方共同贷款核验", authMethod: "face", result: "success", ip: "221.224.15.66", scope: "verify" },
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
