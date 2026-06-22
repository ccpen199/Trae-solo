import type { InfoPost } from "../types";

const avatar = (seed: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`中文社交应用用户头像，${seed}风格，简约大方`)}&image_size=square`;

const postImg = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`;

export const jobPosts: InfoPost[] = [
  {
    id: "j001",
    type: "job",
    title: "镇雄县城超市急招收银员",
    content: "镇雄恒丰超市因业务扩展，现招收银员3名，年龄18-35岁，有经验者优先，待遇从优，包工作餐",
    images: [postImg("中国县城超市收银台，员工在操作收银机，整洁明亮")],
    author: "恒丰人力",
    authorAvatar: avatar("企业蓝色"),
    createdAt: "2025-06-18T09:30:00Z",
    location: { lat: 27.4418, lng: 104.8762, township: "乌峰街道" },
    tags: ["收银员", "全职", "包餐"],
    status: "approved",
    views: 342,
    structuredData: {
      salary: "3000-4000元/月",
      company: "镇雄恒丰购物中心",
      requirements: "18-35岁，有收银经验优先，会基本电脑操作"
    }
  },
  {
    id: "j002",
    type: "job",
    title: "以勒镇工地招瓦工木工",
    content: "以勒镇新建住宅项目招瓦工5名、木工3名，日结工资，包吃住，工期3个月",
    images: [postImg("中国乡镇建筑工地，工人在砌墙，安全帽，脚手架")],
    author: "以勒建工",
    authorAvatar: avatar("橙色建筑"),
    createdAt: "2025-06-17T14:20:00Z",
    location: { lat: 27.5021, lng: 104.9873, township: "以勒镇" },
    tags: ["瓦工", "木工", "日结", "包吃住"],
    status: "approved",
    views: 518,
    structuredData: {
      salary: "250-350元/天",
      company: "以勒镇住宅项目部",
      requirements: "有瓦工或木工经验，能吃苦耐劳，自备工具优先"
    }
  },
  {
    id: "j003",
    type: "job",
    title: "镇雄幼儿园招聘幼师",
    content: "镇阳县幼儿园招聘幼教老师2名，要求学前教育专业毕业，有爱心耐心，持有教师资格证",
    images: [postImg("中国幼儿园教室，幼师带着小朋友做游戏，彩色桌椅，温馨环境")],
    author: "阳光幼教",
    authorAvatar: avatar("粉色温馨"),
    createdAt: "2025-06-16T10:00:00Z",
    location: { lat: 27.4436, lng: 104.8735, township: "乌峰街道" },
    tags: ["幼师", "全职", "教育"],
    status: "approved",
    views: 276,
    structuredData: {
      salary: "3500-5000元/月",
      company: "镇雄县幼儿园",
      requirements: "学前教育专业大专以上，持教师资格证，有经验者优先"
    }
  },
  {
    id: "j004",
    type: "job",
    title: "泼机镇电商运营招聘",
    content: "泼机镇农特产电商公司招运营2名，负责店铺运营和直播带货，有电商经验优先",
    images: [postImg("中国乡村电商直播间，主播在直播卖农产品，补光灯和手机支架")],
    author: "泼机优品",
    authorAvatar: avatar("绿色电商"),
    createdAt: "2025-06-15T16:45:00Z",
    location: { lat: 27.3912, lng: 104.9153, township: "泼机镇" },
    tags: ["电商运营", "直播", "全职"],
    status: "approved",
    views: 189,
    structuredData: {
      salary: "4000-6000元/月+提成",
      company: "泼机镇农特产电商中心",
      requirements: "熟悉淘宝拼多多运营，有直播经验优先，会基础视频剪辑"
    }
  },
  {
    id: "j005",
    type: "job",
    title: "镇雄县城快递员招募",
    content: "顺丰速运镇雄网点招快递员4名，自备电动车，区域固定，多劳多得",
    images: [postImg("中国快递员骑着电动车穿梭在县城街道，绿色快递箱，小城市街景")],
    author: "顺丰镇雄",
    authorAvatar: avatar("黑色物流"),
    createdAt: "2025-06-14T08:15:00Z",
    location: { lat: 27.4381, lng: 104.8692, township: "南台街道" },
    tags: ["快递员", "多劳多得", "自备车"],
    status: "approved",
    views: 423,
    structuredData: {
      salary: "5000-8000元/月",
      company: "顺丰速运镇雄网点",
      requirements: "18-45岁，自备电动车，熟悉镇雄县城路线，能吃苦耐劳"
    }
  },
  {
    id: "j006",
    type: "job",
    title: "芒部镇农技站招技术员",
    content: "芒部镇农技站招聘农业技术员1名，负责农技推广和病虫害防治指导，农学相关专业",
    images: [postImg("中国乡镇农技站技术员在田间查看农作物，稻田和远山")],
    author: "芒部农技",
    authorAvatar: avatar("绿色农业"),
    createdAt: "2025-06-13T11:30:00Z",
    location: { lat: 27.5317, lng: 104.8512, township: "芒部镇" },
    tags: ["农技员", "全职", "事业编"],
    status: "approved",
    views: 156,
    structuredData: {
      salary: "4000-5000元/月",
      company: "芒部镇农业技术推广站",
      requirements: "农学相关专业大专以上，有农技推广经验优先，能下乡入户"
    }
  },
  {
    id: "j007",
    type: "job",
    title: "镇雄火锅店招厨师帮厨",
    content: "镇雄老灶火锅店招主厨1名、帮厨2名，有火锅店经验优先，待遇丰厚包食宿",
    images: [postImg("中国火锅店后厨，厨师在准备食材，大锅底料，新鲜蔬菜肉类")],
    author: "老灶火锅",
    authorAvatar: avatar("红色美食"),
    createdAt: "2025-06-12T15:00:00Z",
    location: { lat: 27.4436, lng: 104.8735, township: "乌峰街道" },
    tags: ["厨师", "帮厨", "包食宿"],
    status: "approved",
    views: 287,
    structuredData: {
      salary: "主厨6000-8000元/月，帮厨3000-4000元/月",
      company: "镇雄老灶火锅店",
      requirements: "主厨需3年以上火锅店经验，帮厨需1年以上餐饮经验，身体健康"
    }
  },
  {
    id: "j008",
    type: "job",
    title: "五德镇服装厂招缝纫工",
    content: "五德镇服装加工厂招缝纫工10名，计件工资，提供培训，新手也可上手",
    images: [postImg("中国乡镇服装厂车间，缝纫机排列整齐，女工在缝制衣服")],
    author: "五德服装",
    authorAvatar: avatar("紫色时尚"),
    createdAt: "2025-06-10T09:00:00Z",
    location: { lat: 27.3826, lng: 104.6234, township: "五德镇" },
    tags: ["缝纫工", "计件", "可培训"],
    status: "approved",
    views: 198,
    structuredData: {
      salary: "计件3000-6000元/月",
      company: "五德镇服装加工厂",
      requirements: "女性优先，18-50岁，无经验可培训，手脚麻利"
    }
  }
];

