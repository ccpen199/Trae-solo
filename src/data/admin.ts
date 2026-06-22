import type { AdminOrder, AuditRecord, AdminMerchant, TownshipDistribution } from "../types";

const avatar = (seed: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`中文社交应用用户头像，${seed}风格，简约大方`)}&image_size=square`;

const postImg = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`;

const evidenceImg = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;

export const adminOrders: AdminOrder[] = [
  {
    id: "ao001",
    orderNo: "ZX20250620001",
    source: "用户发布",
    type: "招聘",
    title: "乌峰街道某奶茶店急招店员",
    content: "镇雄乌峰街道奶茶店招营业员2名，18-30岁，月薪3500+提成，包两餐，月休4天",
    contactName: "李店长",
    contactPhone: "13812345678",
    location: { township: "乌峰街道", address: "建设路88号", lat: 27.4436, lng: 104.8735 },
    images: [postImg("中国县城奶茶店店面，招牌醒目，整洁明亮")],
    status: "已发布",
    amount: 0,
    createdAt: "2025-06-19T09:15:00Z",
    publishedAt: "2025-06-19T10:30:00Z",
    auditRecords: [
      { id: "ar001", status: "提交审核", operator: "系统", time: "2025-06-19T09:15:00Z", remark: "用户提交招聘信息" },
      { id: "ar002", status: "审核通过", operator: "审核员小王", time: "2025-06-19T10:30:00Z", remark: "信息真实完整，符合平台规范，予以发布" }
    ],
    publisher: { id: "u1001", name: "奶茶小李", avatar: avatar("温馨奶茶"), type: "user" }
  },
  {
    id: "ao002",
    orderNo: "ZX20250620002",
    source: "商户发布",
    type: "美食推荐",
    title: "泼机镇老字号羊肉粉开业大酬宾",
    content: "泼机镇老字号黑山羊羊肉粉新店开业，6月20日-6月25日全场8折，每日前50名送卤蛋一个",
    contactName: "王老板",
    contactPhone: "13987654321",
    location: { township: "泼机镇", address: "兴农路15号", lat: 27.3912, lng: 104.9153 },
    images: [postImg("云南羊肉粉美食，红汤羊肉，米粉，香菜薄荷，热气腾腾"), postImg("贵州羊肉粉店铺招牌，中式门面")],
    status: "已发布",
    amount: 200,
    createdAt: "2025-06-18T14:20:00Z",
    publishedAt: "2025-06-18T16:00:00Z",
    auditRecords: [
      { id: "ar003", status: "提交审核", operator: "系统", time: "2025-06-18T14:20:00Z", remark: "商户付费推广美食推荐" },
      { id: "ar004", status: "内容审核", operator: "审核员小张", time: "2025-06-18T15:10:00Z", remark: "图片清晰，内容真实" },
      { id: "ar005", status: "审核通过", operator: "主管老李", time: "2025-06-18T16:00:00Z", remark: "已缴纳推广费用，置顶展示3天" }
    ],
    publisher: { id: "m2001", name: "泼机羊肉粉馆", avatar: avatar("红色美食"), type: "merchant" }
  },
  {
    id: "ao003",
    orderNo: "ZX20250620003",
    source: "平台推送",
    type: "资讯投稿",
    title: "镇雄县2025年高考成绩再创佳绩",
    content: "据县教育局消息，2025年镇雄县高考一本上线人数突破1200人，较去年增长15%，其中镇雄一中一本上线率达78%",
    contactName: "教育局宣传科",
    contactPhone: "0870-3123456",
    location: { township: "乌峰街道", address: "县行政中心", lat: 27.4400, lng: 104.8700 },
    images: [postImg("中国高中校园，教学楼，学生们在校园里，阳光明媚")],
    status: "已发布",
    amount: 0,
    createdAt: "2025-06-23T08:00:00Z",
    publishedAt: "2025-06-23T09:00:00Z",
    auditRecords: [
      { id: "ar006", status: "提交审核", operator: "系统", time: "2025-06-23T08:00:00Z", remark: "平台合作单位投稿" },
      { id: "ar007", status: "审核通过", operator: "审核员小王", time: "2025-06-23T09:00:00Z", remark: "官方资讯，已核实数据来源，紧急发布" }
    ],
    publisher: { id: "u1002", name: "镇雄教育", avatar: avatar("蓝色官方"), type: "user" }
  },
  {
    id: "ao004",
    orderNo: "ZX20250620004",
    source: "用户发布",
    type: "租房",
    title: "南台街道三室一厅住房出租",
    content: "南台街道民主路附近三室一厅，90平米，简装，家电齐全，月租1500元，半年付",
    contactName: "张阿姨",
    contactPhone: "13579246810",
    location: { township: "南台街道", address: "民主路56号3单元502", lat: 27.4381, lng: 104.8692 },
    images: [postImg("中国县城三室一厅简装出租房，客厅整洁，基础家具齐全")],
    status: "待审核",
    amount: 0,
    createdAt: "2025-06-21T11:30:00Z",
    auditRecords: [
      { id: "ar008", status: "提交审核", operator: "系统", time: "2025-06-21T11:30:00Z", remark: "用户发布租房信息，等待审核" }
    ],
    publisher: { id: "u1003", name: "张阿姨租房", avatar: avatar("绿色亲和"), type: "user" }
  },
  {
    id: "ao005",
    orderNo: "ZX20250620005",
    source: "用户发布",
    type: "售房",
    title: "旧府街道电梯房出售，120平米",
    content: "旧府街道某小区电梯房，120平米三室两厅，精装修，带家具家电，售价68万，可贷款",
    contactName: "陈先生",
    contactPhone: "13912345678",
    location: { township: "旧府街道", address: "光明小区B栋1802", lat: 27.4355, lng: 104.8821 },
    images: [postImg("中国县城精装修商品房三室两厅，现代装修风格，大落地窗"), postImg("商品房主卧室，大床衣柜，温馨布置")],
    status: "处理中",
    amount: 100,
    createdAt: "2025-06-20T16:00:00Z",
    auditRecords: [
      { id: "ar009", status: "提交审核", operator: "系统", time: "2025-06-20T16:00:00Z", remark: "用户付费发布售房信息" },
      { id: "ar010", status: "资料核实", operator: "审核员小张", time: "2025-06-21T09:30:00Z", remark: "正在核实房产证信息和房屋权属" }
    ],
    publisher: { id: "u1004", name: "陈先生", avatar: avatar("棕色稳重"), type: "user" }
  },
  {
    id: "ao006",
    orderNo: "ZX20250620006",
    source: "商户发布",
    type: "招聘",
    title: "以勒镇大型超市招部门主管",
    content: "以勒镇某大型超市招聘生鲜主管1名、日用品主管1名，月薪5000-8000，有超市管理经验优先",
    contactName: "人力资源部",
    contactPhone: "0870-3456789",
    location: { township: "以勒镇", address: "以勒镇商业中心", lat: 27.5021, lng: 104.9873 },
    images: [postImg("乡镇大型超市内部，货架整齐，商品丰富，灯光明亮")],
    status: "已发布",
    amount: 300,
    createdAt: "2025-06-17T10:00:00Z",
    publishedAt: "2025-06-17T14:30:00Z",
    auditRecords: [
      { id: "ar011", status: "提交审核", operator: "系统", time: "2025-06-17T10:00:00Z", remark: "认证商户发布招聘信息" },
      { id: "ar012", status: "资质验证", operator: "审核员小王", time: "2025-06-17T11:20:00Z", remark: "商户资质已核验，营业执照有效" },
      { id: "ar013", status: "审核通过", operator: "主管老李", time: "2025-06-17T14:30:00Z", remark: "招聘信息真实，已缴纳推广费，推荐展示一周" }
    ],
    publisher: { id: "m2002", name: "以勒易购超市", avatar: avatar("蓝色超市"), type: "merchant" }
  },
  {
    id: "ao007",
    orderNo: "ZX20250620007",
    source: "用户发布",
    type: "交友",
    title: "92年镇雄男真诚征婚",
    content: "本人男，92年出生，身高175，在昆明做工程，年收入20万+，镇雄有房有车，想找一位温柔善良的姑娘共度余生",
    contactName: "周先生",
    contactPhone: "13888888888",
    location: { township: "乌峰街道", address: "镇雄县城", lat: 27.4418, lng: 104.8762 },
    images: [],
    status: "已拒绝",
    amount: 0,
    createdAt: "2025-06-19T21:00:00Z",
    auditRecords: [
      { id: "ar014", status: "提交审核", operator: "系统", time: "2025-06-19T21:00:00Z", remark: "用户提交交友信息" },
      { id: "ar015", status: "审核拒绝", operator: "审核员小张", time: "2025-06-20T09:00:00Z", remark: "未上传实名认证照片，交友信息需实名认证后发布，请注意平台规则" }
    ],
    publisher: { id: "u1005", name: "周工", avatar: avatar("深灰商务"), type: "user" }
  },
  {
    id: "ao008",
    orderNo: "ZX20250620008",
    source: "第三方合作",
    type: "资讯投稿",
    title: "赤水源镇乡村振兴示范项目启动",
    content: "赤水源镇投资2000万元的乡村振兴示范项目正式启动，涵盖特色农业、乡村旅游、基础设施等多个领域",
    contactName: "赤水源镇政府",
    contactPhone: "0870-3789012",
    location: { township: "赤水源镇", address: "赤水源镇政府大院", lat: 27.4600, lng: 104.7500 },
    images: [postImg("中国乡村振兴示范项目启动仪式，主席台，横幅标语，群众围观")],
    status: "已发布",
    amount: 0,
    createdAt: "2025-06-16T09:00:00Z",
    publishedAt: "2025-06-16T11:00:00Z",
    auditRecords: [
      { id: "ar016", status: "提交审核", operator: "系统", time: "2025-06-16T09:00:00Z", remark: "第三方合作单位投稿" },
      { id: "ar017", status: "内容审核", operator: "审核员小王", time: "2025-06-16T10:00:00Z", remark: "内容为官方新闻稿，来源可靠" },
      { id: "ar018", status: "审核通过", operator: "主管老李", time: "2025-06-16T11:00:00Z", remark: "乡镇重要资讯，安排头条推荐" }
    ],
    publisher: { id: "u1006", name: "镇雄乡村振兴", avatar: avatar("绿色政务"), type: "user" }
  },
  {
    id: "ao009",
    orderNo: "ZX20250620009",
    source: "用户发布",
    type: "租房",
    title: "芒部镇单间出租带厨卫",
    content: "芒部镇街上有单间出租，带独立厨卫，简单家具，月租400元，押一付三",
    contactName: "王先生",
    contactPhone: "13666666666",
    location: { township: "芒部镇", address: "芒部镇老街102号", lat: 27.5317, lng: 104.8512 },
    images: [postImg("乡镇出租单间，单人床小衣柜，独立厨卫，简单干净")],
    status: "已下架",
    amount: 0,
    createdAt: "2025-06-01T10:00:00Z",
    publishedAt: "2025-06-01T14:00:00Z",
    auditRecords: [
      { id: "ar019", status: "提交审核", operator: "系统", time: "2025-06-01T10:00:00Z", remark: "用户提交租房信息" },
      { id: "ar020", status: "审核通过", operator: "审核员小张", time: "2025-06-01T14:00:00Z", remark: "信息完整，审核通过" },
      { id: "ar021", status: "用户下架", operator: "用户", time: "2025-06-20T10:00:00Z", remark: "用户主动申请下架，房屋已出租" }
    ],
    publisher: { id: "u1007", name: "芒部老王", avatar: avatar("黄色朴实"), type: "user" }
  },
  {
    id: "ao010",
    orderNo: "ZX20250620010",
    source: "平台推送",
    type: "美食推荐",
    title: "舌尖上的镇雄：盘点十大必吃小吃",
    content: "镇雄烧洋芋、酸汤鱼、豆花面、腊肉炒折耳根、野生菌火锅……来镇雄旅游不可错过的十大小吃攻略",
    contactName: "平台运营",
    contactPhone: "0870-3000000",
    location: { township: "乌峰街道", address: "镇雄县本地通运营中心", lat: 27.4400, lng: 104.8700 },
    images: [postImg("云南特色小吃拼盘，烧洋芋、豆花面、折耳根、腊肉，摆一桌"), postImg("镇雄县城美食街，夜市摊位，霓虹灯，热闹人群")],
    status: "已发布",
    amount: 0,
    createdAt: "2025-06-10T08:00:00Z",
    publishedAt: "2025-06-10T10:00:00Z",
    auditRecords: [
      { id: "ar022", status: "提交审核", operator: "系统", time: "2025-06-10T08:00:00Z", remark: "平台原创内容" },
      { id: "ar023", status: "主编审核", operator: "主管老李", time: "2025-06-10T09:30:00Z", remark: "内容丰富，图片精美" },
      { id: "ar024", status: "审核通过", operator: "审核员小王", time: "2025-06-10T10:00:00Z", remark: "作为本周精选内容推荐" }
    ],
    publisher: { id: "u1008", name: "本地通小编", avatar: avatar("橙色小编"), type: "user" }
  },
  {
    id: "ao011",
    orderNo: "ZX20250620011",
    source: "用户发布",
    type: "交友",
    title: "98年女老师找对象",
    content: "本人女，98年出生，身高163，镇雄某小学老师，性格文静，喜欢阅读和旅行，希望找一位年龄相仿、有上进心的男生",
    contactName: "刘老师",
    contactPhone: "13777777777",
    location: { township: "乌峰街道", address: "镇雄县某小学", lat: 27.4420, lng: 104.8710 },
    images: [],
    status: "待审核",
    amount: 0,
    createdAt: "2025-06-21T19:30:00Z",
    auditRecords: [
      { id: "ar025", status: "提交审核", operator: "系统", time: "2025-06-21T19:30:00Z", remark: "用户提交交友信息，等待实名认证" }
    ],
    publisher: { id: "u1009", name: "刘老师", avatar: avatar("粉色文静"), type: "user" }
  },
  {
    id: "ao012",
    orderNo: "ZX20250620012",
    source: "商户发布",
    type: "售房",
    title: "大湾镇新建楼盘开盘预售",
    content: "大湾镇中心位置新建商品楼盘，80-140平米多种户型，均价3500元/平米，开盘享95折优惠",
    contactName: "售楼处",
    contactPhone: "0870-3222222",
    location: { township: "大湾镇", address: "大湾镇新街1号", lat: 27.4782, lng: 104.9384 },
    images: [postImg("乡镇新建商品楼盘效果图，多层住宅，现代风格，绿化景观"), postImg("楼盘售楼处内部，沙盘模型，客户咨询")],
    status: "处理中",
    amount: 2000,
    createdAt: "2025-06-20T09:00:00Z",
    auditRecords: [
      { id: "ar026", status: "提交审核", operator: "系统", time: "2025-06-20T09:00:00Z", remark: "商户大额推广合作，2000元套餐" },
      { id: "ar027", status: "资质审核", operator: "审核员小张", time: "2025-06-20T11:00:00Z", remark: "已收到预付款，正在核验预售许可证" },
      { id: "ar028", status: "套餐确认", operator: "主管老李", time: "2025-06-21T10:00:00Z", remark: "大客户合作，准备首页轮播+置顶15天" }
    ],
    publisher: { id: "m2003", name: "大湾镇房产开发公司", avatar: avatar("金色地产"), type: "merchant" }
  },
  {
    id: "ao013",
    orderNo: "ZX20250620013",
    source: "用户发布",
    type: "招聘",
    title: "五德镇家具厂招喷漆工",
    content: "五德镇家具厂招喷漆工2名，月薪6000-9000，计件工资，包吃住，要求有经验",
    contactName: "赵厂长",
    contactPhone: "13555555555",
    location: { township: "五德镇", address: "五德镇工业园区", lat: 27.3826, lng: 104.6234 },
    images: [postImg("乡镇家具厂喷漆车间，工人在作业，防护设备，厂房内景")],
    status: "已拒绝",
    amount: 0,
    createdAt: "2025-06-18T15:00:00Z",
    auditRecords: [
      { id: "ar029", status: "提交审核", operator: "系统", time: "2025-06-18T15:00:00Z", remark: "用户发布招聘信息" },
      { id: "ar030", status: "审核拒绝", operator: "审核员小王", time: "2025-06-19T09:00:00Z", remark: "喷漆工作属于特殊工种，需提供企业营业执照和环保审批文件，个人用户无法发布此类招聘" }
    ],
    publisher: { id: "u1010", name: "赵厂长", avatar: avatar("蓝色工业"), type: "user" }
  },
  {
    id: "ao014",
    orderNo: "ZX20250620014",
    source: "第三方合作",
    type: "招聘",
    title: "镇雄县人民医院招聘医护人员",
    content: "镇雄县人民医院面向社会公开招聘医生5名、护士10名、医技人员3名，详情见官方公告",
    contactName: "县医院人事科",
    contactPhone: "0870-3111111",
    location: { township: "南台街道", address: "镇雄县人民医院", lat: 27.4390, lng: 104.8680 },
    images: [postImg("中国县人民医院门诊大楼，现代建筑，医院标志")],
    status: "已发布",
    amount: 0,
    createdAt: "2025-06-15T08:30:00Z",
    publishedAt: "2025-06-15T10:00:00Z",
    auditRecords: [
      { id: "ar031", status: "提交审核", operator: "系统", time: "2025-06-15T08:30:00Z", remark: "合作单位县医院招聘公告" },
      { id: "ar032", status: "审核通过", operator: "主管老李", time: "2025-06-15T10:00:00Z", remark: "事业单位招聘，重要信息，紧急发布并推荐" }
    ],
    publisher: { id: "u1011", name: "镇雄县医院", avatar: avatar("白色医院"), type: "user" }
  },
  {
    id: "ao015",
    orderNo: "ZX20250620015",
    source: "用户发布",
    type: "资讯投稿",
    title: "塘房镇发现千年古茶树群",
    content: "据当地村民反映，塘房镇深山里发现一片树龄超千年的古茶树群，专家初步评估具有极高的开发价值",
    contactName: "当地村民",
    contactPhone: "13444444444",
    location: { township: "塘房镇", address: "塘房镇某村", lat: 27.4183, lng: 104.9312 },
    images: [postImg("云南深山千年古茶树，粗壮树干，枝叶繁茂，青山环绕")],
    status: "处理中",
    amount: 0,
    createdAt: "2025-06-21T08:00:00Z",
    auditRecords: [
      { id: "ar033", status: "提交审核", operator: "系统", time: "2025-06-21T08:00:00Z", remark: "用户爆料新闻线索" },
      { id: "ar034", status: "核实信息", operator: "审核员小张", time: "2025-06-21T10:00:00Z", remark: "重要新闻线索，已联系当地村委核实，等待回复" }
    ],
    publisher: { id: "u1012", name: "茶农老李", avatar: avatar("绿色自然"), type: "user" }
  }
];

