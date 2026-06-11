import type { Task } from '@/types'

export const tasks: Task[] = [
  {
    id: 'T001', title: '电商平台用户满意度问卷填写', description: '完成电商平台用户满意度调查问卷，需完整作答所有问题并截图提交确认页面。问卷约30道题，预计耗时15分钟。',
    difficulty: 'L1', deliveryStandards: ['完整作答所有30道题目', '截图提交最终确认页面', 'IP地址需与注册地一致'], acceptancePeriod: '24h',
    basePrice: 8, currentPrice: 8, totalSlots: 200, takenSlots: 156, categoryId: 'survey',
    employerId: 'E001', employerName: '慧研科技', status: 'open',
    createdAt: '2026-06-10T09:00:00Z', deadline: '2026-06-15T23:59:59Z', complianceStatus: 'approved', heatScore: 92
  },
  {
    id: 'T002', title: '餐厅菜品图片标注分类', description: '对提供的餐厅菜品图片进行分类标注，包括菜系、食材、烹饪方式等标签。每组50张图片。',
    difficulty: 'L2', deliveryStandards: ['按模板格式填写标注结果', '每张图片至少3个标签', '分类准确率需达90%以上'], acceptancePeriod: '72h',
    basePrice: 35, currentPrice: 35, totalSlots: 50, takenSlots: 38, categoryId: 'data-entry',
    employerId: 'E002', employerName: '食趣网络', status: 'open',
    createdAt: '2026-06-09T14:00:00Z', deadline: '2026-06-20T23:59:59Z', complianceStatus: 'approved', heatScore: 87
  },
  {
    id: 'T003', title: '短视频内容合规审核', description: '审核用户上传的短视频内容是否违反社区规范，包括涉黄、涉暴、虚假信息等判定。需逐条审核并填写审核意见。',
    difficulty: 'L3', deliveryStandards: ['逐条审核并标记违规类型', '填写审核意见不少于20字', '审核准确率需达95%以上'], acceptancePeriod: '72h',
    basePrice: 60, currentPrice: 60, totalSlots: 30, takenSlots: 22, categoryId: 'content-review',
    employerId: 'E003', employerName: '光影传媒', status: 'open',
    createdAt: '2026-06-10T08:00:00Z', deadline: '2026-06-18T23:59:59Z', complianceStatus: 'approved', heatScore: 85
  },
  {
    id: 'T004', title: '企业品牌LOGO设计方案', description: '为初创科技公司设计品牌LOGO，需提供3套不同风格的方案，含矢量源文件及使用规范说明。',
    difficulty: 'L4', deliveryStandards: ['提供3套不同风格方案', 'AI/EPS矢量源文件', '附带色彩规范和使用说明', '原创设计不得抄袭'], acceptancePeriod: '7d',
    basePrice: 500, currentPrice: 500, totalSlots: 5, takenSlots: 3, categoryId: 'design',
    employerId: 'E001', employerName: '慧研科技', status: 'open',
    createdAt: '2026-06-08T10:00:00Z', deadline: '2026-06-25T23:59:59Z', complianceStatus: 'approved', heatScore: 78
  },
  {
    id: 'T005', title: '移动应用功能测试报告', description: '对iOS/Android双端应用进行全面功能测试，覆盖核心流程50+测试用例，需提交详细测试报告含截图和复现步骤。',
    difficulty: 'L5', deliveryStandards: ['覆盖全部50+测试用例', '每个用例含截图和操作步骤', 'Bug需附复现步骤和环境信息', '提交汇总测试报告'], acceptancePeriod: '7d',
    basePrice: 1200, currentPrice: 1200, totalSlots: 3, takenSlots: 1, categoryId: 'testing',
    employerId: 'E004', employerName: '智测科技', status: 'open',
    createdAt: '2026-06-07T16:00:00Z', deadline: '2026-06-30T23:59:59Z', complianceStatus: 'approved', heatScore: 72
  },
  {
    id: 'T006', title: '社区团购满意度调研', description: '完成社区团购使用体验调研，共20道选择题+2道开放题，需提供真实使用经历反馈。',
    difficulty: 'L1', deliveryStandards: ['完整作答所有题目', '开放题不少于50字', '截图确认提交页面'], acceptancePeriod: '24h',
    basePrice: 6, currentPrice: 6.9, totalSlots: 300, takenSlots: 247, categoryId: 'survey',
    employerId: 'E005', employerName: '邻享生活', status: 'open',
    createdAt: '2026-06-10T07:00:00Z', deadline: '2026-06-14T23:59:59Z', complianceStatus: 'approved', heatScore: 95
  },
  {
    id: 'T007', title: '商品信息录入校验', description: '将图片中的商品信息（名称、规格、价格、条码）录入系统，并进行交叉校验确保准确。',
    difficulty: 'L2', deliveryStandards: ['按字段准确录入商品信息', '条码需与图片完全一致', '错误率不超过2%'], acceptancePeriod: '72h',
    basePrice: 25, currentPrice: 28.75, totalSlots: 80, takenSlots: 65, categoryId: 'data-entry',
    employerId: 'E006', employerName: '品汇商贸', status: 'open',
    createdAt: '2026-06-09T11:00:00Z', deadline: '2026-06-19T23:59:59Z', complianceStatus: 'approved', heatScore: 88
  },
  {
    id: 'T008', title: '在线教育课程体验评测', description: '体验指定的在线课程（3节），从内容质量、交互体验、知识点覆盖等维度进行评测。',
    difficulty: 'L2', deliveryStandards: ['完整观看3节课程', '按评测表填写各维度评分', '提交不少于200字总评'], acceptancePeriod: '72h',
    basePrice: 40, currentPrice: 40, totalSlots: 40, takenSlots: 28, categoryId: 'testing',
    employerId: 'E007', employerName: '学海教育', status: 'open',
    createdAt: '2026-06-10T06:00:00Z', deadline: '2026-06-22T23:59:59Z', complianceStatus: 'approved', heatScore: 82
  },
  {
    id: 'T009', title: '英文产品说明书翻译校对', description: '对英文产品说明书进行中文翻译校对，约5000字，需确保术语准确、语句通顺。',
    difficulty: 'L4', deliveryStandards: ['全文翻译校对完成', '专业术语统一使用标准译名', '语句通顺符合中文表达习惯'], acceptancePeriod: '7d',
    basePrice: 350, currentPrice: 350, totalSlots: 8, takenSlots: 5, categoryId: 'translation',
    employerId: 'E002', employerName: '食趣网络', status: 'open',
    createdAt: '2026-06-08T13:00:00Z', deadline: '2026-06-28T23:59:59Z', complianceStatus: 'approved', heatScore: 75
  },
  {
    id: 'T010', title: '公众号文章撰写', description: '撰写健康养生类公众号文章，要求原创，字数1500-2000字，配2-3张相关图片。',
    difficulty: 'L3', deliveryStandards: ['原创内容查重率低于10%', '字数1500-2000字', '配2-3张高清相关图片', '符合公众号排版规范'], acceptancePeriod: '7d',
    basePrice: 150, currentPrice: 150, totalSlots: 10, takenSlots: 7, categoryId: 'writing',
    employerId: 'E008', employerName: '康养生活', status: 'open',
    createdAt: '2026-06-09T09:00:00Z', deadline: '2026-06-23T23:59:59Z', complianceStatus: 'approved', heatScore: 80
  },
  {
    id: 'T011', title: 'APP开屏广告素材制作', description: '设计制作APP开屏广告图片，3套方案，尺寸1080×1920，需含品牌元素和CTA按钮。',
    difficulty: 'L4', deliveryStandards: ['3套不同风格方案', '1080×1920像素PSD/AI源文件', '含品牌元素和CTA', '导出JPG预览图'], acceptancePeriod: '7d',
    basePrice: 450, currentPrice: 450, totalSlots: 4, takenSlots: 2, categoryId: 'design',
    employerId: 'E003', employerName: '光影传媒', status: 'open',
    createdAt: '2026-06-08T15:00:00Z', deadline: '2026-06-26T23:59:59Z', complianceStatus: 'approved', heatScore: 76
  },
  {
    id: 'T012', title: '社交媒体文案编写', description: '为美妆品牌编写小红书种草文案，3篇，每篇500-800字含emoji和话题标签。',
    difficulty: 'L2', deliveryStandards: ['3篇原创文案', '每篇500-800字', '含emoji和#话题标签', '符合小红书内容风格'], acceptancePeriod: '72h',
    basePrice: 30, currentPrice: 34.5, totalSlots: 20, takenSlots: 14, categoryId: 'writing',
    employerId: 'E009', employerName: '花颜美妆', status: 'open',
    createdAt: '2026-06-10T10:00:00Z', deadline: '2026-06-17T23:59:59Z', complianceStatus: 'approved', heatScore: 84
  },
  {
    id: 'T013', title: '产品宣传短视频剪辑', description: '剪辑30秒产品宣传短视频，需含字幕、配乐、转场特效，提供竖版和横版各一条。',
    difficulty: 'L4', deliveryStandards: ['30秒成品竖版横版各一条', '含字幕和配乐', '转场特效流畅', 'PR/FCP源文件+导出MP4'], acceptancePeriod: '7d',
    basePrice: 600, currentPrice: 600, totalSlots: 6, takenSlots: 4, categoryId: 'video',
    employerId: 'E003', employerName: '光影传媒', status: 'open',
    createdAt: '2026-06-09T16:00:00Z', deadline: '2026-06-27T23:59:59Z', complianceStatus: 'approved', heatScore: 74
  },
  {
    id: 'T014', title: '在线客服话术应答', description: '根据客户咨询场景，编写标准客服应答话术模板，覆盖售前咨询、售后维权、物流查询等10个场景。',
    difficulty: 'L3', deliveryStandards: ['覆盖10个指定场景', '每个场景3-5套话术', '语气友善专业', '符合品牌调性'], acceptancePeriod: '7d',
    basePrice: 120, currentPrice: 120, totalSlots: 15, takenSlots: 9, categoryId: 'customer-service',
    employerId: 'E005', employerName: '邻享生活', status: 'open',
    createdAt: '2026-06-09T08:00:00Z', deadline: '2026-06-24T23:59:59Z', complianceStatus: 'approved', heatScore: 79
  },
  {
    id: 'T015', title: '微信小程序开发', description: '开发一个社区团购微信小程序，含商品展示、下单、支付、团长管理等功能模块。',
    difficulty: 'L5', deliveryStandards: ['完成全部功能模块开发', '通过微信审核上线', '提供完整源码和部署文档', 'UI符合设计稿'], acceptancePeriod: '7d',
    basePrice: 8000, currentPrice: 8000, totalSlots: 1, takenSlots: 0, categoryId: 'programming',
    employerId: 'E005', employerName: '邻享生活', status: 'open',
    createdAt: '2026-06-07T09:00:00Z', deadline: '2026-07-10T23:59:59Z', complianceStatus: 'approved', heatScore: 65
  },
  {
    id: 'T016', title: '市场竞品分析报告', description: '针对3款竞品进行深度分析，包括功能对比、用户评价、定价策略、市场定位等维度。',
    difficulty: 'L3', deliveryStandards: ['覆盖3款竞品全维度分析', '含数据图表支撑', '不少于3000字', '提出可执行建议'], acceptancePeriod: '7d',
    basePrice: 200, currentPrice: 200, totalSlots: 5, takenSlots: 3, categoryId: 'writing',
    employerId: 'E001', employerName: '慧研科技', status: 'open',
    createdAt: '2026-06-08T11:00:00Z', deadline: '2026-06-28T23:59:59Z', complianceStatus: 'approved', heatScore: 77
  },
  {
    id: 'T017', title: '社区满意度问卷填写', description: '参与居住社区服务满意度调研，15道题，需真实反馈社区居住体验。',
    difficulty: 'L1', deliveryStandards: ['完整作答所有15道题', '开放题不少于30字', '截图确认页面'], acceptancePeriod: '24h',
    basePrice: 5, currentPrice: 5, totalSlots: 500, takenSlots: 412, categoryId: 'survey',
    employerId: 'E010', employerName: '和谐物业', status: 'open',
    createdAt: '2026-06-10T05:00:00Z', deadline: '2026-06-13T23:59:59Z', complianceStatus: 'pending', heatScore: 96
  },
  {
    id: 'T018', title: '日语游戏文本翻译', description: '将手游日语文本翻译为中文，约8000字，需熟悉游戏术语，保持原文风格。',
    difficulty: 'L5', deliveryStandards: ['全文翻译完成', '游戏术语使用标准译名', '保持原文风格和语境', '查重率低于5%'], acceptancePeriod: '7d',
    basePrice: 1500, currentPrice: 1500, totalSlots: 2, takenSlots: 1, categoryId: 'translation',
    employerId: 'E011', employerName: '幻境游戏', status: 'open',
    createdAt: '2026-06-07T14:00:00Z', deadline: '2026-07-05T23:59:59Z', complianceStatus: 'approved', heatScore: 68
  },
  {
    id: 'T019', title: '电商商品图片精修', description: '对20张电商商品图片进行精修处理，包括调色、去水印、添加阴影等，统一视觉风格。',
    difficulty: 'L3', deliveryStandards: ['20张图片全部精修', '统一视觉风格和色调', 'PSD源文件+JPG导出', '分辨率不低于300dpi'], acceptancePeriod: '72h',
    basePrice: 180, currentPrice: 180, totalSlots: 10, takenSlots: 6, categoryId: 'design',
    employerId: 'E006', employerName: '品汇商贸', status: 'open',
    createdAt: '2026-06-09T12:00:00Z', deadline: '2026-06-19T23:59:59Z', complianceStatus: 'approved', heatScore: 81
  },
  {
    id: 'T020', title: '智能家居App用户体验测试', description: '测试智能家居App的设备连接、场景联动、远程控制等核心功能，覆盖iOS/Android双端。',
    difficulty: 'L3', deliveryStandards: ['覆盖全部测试用例', '每个用例附截图和操作说明', 'Bug附复现步骤', '双端均需测试'], acceptancePeriod: '7d',
    basePrice: 250, currentPrice: 250, totalSlots: 8, takenSlots: 5, categoryId: 'testing',
    employerId: 'E012', employerName: '智家科技', status: 'open',
    createdAt: '2026-06-08T09:00:00Z', deadline: '2026-06-25T23:59:59Z', complianceStatus: 'pending', heatScore: 73
  },
  {
    id: 'T021', title: '刷单返利推广任务', description: '注册指定平台账号并下单，完成后返还本金+佣金，日赚50-200元。',
    difficulty: 'L2', deliveryStandards: ['注册账号并实名认证', '下单指定商品', '提供订单截图'], acceptancePeriod: '24h',
    basePrice: 200, currentPrice: 200, totalSlots: 100, takenSlots: 0, categoryId: 'survey',
    employerId: 'E013', employerName: '某电商', status: 'open',
    createdAt: '2026-06-11T03:00:00Z', deadline: '2026-06-20T23:59:59Z', complianceStatus: 'pending', heatScore: 0
  },
  {
    id: 'T022', title: '理财推广拉新任务', description: '邀请好友注册投资理财平台，每邀请一人奖励50元，拉新越多佣金越高，月入过万不是梦。',
    difficulty: 'L3', deliveryStandards: ['邀请好友注册', '完成实名认证', '首笔投资满1000元'], acceptancePeriod: '7d',
    basePrice: 50, currentPrice: 50, totalSlots: 500, takenSlots: 0, categoryId: 'survey',
    employerId: 'E014', employerName: '某金融', status: 'open',
    createdAt: '2026-06-11T02:00:00Z', deadline: '2026-06-30T23:59:59Z', complianceStatus: 'pending', heatScore: 0
  },
]
