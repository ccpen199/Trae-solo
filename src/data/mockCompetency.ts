import type { CompetencyModel, HardSkill, SoftSkill } from '@shared/types';

const frontendHardSkills: HardSkill[] = [
  { id: 'hs_fe_01', name: 'HTML/CSS', category: '前端基础', priority: 'must', targetLevel: 4, description: '熟练掌握HTML5语义化标签和CSS3高级特性' },
  { id: 'hs_fe_02', name: 'JavaScript', category: '前端基础', priority: 'must', targetLevel: 5, description: '深入理解JS核心原理、ES6+特性和异步编程' },
  { id: 'hs_fe_03', name: 'TypeScript', category: '前端基础', priority: 'must', targetLevel: 4, description: '熟练使用TypeScript进行类型安全的开发' },
  { id: 'hs_fe_04', name: 'React/Vue', category: '前端框架', priority: 'must', targetLevel: 5, description: '深入理解主流前端框架的原理和最佳实践' },
  { id: 'hs_fe_05', name: '状态管理', category: '前端框架', priority: 'important', targetLevel: 4, description: '掌握Redux/Zustand/Pinia等状态管理方案' },
  { id: 'hs_fe_06', name: '工程化工具', category: '工程能力', priority: 'important', targetLevel: 4, description: '熟悉Webpack/Vite等构建工具的配置和优化' },
  { id: 'hs_fe_07', name: '性能优化', category: '工程能力', priority: 'important', targetLevel: 4, description: '掌握前端性能优化方法论和实践技巧' },
  { id: 'hs_fe_08', name: 'Node.js', category: '全栈能力', priority: 'nice', targetLevel: 3, description: '了解Node.js服务端开发基础' },
  { id: 'hs_fe_09', name: '测试能力', category: '工程能力', priority: 'nice', targetLevel: 3, description: '了解单元测试、E2E测试等质量保障手段' },
  { id: 'hs_fe_10', name: '跨端开发', category: '全栈能力', priority: 'nice', targetLevel: 3, description: '了解小程序、React Native等跨端方案' },
];

const productHardSkills: HardSkill[] = [
  { id: 'hs_pm_01', name: '需求分析', category: '核心能力', priority: 'must', targetLevel: 5, description: '深入理解用户需求并转化为产品需求文档' },
  { id: 'hs_pm_02', name: '竞品分析', category: '战略思维', priority: 'important', targetLevel: 4, description: '系统性分析竞品与市场格局' },
  { id: 'hs_pm_03', name: '数据分析', category: '决策能力', priority: 'must', targetLevel: 4, description: '通过数据驱动产品决策' },
  { id: 'hs_pm_04', name: '原型设计', category: '表达能力', priority: 'must', targetLevel: 4, description: '熟练使用Axure/Figma等工具' },
  { id: 'hs_pm_05', name: '项目管理', category: '执行能力', priority: 'important', targetLevel: 4, description: '跨部门协作推进项目落地' },
  { id: 'hs_pm_06', name: '行业认知', category: '专业深度', priority: 'important', targetLevel: 3, description: '对垂直行业有深入理解' },
  { id: 'hs_pm_07', name: '商业化思维', category: '商业能力', priority: 'nice', targetLevel: 3, description: '理解产品变现与商业模式' },
];

const defaultSoftSkills: SoftSkill[] = [
  { id: 'ss_01', name: '沟通表达', dimension: 'communication', targetLevel: 4, behavioralIndicators: ['清晰表达观点', '善于倾听', '书面表达能力强'] },
  { id: 'ss_02', name: '团队协作', dimension: 'communication', targetLevel: 4, behavioralIndicators: ['乐于分享', '支持同事', '推动团队目标达成'] },
  { id: 'ss_03', name: '项目领导力', dimension: 'leadership', targetLevel: 3, behavioralIndicators: ['能主导小型项目', '协调资源', '推动决策'] },
  { id: 'ss_04', name: '人才培养', dimension: 'leadership', targetLevel: 2, behavioralIndicators: ['指导新人', '分享经验', '帮助他人成长'] },
  { id: 'ss_05', name: '逻辑思维', dimension: 'thinking', targetLevel: 4, behavioralIndicators: ['结构化思考', '善于分析问题', '推理能力强'] },
  { id: 'ss_06', name: '创新思维', dimension: 'thinking', targetLevel: 3, behavioralIndicators: ['提出新想法', '探索新方案', '持续改进'] },
  { id: 'ss_07', name: '目标管理', dimension: 'execution', targetLevel: 4, behavioralIndicators: ['设定清晰目标', '制定计划', '追踪进度'] },
  { id: 'ss_08', name: '执行效率', dimension: 'execution', targetLevel: 4, behavioralIndicators: ['行动力强', '高效产出', '结果导向'] },
  { id: 'ss_09', name: '情绪管理', dimension: 'emotional', targetLevel: 4, behavioralIndicators: ['情绪稳定', '应对压力', '自我调节'] },
  { id: 'ss_10', name: '抗挫折能力', dimension: 'emotional', targetLevel: 3, behavioralIndicators: ['面对困难不放弃', '从失败中学习', '快速恢复'] },
];