export const auditRecords: AuditRecord[] = [
  {
    id: "aud001",
    auditNo: "SH20250620001",
    type: "招聘信息",
    title: "乌峰街道某奶茶店急招店员",
    submitter: "奶茶小李",
    submitterRole: "普通用户",
    submittedAt: "2025-06-19T09:15:00Z",
    operator: "审核员小王",
    status: "审核通过",
    township: "乌峰街道",
    evidence: [evidenceImg("招聘信息截图，包含联系电话和工资待遇")],
    remark: "信息真实完整，符合平台招聘信息发布规范",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-19T09:15:00Z", remark: "用户提交招聘信息及相关图片" },
      { step: 2, operator: "审核员小王", action: "初审通过", time: "2025-06-19T10:30:00Z", remark: "核对联系方式有效，内容无违规，予以通过发布" }
    ]
  },
  {
    id: "aud002",
    auditNo: "SH20250620002",
    type: "商户资质",
    title: "泼机镇老字号羊肉粉馆资质认证",
    submitter: "泼机羊肉粉馆",
    submitterRole: "认证商户",
    submittedAt: "2025-06-15T14:00:00Z",
    operator: "主管老李",
    status: "已复查通过",
    township: "泼机镇",
    evidence: [evidenceImg("营业执照正本照片，清晰可见注册信息"), evidenceImg("食品经营许可证照片")],
    remark: "经复查，商户提交的营业执照和食品经营许可证均真实有效，予以认证通过",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-15T14:00:00Z", remark: "商户上传营业执照、食品经营许可证、门店照片" },
      { step: 2, operator: "审核员小张", action: "审核拒绝", time: "2025-06-16T09:00:00Z", remark: "营业执照照片模糊，注册号无法辨认，请重新上传清晰照片" },
      { step: 3, operator: "泼机羊肉粉馆", action: "用户申诉", time: "2025-06-16T14:30:00Z", remark: "已重新拍摄高清营业执照照片，原因为拍摄时光线不足" },
      { step: 4, operator: "主管老李", action: "复核通过", time: "2025-06-17T10:00:00Z", remark: "重新提交的材料清晰可辨，资质齐全，认证通过" }
    ]
  },
  {
    id: "aud003",
    auditNo: "SH20250620003",
    type: "UGC图文",
    title: "镇雄烧洋芋——街头不可错过的美味",
    submitter: "吃货小王",
    submitterRole: "普通用户",
    submittedAt: "2025-06-19T12:00:00Z",
    operator: "审核员小王",
    status: "审核通过",
    township: "南台街道",
    evidence: [evidenceImg("美食实拍图片，烧洋芋配辣椒面")],
    remark: "原创美食推荐内容，图片真实，文字描述生动",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-19T12:00:00Z", remark: "用户提交美食图文内容" },
      { step: 2, operator: "审核员小王", action: "初审通过", time: "2025-06-19T13:00:00Z", remark: "内容积极健康，为本地美食推广，审核通过" }
    ]
  },
  {
    id: "aud004",
    auditNo: "SH20250620004",
    type: "房产信息",
    title: "旧府街道电梯房出售，120平米",
    submitter: "陈先生",
    submitterRole: "普通用户",
    submittedAt: "2025-06-20T16:00:00Z",
    operator: "审核员小张",
    status: "待复查",
    township: "旧府街道",
    evidence: [evidenceImg("房屋照片，客厅卧室实景"), evidenceImg("疑似房产证照片，部分信息被遮挡")],
    remark: "房产证照片关键信息被遮挡，需用户补充完整材料后进行复查",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-20T16:00:00Z", remark: "用户提交售房信息、房屋照片及房产证照片" },
      { step: 2, operator: "审核员小张", action: "初审驳回", time: "2025-06-21T09:30:00Z", remark: "房产证照片中房屋所有权人信息和房屋坐落地址被马赛克遮挡，无法核实权属" },
      { step: 3, operator: "系统", action: "待复查", time: "2025-06-21T10:00:00Z", remark: "已通知用户补充完整清晰的产权证明材料，等待用户重新提交" }
    ]
  },
  {
    id: "aud005",
    auditNo: "SH20250620005",
    type: "交友信息",
    title: "92年镇雄男真诚征婚",
    submitter: "周工",
    submitterRole: "普通用户",
    submittedAt: "2025-06-19T21:00:00Z",
    operator: "审核员小张",
    status: "审核拒绝",
    township: "乌峰街道",
    evidence: [],
    remark: "交友类信息必须完成实名认证并上传本人真实照片，当前未满足发布条件",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-19T21:00:00Z", remark: "用户提交交友征婚信息，未上传照片" },
      { step: 2, operator: "审核员小张", action: "审核拒绝", time: "2025-06-20T09:00:00Z", remark: "根据平台交友安全规则，征婚信息需实名认证并上传本人近照，防止虚假诈骗信息，请用户完成认证后重新发布" }
    ]
  },
  {
    id: "aud006",
    auditNo: "SH20250620006",
    type: "资讯投稿",
    title: "镇雄县2025年高考成绩再创佳绩",
    submitter: "镇雄教育",
    submitterRole: "管理员",
    submittedAt: "2025-06-23T08:00:00Z",
    operator: "审核员小王",
    status: "审核通过",
    township: "乌峰街道",
    evidence: [evidenceImg("县教育局官方新闻稿截图，盖有公章")],
    remark: "官方权威资讯，数据来源可靠，内容积极正面",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-23T08:00:00Z", remark: "管理员发布官方高考成绩新闻稿" },
      { step: 2, operator: "审核员小王", action: "初审通过", time: "2025-06-23T09:00:00Z", remark: "官方来源，内容准确，紧急发布并安排首页推荐" }
    ]
  },
  {
    id: "aud007",
    auditNo: "SH20250620007",
    type: "美食推荐",
    title: "泼机镇老字号羊肉粉开业大酬宾",
    submitter: "泼机羊肉粉馆",
    submitterRole: "认证商户",
    submittedAt: "2025-06-18T14:20:00Z",
    operator: "主管老李",
    status: "审核通过",
    township: "泼机镇",
    evidence: [evidenceImg("店铺门头照片，招牌清晰"), evidenceImg("羊肉粉美食实拍")],
    remark: "已认证商户发布的美食推广，已缴纳推广费用，内容合规",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-18T14:20:00Z", remark: "认证商户提交美食推荐及付费推广订单" },
      { step: 2, operator: "审核员小张", action: "内容审核", time: "2025-06-18T15:10:00Z", remark: "图片清晰，美食实拍，无违规宣传用语" },
      { step: 3, operator: "主管老李", action: "审核通过", time: "2025-06-18T16:00:00Z", remark: "推广费用已到账，按套餐安排置顶展示3天" }
    ]
  },
  {
    id: "aud008",
    auditNo: "SH20250620008",
    type: "招聘信息",
    title: "五德镇家具厂招喷漆工",
    submitter: "赵厂长",
    submitterRole: "普通用户",
    submittedAt: "2025-06-18T15:00:00Z",
    operator: "审核员小王",
    status: "审核拒绝",
    township: "五德镇",
    evidence: [evidenceImg("招聘信息内容截图")],
    remark: "特殊工种招聘需企业主体资质，个人用户无法发布此类信息",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-18T15:00:00Z", remark: "用户以个人身份提交喷漆工招聘信息" },
      { step: 2, operator: "审核员小王", action: "审核拒绝", time: "2025-06-19T09:00:00Z", remark: "喷漆属于有毒有害特殊工种，根据平台规定，此类招聘需提供企业营业执照、环保审批及安全资质文件，请注册商户账号并完善资质后发布" }
    ]
  },
  {
    id: "aud009",
    auditNo: "SH20250620009",
    type: "UGC短视频",
    title: "芒部镇苗族花山节精彩瞬间",
    submitter: "民族文化爱好者",
    submitterRole: "普通用户",
    submittedAt: "2025-06-10T16:00:00Z",
    operator: "复核员小张",
    status: "已复查通过",
    township: "芒部镇",
    evidence: [evidenceImg("短视频封面，苗族群众身着节日盛装跳舞"), evidenceImg("视频拍摄地点证明，与当地人合影")],
    remark: "经复查，视频内容为真实民族文化活动记录，无违规内容，予以恢复展示",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-10T16:00:00Z", remark: "用户上传苗族花山节实拍短视频，时长5分钟" },
      { step: 2, operator: "审核员小王", action: "审核拒绝", time: "2025-06-11T09:00:00Z", remark: "疑似存在未经授权的大规模群众集会内容，需核实活动合法性" },
      { step: 3, operator: "民族文化爱好者", action: "用户申诉", time: "2025-06-11T14:00:00Z", remark: "花山节是苗族传统节日，当地政府每年主办，附活动现场照片及村委证明" },
      { step: 4, operator: "复核员小张", action: "复核通过", time: "2025-06-12T10:00:00Z", remark: "核实为当地合法民族文化活动，内容积极健康，弘扬民族文化，撤销原驳回决定，恢复发布并推荐" }
    ]
  },
  {
    id: "aud010",
    auditNo: "SH20250620010",
    type: "商户资质",
    title: "以勒易购超市商户资质认证",
    submitter: "以勒易购超市",
    submitterRole: "认证商户",
    submittedAt: "2025-06-01T10:00:00Z",
    operator: "主管老李",
    status: "审核通过",
    township: "以勒镇",
    evidence: [evidenceImg("营业执照正本"), evidenceImg("税务登记证"), evidenceImg("店铺内景照片")],
    remark: "大型超市资质齐全，经营规模较大，列为平台重点合作商户",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-01T10:00:00Z", remark: "商户提交营业执照、税务登记证、店铺照片等材料" },
      { step: 2, operator: "审核员小张", action: "初审通过", time: "2025-06-02T10:00:00Z", remark: "材料齐全，证照在有效期内" },
      { step: 3, operator: "主管老李", action: "审核通过", time: "2025-06-02T15:00:00Z", remark: "资质优良，经营面积超500平米，授予认证商户标识并享受推广优惠" }
    ]
  },
  {
    id: "aud011",
    auditNo: "SH20250620011",
    type: "房产信息",
    title: "南台街道三室一厅住房出租",
    submitter: "张阿姨租房",
    submitterRole: "普通用户",
    submittedAt: "2025-06-21T11:30:00Z",
    operator: "审核员小王",
    status: "待审核",
    township: "南台街道",
    evidence: [evidenceImg("出租房屋客厅照片")],
    remark: "新提交的租房信息，排队等待审核",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-21T11:30:00Z", remark: "用户提交租房信息及房屋照片" }
    ]
  },
  {
    id: "aud012",
    auditNo: "SH20250620012",
    type: "交友信息",
    title: "98年女老师找对象",
    submitter: "刘老师",
    submitterRole: "普通用户",
    submittedAt: "2025-06-21T19:30:00Z",
    operator: "审核员小张",
    status: "待审核",
    township: "乌峰街道",
    evidence: [],
    remark: "等待用户完成实名认证",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-21T19:30:00Z", remark: "用户提交交友信息，实名认证进行中" }
    ]
  },
  {
    id: "aud013",
    auditNo: "SH20250620013",
    type: "UGC图文",
    title: "塘房镇发现千年古茶树群",
    submitter: "茶农老李",
    submitterRole: "普通用户",
    submittedAt: "2025-06-21T08:00:00Z",
    operator: "审核员小张",
    status: "待复查",
    township: "塘房镇",
    evidence: [evidenceImg("古茶树照片，树干粗壮需多人合抱"), evidenceImg("深山茶树群远景照片")],
    remark: "重大新闻线索，已联系当地有关部门进行专业鉴定，待核实树龄后发布",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-21T08:00:00Z", remark: "用户提交古茶树群图文爆料" },
      { step: 2, operator: "审核员小张", action: "暂缓发布", time: "2025-06-21T10:00:00Z", remark: "内容涉及重大发现，需专业机构核实树龄和数量，已联系县农业农村局专家" },
      { step: 3, operator: "系统", action: "待复查", time: "2025-06-21T14:00:00Z", remark: "等待专家现场考察结果，预计3个工作日内反馈" }
    ]
  },
  {
    id: "aud014",
    auditNo: "SH20250620014",
    type: "商户资质",
    title: "大湾镇某农家乐营业执照续期",
    submitter: "大湾山水农家乐",
    submitterRole: "认证商户",
    submittedAt: "2025-06-05T10:00:00Z",
    operator: "复核员小张",
    status: "已复查拒绝",
    township: "大湾镇",
    evidence: [evidenceImg("过期营业执照照片")],
    remark: "商户营业执照已于2025年5月过期，提交的新材料经核实仍为过期证照，不予通过",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-05T10:00:00Z", remark: "商户提交营业执照续期申请" },
      { step: 2, operator: "审核员小王", action: "审核拒绝", time: "2025-06-06T09:00:00Z", remark: "营业执照显示有效期至2025年5月15日，已过期，请办理新证后上传" },
      { step: 3, operator: "大湾山水农家乐", action: "用户申诉", time: "2025-06-10T15:00:00Z", remark: "新证正在工商局办理中，能否先用旧证延续一个月？" },
      { step: 4, operator: "复核员小张", action: "复核拒绝", time: "2025-06-11T10:00:00Z", remark: "根据平台商户管理规定，过期证照无法使用，为保障消费者权益，请在取得新营业执照后再次提交申请，期间商户发布功能将暂时受限" }
    ]
  },
  {
    id: "aud015",
    auditNo: "SH20250620015",
    type: "资讯投稿",
    title: "赤水源镇乡村振兴示范项目启动",
    submitter: "镇雄乡村振兴",
    submitterRole: "管理员",
    submittedAt: "2025-06-16T09:00:00Z",
    operator: "主管老李",
    status: "审核通过",
    township: "赤水源镇",
    evidence: [evidenceImg("项目启动仪式现场照片，背景有政府横幅")],
    remark: "政府官方投稿，乡镇重要新闻，内容真实可信",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-16T09:00:00Z", remark: "管理员发布赤水源镇乡村振兴项目新闻" },
      { step: 2, operator: "审核员小王", action: "内容审核", time: "2025-06-16T10:00:00Z", remark: "官方新闻稿，数据准确，来源可靠" },
      { step: 3, operator: "主管老李", action: "审核通过", time: "2025-06-16T11:00:00Z", remark: "乡镇重点项目，安排头条推荐和乡镇定向推送" }
    ]
  },
  {
    id: "aud016",
    auditNo: "SH20250620016",
    type: "招聘信息",
    title: "镇雄县人民医院招聘医护人员",
    submitter: "镇雄县医院",
    submitterRole: "管理员",
    submittedAt: "2025-06-15T08:30:00Z",
    operator: "主管老李",
    status: "审核通过",
    township: "南台街道",
    evidence: [evidenceImg("县医院官方招聘公告扫描件，盖人事科公章")],
    remark: "事业单位官方招聘，重要民生信息，加急审核发布",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-15T08:30:00Z", remark: "管理员发布县人民医院医护人员招聘公告" },
      { step: 2, operator: "主管老李", action: "审核通过", time: "2025-06-15T10:00:00Z", remark: "事业单位招聘信息，优先审核，立即发布并全站推送" }
    ]
  },
  {
    id: "aud017",
    auditNo: "SH20250620017",
    type: "美食推荐",
    title: "舌尖上的镇雄：盘点十大必吃小吃",
    submitter: "本地通小编",
    submitterRole: "管理员",
    submittedAt: "2025-06-10T08:00:00Z",
    operator: "主管老李",
    status: "审核通过",
    township: "乌峰街道",
    evidence: [evidenceImg("十大小吃拼图合集，每款配实拍照片")],
    remark: "平台原创精品内容，图文并茂，适合作为本周精选推荐",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-10T08:00:00Z", remark: "小编提交原创美食攻略图文" },
      { step: 2, operator: "审核员小王", action: "初审", time: "2025-06-10T09:00:00Z", remark: "内容详实，图片精美，涵盖各乡特色美食" },
      { step: 3, operator: "主管老李", action: "审核通过", time: "2025-06-10T10:00:00Z", remark: "优质原创内容，作为本周精选首页置顶展示一周" }
    ]
  },
  {
    id: "aud018",
    auditNo: "SH20250620018",
    type: "房产信息",
    title: "大湾镇新建楼盘开盘预售",
    submitter: "大湾镇房产开发公司",
    submitterRole: "认证商户",
    submittedAt: "2025-06-20T09:00:00Z",
    operator: "主管老李",
    status: "待审核",
    township: "大湾镇",
    evidence: [evidenceImg("楼盘效果图"), evidenceImg("土地使用证照片"), evidenceImg("预售许可证（待上传）")],
    remark: "大额推广合作项目，正在核验商品房预售许可证，材料齐全后审批",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-20T09:00:00Z", remark: "认证商户提交楼盘预售信息及2000元推广订单" },
      { step: 2, operator: "审核员小张", action: "资料核验", time: "2025-06-20T11:00:00Z", remark: "已确认土地使用证，预售许可证显示正在办理中" },
      { step: 3, operator: "主管老李", action: "待补充材料", time: "2025-06-21T10:00:00Z", remark: "要求商户补充正式商品房预售许可证后方可发布推广，已通知对方" }
    ]
  },
  {
    id: "aud019",
    auditNo: "SH20250620019",
    type: "UGC短视频",
    title: "乌峰街道广场舞大赛精彩视频",
    submitter: "社区文化宣传员",
    submitterRole: "普通用户",
    submittedAt: "2025-06-12T19:00:00Z",
    operator: "审核员小王",
    status: "审核通过",
    township: "乌峰街道",
    evidence: [evidenceImg("广场舞大赛现场视频截图，统一服装的中老年队伍")],
    remark: "社区文化活动视频，积极健康，传递正能量",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-12T19:00:00Z", remark: "用户上传社区广场舞比赛短视频" },
      { step: 2, operator: "审核员小王", action: "初审通过", time: "2025-06-13T09:00:00Z", remark: "内容健康向上，丰富居民文化生活，审核通过并推荐" }
    ]
  },
  {
    id: "aud020",
    auditNo: "SH20250620020",
    type: "商户资质",
    title: "雨河镇某农资店资质审核",
    submitter: "雨河老张农资",
    submitterRole: "普通用户",
    submittedAt: "2025-06-08T14:00:00Z",
    operator: "审核员小张",
    status: "审核拒绝",
    township: "雨河镇",
    evidence: [evidenceImg("模糊的营业执照照片，信息不清"), evidenceImg("疑似PS的经营许可证")],
    remark: "提交的资质材料存在伪造嫌疑，营业执照模糊不清，经营许可证疑似PS修改，驳回申请并限制再次提交",
    reviewTraces: [
      { step: 1, operator: "系统", action: "提交材料", time: "2025-06-08T14:00:00Z", remark: "用户申请商户认证，上传营业执照和经营许可证" },
      { step: 2, operator: "审核员小张", action: "技术核验", time: "2025-06-09T10:00:00Z", remark: "营业执照分辨率过低无法识别，经营许可证编号经工商系统查询不存在，疑似伪造" },
      { step: 3, operator: "主管老李", action: "审核拒绝", time: "2025-06-09T15:00:00Z", remark: "提交虚假资质材料违反平台规则，驳回申请，该账号30天内禁止提交商户认证申请，如有异议请携带真实证件前往平台运营中心处理" }
    ]
  }
];

