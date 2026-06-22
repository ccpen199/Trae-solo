export const NON_STANDARD_QUOTE_PHRASES = [
  '一口价',
  '全包只要',
  '最低价',
  '全网最低',
  '绝对便宜',
  '保证最低价',
  '史上最低',
  '跳楼价',
  '亏本装修',
  '免费设计',
  '零利润',
  '先装修后付款',
  '人工费全免',
  '材料免费送',
  '699全包',
  '799拎包入住',
  '999精装',
  '套餐价',
  '特价活动',
  '仅限今日',
  '名额有限',
  '仅此一天'
];

export const INAPPROPRIATE_WORDS = [
  '骗子',
  '垃圾装修',
  '黑社会',
  '霸王条款'
];

export const SUSPICIOUS_PATTERNS = [
  /(\d{2,3})\s*(元|块|￥|¥)\s*(每平|平米|m2|平方)/gi,
  /(加|微|vx|qq)\s*[:：]?\s*[a-zA-Z0-9_-]{5,}/gi,
  /(电话|tel)\s*[:：]?\s*1[3-9]\d{9}/gi,
  /(点击|查看|访问)\s*(链接|地址|主页)/gi
];

export const VALID_BUDGET_CATEGORIES = [
  '设计费',
  '拆改工程',
  '水电工程',
  '泥瓦工程',
  '木作工程',
  '油漆工程',
  '安装工程',
  '瓷砖石材',
  '地板',
  '门窗',
  '橱柜',
  '卫浴',
  '灯具',
  '开关插座',
  '五金配件',
  '定制家具',
  '成品家具',
  '软装装饰',
  '家电',
  '清洁费',
  '管理费',
  '其他'
];

export const CONSTRUCTION_STAGES = [
  { key: 'planning', label: '方案设计', percentage: 15 },
  { key: 'demolition', label: '拆改阶段', percentage: 10 },
  { key: 'plumbing_electrical', label: '水电阶段', percentage: 20 },
  { key: 'masonry_carpentry', label: '泥木阶段', percentage: 25 },
  { key: 'painting', label: '油漆阶段', percentage: 15 },
  { key: 'installation', label: '安装阶段', percentage: 10 },
  { key: 'acceptance', label: '竣工验收', percentage: 5 }
];

export const HOUSE_TYPES = [
  { key: 'apartment', label: '普通住宅' },
  { key: 'villa', label: '别墅' },
  { key: 'duplex', label: '复式' },
  { key: 'loft', label: 'LOFT' },
  { key: 'townhouse', label: '联排别墅' }
];

export const DECORATION_STYLES = [
  '北欧风格',
  '新中式',
  '现代简约',
  '美式风格',
  '欧式古典',
  '日式极简',
  '工业风',
  '地中海',
  '轻奢风格',
  '法式风格',
  '田园风格',
  '东南亚风格'
];

export const COMMON_MATERIALS = [
  '岩板',
  '大理石',
  '木饰面',
  '实木地板',
  '复合地板',
  '抛光砖',
  '通体砖',
  '马赛克',
  '硅藻泥',
  '乳胶漆',
  '护墙板',
  '石膏线',
  '铝合金',
  '不锈钢',
  '玻璃',
  '皮革',
  '黄铜',
  '藤编'
];