export const mockCompetencyModels: Record<string, CompetencyModel> = {
  default: {
    jobId: 'default',
    jobName: '通用岗位',
    jobLevel: 'middle',
    hardSkills: frontendHardSkills,
    softSkills: defaultSoftSkills,
    certifications: [
      { id: 'cert_01', name: 'PMP项目管理', issuer: 'PMI', difficulty: 'intermediate', estimatedHours: 120, relevance: 0.75 },
      { id: 'cert_02', name: 'AWS解决方案架构师', issuer: 'Amazon', difficulty: 'advanced', estimatedHours: 200, relevance: 0.65 },
    ],
    yearsOfExperience: { min: 2, ideal: 5 },
    educationRequirement: '本科及以上',
    industryKnowledge: ['互联网', '软件服务'],
  },
  frontend: {
    jobId: 'job_fe_01',
    jobName: '前端工程师',
    jobLevel: 'middle',
    hardSkills: frontendHardSkills,
    softSkills: defaultSoftSkills,
    certifications: [
      { id: 'cert_fe_01', name: 'React官方认证', issuer: 'Meta', difficulty: 'intermediate', estimatedHours: 80, relevance: 0.9 },
      { id: 'cert_fe_02', name: 'AWS Cloud Practitioner', issuer: 'Amazon', difficulty: 'basic', estimatedHours: 40, relevance: 0.6 },
    ],
    yearsOfExperience: { min: 2, ideal: 4 },
    educationRequirement: '本科及以上，计算机相关专业优先',
    industryKnowledge: ['互联网', 'SaaS', '电商'],
  },
  product: {
    jobId: 'job_pm_01',
    jobName: '产品经理',
    jobLevel: 'middle',
    hardSkills: productHardSkills,
    softSkills: defaultSoftSkills,
    certifications: [
      { id: 'cert_pm_01', name: 'PMP项目管理', issuer: 'PMI', difficulty: 'intermediate', estimatedHours: 120, relevance: 0.85 },
      { id: 'cert_pm_02', name: 'NPDP产品经理认证', issuer: 'PDMA', difficulty: 'intermediate', estimatedHours: 100, relevance: 0.8 },
    ],
    yearsOfExperience: { min: 2, ideal: 5 },
    educationRequirement: '本科及以上',
    industryKnowledge: ['互联网', '消费', '企业服务'],
  },
};

export const getMockCompetencyModel = (jobId: string): CompetencyModel => {
  if (jobId.startsWith('job_fe')) return mockCompetencyModels.frontend;
  if (jobId.startsWith('job_pm')) return mockCompetencyModels.product;
  return mockCompetencyModels.default;
};

