import { CalculatorMeta, CalculatorType } from '@/types';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SEARCH: '/search',
  COMPANY_DETAIL: '/search/company/:id',
  REPORTS: '/reports',
  REPORTS_NEW: '/reports/new',
  DEVELOPERS: '/developers',
  CASE_MARKET: '/cases',
  CASE_DETAIL: '/cases/:id',
  CASE_PUBLISH: '/cases/publish',
  BIDDING: '/cases/bidding',
  CONTRACTS: '/contracts',
  WORKSPACE: '/workspace',
  WORKSPACE_CASE: '/workspace/case/:id',
  KANBAN: '/workspace/board',
  EVIDENCE: '/workspace/evidence',
  TOOLS: '/tools',
  TOOLS_CALCULATOR: '/tools/calculator',
  TOOLS_AI: '/tools/ai',
  TOOLS_TEMPLATES: '/tools/templates',
  TEAM: '/team',
  FINANCE: '/finance',
  SETTINGS: '/settings',
} as const;

export const CASE_CAUSES = [
  { value: 'contract', label: '合同纠纷' },
  { value: 'labor', label: '劳动争议' },
  { value: 'tort', label: '侵权责任' },
  { value: 'marriage', label: '婚姻家庭' },
  { value: 'inheritance', label: '继承纠纷' },
  { value: 'property', label: '物权纠纷' },
  { value: 'company', label: '公司纠纷' },
  { value: 'securities', label: '证券纠纷' },
  { value: 'insurance', label: '保险纠纷' },
  { value: 'intellectual', label: '知识产权' },
  { value: 'unfair_competition', label: '不正当竞争' },
  { value: 'consumer', label: '消费者权益' },
  { value: 'traffic', label: '交通事故' },
  { value: 'medical', label: '医疗纠纷' },
  { value: 'construction', label: '建设工程' },
  { value: 'real_estate', label: '房产纠纷' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'administrative', label: '行政诉讼' },
  { value: 'execution', label: '执行程序' },
  { value: 'bankruptcy', label: '破产清算' },
];

export const INDUSTRIES = [
  { value: 'manufacturing', label: '制造业' },
  { value: 'construction', label: '建筑业' },
  { value: 'finance', label: '金融业' },
  { value: 'real_estate', label: '房地产业' },
  { value: 'wholesale', label: '批发和零售业' },
  { value: 'transport', label: '交通运输业' },
  { value: 'software', label: '信息技术服务业' },
  { value: 'leasing', label: '租赁和商务服务业' },
  { value: 'scientific', label: '科学研究和技术服务' },
  { value: 'education', label: '教育' },
  { value: 'health', label: '卫生和社会工作' },
  { value: 'culture', label: '文化和娱乐业' },
  { value: 'energy', label: '电力、热力、燃气' },
  { value: 'water', label: '水利、环境和公共设施' },
  { value: 'mining', label: '采矿业' },
  { value: 'agriculture', label: '农、林、牧、渔业' },
];

export const PROVINCES = [
  { value: 'beijing', label: '北京市', cities: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区'] },
  { value: 'shanghai', label: '上海市', cities: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区'] },
  { value: 'guangdong', label: '广东省', cities: ['广州市', '深圳市', '珠海市', '佛山市', '东莞市', '中山市'] },
  { value: 'jiangsu', label: '江苏省', cities: ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市'] },
  { value: 'zhejiang', label: '浙江省', cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市'] },
  { value: 'shandong', label: '山东省', cities: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市', '淄博市'] },
  { value: 'sichuan', label: '四川省', cities: ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市', '乐山市'] },
  { value: 'hubei', label: '湖北省', cities: ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄石市', '十堰市'] },
  { value: 'hunan', label: '湖南省', cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市'] },
  { value: 'henan', label: '河南省', cities: ['郑州市', '洛阳市', '开封市', '新乡市', '焦作市', '安阳市'] },
  { value: 'fujian', label: '福建省', cities: ['福州市', '厦门市', '泉州市', '漳州市', '莆田市', '宁德市'] },
  { value: 'chongqing', label: '重庆市', cities: ['渝中区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '渝北区'] },
  { value: 'tianjin', label: '天津市', cities: ['和平区', '河东区', '河西区', '南开区', '滨海新区', '西青区'] },
  { value: 'shaanxi', label: '陕西省', cities: ['西安市', '咸阳市', '宝鸡市', '渭南市', '延安市', '榆林市'] },
  { value: 'liaoning', label: '辽宁省', cities: ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市'] },
];

export const CALCULATOR_META: Record<CalculatorType, CalculatorMeta> = {
  court_fee: {
    type: 'court_fee',
    name: '诉讼费计算器',
    description: '依据《诉讼费用交纳办法》计算案件受理费、申请费等',
    icon: 'Scale',
    legalBasis: ['《诉讼费用交纳办法》第十三条、第十四条'],
  },
  injury: {
    type: 'injury',
    name: '工伤赔偿计算器',
    description: '依据《工伤保险条例》计算一次性伤残补助金、医疗补助金等',
    icon: 'Activity',
    legalBasis: ['《工伤保险条例》第三十五条至第三十七条'],
  },
  interest: {
    type: 'interest',
    name: '利息计算器',
    description: '计算借贷利息、逾期利息、迟延履行期间债务利息',
    icon: 'Percent',
    legalBasis: ['《民法典》第六百八十条', '《民事诉讼法》第二百六十条'],
  },
  penalty: {
    type: 'penalty',
    name: '违约金计算器',
    description: '根据合同约定和法律规定计算违约金及调整幅度',
    icon: 'AlertTriangle',
    legalBasis: ['《民法典》第五百八十五条'],
  },
  lawyer_fee: {
    type: 'lawyer_fee',
    name: '律师费计算器',
    description: '依据各地律师服务收费指导标准计算律师代理费',
    icon: 'Briefcase',
    legalBasis: ['律师服务收费管理办法'],
  },
  delay: {
    type: 'delay',
    name: '迟延履行利息',
    description: '计算民事诉讼中迟延履行期间的加倍债务利息',
    icon: 'Clock',
    legalBasis: ['《民事诉讼法》第二百六十条'],
  },
  tax: {
    type: 'tax',
    name: '税务计算器',
    description: '计算个人所得税、增值税等涉税金额',
    icon: 'Calculator',
    legalBasis: ['《个人所得税法》', '《增值税暂行条例》'],
  },
};

export const RISK_LEVEL_CONFIG = {
  low: { label: '低风险', color: 'green', className: 'lc-badge-low' },
  medium: { label: '中风险', color: 'yellow', className: 'lc-badge-medium' },
  high: { label: '高风险', color: 'orange', className: 'lc-badge-high' },
  critical: { label: '极高风险', color: 'red', className: 'lc-badge-critical' },
};

export const WORK_CASE_STATUS_CONFIG = {
  intake: { label: '立案受理', color: 'blue' },
  preparation: { label: '诉讼准备', color: 'cyan' },
  trial: { label: '审理阶段', color: 'purple' },
  enforcement: { label: '执行阶段', color: 'orange' },
  archived: { label: '已归档', color: 'gray' },
};

export const TASK_STATUS_CONFIG = {
  todo: { label: '待办', color: 'default' },
  in_progress: { label: '进行中', color: 'processing' },
  review: { label: '审核中', color: 'warning' },
  done: { label: '已完成', color: 'success' },
  archived: { label: '已归档', color: 'default' },
};