export const housingPosts: InfoPost[] = [
  {
    id: "h001",
    type: "housing",
    title: "乌峰街道精装两室一厅出租",
    content: "乌峰街道建设路中段，精装两室一厅，家电齐全，拎包入住，紧邻学校和菜市场，交通便利",
    images: [postImg("中国县城精装两室一厅出租房，客厅明亮，沙发电视，干净整洁")],
    author: "小李租房",
    authorAvatar: avatar("蓝色房屋"),
    createdAt: "2025-06-19T10:20:00Z",
    location: { lat: 27.4436, lng: 104.8735, township: "乌峰街道" },
    tags: ["两室一厅", "精装修", "拎包入住"],
    status: "approved",
    views: 456,
    structuredData: {
      price: "1200元/月",
      area: "78平方米",
      deposit: "押一付三",
      furniture: "空调、洗衣机、冰箱、热水器、床、衣柜、沙发"
    }
  },
  {
    id: "h002",
    type: "housing",
    title: "以勒镇临街商铺转让",
    content: "以勒镇中心街临街商铺，面积50平，目前经营小超市，客源稳定，因个人原因整体转让",
    images: [postImg("中国乡镇临街小超市商铺，门面宽敞，货架整齐，位置好")],
    author: "王老板",
    authorAvatar: avatar("金色商业"),
    createdAt: "2025-06-18T14:30:00Z",
    location: { lat: 27.5021, lng: 104.9873, township: "以勒镇" },
    tags: ["商铺转让", "临街", "客源稳定"],
    status: "approved",
    views: 312,
    structuredData: {
      price: "转让费8万元",
      area: "50平方米",
      deposit: "月租1500元",
      furniture: "货架、冰柜、收银台"
    }
  },
  {
    id: "h003",
    type: "housing",
    title: "南台街道单间出租学生优先",
    content: "南台街道民主路附近，独立单间带卫生间，安静适合学生和上班族，水电网费另算",
    images: [postImg("中国县城出租单间，简洁干净，单人床书桌衣柜，独立卫生间")],
    author: "张阿姨",
    authorAvatar: avatar("绿色亲和"),
    createdAt: "2025-06-17T08:00:00Z",
    location: { lat: 27.4381, lng: 104.8692, township: "南台街道" },
    tags: ["单间", "学生优先", "独立卫浴"],
    status: "approved",
    views: 234,
    structuredData: {
      price: "500元/月",
      area: "20平方米",
      deposit: "押一付一",
      furniture: "床、书桌、衣柜、热水器"
    }
  },
  {
    id: "h004",
    type: "housing",
    title: "旧府街道三室两厅新房出租",
    content: "旧府街道新小区电梯房，三室两厅两卫，全新装修未入住，采光好视野开阔，可办公可居住",
    images: [postImg("中国县城新小区三室两厅新房，现代装修，大阳台，采光极好")],
    author: "阳光房产",
    authorAvatar: avatar("橙色房产"),
    createdAt: "2025-06-16T16:00:00Z",
    location: { lat: 27.4355, lng: 104.8821, township: "旧府街道" },
    tags: ["三室两厅", "新房", "电梯房"],
    status: "approved",
    views: 189,
    structuredData: {
      price: "2200元/月",
      area: "120平方米",
      deposit: "押一付六",
      furniture: "全屋定制衣柜、厨卫齐全，可配家电"
    }
  },
  {
    id: "h005",
    type: "housing",
    title: "塘房镇农家小院出售",
    content: "塘房镇近郊农家小院，二层小楼带院子，面积200平，可做农家乐或民宿，环境清幽",
    images: [postImg("云南乡村农家小院，二层白墙楼房，院子里种满花草，青山背景")],
    author: "乡村地产",
    authorAvatar: avatar("绿色田园"),
    createdAt: "2025-06-15T11:30:00Z",
    location: { lat: 27.4183, lng: 104.9312, township: "塘房镇" },
    tags: ["农家小院", "出售", "带院子"],
    status: "approved",
    views: 378,
    structuredData: {
      price: "35万元",
      area: "200平方米",
      deposit: "一次性付款",
      furniture: "简装，基本生活设施齐全"
    }
  },
  {
    id: "h006",
    type: "housing",
    title: "泼机镇门面房出租可做餐饮",
    content: "泼机镇兴农路临街门面，上下两层共80平，有排烟管道可做餐饮，门前可停车",
    images: [postImg("中国乡镇临街餐饮门面房，两层楼，招牌位置显眼，门前可停车")],
    author: "兴农物业",
    authorAvatar: avatar("红色商业"),
    createdAt: "2025-06-14T09:15:00Z",
    location: { lat: 27.3912, lng: 104.9153, township: "泼机镇" },
    tags: ["门面出租", "可做餐饮", "可停车"],
    status: "approved",
    views: 267,
    structuredData: {
      price: "1800元/月",
      area: "80平方米",
      deposit: "押二付六",
      furniture: "排烟管道、水电齐全，其余自配"
    }
  }
];

