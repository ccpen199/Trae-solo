import {
  initDb,
  clearAllTables,
  insertNewsArticle,
  insertWorkOrder,
  insertEmergencyAlert,
  insertServiceOutlet,
  insertPublicOpinion,
  getNewsArticles,
} from './db.js';
import type {
  NewsArticle,
  WorkOrder,
  EmergencyAlert,
  ServiceOutlet,
  PublicOpinion,
} from '../shared/types.js';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysLater(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const newsSeedData: Array<Omit<NewsArticle, 'id'>> = [
  {
    title: '盐城市召开2026年度民生实事项目推进会',
    summary: '市委书记强调要把民生实事放在心上、抓在手上，确保各项任务按时高质量完成。',
    content:
      '6月20日，盐城市召开2026年度民生实事项目推进会。市委书记出席会议并讲话，强调要深入贯彻落实以人民为中心的发展思想，把民生实事放在心上、抓在手上，以更高标准、更实举措推进各项任务落地见效。\n\n会议指出，今年以来，全市上下紧紧围绕年度目标任务，凝心聚力、攻坚克难，民生实事项目总体进展顺利。截至目前，20件民生实事已完成年度投资的65%，其中5件实事已提前完成。\n\n会议要求，各级各部门要进一步提高政治站位，强化责任担当，紧盯时间节点，倒排工期、挂图作战，确保各项任务按时高质量完成。要加强统筹协调，形成工作合力，及时研究解决项目推进中的困难和问题。要强化督查考核，严格落实奖惩机制，确保民生实事项目真正惠及广大人民群众。',
    coverImage:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f5?w=800&h=450&fit=crop',
    category: 'policy',
    type: 'article',
    tags: ['民生实事', '市委会议', '政策动态'],
    source: '盐城日报',
    publishTime: hoursAgo(2),
    views: 3521,
    likes: 128,
  },
  {
    title: '盐城黄海湿地世界遗产地迎来候鸟迁徙高峰',
    summary: '近期，数十万只候鸟飞抵盐城黄海湿地，场面蔚为壮观，吸引了众多观鸟爱好者。',
    content:
      '随着候鸟迁徙季的到来，盐城黄海湿地世界遗产地迎来了候鸟迁徙的高峰期。据监测数据显示，目前已有超过30万只候鸟飞抵湿地栖息、觅食。\n\n在条子泥湿地，成群结队的丹顶鹤、勺嘴鹬、黑脸琵鹭等珍稀鸟类在滩涂上翩翩起舞，构成了一幅和谐美丽的生态画卷。不少观鸟爱好者和摄影爱好者专程从全国各地赶来，一睹候鸟风采。\n\n据湿地保护专家介绍，盐城黄海湿地是全球重要的候鸟迁徙停歇地和越冬地，每年有近百万只候鸟在此停歇、繁殖或越冬。近年来，盐城市不断加大湿地保护力度，实施了一系列生态修复工程，湿地生态环境持续改善，候鸟种群数量稳步增长。',
    category: 'culture',
    type: 'article',
    tags: ['黄海湿地', '候鸟', '生态保护', '世界遗产'],
    source: '盐城晚报',
    publishTime: hoursAgo(5),
    views: 2890,
    likes: 256,
  },
  {
    title: '关于优化亭湖区公交线路的通知',
    summary: '为方便市民出行，自6月25日起，亭湖区将优化调整3条公交线路，新增2条社区接驳线。',
    content:
      '关于优化亭湖区公交线路的通知\n\n尊敬的广大市民：\n\n为进一步优化线网布局，方便市民出行，提升公交服务水平，经研究决定，自2026年6月25日起，对亭湖区部分公交线路进行优化调整。具体如下：\n\n一、优化调整线路\n1. 3路公交：调整后途经开放大道、青年路，取消人民路路段，新增站点5个。\n2. 15路公交：延长至盐城高铁站，方便市民换乘高铁。\n3. 28路公交：优化早晚高峰发车间隔，由15分钟缩短至10分钟。\n\n二、新增社区接驳线路\n1. 接驳1号线：连接多个大型社区与地铁1号线站点。\n2. 接驳2号线：服务城南新区居民出行。\n\n请广大市民合理安排出行路线，如有疑问可拨打公交服务热线：0515-88888888。\n\n盐城市公共交通有限公司\n2026年6月20日',
    category: 'livelihood',
    type: 'article',
    tags: ['公交', '出行', '亭湖区', '便民服务'],
    source: '盐城公交',
    publishTime: hoursAgo(8),
    views: 1567,
    likes: 89,
  },
  {
    title: '视频：盐城市民文化广场启用仪式',
    summary: '总投资3.5亿元的市民文化广场今日正式启用，成为市民休闲娱乐新地标。',
    content:
      '盐城市民文化广场正式启用！这座投资3.5亿元、历时两年建设的城市文化新地标，于今日上午举行了隆重的启用仪式。\n\n广场总占地面积约120亩，集文化展示、休闲娱乐、体育健身、生态景观于一体，包括文化艺术中心、青少年活动中心、老年活动中心、图书馆分馆等多个功能区域。\n\n启用仪式现场还举办了丰富多彩的文化活动，包括非遗展示、文艺演出、书画展览等，吸引了数千名市民前来参观体验。',
    coverImage:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=450&fit=crop',
    category: 'culture',
    type: 'video',
    videoUrl: 'https://example.com/videos/cultural-square.mp4',
    tags: ['文化广场', '城市建设', '视频新闻'],
    source: '盐城广电',
    publishTime: hoursAgo(12),
    views: 5621,
    likes: 432,
  },
  {
    title: '盐城发布2026年中考招生政策',
    summary: '今年中考招生政策有新变化，普高计划扩招10%，新增2所普通高中招生。',
    content:
      '盐城市教育局今日正式发布2026年中考招生政策。今年中考将于6月16日至18日举行，全市共设考区9个、考点32个、考场1560个，报考考生4.68万人。\n\n今年中招政策主要有以下变化：\n\n一、普通高中招生计划扩招10%，全市普高招生计划达到2.8万人。\n\n二、新增盐城中学开发区校区和亭湖高级中学2所学校招生。\n\n三、优化志愿填报方式，实行平行志愿投档，降低志愿填报风险。\n\n四、加强中职与普高融通，为学生提供更多成长成才路径。\n\n市教育局提醒广大考生和家长，要密切关注官方发布的招生信息，合理填报志愿。',
    category: 'livelihood',
    type: 'article',
    tags: ['中考', '招生政策', '教育'],
    source: '盐城市教育局',
    publishTime: hoursAgo(20),
    views: 8934,
    likes: 312,
  },
  {
    title: '直播：盐城市2026年龙舟大赛',
    summary: '端午佳节来临，盐城市2026年龙舟大赛在串场河火热开赛，36支队伍同场竞技。',
    content:
      '各位网友大家好，这里是盐城市2026年"迎端午·赛龙舟"大赛的直播现场！\n\n今天的串场河上，锣鼓喧天，彩旗飘扬。来自全市各县（市、区）的36支代表队、近500名运动员齐聚一堂，在这里展开激烈角逐。\n\n本次比赛设200米直道竞速和500米直道竞速两个项目，分为机关组、企业组和群众组三个组别。经过上午的预赛，12支队伍成功晋级下午的决赛。',
    coverImage:
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&h=450&fit=crop',
    category: 'culture',
    type: 'live',
    tags: ['龙舟赛', '端午节', '直播', '群众体育'],
    source: '盐城发布',
    publishTime: daysAgo(1),
    views: 15234,
    likes: 876,
  },
  {
    title: '盐城市住房公积金政策最新调整解读',
    summary: '公积金贷款最高额度上调至80万元，多孩家庭可再上浮20%。',
    content:
      '近日，盐城市住房公积金管理中心发布最新政策调整通知，对住房公积金使用政策进行了优化完善，新政策自2026年7月1日起施行。\n\n主要调整内容如下：\n\n一、提高贷款最高额度。夫妻双方均缴存住房公积金的，贷款最高额度由60万元调整至80万元；单方缴存的，最高额度由40万元调整至50万元。\n\n二、支持多孩家庭。符合国家生育政策生育二孩及以上的家庭，住房公积金贷款最高额度可再上浮20%。\n\n三、放宽提取条件。职工及家庭成员在本市无自有住房且租赁住房的，可按月提取住房公积金支付房租。\n\n四、支持老旧小区改造。纳入本市老旧小区改造项目的房屋，业主及配偶可提取住房公积金用于支付个人承担的改造费用。',
    category: 'policy',
    type: 'article',
    tags: ['公积金', '住房政策', '民生保障'],
    source: '盐城公积金',
    publishTime: daysAgo(2),
    views: 12456,
    likes: 567,
  },
  {
    title: '盐南高新区数字经济产业园正式开园',
    summary: '首批入驻企业52家，预计年产值超30亿元，将打造全市数字经济发展新引擎。',
    content:
      '6月18日上午，盐南高新区数字经济产业园举行开园仪式。市委副书记、市长出席仪式并宣布开园。\n\n盐南高新区数字经济产业园总规划面积1500亩，总建筑面积120万平方米，重点发展人工智能、大数据、云计算、区块链等数字产业。园区已建成标准厂房50万平方米、人才公寓2000套，配套建有行政服务中心、展示中心、会议中心等公共服务设施。\n\n开园仪式上，首批52家企业签约入驻，涵盖人工智能、物联网、数字文创等多个领域，预计全部投产后年产值超30亿元，带动就业超1万人。',
    category: 'general',
    type: 'article',
    tags: ['数字经济', '产业园', '盐南高新区', '招商引资'],
    source: '盐南发布',
    publishTime: daysAgo(3),
    views: 4521,
    likes: 234,
  },
  {
    title: '盐城市第一人民医院名医专家义诊公告',
    summary: '6月25日市一院将举办大型义诊活动，20余名知名专家坐诊，免挂号费。',
    content:
      '为庆祝中国共产党成立105周年，深入开展"我为群众办实事"实践活动，盐城市第一人民医院定于6月25日举办"庆七一·惠民生"大型义诊活动。\n\n义诊时间：2026年6月25日（星期四）上午8:30-11:30\n\n义诊地点：市一院南院区门诊大厅\n\n义诊科室：心血管内科、神经内科、呼吸内科、消化内科、内分泌科、骨科、普外科、妇产科、儿科、眼科、耳鼻喉科、皮肤科等20余个临床科室\n\n义诊专家：由20余名主任医师、副主任医师组成的专家团队现场坐诊\n\n惠民举措：免挂号费、部分检查项目优惠50%、健康宣教资料免费发放\n\n欢迎广大市民朋友前来咨询就诊！',
    category: 'livelihood',
    type: 'article',
    tags: ['义诊', '医疗', '市一院', '便民服务'],
    source: '盐城市一院',
    publishTime: daysAgo(4),
    views: 6789,
    likes: 445,
  },
  {
    title: '盐城市文旅局发布暑期旅游精品线路',
    summary: '推出"生态湿地""红色记忆""海盐文化"三大主题15条精品线路，丰富市民游客假期生活。',
    content:
      '暑期将至，盐城市文化广电和旅游局精心策划推出三大主题15条精品旅游线路，邀请广大市民和游客感受盐城独特的生态之美、人文之美。\n\n一、"生态湿地"主题线路（5条）\n1. 黄海湿地世界遗产二日游\n2. 条子泥观鸟生态一日游\n3. 丹顶鹤自然保护区研学游\n4. 麋鹿保护区生态探秘游\n5. 大丰荷兰花海赏花一日游\n\n二、"红色记忆"主题线路（5条）\n1. 新四军纪念馆红色经典一日游\n2. 华中工委旧址红色研学游\n3. 五条岭烈士陵园瞻仰游\n4. 白驹狮子口会师旧址游\n5. 滨海红色文化二日游\n\n三、"海盐文化"主题线路（5条）\n1. 海盐历史文化风貌区一日游\n2. 水街庙会民俗文化体验游\n3. 安丰古镇明清建筑游\n4. 西溪泰山寺祈福文化游\n5. 东晋水城沉浸式体验游\n\n暑期期间，各景区还将推出门票优惠、特色活动等一系列惠民举措，欢迎广大市民和游客前来观光旅游。',
    category: 'culture',
    type: 'article',
    tags: ['旅游', '暑期', '精品线路', '文旅'],
    source: '盐城文旅',
    publishTime: daysAgo(5),
    views: 3456,
    likes: 198,
  },
];

const workOrderSeedData: Array<
  Omit<WorkOrder, 'id' | 'orderNo' | 'progress' | 'status'> & {
    status: WorkOrder['status'];
  }
> = [
  {
    title: '人民路与解放路交叉路口路灯损坏',
    category: '城市管理',
    description: '人民路与解放路交叉路口东南角的路灯已经坏了三天了，晚上黑漆漆的，给附近居民出行带来很大不便，存在安全隐患，请尽快安排维修。',
    status: 'completed',
    responsibleDept: '市住建局',
    submitTime: daysAgo(7),
    deadline: daysAgo(2),
    rating: 5,
  },
  {
    title: '城南新区某小区物业违规收取停车费',
    category: '市场监管',
    description: '我是城南新区某小区业主，我们小区物业未经业主同意，擅自提高地下停车位租金，由原来的200元/月涨到300元/月，并且不购买车位不让业主车辆进入小区。希望有关部门能介入调查，维护业主合法权益。',
    status: 'processing',
    responsibleDept: '市市场监督管理局',
    submitTime: daysAgo(3),
    deadline: daysLater(4),
  },
  {
    title: '青年路高架桥下积水严重',
    category: '城市管理',
    description: '青年路高架桥下（开放大道以西段）每次下雨都会积水，最深的时候能没过脚踝，行人无法通行，电动车也容易熄火。希望能尽快疏通排水管道，解决积水问题。',
    status: 'assigned',
    responsibleDept: '市城管局',
    submitTime: daysAgo(1),
    deadline: daysLater(6),
  },
  {
    title: '社保卡丢失如何补办',
    category: '社会保障',
    description: '我的社保卡不小心弄丢了，请问需要带什么材料去哪里补办？补办需要多长时间？能不能加急办理？',
    status: 'completed',
    responsibleDept: '市人社局',
    submitTime: daysAgo(10),
    deadline: daysAgo(5),
    rating: 4,
  },
  {
    title: '希望增加B支6路公交车班次',
    category: '交通运输',
    description: 'B支6路公交车上下班高峰期人特别多，经常挤不上去，发车间隔也比较长，有时候要等20多分钟。建议在早晚高峰时段增加班次，缩短发车间隔。',
    status: 'pending',
    responsibleDept: '市交通局',
    submitTime: hoursAgo(6),
    deadline: daysLater(10),
  },
  {
    title: '咨询2026年秋季小学入学政策',
    category: '教育服务',
    description: '我家孩子今年到了上小学的年龄，户口在亭湖区，房产在盐南高新区，请问应该按哪个学区报名？需要准备哪些材料？什么时候开始报名？',
    status: 'processing',
    responsibleDept: '市教育局',
    submitTime: daysAgo(2),
    deadline: daysLater(3),
  },
  {
    title: '某建筑工地夜间施工噪音扰民',
    category: '环境保护',
    description: '我家附近有个建筑工地，最近连续几天晚上都在施工，机器轰鸣声很大，严重影响家人休息。按照规定夜间22点以后不应该再施工了，希望环保部门能管一管。',
    status: 'assigned',
    responsibleDept: '市生态环境局',
    submitTime: daysAgo(1),
    deadline: daysLater(5),
  },
  {
    title: '申请办理个体工商户营业执照',
    category: '市场监管',
    description: '我想在大学城附近开一家小吃店，请问办理个体工商户营业执照需要哪些材料？大概多长时间能办好？有没有线上办理的渠道？',
    status: 'completed',
    responsibleDept: '市行政审批局',
    submitTime: daysAgo(14),
    deadline: daysAgo(10),
    rating: 5,
  },
];

const emergencyAlertSeedData: Array<Omit<EmergencyAlert, 'id'>> = [
  {
    title: '暴雨橙色预警信号',
    level: 'orange',
    type: 'rainstorm',
    content:
      '盐城市气象台2026年6月21日08时30分升级发布暴雨橙色预警信号：预计未来6小时我市北部地区（响水、滨海、阜宁）将出现6小时100毫米以上的强降水，局部伴有雷暴大风、短时强降水等强对流天气。请广大市民注意防范！',
    publishTime: hoursAgo(1),
    effectiveTime: hoursAgo(1),
    scope: '响水县、滨海县、阜宁县',
  },
  {
    title: '高温黄色预警信号',
    level: 'yellow',
    type: 'high_temp',
    content:
      '盐城市气象台2026年6月21日09时00分发布高温黄色预警信号：预计未来连续3天我市最高气温将达到35℃以上，局部地区可达37℃以上。请注意防暑降温，尽量避免高温时段户外活动。',
    publishTime: hoursAgo(4),
    effectiveTime: hoursAgo(4),
    scope: '全市范围',
  },
  {
    title: '台风蓝色预警信号',
    level: 'blue',
    type: 'typhoon',
    content:
      '盐城市气象台2026年6月20日16时00分发布台风蓝色预警信号：今年第5号台风已进入东海海域，预计22日夜间至23日白天将影响我市沿海地区，沿海海面风力可达8-10级，陆地风力6-8级，并伴有阵雨。请提前做好防范准备。',
    publishTime: daysAgo(1),
    effectiveTime: daysAgo(1),
    scope: '沿海各县（市、区）',
  },
  {
    title: '雷电黄色预警信号',
    level: 'yellow',
    type: 'other',
    content:
      '盐城市气象台2026年6月21日12时15分发布雷电黄色预警信号：预计未来6小时我市大部分地区将发生雷电活动，可能会造成雷电灾害事故，局部地区可能伴有短时强降水、8-10级雷雨大风等强对流天气。',
    publishTime: hoursAgo(2),
    effectiveTime: hoursAgo(2),
    scope: '全市范围',
  },
  {
    title: '关于做好中考期间考生服务保障的通知',
    level: 'blue',
    type: 'other',
    content:
      '中考期间（6月16日-18日），请广大市民尽量选择绿色出行方式，途经考点周边请勿鸣笛，为考生营造安静的考试环境。各考点周边将设置临时交通管制，请广大市民配合。市应急管理局联合教育局、公安局等部门，将全力做好考生服务保障工作，如遇紧急情况可拨打12345服务热线。',
    publishTime: daysAgo(6),
    effectiveTime: daysAgo(4),
    scope: '全市各考区考点',
  },
];

const serviceOutletSeedData: Array<Omit<ServiceOutlet, 'id'>> = [
  {
    name: '盐城市政务服务中心',
    type: 'health',
    address: '盐城市盐都区府西路1号',
    lat: 33.3582,
    lng: 120.1623,
    phone: '0515-12345',
    openHours: '周一至周五 09:00-17:00',
    queueCount: 18,
    queueWaitTime: 32,
  },
  {
    name: '国家电网盐城供电营业厅',
    type: 'electricity',
    address: '盐城市亭湖区建军中路28号',
    lat: 33.3885,
    lng: 120.1398,
    phone: '0515-88123456',
    openHours: '周一至周日 08:30-17:30',
    queueCount: 6,
    queueWaitTime: 12,
  },
  {
    name: '盐城汇津水务营业厅',
    type: 'water',
    address: '盐城市亭湖区解放北路38号',
    lat: 33.3956,
    lng: 120.1356,
    phone: '0515-88322456',
    openHours: '周一至周五 08:30-17:30',
    queueCount: 3,
    queueWaitTime: 8,
  },
  {
    name: '盐城燃气客户服务中心',
    type: 'gas',
    address: '盐城市亭湖区开放大道78号',
    lat: 33.3789,
    lng: 120.1556,
    phone: '0515-88556677',
    openHours: '周一至周六 08:30-17:00',
    queueCount: 9,
    queueWaitTime: 18,
  },
  {
    name: '盐城市第一人民医院南院区',
    type: 'health',
    address: '盐城市盐南高新区人民南路66号',
    lat: 33.3423,
    lng: 120.1789,
    phone: '0515-88011120',
    openHours: '24小时（急诊）',
    queueCount: 45,
    queueWaitTime: 58,
  },
  {
    name: '亭湖区政务服务中心',
    type: 'health',
    address: '盐城市亭湖区青年东路51号',
    lat: 33.3712,
    lng: 120.1689,
    phone: '0515-88998899',
    openHours: '周一至周五 09:00-17:00',
    queueCount: 12,
    queueWaitTime: 22,
  },
  {
    name: '盐都区政务服务中心',
    type: 'health',
    address: '盐城市盐都区新都路618号',
    lat: 33.3456,
    lng: 120.1423,
    phone: '0515-88445566',
    openHours: '周一至周五 09:00-17:00',
    queueCount: 8,
    queueWaitTime: 15,
  },
  {
    name: '盐城经济技术开发区供电所',
    type: 'electricity',
    address: '盐城市经济技术开发区黄山南路9号',
    lat: 33.3623,
    lng: 120.1956,
    phone: '0515-88778899',
    openHours: '周一至周五 08:30-17:30',
    queueCount: 2,
    queueWaitTime: 5,
  },
  {
    name: '盐城市第三人民医院',
    type: 'health',
    address: '盐城市盐都区盐渎路699号',
    lat: 33.3345,
    lng: 120.1356,
    phone: '0515-88888333',
    openHours: '24小时（急诊）',
    queueCount: 28,
    queueWaitTime: 42,
  },
  {
    name: '城南新区水务服务站',
    type: 'water',
    address: '盐城市盐南高新区解放南路288号',
    lat: 33.3267,
    lng: 120.1678,
    phone: '0515-88223344',
    openHours: '周一至周五 08:30-17:30',
    queueCount: 4,
    queueWaitTime: 10,
  },
];

const publicOpinionSeedData: Array<
  Omit<PublicOpinion, 'id' | 'relatedArticles' | 'trend'>
> = [
  {
    keyword: '黄海湿地保护',
    sentimentScore: 0.85,
    spreadCount: 15623,
    riskLevel: 'low',
  },
  {
    keyword: '中考招生政策',
    sentimentScore: 0.42,
    spreadCount: 8934,
    riskLevel: 'medium',
  },
  {
    keyword: '公积金贷款调整',
    sentimentScore: 0.78,
    spreadCount: 12456,
    riskLevel: 'low',
  },
  {
    keyword: '小区物业纠纷',
    sentimentScore: -0.35,
    spreadCount: 3421,
    riskLevel: 'medium',
  },
  {
    keyword: '夜间施工噪音',
    sentimentScore: -0.68,
    spreadCount: 2156,
    riskLevel: 'high',
  },
  {
    keyword: '公交线路优化',
    sentimentScore: 0.62,
    spreadCount: 1567,
    riskLevel: 'low',
  },
  {
    keyword: '高温天气应对',
    sentimentScore: 0.28,
    spreadCount: 5621,
    riskLevel: 'medium',
  },
  {
    keyword: '龙舟大赛活动',
    sentimentScore: 0.92,
    spreadCount: 15234,
    riskLevel: 'low',
  },
];

export function runSeed(): void {
  initDb();

  const existing = getNewsArticles();
  if (existing.total > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  console.log('Clearing tables...');
  clearAllTables();

  console.log('Seeding news articles...');
  for (const article of newsSeedData) {
    insertNewsArticle(article);
  }

  console.log('Seeding work orders...');
  for (const order of workOrderSeedData) {
    insertWorkOrder(order);
  }

  console.log('Seeding emergency alerts...');
  for (const alert of emergencyAlertSeedData) {
    insertEmergencyAlert(alert);
  }

  console.log('Seeding service outlets...');
  for (const outlet of serviceOutletSeedData) {
    insertServiceOutlet(outlet);
  }

  console.log('Seeding public opinions...');
  for (const opinion of publicOpinionSeedData) {
    insertPublicOpinion(opinion);
  }

  console.log('Database seed completed successfully!');
}

export function resetAndSeed(): void {
  initDb();
  clearAllTables();
  runSeed();
}