export const adminMerchants: AdminMerchant[] = [
  {
    id: "am001",
    name: "镇雄恒丰购物中心",
    category: ["购物", "超市", "日用百货"],
    contactName: "李经理",
    contactPhone: "13800138001",
    address: "乌峰街道建设路88号",
    township: "乌峰街道",
    qualificationStatus: "已通过",
    businessStatus: "营业中",
    verified: true,
    registerTime: "2024-03-15T10:00:00Z",
    licenseExpiry: "2028-03-14T23:59:59Z",
    postCount: 56,
    viewCount: 28450
  },
  {
    id: "am002",
    name: "泼机镇老字号羊肉粉馆",
    category: ["餐饮", "小吃", "特色美食"],
    contactName: "王老板",
    contactPhone: "13987654321",
    address: "泼机镇兴农路15号",
    township: "泼机镇",
    qualificationStatus: "已通过",
    businessStatus: "营业中",
    verified: true,
    registerTime: "2024-05-20T09:00:00Z",
    licenseExpiry: "2027-05-19T23:59:59Z",
    postCount: 32,
    viewCount: 15680
  },
  {
    id: "am003",
    name: "以勒易购超市",
    category: ["购物", "超市", "生鲜"],
    contactName: "陈总",
    contactPhone: "13900139002",
    address: "以勒镇商业中心A栋",
    township: "以勒镇",
    qualificationStatus: "已通过",
    businessStatus: "营业中",
    verified: true,
    registerTime: "2024-01-10T08:30:00Z",
    licenseExpiry: "2029-01-09T23:59:59Z",
    postCount: 78,
    viewCount: 42150
  },
  {
    id: "am004",
    name: "大湾山水农家乐",
    category: ["餐饮", "休闲娱乐", "农家菜"],
    contactName: "黄老板",
    contactPhone: "13700137003",
    address: "大湾镇风景区入口处",
    township: "大湾镇",
    qualificationStatus: "已过期",
    businessStatus: "休息中",
    verified: false,
    registerTime: "2023-05-15T10:00:00Z",
    licenseExpiry: "2025-05-14T23:59:59Z",
    postCount: 18,
    viewCount: 8920
  },
  {
    id: "am005",
    name: "芒部镇农技服务中心",
    category: ["农资", "农业服务", "种子化肥"],
    contactName: "赵站长",
    contactPhone: "13600136004",
    address: "芒部镇新街农技站大楼",
    township: "芒部镇",
    qualificationStatus: "已通过",
    businessStatus: "营业中",
    verified: true,
    registerTime: "2024-02-28T09:00:00Z",
    licenseExpiry: "2028-02-27T23:59:59Z",
    postCount: 45,
    viewCount: 12340
  },
  {
    id: "am006",
    name: "雨河老张农资店",
    category: ["农资", "农药", "种子"],
    contactName: "张老板",
    contactPhone: "13500135005",
    address: "雨河镇老街农资市场",
    township: "雨河镇",
    qualificationStatus: "已拒绝",
    businessStatus: "已停业",
    verified: false,
    registerTime: "2025-06-08T14:00:00Z",
    licenseExpiry: "2025-06-08T14:00:00Z",
    postCount: 2,
    viewCount: 150
  },
  {
    id: "am007",
    name: "五德镇服装加工厂",
    category: ["制造", "服装", "加工"],
    contactName: "孙厂长",
    contactPhone: "13400134006",
    address: "五德镇工业园区B区",
    township: "五德镇",
    qualificationStatus: "待审核",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-06-18T10:00:00Z",
    licenseExpiry: "2027-06-17T23:59:59Z",
    postCount: 5,
    viewCount: 680
  },
  {
    id: "am008",
    name: "镇雄老灶火锅店",
    category: ["餐饮", "火锅", "特色美食"],
    contactName: "刘大厨",
    contactPhone: "13300133007",
    address: "乌峰街道美食街28号",
    township: "乌峰街道",
    qualificationStatus: "已通过",
    businessStatus: "营业中",
    verified: true,
    registerTime: "2023-11-20T11:00:00Z",
    licenseExpiry: "2026-11-19T23:59:59Z",
    postCount: 28,
    viewCount: 18920
  },
  {
    id: "am009",
    name: "塘房镇生态茶园",
    category: ["农业", "茶叶", "农产品"],
    contactName: "茶农老李",
    contactPhone: "13200132008",
    address: "塘房镇某村高山茶园",
    township: "塘房镇",
    qualificationStatus: "未提交",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-06-01T09:00:00Z",
    licenseExpiry: "",
    postCount: 3,
    viewCount: 420
  },
  {
    id: "am010",
    name: "大湾镇房产开发公司",
    category: ["房地产", "楼盘销售", "物业服务"],
    contactName: "售楼处",
    contactPhone: "0870-3222222",
    address: "大湾镇新街1号售楼部",
    township: "大湾镇",
    qualificationStatus: "待审核",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-06-15T10:00:00Z",
    licenseExpiry: "2028-06-14T23:59:59Z",
    postCount: 8,
    viewCount: 3560
  },
  {
    id: "am011",
    name: "赤水源镇乡村旅游合作社",
    category: ["旅游", "农家乐", "民宿"],
    contactName: "合作社社长",
    contactPhone: "13100131009",
    address: "赤水源镇旅游接待中心",
    township: "赤水源镇",
    qualificationStatus: "待审核",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-06-20T14:00:00Z",
    licenseExpiry: "2026-12-31T23:59:59Z",
    postCount: 4,
    viewCount: 780
  },
  {
    id: "am012",
    name: "罗坎镇石材加工厂",
    category: ["建材", "石材", "加工"],
    contactName: "加工厂负责人",
    contactPhone: "13000130010",
    address: "罗坎镇工业区",
    township: "罗坎镇",
    qualificationStatus: "未提交",
    businessStatus: "已停业",
    verified: false,
    registerTime: "2024-08-10T09:00:00Z",
    licenseExpiry: "",
    postCount: 1,
    viewCount: 90
  },
  {
    id: "am013",
    name: "木卓乡高山养殖场",
    category: ["农业", "畜牧", "家禽"],
    contactName: "养殖场主",
    contactPhone: "15800158011",
    address: "木卓乡某村高山牧场",
    township: "木卓乡",
    qualificationStatus: "未提交",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-05-10T08:00:00Z",
    licenseExpiry: "",
    postCount: 6,
    viewCount: 560
  },
  {
    id: "am014",
    name: "花朗乡生态蜂蜜合作社",
    category: ["农业", "特产", "蜂蜜"],
    contactName: "合作社理事长",
    contactPhone: "15900159012",
    address: "花朗乡养蜂基地",
    township: "花朗乡",
    qualificationStatus: "待审核",
    businessStatus: "营业中",
    verified: false,
    registerTime: "2025-06-19T10:00:00Z",
    licenseExpiry: "2027-06-18T23:59:59Z",
    postCount: 2,
    viewCount: 280
  },
  {
    id: "am015",
    name: "黑树镇传统酿酒坊",
    category: ["食品", "白酒", "传统工艺"],
    contactName: "酿酒师老周",
    contactPhone: "15700157013",
    address: "黑树镇老街酿酒坊",
    township: "黑树镇",
    qualificationStatus: "已过期",
    businessStatus: "休息中",
    verified: false,
    registerTime: "2023-08-20T09:00:00Z",
    licenseExpiry: "2025-05-20T23:59:59Z",
    postCount: 12,
    viewCount: 4560
  }
];