export const foodPosts: InfoPost[] = [
  {
    id: "f001",
    type: "food",
    title: "镇雄烧洋芋——街头不可错过的美味",
    content: "镇雄街头最经典的小吃就是烧洋芋，高原土豆直接炭火烤至外皮焦脆、内里软糯，蘸上辣椒面和折耳根，一口下去满嘴留香。推荐南台街老张家的，每天下午3点出摊",
    images: [postImg("云南镇雄街头烧洋芋小吃，炭火烤土豆，金黄焦脆外皮，蘸辣椒面")],
    author: "吃货小王",
    authorAvatar: avatar("橙色美食"),
    createdAt: "2025-06-19T12:00:00Z",
    location: { lat: 27.4381, lng: 104.8692, township: "南台街道" },
    tags: ["烧洋芋", "街头小吃", "本地特色"],
    status: "approved",
    views: 623
  },
  {
    id: "f002",
    type: "food",
    title: "泼机镇酸汤鱼真安逸",
    content: "泼机镇老街酸汤鱼馆，用本地番茄发酵做酸汤，配上赤水河鲜鱼，酸辣鲜香，再来碗米饭绝了！人均40块吃到撑",
    images: [postImg("云南酸汤鱼，红汤翻滚，鲜嫩鱼肉，香菜葱花点缀，热气腾腾")],
    author: "酸汤控",
    authorAvatar: avatar("红色辣味"),
    createdAt: "2025-06-18T18:30:00Z",
    location: { lat: 27.3912, lng: 104.9153, township: "泼机镇" },
    tags: ["酸汤鱼", "本地特色", "人均40"],
    status: "approved",
    views: 412
  },
  {
    id: "f003",
    type: "food",
    title: "夏天来碗镇雄凉糕降降温",
    content: "镇雄夏天必吃凉糕！米浆蒸出来的凉糕口感细滑，浇上红糖水，冰凉清甜。乌峰街道菜市场旁边李婆婆家的最正宗",
    images: [postImg("云南凉糕甜品，白色晶莹的凉糕块，浇红糖水，碗里冰凉清爽")],
    author: "甜品达人",
    authorAvatar: avatar("粉色甜蜜"),
    createdAt: "2025-06-17T15:00:00Z",
    location: { lat: 27.4436, lng: 104.8735, township: "乌峰街道" },
    tags: ["凉糕", "夏季消暑", "甜品"],
    status: "approved",
    views: 345
  },
  {
    id: "f004",
    type: "food",
    title: "大湾镇腊肉炒折耳根味道巴适",
    content: "大湾镇农家腊肉配上新鲜折耳根爆炒，腊肉的烟熏味和折耳根的独特香气完美融合，下饭神菜！",
    images: [postImg("云南腊肉炒折耳根，深色腊肉薄片和绿色折耳根，爆炒光泽诱人")],
    author: "山里味道",
    authorAvatar: avatar("绿色自然"),
    createdAt: "2025-06-16T19:00:00Z",
    location: { lat: 27.4782, lng: 104.9384, township: "大湾镇" },
    tags: ["腊肉", "折耳根", "农家菜"],
    status: "approved",
    views: 289
  },
  {
    id: "f005",
    type: "food",
    title: "镇雄豆花面——早餐首选",
    content: "镇雄人的早晨从一碗豆花面开始，嫩滑豆花配上劲道面条，再来勺油辣子，简单却让人回味无穷。旧府街赵记豆花面，开了三十年了",
    images: [postImg("云南豆花面早餐，白嫩豆花铺在面条上，红油辣子浇头，葱花点缀")],
    author: "早餐侠",
    authorAvatar: avatar("黄色活力"),
    createdAt: "2025-06-15T07:30:00Z",
    location: { lat: 27.4355, lng: 104.8821, township: "旧府街道" },
    tags: ["豆花面", "早餐", "老字号"],
    status: "approved",
    views: 501
  },
  {
    id: "f006",
    type: "food",
    title: "芒部镇野生菌火锅季来啦",
    content: "每年六月到九月是云南野生菌的季节，芒部镇多家餐馆推出野生菌火锅，鸡枞菌、牛肝菌、青头菌应有尽有，鲜到眉毛掉下来！",
    images: [postImg("云南野生菌火锅，锅里各种颜色的新鲜野生菌，鸡枞菌牛肝菌，热气腾腾")],
    author: "菌子迷",
    authorAvatar: avatar("棕色山珍"),
    createdAt: "2025-06-14T20:00:00Z",
    location: { lat: 27.5317, lng: 104.8512, township: "芒部镇" },
    tags: ["野生菌", "火锅", "时令美食"],
    status: "approved",
    views: 567
  }
];