export const softSkillDimensions = [
  {
    id: 'communication',
    name: '沟通协作',
    color: 'emerald',
    question: '在团队项目中，当与同事对技术方案产生分歧时，你通常会：',
    options: [
      { score: 1, text: '坚持自己的方案，用专业论据说服对方', behavior: '偏主导型沟通，注重个人专业判断，在协作中可能较为强势' },
      { score: 2, text: '先倾听对方想法，再尝试找共同点', behavior: '理性协商型，能够平衡个人意见与他人观点，注重过程沟通' },
      { score: 3, text: '组织双方梳理方案优劣，用数据和逻辑共同决策', behavior: '协作引导型，擅长推动建设性讨论，以事实为基础达成共识' },
      { score: 4, text: '站在多方视角整合方案，同时确保团队关系与目标双赢', behavior: '整合共赢型，不仅解决当前问题，更能建立长期信任与协作机制' },
    ],
  },
  {
    id: 'leadership',
    name: '领导力',
    color: 'indigo',
    question: '当你负责一个紧急且资源有限的项目时，你会：',
    options: [
      { score: 1, text: '自己承担核心任务，确保按时交付', behavior: '个人贡献者模式，追求自我卓越，但团队赋能不足' },
      { score: 2, text: '分配任务并密切跟踪每个人的进度', behavior: '任务管理型，能够合理分工，但偏过程监控而非激发潜能' },
      { score: 3, text: '明确目标与分工，给予支持并鼓励团队自主完成', behavior: '赋能支持型，信任团队并提供必要资源，注重培养成员能力' },
      { score: 4, text: '塑造愿景激发动力，根据成员优势设计成长型任务并创造突破机会', behavior: '愿景引领型，不仅交付项目更培养未来领导者，创造长期团队价值' },
    ],
  },
  {
    id: 'thinking',
    name: '思维分析',
    color: 'purple',
    question: '面对一个陌生领域的复杂问题，你的思考路径是：',
    options: [
      { score: 1, text: '凭经验先做起来，边做边调整', behavior: '实践试错型，行动力强但可能缺乏系统性规划' },
      { score: 2, text: '请教领域专家，参考已有案例来制定方案', behavior: '经验借鉴型，善于学习他人经验，但原创突破可能不足' },
      { score: 3, text: '拆解问题成子模块，结构化分析后制定优先级方案', behavior: '结构化思维型，擅长系统拆解与逻辑推演，决策质量较高' },
      { score: 4, text: '先理解底层原理，建立框架假设，再通过实验验证迭代', behavior: '第一性原理型，能够穿透现象看本质，产生创新性解决方案' },
    ],
  },
  {
    id: 'execution',
    name: '执行力',
    color: 'gold',
    question: '面对一个多目标并行的季度规划，你通常会：',
    options: [
      { score: 1, text: '按紧急程度逐项处理，走一步看一步', behavior: '应急响应型，能应对突发任务但长周期规划较弱' },
      { score: 2, text: '列一个清单按照优先级逐个完成', behavior: '清单管理型，有基本的优先级意识，但缺少里程碑节奏' },
      { score: 3, text: '拆解目标为里程碑和关键任务，建立进度跟踪机制定期复盘', behavior: '目标管理型，掌握OKR等方法，能稳定交付重要目标' },
      { score: 4, text: '先识别关键路径与资源瓶颈，动态排程并建立风险预案，超预期交付', behavior: '战略执行型，不仅能稳定交付，还能预判风险创造额外价值' },
    ],
  },
  {
    id: 'emotional',
    name: '情商逆商',
    color: 'pink',
    question: '当项目遭遇重大挫折且受到上级质疑时，你通常会：',
    options: [
      { score: 1, text: '情绪低落，需要一段时间才能恢复状态', behavior: '敏感波动型，抗压能力有待提升，易受外部评价影响' },
      { score: 2, text: '接受批评，总结教训后继续努力', behavior: '恢复适应型，能够面对现实，但缺少主动掌控局面的意识' },
      { score: 3, text: '理性分析原因，主动沟通寻求支持并制定改进计划', behavior: '理性应对型，能快速从负面情绪中抽离，主动解决问题' },
      { score: 4, text: '将挫折视为成长契机，主动沟通管理预期，同时带领团队看到积极面并转化为动力', behavior: '韧性超越型，不仅个人抗压能力强，还能赋能团队在逆境中成长' },
    ],
  },
];

export const cities = [
  '北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉',
  '西安', '苏州', '重庆', '天津', '厦门', '青岛', '长沙', '郑州',
  '合肥', '佛山', '东莞', '宁波',
];

export const companySizes = [
  { value: 'startup', label: '初创', sub: '<50人' },
  { value: 'growth', label: '成长', sub: '50-500人' },
  { value: 'mid', label: '中型', sub: '500-2000人' },
  { value: 'large', label: '大型', sub: '>2000人' },
];

export const industryPreferences = [
  '互联网/科技', '人工智能', '新能源', '生物医药', '金融科技',
  '电商零售', '游戏娱乐', '教育科技', '企业服务', '智能硬件',
  '汽车出行', '本地生活', '医疗健康', '文化创意', '物流供应链',
];

export const jobLevels = [
  { value: 'entry' as const, label: '入门', desc: '应届生/转行者', num: 1 },
  { value: 'junior' as const, label: '初级', desc: '1-2年经验', num: 2 },
  { value: 'middle' as const, label: '中级', desc: '2-5年经验', num: 3 },
  { value: 'senior' as const, label: '高级', desc: '5-8年经验', num: 4 },
  { value: 'expert' as const, label: '专家', desc: '8年以上', num: 5 },
  { value: 'lead' as const, label: '负责人', desc: '团队管理者', num: 6 },
];