export const townshipDistributions: TownshipDistribution[] = [
  {
    id: "td001",
    contentId: "c001",
    contentType: "资讯投稿",
    title: "镇雄县2025年高考成绩再创佳绩",
    sourceTownship: "乌峰街道",
    targetTownships: ["乌峰街道", "南台街道", "旧府街道", "泼机镇", "黑树镇", "母享镇", "以勒镇", "芒部镇"],
    status: "已完成",
    publisher: "镇雄教育",
    publishedAt: "2025-06-23T09:00:00Z",
    distributedAt: "2025-06-23T09:30:00Z",
    reachCount: 12580
  },
  {
    id: "td002",
    contentId: "c002",
    contentType: "美食推荐",
    title: "舌尖上的镇雄：盘点十大必吃小吃",
    sourceTownship: "乌峰街道",
    targetTownships: ["乌峰街道", "南台街道", "旧府街道", "塘房镇", "泼机镇"],
    status: "已完成",
    publisher: "本地通小编",
    publishedAt: "2025-06-10T10:00:00Z",
    distributedAt: "2025-06-10T10:30:00Z",
    reachCount: 8920
  },
  {
    id: "td003",
    contentId: "c003",
    contentType: "资讯投稿",
    title: "赤水源镇乡村振兴示范项目启动",
    sourceTownship: "赤水源镇",
    targetTownships: ["赤水源镇", "芒部镇", "雨河镇", "木卓乡", "以勒镇", "大湾镇"],
    status: "已完成",
    publisher: "镇雄乡村振兴",
    publishedAt: "2025-06-16T11:00:00Z",
    distributedAt: "2025-06-16T11:45:00Z",
    reachCount: 6750
  },
  {
    id: "td004",
    contentId: "c004",
    contentType: "招聘信息",
    title: "镇雄县人民医院招聘医护人员",
    sourceTownship: "南台街道",
    targetTownships: ["乌峰街道", "南台街道", "旧府街道", "泼机镇", "以勒镇", "芒部镇", "五德镇", "罗坎镇"],
    status: "已完成",
    publisher: "镇雄县医院",
    publishedAt: "2025-06-15T10:00:00Z",
    distributedAt: "2025-06-15T10:20:00Z",
    reachCount: 15320
  },
  {
    id: "td005",
    contentId: "c005",
    contentType: "招聘信息",
    title: "以勒镇大型超市招部门主管",
    sourceTownship: "以勒镇",
    targetTownships: ["以勒镇", "大湾镇", "坡头镇", "雨河镇", "木卓乡", "果珠乡"],
    status: "已完成",
    publisher: "以勒易购超市",
    publishedAt: "2025-06-17T14:30:00Z",
    distributedAt: "2025-06-17T15:00:00Z",
    reachCount: 4580
  },
  {
    id: "td006",
    contentId: "c006",
    contentType: "美食推荐",
    title: "泼机镇老字号羊肉粉开业大酬宾",
    sourceTownship: "泼机镇",
    targetTownships: ["泼机镇", "黑树镇", "母享镇", "塘房镇", "中屯镇"],
    status: "分发中",
    publisher: "泼机羊肉粉馆",
    publishedAt: "2025-06-18T16:00:00Z",
    distributedAt: "2025-06-18T16:15:00Z",
    reachCount: 2340
  },
  {
    id: "td007",
    contentId: "c007",
    contentType: "售房",
    title: "大湾镇新建楼盘开盘预售",
    sourceTownship: "大湾镇",
    targetTownships: ["大湾镇", "以勒镇", "雨河镇", "芒部镇", "赤水源镇"],
    status: "待分发",
    publisher: "大湾镇房产开发公司",
    publishedAt: "2025-06-20T09:00:00Z",
    reachCount: 0
  },
  {
    id: "td008",
    contentId: "c008",
    contentType: "UGC图文",
    title: "芒部镇苗族花山节精彩瞬间",
    sourceTownship: "芒部镇",
    targetTownships: ["芒部镇", "雨河镇", "木卓乡", "赤水源镇", "尖山乡", "果珠乡"],
    status: "已完成",
    publisher: "民族文化爱好者",
    publishedAt: "2025-06-12T10:00:00Z",
    distributedAt: "2025-06-12T10:30:00Z",
    reachCount: 5680
  },
  {
    id: "td009",
    contentId: "c009",
    contentType: "招聘",
    title: "五德镇服装厂招缝纫工",
    sourceTownship: "五德镇",
    targetTownships: ["五德镇", "牛场镇", "坪上镇", "罗坎镇", "盐源镇"],
    status: "已撤回",
    publisher: "五德服装",
    publishedAt: "2025-06-10T09:00:00Z",
    distributedAt: "2025-06-10T09:30:00Z",
    reachCount: 1230
  },
  {
    id: "td010",
    contentId: "c010",
    contentType: "资讯投稿",
    title: "塘房镇发现千年古茶树群",
    sourceTownship: "塘房镇",
    targetTownships: ["塘房镇", "泼机镇", "乌峰街道", "旧府街道", "以古镇"],
    status: "分发中",
    publisher: "茶农老李",
    publishedAt: "2025-06-21T08:00:00Z",
    distributedAt: "2025-06-21T14:00:00Z",
    reachCount: 1890
  },
  {
    id: "td011",
    contentId: "c011",
    contentType: "租房",
    title: "乌峰街道精装两室一厅出租",
    sourceTownship: "乌峰街道",
    targetTownships: ["乌峰街道", "南台街道", "旧府街道"],
    status: "已完成",
    publisher: "小李租房",
    publishedAt: "2025-06-19T10:20:00Z",
    distributedAt: "2025-06-19T11:00:00Z",
    reachCount: 3450
  },
  {
    id: "td012",
    contentId: "c012",
    contentType: "交友信息",
    title: "98年女老师找对象",
    sourceTownship: "乌峰街道",
    targetTownships: ["乌峰街道", "南台街道", "旧府街道", "泼机镇", "以勒镇"],
    status: "待分发",
    publisher: "刘老师",
    publishedAt: "2025-06-21T19:30:00Z",
    reachCount: 0
  }
];