export const datingPosts: InfoPost[] = [
  {
    id: "d001",
    type: "dating",
    title: "90后镇雄姑娘真诚交友",
    content: "本人女，93年出生，身高160，镇雄县城工作，性格开朗喜欢做饭旅行，希望找一位踏实靠谱的男生，年龄30-38岁，有稳定工作",
    images: [],
    author: "小敏",
    authorAvatar: avatar("粉色温柔"),
    createdAt: "2025-06-19T20:00:00Z",
    location: { lat: 27.4436, lng: 104.8735, township: "乌峰街道" },
    tags: ["90后", "真诚交友", "镇雄县城"],
    status: "approved",
    views: 834
  },
  {
    id: "d002",
    type: "dating",
    title: "以勒镇小伙找对象",
    content: "本人男，95年，身高172，以勒镇开小超市，有房有车，性格老实本分，想找一位善良勤劳的姑娘，镇雄本地人优先",
    images: [],
    author: "小赵",
    authorAvatar: avatar("蓝色稳重"),
    createdAt: "2025-06-18T21:00:00Z",
    location: { lat: 27.5021, lng: 104.9873, township: "以勒镇" },
    tags: ["95后", "有房有车", "本地优先"],
    status: "approved",
    views: 672
  },
  {
    id: "d003",
    type: "dating",
    title: "87年镇雄男教师觅良缘",
    content: "本人男，87年出生，镇雄中学教师，研究生学历，有房，喜欢读书运动，希望找一位志同道合的伴侣，学历大专以上",
    images: [],
    author: "张老师",
    authorAvatar: avatar("深蓝知性"),
    createdAt: "2025-06-17T19:30:00Z",
    location: { lat: 27.4355, lng: 104.8821, township: "旧府街道" },
    tags: ["教师", "研究生", "觅良缘"],
    status: "approved",
    views: 543
  },
  {
    id: "d004",
    type: "dating",
    title: "泼机镇姑娘寻觅有缘人",
    content: "本人女，96年出生，身高158，在泼机镇做电商，活泼外向，喜欢拍短视频和做手工，想找一位阳光上进的男生，镇雄周边均可",
    images: [],
    author: "小花",
    authorAvatar: avatar("绿色活泼"),
    createdAt: "2025-06-16T22:00:00Z",
    location: { lat: 27.3912, lng: 104.9153, township: "泼机镇" },
    tags: ["96后", "电商", "活泼外向"],
    status: "approved",
    views: 498
  }
];
