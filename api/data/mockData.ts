import type {
  Industry,
  CompetencyModel,
  PromotionPath,
  JobPost,
  EncyclopediaEntry,
  TalentPoolEntry,
  JobWarning,
  DiagnosisReport,
  UserProfile,
  FollowUpReminder,
} from '../../shared/types/index.js';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const industries: Industry[] = [
  {
    id: 'ind-internet',
    name: '互联网',
    icon: 'Globe',
    description: '涵盖互联网公司、科技企业、软件服务等数字化领域',
    categories: [
      {
        id: 'cat-dev',
        name: '技术研发',
        jobs: [
          { id: 'job-fe', name: '前端工程师', level: 'middle', avgSalary: 25000, hotness: 95 },
          { id: 'job-be', name: '后端工程师', level: 'middle', avgSalary: 28000, hotness: 92 },
          { id: 'job-ds', name: '数据科学家', level: 'middle', avgSalary: 35000, hotness: 88 },
          { id: 'job-algo', name: '算法工程师', level: 'middle', avgSalary: 40000, hotness: 90 },
          { id: 'job-ops', name: '运维工程师', level: 'middle', avgSalary: 22000, hotness: 75 },
          { id: 'job-sec', name: '安全工程师', level: 'middle', avgSalary: 30000, hotness: 80 },
        ],
      },
      {
        id: 'cat-product',
        name: '产品设计',
        jobs: [
          { id: 'job-pm', name: '产品经理', level: 'middle', avgSalary: 28000, hotness: 93 },
          { id: 'job-ui', name: 'UI设计师', level: 'middle', avgSalary: 20000, hotness: 85 },
        ],
      },
    ],
  },
  {
    id: 'ind-finance',
    name: '金融',
    icon: 'Landmark',
    description: '银行、证券、基金、保险、投资等金融服务领域',
    categories: [
      {
        id: 'cat-invest',
        name: '投资分析',
        jobs: [
          { id: 'job-ia', name: '投资分析师', level: 'middle', avgSalary: 35000, hotness: 82 },
          { id: 'job-rc', name: '风控经理', level: 'middle', avgSalary: 32000, hotness: 78 },
        ],
      },
    ],
  },
  {
    id: 'ind-healthcare',
    name: '医疗健康',
    icon: 'Heart',
    description: '医疗器械、医药研发、临床研究等医疗健康领域',
    categories: [
      {
        id: 'cat-medical',
        name: '医疗技术',
        jobs: [
          { id: 'job-cra', name: '临床研究员', level: 'middle', avgSalary: 18000, hotness: 70 },
          { id: 'job-me', name: '医疗器械工程师', level: 'middle', avgSalary: 25000, hotness: 72 },
        ],
      },
    ],
  },
  {
    id: 'ind-manufacturing',
    name: '智能制造',
    icon: 'Factory',
    description: '工业4.0、自动化、机器人、智能装备等制造领域',
    categories: [
      {
        id: 'cat-industrial',
        name: '工业工程',
        jobs: [
          { id: 'job-id', name: '工业设计师', level: 'middle', avgSalary: 22000, hotness: 76 },
          { id: 'job-plc', name: 'PLC工程师', level: 'middle', avgSalary: 20000, hotness: 73 },
        ],
      },
    ],
  },
  {
    id: 'ind-education',
    name: '教育培训',
    icon: 'GraduationCap',
    description: 'K12教育、职业教育、在线教育、教育科技等领域',
    categories: [
      {
        id: 'cat-teaching',
        name: '教学教研',
        jobs: [
          { id: 'job-dean', name: '教研主任', level: 'middle', avgSalary: 25000, hotness: 68 },
          { id: 'job-lecturer', name: '在线讲师', level: 'middle', avgSalary: 20000, hotness: 80 },
        ],
      },
    ],
  },
  {
    id: 'ind-retail',
    name: '新零售',
    icon: 'ShoppingBag',
    description: '电商、直播电商、社区团购、线下零售等新零售领域',
    categories: [
      {
        id: 'cat-ops',
        name: '运营管理',
        jobs: [
          { id: 'job-co', name: '品类运营', level: 'middle', avgSalary: 22000, hotness: 82 },
          { id: 'job-po', name: '私域运营', level: 'middle', avgSalary: 20000, hotness: 85 },
        ],
      },
    ],
  },
  {
    id: 'ind-consulting',
    name: '管理咨询',
    icon: 'Briefcase',
    description: '战略咨询、管理咨询、IT咨询、人力资源咨询等领域',
    categories: [
      {
        id: 'cat-strategy',
        name: '战略管理',
        jobs: [
          { id: 'job-sc', name: '战略咨询顾问', level: 'middle', avgSalary: 40000, hotness: 75 },
          { id: 'job-mc', name: '管理咨询顾问', level: 'middle', avgSalary: 35000, hotness: 72 },
        ],
      },
    ],
  },
  {
    id: 'ind-media',
    name: '文化传媒',
    icon: 'Video',
    description: '内容创作、短视频、影视制作、广告营销等文化领域',
    categories: [
      {
        id: 'cat-content',
        name: '内容创作',
        jobs: [
          { id: 'job-content', name: '内容运营', level: 'middle', avgSalary: 18000, hotness: 86 },
          { id: 'job-vd', name: '视频编导', level: 'middle', avgSalary: 22000, hotness: 88 },
        ],
      },
    ],
  },
];

const jobNameMap: Record<string, string> = {};
industries.forEach(ind =>
  ind.categories.forEach(cat =>
    cat.jobs.forEach(job => { jobNameMap[job.id] = job.name; })
  )
);

function makeHardSkills(jobId: string): CompetencyModel['hardSkills'] {
  const presets: Record<string, CompetencyModel['hardSkills']> = {
    'job-fe': [
      { id: 'hs-fe-1', name: 'React/Vue框架', category: '前端框架', priority: 'must', targetLevel: 4, description: '熟练使用主流前端框架进行组件化开发' },
      { id: 'hs-fe-2', name: 'TypeScript', category: '编程语言', priority: 'must', targetLevel: 4, description: '掌握TS类型系统，能编写类型安全的代码' },
      { id: 'hs-fe-3', name: 'HTML5/CSS3', category: '基础技术', priority: 'must', targetLevel: 5, description: '精通语义化HTML和现代CSS，包括Flex/Grid' },
      { id: 'hs-fe-4', name: '工程化工具链', category: '工程化', priority: 'important', targetLevel: 4, description: '熟悉Vite/Webpack等构建工具配置' },
      { id: 'hs-fe-5', name: '状态管理', category: '前端框架', priority: 'important', targetLevel: 4, description: '掌握Redux/Zustand等状态管理方案' },
      { id: 'hs-fe-6', name: '性能优化', category: '性能', priority: 'important', targetLevel: 3, description: '了解首屏优化、懒加载、代码分割等技术' },
      { id: 'hs-fe-7', name: 'Node.js基础', category: '全栈能力', priority: 'nice', targetLevel: 3, description: '能用Node.js编写简单的后端服务' },
      { id: 'hs-fe-8', name: '跨端开发', category: '前端框架', priority: 'nice', targetLevel: 2, description: '了解小程序、React Native等跨端技术' },
      { id: 'hs-fe-9', name: '测试技术', category: '质量保障', priority: 'nice', targetLevel: 3, description: '会写Jest/Vitest单元测试' },
      { id: 'hs-fe-10', name: '可视化基础', category: '数据展示', priority: 'nice', targetLevel: 3, description: '能使用ECharts/Recharts做数据可视化' },
    ],
    'job-be': [
      { id: 'hs-be-1', name: 'Java/Spring Boot', category: '后端框架', priority: 'must', targetLevel: 4, description: '精通Spring全家桶，能构建高并发服务' },
      { id: 'hs-be-2', name: 'MySQL数据库', category: '数据库', priority: 'must', targetLevel: 4, description: '熟练SQL编写与索引优化' },
      { id: 'hs-be-3', name: 'Redis缓存', category: '中间件', priority: 'must', targetLevel: 4, description: '掌握缓存策略、持久化、集群方案' },
      { id: 'hs-be-4', name: '消息队列', category: '中间件', priority: 'important', targetLevel: 3, description: '熟悉Kafka/RocketMQ的使用场景' },
      { id: 'hs-be-5', name: '微服务架构', category: '架构设计', priority: 'important', targetLevel: 4, description: '了解Spring Cloud/Dubbo微服务体系' },
      { id: 'hs-be-6', name: '分布式系统', category: '架构设计', priority: 'important', targetLevel: 3, description: '理解CAP、一致性协议、分布式事务' },
      { id: 'hs-be-7', name: 'Docker/K8s', category: '云原生', priority: 'important', targetLevel: 3, description: '会用容器部署和管理应用' },
      { id: 'hs-be-8', name: 'API设计', category: '接口规范', priority: 'must', targetLevel: 4, description: '能设计RESTful/GraphQL接口' },
      { id: 'hs-be-9', name: 'MongoDB', category: '数据库', priority: 'nice', targetLevel: 3, description: '了解NoSQL数据库使用场景' },
      { id: 'hs-be-10', name: '性能调优', category: '性能', priority: 'important', targetLevel: 3, description: '能进行JVM调优和SQL优化' },
    ],
    'job-ds': [
      { id: 'hs-ds-1', name: 'Python', category: '编程语言', priority: 'must', targetLevel: 5, description: '精通Python数据科学生态' },
      { id: 'hs-ds-2', name: 'SQL/数据仓库', category: '数据工程', priority: 'must', targetLevel: 4, description: '熟练复杂SQL查询和数仓建模' },
      { id: 'hs-ds-3', name: '统计学基础', category: '理论基础', priority: 'must', targetLevel: 4, description: '掌握假设检验、贝叶斯、回归分析' },
      { id: 'hs-ds-4', name: '机器学习', category: '算法', priority: 'must', targetLevel: 4, description: '熟悉常用ML算法及调优方法' },
      { id: 'hs-ds-5', name: 'Pandas/Numpy', category: '数据处理', priority: 'must', targetLevel: 5, description: '熟练数据清洗和特征工程' },
      { id: 'hs-ds-6', name: '数据可视化', category: '数据展示', priority: 'important', targetLevel: 4, description: '能用Matplotlib/Tableau讲故事' },
      { id: 'hs-ds-7', name: '深度学习', category: '算法', priority: 'nice', targetLevel: 3, description: '了解神经网络基本原理' },
      { id: 'hs-ds-8', name: 'Spark大数据', category: '数据工程', priority: 'nice', targetLevel: 3, description: '了解大规模数据处理框架' },
      { id: 'hs-ds-9', name: 'A/B测试', category: '实验设计', priority: 'important', targetLevel: 4, description: '能设计和分析对照实验' },
      { id: 'hs-ds-10', name: '业务理解', category: '行业认知', priority: 'important', targetLevel: 4, description: '能将数据洞察转化为业务建议' },
    ],
    'job-pm': [
      { id: 'hs-pm-1', name: '需求分析', category: '核心能力', priority: 'must', targetLevel: 5, description: '能深入挖掘用户真实需求' },
      { id: 'hs-pm-2', name: '产品设计', category: '核心能力', priority: 'must', targetLevel: 4, description: '能输出PRD、原型图、流程图' },
      { id: 'hs-pm-3', name: 'Axure/Figma', category: '工具', priority: 'must', targetLevel: 4, description: '熟练使用原型设计工具' },
      { id: 'hs-pm-4', name: '项目管理', category: '执行能力', priority: 'important', targetLevel: 4, description: '能推动项目按时高质量交付' },
      { id: 'hs-pm-5', name: '数据分析', category: '决策支持', priority: 'important', targetLevel: 4, description: '会用数据驱动产品决策' },
      { id: 'hs-pm-6', name: '用户研究', category: '用户洞察', priority: 'important', targetLevel: 3, description: '会做用户访谈和可用性测试' },
      { id: 'hs-pm-7', name: '技术理解力', category: '协作能力', priority: 'important', targetLevel: 3, description: '理解技术实现原理和边界' },
      { id: 'hs-pm-8', name: '商业思维', category: '战略思维', priority: 'nice', targetLevel: 3, description: '理解商业模式和盈利逻辑' },
      { id: 'hs-pm-9', name: '竞品分析', category: '市场洞察', priority: 'important', targetLevel: 4, description: '能进行系统性竞品调研' },
      { id: 'hs-pm-10', name: 'UI/UX基础', category: '设计感知', priority: 'nice', targetLevel: 3, description: '具备基本的审美和交互判断' },
    ],
    'job-ui': [
      { id: 'hs-ui-1', name: 'Figma/Sketch', category: '设计工具', priority: 'must', targetLevel: 5, description: '精通主流UI设计工具' },
      { id: 'hs-ui-2', name: '视觉设计', category: '设计基础', priority: 'must', targetLevel: 5, description: '精通色彩、排版、布局' },
      { id: 'hs-ui-3', name: '交互设计', category: '设计基础', priority: 'must', targetLevel: 4, description: '能设计流畅的用户流程' },
      { id: 'hs-ui-4', name: '设计系统', category: '工程化', priority: 'important', targetLevel: 4, description: '能搭建和维护组件库' },
      { id: 'hs-ui-5', name: '图标/插画', category: '美术功底', priority: 'important', targetLevel: 3, description: '能绘制高质量图标插画' },
      { id: 'hs-ui-6', name: '动效设计', category: '体验增强', priority: 'nice', targetLevel: 3, description: '了解AE/Lottie动效' },
      { id: 'hs-ui-7', name: '用户研究', category: '设计验证', priority: 'important', targetLevel: 3, description: '能用研究指导设计决策' },
      { id: 'hs-ui-8', name: '前端切图', category: '协作能力', priority: 'nice', targetLevel: 3, description: '了解CSS和切图规范' },
      { id: 'hs-ui-9', name: '品牌设计', category: '视觉延伸', priority: 'nice', targetLevel: 3, description: '了解VI系统和品牌调性' },
      { id: 'hs-ui-10', name: '3D/Blender', category: '前沿技能', priority: 'nice', targetLevel: 2, description: '了解3D设计基础' },
    ],
    'job-algo': [
      { id: 'hs-algo-1', name: 'Python/C++', category: '编程语言', priority: 'must', targetLevel: 5, description: '精通算法实现语言' },
      { id: 'hs-algo-2', name: '数据结构与算法', category: '理论基础', priority: 'must', targetLevel: 5, description: '精通常见算法和复杂度分析' },
      { id: 'hs-algo-3', name: '深度学习', category: '核心能力', priority: 'must', targetLevel: 5, description: '精通CNN/RNN/Transformer等' },
      { id: 'hs-algo-4', name: 'PyTorch/TensorFlow', category: '框架工具', priority: 'must', targetLevel: 4, description: '熟练使用深度学习框架' },
      { id: 'hs-algo-5', name: '机器学习', category: '核心能力', priority: 'must', targetLevel: 4, description: '全面掌握传统ML算法' },
      { id: 'hs-algo-6', name: 'NLP/CV', category: '应用领域', priority: 'important', targetLevel: 4, description: '在NLP或CV方向有深入经验' },
      { id: 'hs-algo-7', name: '数学基础', category: '理论基础', priority: 'must', targetLevel: 4, description: '精通线性代数、微积分、概率论' },
      { id: 'hs-algo-8', name: '模型部署', category: '工程能力', priority: 'important', targetLevel: 3, description: '能将模型部署到生产环境' },
      { id: 'hs-algo-9', name: '分布式训练', category: '工程能力', priority: 'nice', targetLevel: 3, description: '了解多卡/多机训练' },
      { id: 'hs-algo-10', name: '论文阅读', category: '研究能力', priority: 'important', targetLevel: 4, description: '能跟踪前沿并复现' },
    ],
  };
  if (presets[jobId]) return presets[jobId];
  return [
    { id: `hs-${jobId}-1`, name: `${jobNameMap[jobId] || '岗位'}核心技能A`, category: '核心能力', priority: 'must', targetLevel: 4, description: '本岗位最核心的专业技能之一' },
    { id: `hs-${jobId}-2`, name: `${jobNameMap[jobId] || '岗位'}核心技能B`, category: '核心能力', priority: 'must', targetLevel: 4, description: '本岗位另一项必备技能' },
    { id: `hs-${jobId}-3`, name: `${jobNameMap[jobId] || '岗位'}核心技能C`, category: '核心能力', priority: 'must', targetLevel: 3, description: '本岗位高频使用技能' },
    { id: `hs-${jobId}-4`, name: `${jobNameMap[jobId] || '岗位'}核心技能D`, category: '专业工具', priority: 'important', targetLevel: 4, description: '常用专业工具的熟练使用' },
    { id: `hs-${jobId}-5`, name: `${jobNameMap[jobId] || '岗位'}核心技能E`, category: '专业工具', priority: 'important', targetLevel: 3, description: '辅助工具的掌握' },
    { id: `hs-${jobId}-6`, name: '数据分析能力', category: '通用能力', priority: 'important', targetLevel: 3, description: '能用数据指导决策' },
    { id: `hs-${jobId}-7`, name: '项目管理', category: '通用能力', priority: 'nice', targetLevel: 3, description: '能独立管理小型项目' },
    { id: `hs-${jobId}-8`, name: '行业认知', category: '业务理解', priority: 'important', targetLevel: 3, description: '对所在行业有深入了解' },
    { id: `hs-${jobId}-9`, name: '文档撰写', category: '通用能力', priority: 'nice', targetLevel: 3, description: '能输出高质量专业文档' },
    { id: `hs-${jobId}-10`, name: '跨部门协作', category: '通用能力', priority: 'nice', targetLevel: 3, description: '能有效推动跨团队协作' },
  ];
}

function makeSoftSkills(jobId: string): CompetencyModel['softSkills'] {
  return [
    { id: `ss-${jobId}-1`, name: '沟通表达', dimension: 'communication', targetLevel: 4, behavioralIndicators: ['能清晰表达技术方案', '会写清晰的文档', '能有效协调资源'] },
    { id: `ss-${jobId}-2`, name: '团队协作', dimension: 'communication', targetLevel: 4, behavioralIndicators: ['乐于分享知识', '能接受不同意见', '主动帮助同事'] },
    { id: `ss-${jobId}-3`, name: '逻辑思维', dimension: 'thinking', targetLevel: 4, behavioralIndicators: ['能结构化分析问题', '会拆解复杂任务', '决策有理有据'] },
    { id: `ss-${jobId}-4`, name: '执行落地', dimension: 'execution', targetLevel: 4, behavioralIndicators: ['任务按时交付', '主动跟进进度', '闭环意识强'] },
    { id: `ss-${jobId}-5`, name: '抗压能力', dimension: 'emotional', targetLevel: 3, behavioralIndicators: ['能应对紧急需求', '保持积极心态', '高强度下保持质量'] },
    { id: `ss-${jobId}-6`, name: '学习成长', dimension: 'thinking', targetLevel: 4, behavioralIndicators: ['主动学习新技术', '复盘总结经验', '关注行业动态'] },
  ];
}

function makeCertifications(jobId: string): CompetencyModel['certifications'] {
  const presets: Record<string, CompetencyModel['certifications']> = {
    'job-fe': [
      { id: 'cert-fe-1', name: 'Google Mobile Web Specialist', issuer: 'Google', difficulty: 'intermediate', estimatedHours: 80, relevance: 0.75 },
      { id: 'cert-fe-2', name: 'Meta Front-End Developer', issuer: 'Meta', difficulty: 'basic', estimatedHours: 60, relevance: 0.7 },
    ],
    'job-be': [
      { id: 'cert-be-1', name: 'Oracle Certified Professional Java SE', issuer: 'Oracle', difficulty: 'intermediate', estimatedHours: 120, relevance: 0.8 },
      { id: 'cert-be-2', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', difficulty: 'advanced', estimatedHours: 150, relevance: 0.75 },
      { id: 'cert-be-3', name: 'CKA Kubernetes Administrator', issuer: 'CNCF', difficulty: 'advanced', estimatedHours: 100, relevance: 0.7 },
    ],
    'job-ds': [
      { id: 'cert-ds-1', name: 'TensorFlow Developer Certificate', issuer: 'Google', difficulty: 'intermediate', estimatedHours: 100, relevance: 0.8 },
      { id: 'cert-ds-2', name: 'AWS Certified Machine Learning', issuer: 'Amazon', difficulty: 'advanced', estimatedHours: 120, relevance: 0.75 },
    ],
    'job-algo': [
      { id: 'cert-algo-1', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', difficulty: 'advanced', estimatedHours: 160, relevance: 0.85 },
      { id: 'cert-algo-2', name: 'Google Cloud Professional ML Engineer', issuer: 'Google', difficulty: 'advanced', estimatedHours: 140, relevance: 0.75 },
      { id: 'cert-algo-3', name: 'Kaggle Competitions Expert', issuer: 'Kaggle', difficulty: 'advanced', estimatedHours: 300, relevance: 0.8 },
    ],
  };
  if (presets[jobId]) return presets[jobId];
  return [
    { id: `cert-${jobId}-1`, name: `${jobNameMap[jobId] || '岗位'}专业认证(初级)`, issuer: '行业协会', difficulty: 'basic', estimatedHours: 60, relevance: 0.6 },
    { id: `cert-${jobId}-2`, name: `${jobNameMap[jobId] || '岗位'}专业认证(中级)`, issuer: '权威机构', difficulty: 'intermediate', estimatedHours: 100, relevance: 0.75 },
  ];
}

export const competencyModels: CompetencyModel[] = industries.flatMap(ind =>
  ind.categories.flatMap(cat =>
    cat.jobs.map(job => ({
      jobId: job.id,
      jobName: job.name,
      jobLevel: job.level,
      hardSkills: makeHardSkills(job.id),
      softSkills: makeSoftSkills(job.id),
      certifications: makeCertifications(job.id),
      yearsOfExperience: { min: 2, ideal: 4 },
      educationRequirement: '本科及以上学历，相关专业优先',
      industryKnowledge: ['行业发展趋势', '竞品动态', '业务流程理解'],
    }))
  )
);

export const promotionPaths: PromotionPath[] = competencyModels.map(cm => {
  const base = cm.jobName.replace(/工程师|经理|主任|顾问|讲师|研究员|师$/, '');
  const levels = [
    { suffix: '初级', level: 'junior', months: 12, salary: [10000, 18000] as [number, number] },
    { suffix: '中级', level: 'middle', months: 24, salary: [18000, 30000] as [number, number] },
    { suffix: '高级', level: 'senior', months: 24, salary: [30000, 50000] as [number, number] },
    { suffix: '专家', level: 'expert', months: 24, salary: [50000, 80000] as [number, number] },
    { suffix: '技术负责人', level: 'lead', months: 24, salary: [60000, 120000] as [number, number] },
  ];
  const thresholds = [
    ['完成基础培训', '能独立完成简单任务', '通过试用期考核'],
    ['独立负责模块', '指导初级同事', '至少1个项目经验'],
    ['主导中型项目', '技术方案设计', '团队技术分享'],
    ['解决复杂问题', '跨部门协作', '培养中级同事'],
    ['制定技术战略', '团队管理能力', '行业影响力'],
  ];
  const nodes = levels.map((l, i) => ({
    id: `pn-${cm.jobId}-${i}`,
    jobName: `${base}${l.suffix}` || `L${i + 1}`,
    level: l.level,
    estimatedMonths: l.months,
    keyThresholds: thresholds[i],
    avgSalaryRange: l.salary,
  }));
  return {
    fromJobId: cm.jobId,
    nodes,
    totalEstimatedMonths: levels.reduce((s, l) => s + l.months, 0),
  };
});

const companies = [
  { id: 'c1', name: '字节跳动', size: '10000人以上', industry: '互联网', logo: '🏢' },
  { id: 'c2', name: '阿里巴巴', size: '10000人以上', industry: '互联网', logo: '🏬' },
  { id: 'c3', name: '腾讯', size: '10000人以上', industry: '互联网', logo: '🐧' },
  { id: 'c4', name: '美团', size: '10000人以上', industry: '互联网', logo: '🛵' },
  { id: 'c5', name: '京东', size: '10000人以上', industry: '互联网', logo: '📦' },
  { id: 'c6', name: '小米', size: '10000人以上', industry: '互联网', logo: '📱' },
  { id: 'c7', name: '百度', size: '10000人以上', industry: '互联网', logo: '🔍' },
  { id: 'c8', name: '网易', size: '10000人以上', industry: '互联网', logo: '🎮' },
  { id: 'c9', name: '高盛中国', size: '1000-5000人', industry: '金融', logo: '💎' },
  { id: 'c10', name: '摩根士丹利', size: '1000-5000人', industry: '金融', logo: '🏦' },
  { id: 'c11', name: '招商证券', size: '5000-10000人', industry: '金融', logo: '📈' },
  { id: 'c12', name: '平安科技', size: '10000人以上', industry: '金融', logo: '🛡️' },
  { id: 'c13', name: '辉瑞制药', size: '10000人以上', industry: '医疗健康', logo: '💊' },
  { id: 'c14', name: '迈瑞医疗', size: '10000人以上', industry: '医疗健康', logo: '🏥' },
  { id: 'c15', name: '联影医疗', size: '5000-10000人', industry: '医疗健康', logo: '🩻' },
  { id: 'c16', name: '大疆创新', size: '10000人以上', industry: '智能制造', logo: '🚁' },
  { id: 'c17', name: '宁德时代', size: '10000人以上', industry: '智能制造', logo: '🔋' },
  { id: 'c18', name: '比亚迪', size: '10000人以上', industry: '智能制造', logo: '🚗' },
  { id: 'c19', name: '新东方', size: '10000人以上', industry: '教育培训', logo: '📚' },
  { id: 'c20', name: '好未来', size: '10000人以上', industry: '教育培训', logo: '🎓' },
  { id: 'c21', name: '得物App', size: '1000-5000人', industry: '新零售', logo: '👟' },
  { id: 'c22', name: '小红书', size: '5000-10000人', industry: '新零售', logo: '📕' },
  { id: 'c23', name: '波士顿咨询', size: '1000-5000人', industry: '管理咨询', logo: '💼' },
  { id: 'c24', name: '麦肯锡', size: '1000-5000人', industry: '管理咨询', logo: '🎯' },
  { id: 'c25', name: '芒果TV', size: '5000-10000人', industry: '文化传媒', logo: '🥭' },
];

const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '苏州', '厦门', '重庆'];
const techStackEvolutions: Array<'stable' | 'growing' | 'leading'> = ['stable', 'growing', 'leading'];
const frequencies: Array<'none' | 'low' | 'medium' | 'high'> = ['none', 'low', 'medium', 'high'];

function makeGrowthTags(): JobPost['growthTags'] {
  return {
    hasTrainingSystem: Math.random() > 0.3,
    hasRotationProgram: Math.random() > 0.6,
    techStackEvolution: techStackEvolutions[Math.floor(Math.random() * 3)],
    mentorshipProgram: Math.random() > 0.4,
    promotionPathClear: Math.random() > 0.35,
    learningBudget: Math.random() > 0.5,
  };
}

function makeImplicitSignals(): JobPost['implicitSignals'] {
  return {
    techBlogFrequency: frequencies[Math.floor(Math.random() * 4)],
    openSourceContributions: Math.floor(Math.random() * 20),
    employeeLevelDistribution: {
      entry: Math.floor(Math.random() * 15) + 5,
      junior: Math.floor(Math.random() * 20) + 10,
      middle: Math.floor(Math.random() * 25) + 20,
      senior: Math.floor(Math.random() * 15) + 5,
      expert: Math.floor(Math.random() * 8) + 1,
      lead: Math.floor(Math.random() * 5) + 1,
    },
    avgTenureMonths: Math.floor(Math.random() * 30) + 18,
    internalPromotionRate: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100,
  };
}

function salaryForJob(jobId: string, level: number): [number, number] {
  const base: Record<string, number> = {
    'job-fe': 20, 'job-be': 22, 'job-ds': 30, 'job-pm': 24, 'job-ui': 18,
    'job-algo': 35, 'job-ops': 18, 'job-sec': 25, 'job-ia': 30, 'job-rc': 28,
    'job-cra': 15, 'job-me': 22, 'job-id': 20, 'job-plc': 18, 'job-dean': 22,
    'job-lecturer': 18, 'job-co': 20, 'job-po': 18, 'job-sc': 35, 'job-mc': 30,
    'job-content': 16, 'job-vd': 20,
  };
  const b = (base[jobId] || 20) * level;
  return [Math.round(b * 0.8), Math.round(b * 1.2)];
}

const allJobsFlat = industries.flatMap(ind => ind.categories.flatMap(cat => cat.jobs));

export const jobPosts: JobPost[] = Array.from({ length: 65 }, (_, i) => {
  const job = allJobsFlat[i % allJobsFlat.length];
  const company = companies[i % companies.length];
  const city = cities[i % cities.length];
  const level = Math.floor(i / allJobsFlat.length) + 1;
  const levelMap = ['entry', 'junior', 'middle'] as const;
  const lvlStr = levelMap[Math.min(level - 1, 2)];
  const levelText = lvlStr === 'entry' ? '校招' : lvlStr === 'junior' ? '1-3年' : '3-5年';
  return {
    id: `jp-${String(i + 1).padStart(3, '0')}`,
    title: `[${levelText}]${job.name}`,
    company,
    requiredCompetencyModelId: job.id,
    salaryRange: salaryForJob(job.id, level),
    city,
    description: `我们正在寻找优秀的${job.name}加入团队。您将负责核心业务的${job.name}相关工作，与来自顶尖公司的同事一起解决挑战性问题。公司提供具有竞争力的薪资、完善的福利体系和广阔的发展空间。要求：熟悉本岗位相关技能，具备良好的团队协作精神和沟通能力。`,
    growthTags: makeGrowthTags(),
    implicitSignals: makeImplicitSignals(),
    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
  };
});

function buildEncyclopedia(jobId: string, jobName: string, category: string, overview: string, workflow: EncyclopediaEntry['workflow'], careerProspects: string): EncyclopediaEntry {
  return {
    jobId, jobName, category, overview, careerProspects,
    avgSalaryDistribution: [
      { city: '北京', avg: 32000 }, { city: '上海', avg: 30000 }, { city: '深圳', avg: 31000 },
      { city: '杭州', avg: 28000 }, { city: '广州', avg: 25000 }, { city: '成都', avg: 22000 },
    ],
    workflow,
    workflowVideoUrl: `https://example.com/videos/${jobId}-workflow.mp4`,
    interviews: [
      {
        id: `int-${jobId}-1`, jobName, intervieweeName: '张工', yearsOfExperience: 6, currentLevel: '资深',
        audioUrl: `https://example.com/audio/int-${jobId}-1.mp3`, durationSeconds: 1800,
        transcript: `大家好，我是做${jobName}6年的张工。这些年最大的感受就是这个行业变化真的很快...`,
        keyInsights: ['保持学习是最重要的', '基础扎实才能走得远', '沟通能力同样关键'],
        tags: ['成长路径', '学习方法'],
      },
    ],
    entryThresholdLadder: [
      { step: 1, title: '入门期', description: '掌握基础概念和工具，能完成简单任务', estimatedMonths: 3, typicalObstacles: ['基础不扎实', '术语不熟悉'] },
      { step: 2, title: '成长期', description: '独立承担工作，解决常规问题', estimatedMonths: 12, typicalObstacles: ['经验不足', '效率待提升'] },
      { step: 3, title: '进阶期', description: '处理复杂任务，总结方法论', estimatedMonths: 24, typicalObstacles: ['综合能力瓶颈'] },
      { step: 4, title: '资深期', description: '制定策略，带团队或成为专家', estimatedMonths: 48, typicalObstacles: ['战略思维', '组织影响力'] },
    ],
  };
}

export const encyclopediaEntries: EncyclopediaEntry[] = [
  buildEncyclopedia('job-fe', '前端工程师', '技术研发',
    '前端工程师负责Web/移动应用的用户界面开发，通过HTML/CSS/JS将设计稿转化为用户可交互的产品。现代前端工程师已从"切图仔"进化为全栈工程师，负责性能优化、工程化、用户体验等全方位工作。',
    [
      { title: '需求评审与技术方案', description: '参与产品需求评审，评估技术可行性，输出技术方案', duration: '1-2天', tools: ['PRD文档', 'Figma', 'Notion'] },
      { title: 'UI组件开发', description: '基于设计稿开发可复用UI组件，确保视觉还原度', duration: '3-5天', tools: ['React', 'Figma', 'Storybook'] },
      { title: '业务逻辑对接', description: '对接后端API，完成数据交互和业务流程实现', duration: '3-5天', tools: ['Axios', 'TypeScript', 'Postman'] },
      { title: '性能优化与测试', description: '优化首屏加载、运行时性能，编写单元测试', duration: '2-3天', tools: ['Lighthouse', 'Vitest', 'Webpack'] },
      { title: '上线与运维', description: '部署上线，监控异常，持续迭代优化', duration: '持续', tools: ['Docker', 'Kibana', 'Sentry'] },
    ],
    '前端工程师的发展路径多元化：技术专家路线（资深→专家→架构师）、管理路线（TL→前端负责人→技术总监）、全栈路线（Node.js/BFF）、横向路线（技术布道师/开发者关系）。AI时代下，前端工程师更专注于用户体验和交互创新。'),
  buildEncyclopedia('job-be', '后端工程师', '技术研发',
    '后端工程师负责服务端业务逻辑实现、数据库设计、接口开发、系统架构等工作，是支撑整个互联网产品稳定运行的核心角色。',
    [
      { title: '需求分析与架构设计', description: '分析业务需求，设计系统架构和数据模型', duration: '2-3天', tools: ['UML', 'ER图', 'Swagger'] },
      { title: '接口开发', description: '开发RESTful/GraphQL接口，编写单元测试', duration: '5-10天', tools: ['Spring Boot', 'Junit', 'Postman'] },
      { title: '数据库设计', description: '设计数据库表结构，编写优化SQL', duration: '2-3天', tools: ['MySQL', 'Navicat', 'Flyway'] },
      { title: '集成测试', description: '与前端/测试联调，修复bug', duration: '3-5天', tools: ['Postman', 'JMeter'] },
      { title: '上线与维护', description: '发布上线，监控告警，持续优化', duration: '持续', tools: ['K8s', 'Prometheus', 'Grafana'] },
    ],
    '后端工程师可向架构师、技术专家、技术管理等方向发展。云原生、大数据、AI工程化是当前的热门方向，也是后端工程师的重要机会窗口。'),
  buildEncyclopedia('job-pm', '产品经理', '产品设计',
    '产品经理是产品的"CEO"，负责用户需求挖掘、产品规划、功能设计、项目推动等全流程工作，连接用户、技术、商业的桥梁角色。',
    [
      { title: '用户研究', description: '通过访谈、问卷、数据分析挖掘用户需求', duration: '3-7天', tools: ['用户访谈', '问卷星', 'SQL'] },
      { title: '需求分析', description: '将用户需求转化为产品功能，排优先级', duration: '2-3天', tools: ['KANO模型', 'RICE评分', 'Notion'] },
      { title: '产品设计', description: '输出PRD、原型、流程图', duration: '5-7天', tools: ['Axure', 'Figma', 'XMind'] },
      { title: '项目推动', description: '协调设计/开发/测试，推动项目交付', duration: '2-4周', tools: ['Jira', '飞书', '周会'] },
      { title: '效果复盘', description: '上线后数据分析，持续迭代优化', duration: '持续', tools: ['SQL', '神策', 'GA'] },
    ],
    '产品经理的发展路径：产品专家→产品负责人→产品总监→CPO，也可转向创业、投资、运营等方向。AI时代，具备AI产品思维的产品经理将更具竞争力。'),
  buildEncyclopedia('job-ui', 'UI设计师', '产品设计',
    'UI设计师负责产品视觉界面的设计，包括图标、配色、排版、组件等，通过美学创造愉悦的用户体验。',
    [
      { title: '需求理解', description: '理解产品目标和用户人群，制定设计方向', duration: '1-2天', tools: ['产品脑图', '竞品分析'] },
      { title: '视觉探索', description: '情绪板、配色方案、风格探索', duration: '2-3天', tools: ['Pinterest', 'Dribbble', 'Behance'] },
      { title: '界面设计', description: '页面设计、组件设计、图标绘制', duration: '5-7天', tools: ['Figma', 'Sketch', 'Photoshop'] },
      { title: '设计规范', description: '输出设计系统和组件库规范', duration: '2-3天', tools: ['Figma', '零高'] },
      { title: '走查验收', description: '和开发联调，还原设计效果', duration: '2-3天', tools: ['Figma', '浏览器'] },
    ],
    'UI设计师可向交互设计师、体验设计师、设计专家、设计管理等方向发展。AI工具时代，设计师的价值更偏向创意、策略和系统思维。'),
  buildEncyclopedia('job-ds', '数据科学家', '技术研发',
    '数据科学家通过统计学、机器学习等方法从海量数据中挖掘洞察，为业务决策提供数据支持，是连接数据与价值的关键角色。',
    [
      { title: '业务理解', description: '和业务方沟通，明确分析目标和问题定义', duration: '1-3天', tools: ['访谈', '文档'] },
      { title: '数据获取', description: 'SQL取数、数据清洗、数据校验', duration: '3-5天', tools: ['SQL', 'Python', 'Airflow'] },
      { title: '探索性分析', description: '数据可视化、描述统计、假设验证', duration: '3-5天', tools: ['Pandas', 'Matplotlib', 'Tableau'] },
      { title: '建模分析', description: '特征工程、模型训练、效果评估', duration: '5-10天', tools: ['Scikit-learn', 'XGBoost'] },
      { title: '报告产出', description: '撰写分析报告，推动业务落地', duration: '2-3天', tools: ['PPT', 'Notion'] },
    ],
    '数据科学家可向算法专家、数据总监、AI产品经理等方向发展。大模型时代，传统数据分析和机器学习的边界正在融合。'),
  buildEncyclopedia('job-algo', '算法工程师', '技术研发',
    '算法工程师专注于深度学习、机器学习算法的研发与落地，在AI浪潮中扮演核心技术角色。',
    [
      { title: '问题定义', description: '将业务问题转化为算法问题，明确评估指标', duration: '3-5天', tools: ['论文调研', '需求文档'] },
      { title: '数据准备', description: '数据清洗、标注、特征工程', duration: '5-10天', tools: ['Python', 'Spark'] },
      { title: '模型研发', description: '模型设计、训练调优、A/B测试', duration: '2-4周', tools: ['PyTorch', 'TensorBoard'] },
      { title: '工程落地', description: '模型部署、性能优化、线上监控', duration: '1-2周', tools: ['ONNX', 'TensorRT'] },
      { title: '效果迭代', description: '持续优化模型，跟踪前沿技术', duration: '持续', tools: ['arXiv', 'Grafana'] },
    ],
    '算法工程师可向研究科学家、AI架构师、技术管理等方向发展。大模型时代，LLM/多模态/Agent方向需求爆发。'),
  buildEncyclopedia('job-ia', '投资分析师', '投资分析',
    '投资分析师负责行业研究、公司分析、估值建模，为投资决策提供专业建议，是金融市场的核心研究力量。',
    [
      { title: '信息收集', description: '收集行业数据、公司公告、研报信息', duration: '3-5天', tools: ['Wind', 'Bloomberg'] },
      { title: '行业研究', description: '分析行业格局、政策环境、竞争态势', duration: '5-7天', tools: ['Excel', '行业数据库'] },
      { title: '公司分析', description: '财务分析、商业模式分析、竞争力评估', duration: '5-7天', tools: ['Excel', '年报'] },
      { title: '估值建模', description: 'DCF、可比公司估值、建模推演', duration: '3-5天', tools: ['Excel', 'PPT'] },
      { title: '报告撰写', description: '撰写投资报告，推荐投资决策', duration: '3-5天', tools: ['Word', 'PPT'] },
    ],
    '投资分析师可向投资经理、基金经理、行业专家、创业投资等方向发展。CFA/CPA证书是行业硬通货。'),
  buildEncyclopedia('job-rc', '风控经理', '投资分析',
    '风控经理负责识别、评估、控制各类金融风险，保障金融机构稳健运营，是金融行业的"守门人"。',
    [
      { title: '风险识别', description: '识别信用风险、市场风险、操作风险等', duration: '持续', tools: ['风险矩阵', '历史数据'] },
      { title: '模型开发', description: '开发风控模型、评分卡、反欺诈策略', duration: '2-4周', tools: ['Python', 'SAS', 'SQL'] },
      { title: '监控分析', description: '日常监控风险指标，分析异常情况', duration: '持续', tools: ['BI系统', '报表'] },
      { title: '报告撰写', description: '撰写风控报告，提出优化建议', duration: '定期', tools: ['PPT', 'Word'] },
      { title: '合规检查', description: '确保风控体系符合监管要求', duration: '持续', tools: ['监管文件', '审计系统'] },
    ],
    '风控经理可向风控总监、CRO、合规专家等方向发展。FRM证书是专业能力的重要体现。'),
  buildEncyclopedia('job-co', '品类运营', '运营管理',
    '品类运营负责特定商品类目的规划、招商、营销，通过精细化运营提升类目GMV，是电商平台的核心角色。',
    [
      { title: '类目规划', description: '制定类目发展策略、选品规划、品牌布局', duration: '季度', tools: ['数据大盘', '行业报告'] },
      { title: '招商管理', description: '商家招商、入驻审核、商家分层运营', duration: '持续', tools: ['CRM', 'Excel'] },
      { title: '营销策划', description: '策划大促活动、日常营销、内容种草', duration: '大促前1-2月', tools: ['活动系统', '数据分析'] },
      { title: '数据分析', description: '分析类目数据，发现问题并优化', duration: '持续', tools: ['SQL', 'BI'] },
      { title: '商家赋能', description: '培训商家、输出方法论、打造标杆', duration: '持续', tools: ['直播', '文档'] },
    ],
    '品类运营可向运营总监、类目负责人、商家运营专家、品牌方市场等方向发展。'),
  buildEncyclopedia('job-vd', '视频编导', '内容创作',
    '视频编导负责短视频/节目的内容策划、脚本撰写、拍摄指导、后期把控，是视频内容的灵魂创作者。',
    [
      { title: '选题策划', description: '热点追踪、用户调研、创意 brainstorm', duration: '每周', tools: ['抖音', '小红书', '新抖'] },
      { title: '脚本撰写', description: '撰写分镜脚本、台词、旁白文案', duration: '2-3天/条', tools: ['Word', 'Excel', '剪映脚本'] },
      { title: '拍摄指导', description: '指导演员、灯光、场景、镜头语言', duration: '拍摄日', tools: ['相机', '灯光', '场记板'] },
      { title: '后期把控', description: '跟剪辑沟通、配乐、字幕、调色把控', duration: '1-2天', tools: ['Premiere', 'AE', '剪映'] },
      { title: '数据复盘', description: '分析完播、点赞、评论数据，优化选题', duration: '上线后', tools: ['创作者平台', 'Excel'] },
    ],
    '视频编导可向内容总监、MCN负责人、独立导演、品牌内容官等方向发展。短视频时代，优质编导需求旺盛。'),
  buildEncyclopedia('job-id', '工业设计师', '工业工程',
    '工业设计师负责产品外观、人机交互、材料工艺的综合设计，将技术与美学融合，创造优秀的实体产品体验。',
    [
      { title: '需求调研', description: '用户研究、竞品分析、市场趋势洞察', duration: '1-2周', tools: ['访谈', 'Youtube', '设计网站'] },
      { title: '概念设计', description: '草图绘制、头脑风暴、概念方案输出', duration: '1-2周', tools: ['Sketchbook', 'Procreate', '马克笔'] },
      { title: '三维建模', description: 'Rhino/3Dmax建模、渲染效果图', duration: '2-3周', tools: ['Rhino', 'Keyshot', 'C4D'] },
      { title: '结构设计', description: '配合结构工程师、开模评估、工艺设计', duration: '持续', tools: ['Creo', 'AutoCAD'] },
      { title: '样机验证', description: '手板制作、测试迭代、量产跟进', duration: '1-2月', tools: ['3D打印', '工厂'] },
    ],
    '工业设计师可向设计总监、首席设计师、产品经理、独立设计工作室等方向发展。新能源、消费电子行业需求旺盛。'),
  buildEncyclopedia('job-ops', '运维工程师', '技术研发',
    '运维工程师负责IT基础设施的建设、监控、优化，保障系统稳定高效运行，是企业技术架构的"后勤保障部队"。',
    [
      { title: '基础设施搭建', description: '服务器、网络、存储环境搭建', duration: '项目初期', tools: ['Linux', '交换机', 'Ansible'] },
      { title: '监控告警体系', description: '搭建监控、告警、日志分析平台', duration: '持续', tools: ['Prometheus', 'Grafana', 'ELK'] },
      { title: '自动化运维', description: '编写运维脚本、CI/CD流程自动化', duration: '持续', tools: ['Python', 'Shell', 'Jenkins'] },
      { title: '故障处理', description: '7x24响应故障、根因分析、复盘改进', duration: '应急', tools: ['各种监控', '工单系统'] },
      { title: '性能优化', description: '系统性能调优、容量规划、成本优化', duration: '持续', tools: ['压测工具', '数据分析'] },
    ],
    '运维工程师可向SRE、DevOps专家、云架构师、技术管理等方向发展。云原生时代，K8s/容器化是核心技能。'),
  buildEncyclopedia('job-sc', '战略咨询顾问', '战略管理',
    '战略咨询顾问为企业提供战略规划、组织变革、业务转型等高端咨询服务，是"企业医生"式的智囊角色。',
    [
      { title: '项目启动', description: '客户沟通、问题界定、项目计划', duration: '1周', tools: ['Kickoff会议', '章程'] },
      { title: '信息收集', description: '桌面研究、行业访谈、数据收集', duration: '2-3周', tools: ['数据库', '访谈', '问卷'] },
      { title: '分析诊断', description: '行业分析、竞争分析、内部诊断', duration: '2-3周', tools: ['各种框架', 'Excel', 'PPT'] },
      { title: '方案设计', description: '战略方案、路线图、财务测算', duration: '2周', tools: ['PPT', 'Excel模型'] },
      { title: '汇报交付', description: '客户汇报、落地辅导、项目结案', duration: '1周', tools: ['汇报会', '文档'] },
    ],
    '战略咨询顾问可向合伙人、企业高管、投资机构、创业等方向发展。MBB背景是顶级通行证。'),
  buildEncyclopedia('job-lecturer', '在线讲师', '教学教研',
    '在线讲师通过互联网平台进行知识授课、课程设计、学员服务，是知识付费时代的核心内容创作者。',
    [
      { title: '课程规划', description: '用户调研、课程体系设计、大纲编写', duration: '新课前期', tools: ['用户访谈', '竞品分析'] },
      { title: '内容制作', description: 'PPT制作、脚本撰写、案例设计', duration: '每节课2-3天', tools: ['PowerPoint', 'Keynote'] },
      { title: '录播/直播', description: '课程录制、直播授课、互动答疑', duration: '录制日/直播日', tools: ['OBS', 'ClassIn', '小鹅通'] },
      { title: '学员服务', description: '作业批改、社群运营、1对1辅导', duration: '持续', tools: ['社群', '小程序'] },
      { title: '迭代优化', description: '收集反馈、更新内容、提升完课率', duration: '持续', tools: ['数据分析', '问卷'] },
    ],
    '在线讲师可向课程产品总监、教育IP、教育创业者、企业内训师等方向发展。AI+教育融合带来新机会。'),
  buildEncyclopedia('job-me', '医疗器械工程师', '医疗技术',
    '医疗器械工程师负责医疗设备的研发、测试、注册、生产，是医疗健康产业的核心技术力量，直接关系患者生命安全。',
    [
      { title: '需求定义', description: '临床需求调研、法规研读、产品定义', duration: '项目初期', tools: ['临床访谈', '法规文档'] },
      { title: '设计开发', description: '硬件设计、软件开发、原型制作', duration: '3-6月', tools: ['Altium', 'SolidWorks', 'Keil'] },
      { title: '测试验证', description: '性能测试、EMC测试、生物相容性测试', duration: '2-4月', tools: ['测试设备', '实验室'] },
      { title: '注册申报', description: '撰写注册资料、应对审评、现场核查', duration: '6-12月', tools: ['NMPA/510k文档', 'eCTD'] },
      { title: '生产转移', description: '工艺验证、产线搭建、质量体系', duration: '持续', tools: ['ISO13485', '生产系统'] },
    ],
    '医疗器械工程师可向研发总监、法规专家、临床专家、创业等方向发展。老龄化+国产替代带来长期红利。'),
];

const talentNames = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周强', '吴敏',
  '徐涛', '孙燕', '胡军', '朱琳', '郭鹏', '何倩', '高翔', '林晓', '罗宇', '郑华',
  '梁思', '谢涛', '宋佳', '唐杰', '韩雪', '冯刚', '董敏', '萧然', '曹阳', '程曦',
  '袁野', '邓超', '许晴', '傅明', '沈悦',
];
const talentAvatars = ['👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '🧑‍💻', '🧑‍🎓'];
const talentStatuses: Array<'new' | 'contacted' | 'screening' | 'interview' | 'offer' | 'archived'> = [
  'new', 'contacted', 'screening', 'interview', 'offer', 'archived',
];
const potentialLevelsArr: Array<'S' | 'A' | 'B' | 'C'> = ['S', 'A', 'B', 'C'];
const allTalentSkills = [
  'React', 'Vue', 'TypeScript', 'Node.js', 'Java', 'Spring Boot', 'Python', 'MySQL',
  'Redis', 'Kafka', 'Docker', 'K8s', '产品设计', '数据分析', '用户研究', 'Figma',
  'Sketch', '设计系统', '机器学习', '深度学习', 'PyTorch', 'SQL', 'Excel',
  '项目管理', '沟通协调', '演讲表达', '文案撰写', '视频剪辑', 'A/B测试',
];
const jobIds = ['job-fe', 'job-be', 'job-ds', 'job-pm', 'job-ui', 'job-algo', 'job-ia', 'job-rc', 'job-co', 'job-vd'];
const jobNamesArr = ['前端工程师', '后端工程师', '数据科学家', '产品经理', 'UI设计师', '算法工程师', '投资分析师', '风控经理', '品类运营', '视频编导'];
const tagPool = ['高潜力', '985/211', '海归', '大厂背景', '创业经验', '管理经验', '跨行业', '技术博客', '开源贡献'];
const tagPool2 = ['急招', '可内推', '薪资可谈', '下周可到岗', '有客户资源', '英语流利'];

export const talentPoolEntries: TalentPoolEntry[] = talentNames.map((name, i) => {
  const jidx = i % jobIds.length;
  const skills = Array.from({ length: 5 + Math.floor(Math.random() * 5) }, () =>
    allTalentSkills[Math.floor(Math.random() * allTalentSkills.length)]
  ).filter((v, idx, self) => self.indexOf(v) === idx);
  return {
    id: `talent-${String(i + 1).padStart(3, '0')}`,
    userId: `user-${1000 + i}`,
    userSummary: {
      name,
      avatar: talentAvatars[i % talentAvatars.length],
      currentJob: jobNamesArr[jidx],
      yearsOfExperience: Math.floor(Math.random() * 10) + 1,
      keySkills: skills.slice(0, 5),
      matchScore: Math.round((70 + Math.random() * 28) * 10) / 10,
    },
    potentialLevel: potentialLevelsArr[Math.floor(Math.random() * potentialLevelsArr.length)],
    tags: Array.from(new Set([
      tagPool[Math.floor(Math.random() * tagPool.length)],
      tagPool2[Math.floor(Math.random() * tagPool2.length)],
    ])),
    status: talentStatuses[i % talentStatuses.length],
    lastFollowUpAt: i % 3 === 0 ? undefined : new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString(),
    nextFollowUpAt: i % 2 === 0 ? new Date(Date.now() + Math.floor(Math.random() * 15) * 86400000).toISOString() : undefined,
    notes: `${name}，${jobNamesArr[jidx]}方向，过往履历优秀，具备${skills.slice(0, 3).join('、')}等核心技能，面试反馈良好。`,
    addedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
    matchJobs: [
      { jobId: jobIds[jidx], jobTitle: jobNamesArr[jidx], score: Math.round(75 + Math.random() * 20) },
      { jobId: jobIds[(jidx + 1) % jobIds.length], jobTitle: jobNamesArr[(jidx + 1) % jobNamesArr.length], score: Math.round(65 + Math.random() * 15) },
    ],
  };
});

const warningData = [
  { type: 'competition-intensified' as const, sev: 'critical' as const, msg: '该岗位近30天竞品公司新增招聘28个，薪酬上浮15%', sug: '建议提高薪酬预算10-15%，并突出福利和成长空间', dp: { newJobs: 28, salaryIncrease: 0.15, competitors: ['字节', '阿里', '腾讯'] } },
  { type: 'prolonged-hiring' as const, sev: 'warning' as const, msg: '该岗位平均招聘周期已达52天，超过警戒线35天', sug: '建议降低部分非核心要求，或启动猎头合作', dp: { avgDays: 52, threshold: 35, stageDrop: { screening: 0.4, interview: 0.6, offer: 0.8 } } },
  { type: 'skill-shortage' as const, sev: 'critical' as const, msg: '目标技能"大模型RAG"的人才池仅128人，供需比1:8', sug: '考虑相关技能替代或内部培养方案', dp: { poolSize: 128, demand: 1024, ratio: 0.125 } },
  { type: 'market-shift' as const, sev: 'warning' as const, msg: '行业AI转型加速，传统岗位需求月环比下降18%', sug: '及时调整招聘方向，增加AI相关岗位配比', dp: { decline: 0.18, growthJobs: ['AI产品', 'LLM工程师', 'Prompt工程师'] } },
  { type: 'competition-intensified' as const, sev: 'warning' as const, msg: '高端算法岗位被头部公司垄断，薪酬溢价40%', sug: '关注二三线城市远程人才或校招培养', dp: { premium: 0.4, topCompanies: ['OpenAI系', '字节', '百度'] } },
  { type: 'prolonged-hiring' as const, sev: 'info' as const, msg: '简历投递量同比下降40%，招聘漏斗收窄', sug: '加强雇主品牌建设，拓宽招聘渠道', dp: { drop: 0.4, channels: { boss: -35, liepin: -42, zhihu: -50 } } },
  { type: 'skill-shortage' as const, sev: 'critical' as const, msg: 'AIGC+设计复合人才严重短缺，供需比1:12', sug: '考虑对现有设计师进行AI工具培训', dp: { ratio: 0.083, trainedFrom: 'UI设计师', trainingPeriod: 3 } },
  { type: 'market-shift' as const, sev: 'info' as const, msg: '新能源行业爆发，相关制造岗位需求激增300%', sug: '建议锁定传统车企相关人才做转型', dp: { growth: 3.0, targetSource: ['上汽', '一汽', '广汽'] } },
  { type: 'competition-intensified' as const, sev: 'warning' as const, msg: '跨境电商运营岗位竞争白热化，转化率下降25%', sug: '增加内推激励和差异化福利', dp: { conversionDrop: 0.25, competitors: ['Shein', 'Temu', 'TikTok Shop'] } },
  { type: 'prolonged-hiring' as const, sev: 'critical' as const, msg: '关键岗位候选人offer拒绝率达65%', sug: '深入分析拒绝原因，优化薪酬与职级匹配', dp: { rejectRate: 0.65, topReasons: ['薪酬偏低', '职级不匹配', '地点不满意'] } },
];

export const jobWarnings: JobWarning[] = warningData.map((w, i) => {
  const jp = jobPosts[i % jobPosts.length];
  return {
    id: `warn-${String(i + 1).padStart(3, '0')}`,
    jobPostId: jp.id,
    jobTitle: jp.title,
    type: w.type,
    severity: w.sev,
    message: w.msg,
    suggestion: w.sug,
    dataPoint: w.dp,
    detectedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
  };
});

export const sampleDiagnosisReport: DiagnosisReport = {
  id: 'diag-sample-001',
  createdAt: new Date().toISOString(),
  targetJob: { id: 'job-fe', name: '前端工程师', level: 'middle' },
  overallMatchScore: 72.5,
  radarDimensions: [
    { dimension: '前端框架', current: 3.5, target: 4 },
    { dimension: '工程化能力', current: 2.8, target: 4 },
    { dimension: '基础技术', current: 3.2, target: 5 },
    { dimension: '沟通协作', current: 3.8, target: 4 },
    { dimension: '算法逻辑', current: 3.0, target: 3 },
    { dimension: '性能优化', current: 2.2, target: 3 },
  ],
  hardSkillGaps: [
    { skillId: 'hs-fe-4', skillName: '工程化工具链', currentLevel: 2, targetLevel: 4, gap: 2, priority: 'critical', suggestedAction: '系统学习Vite/Webpack原理，完成3个项目配置实战' },
    { skillId: 'hs-fe-6', skillName: '性能优化', currentLevel: 2, targetLevel: 3, gap: 1, priority: 'high', suggestedAction: '学习Lighthouse指标体系，优化2个实际项目首屏' },
    { skillId: 'hs-fe-5', skillName: '状态管理', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'high', suggestedAction: '深入学习Zustand/Jotai，重构1个复杂状态项目' },
    { skillId: 'hs-fe-7', skillName: 'Node.js基础', currentLevel: 2, targetLevel: 3, gap: 1, priority: 'medium', suggestedAction: '用Node.js写1个完整后端项目，含鉴权/数据库/部署' },
    { skillId: 'hs-fe-10', skillName: '可视化基础', currentLevel: 2, targetLevel: 3, gap: 1, priority: 'low', suggestedAction: '掌握Recharts常用图表，完成1个数据看板项目' },
  ],
  softSkillGaps: [
    { skillId: 'ss-job-fe-6', skillName: '学习成长', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'high', suggestedAction: '建立周度学习计划，每月输出1篇技术博客' },
    { skillId: 'ss-job-fe-1', skillName: '沟通表达', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'medium', suggestedAction: '主动承担技术分享，每季度做1次组内分享' },
  ],
  certificationRecommendations: competencyModels.find(c => c.jobId === 'job-fe')!.certifications,
  promotionPath: promotionPaths.find(p => p.fromJobId === 'job-fe')!,
  estimatedReadinessMonths: 6,
  learningPlan: [
    { phase: '基础补强期', durationWeeks: 4, tasks: ['系统学习Webpack/Vite配置', '掌握性能优化方法论', '完成2个基础项目配置'] },
    { phase: '进阶实战期', durationWeeks: 8, tasks: ['深入状态管理原理', '用Node.js完成BFF项目', '优化2个真实项目性能'] },
    { phase: '冲刺面试期', durationWeeks: 4, tasks: ['刷300道前端算法题', '梳理10个项目亮点', '完成10次模拟面试'] },
    { phase: '入职适应期', durationWeeks: 4, tasks: ['熟悉新公司技术栈', '建立内部影响力', '快速产出第一个成果'] },
  ],
};

export const diagnosisHistory: DiagnosisReport[] = [
  {
    ...sampleDiagnosisReport,
    id: 'diag-history-001',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    targetJob: { id: 'job-fe', name: '前端工程师', level: 'junior' },
    overallMatchScore: 58.0,
    estimatedReadinessMonths: 12,
  },
  {
    ...sampleDiagnosisReport,
    id: 'diag-history-002',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    overallMatchScore: 65.5,
    estimatedReadinessMonths: 8,
  },
  sampleDiagnosisReport,
];

export const currentUserProfile: UserProfile = {
  id: 'user-001',
  role: 'jobseeker',
  name: '李小明',
  email: 'lixiaoming@example.com',
  avatar: '👨‍💻',
  jobseekerProfile: {
    currentJob: '初级前端工程师',
    currentLevel: 'junior',
    yearsOfExperience: 2,
    skills: [
      { id: 'hs-fe-1', name: 'React/Vue框架', level: 3 },
      { id: 'hs-fe-2', name: 'TypeScript', level: 3 },
      { id: 'hs-fe-3', name: 'HTML5/CSS3', level: 4 },
      { id: 'hs-fe-5', name: '状态管理', level: 3 },
      { id: 'hs-fe-9', name: '测试技术', level: 2 },
    ],
    certifications: [
      { id: 'cert-fe-2', name: 'Meta Front-End Developer', date: '2025-08-15' },
    ],
    targetJobId: 'job-fe',
    resumeUrl: 'https://example.com/resume/lixiaoming.pdf',
  },
  growthTimeline: [
    { date: '2024-07-01', type: 'diagnosis', title: '第一次能力诊断', description: '目标前端工程师，匹配度58%', relatedSkill: '综合能力' },
    { date: '2024-09-15', type: 'skill-up', title: 'TypeScript等级提升', description: 'TS掌握度从2级提升到3级', relatedSkill: 'TypeScript' },
    { date: '2025-01-10', type: 'certification', title: '获得Meta前端认证', description: '通过Meta Front-End Developer考试', relatedSkill: '前端工程化' },
    { date: '2025-04-01', type: 'skill-up', title: 'React深入掌握', description: 'React等级从2级提升到3级', relatedSkill: 'React' },
    { date: '2025-05-20', type: 'interview', title: '字节跳动一面', description: '前端岗位首次面试，积累经验', relatedSkill: '面试能力' },
    { date: '2025-08-01', type: 'diagnosis', title: '第二次能力诊断', description: '经过学习，匹配度提升至72.5%', relatedSkill: '综合能力' },
  ],
  achievements: [
    { id: 'ach-1', title: '初识前端', description: '完成第一个前端项目并上线', icon: '🎯', earnedAt: '2023-08-01' },
    { id: 'ach-2', title: '百日筑基', description: '连续100天坚持技术学习', icon: '📚', earnedAt: '2024-01-10' },
    { id: 'ach-3', title: '认证达人', description: '获得首个行业权威认证', icon: '🏆', earnedAt: '2025-01-10' },
    { id: 'ach-4', title: '突破自我', description: '诊断匹配度突破70分', icon: '🚀', earnedAt: '2025-08-01' },
  ],
};

export const followUpReminders: FollowUpReminder[] = [
  { id: 'fu-001', talentId: 'talent-001', scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(), type: 'call', note: '跟进张伟的面试反馈，确认意向', completed: false },
  { id: 'fu-002', talentId: 'talent-003', scheduledAt: new Date(Date.now() + 1 * 86400000).toISOString(), type: 'email', note: '发送公司介绍资料和JD详情', completed: false },
  { id: 'fu-003', talentId: 'talent-005', scheduledAt: new Date(Date.now() - 1 * 86400000).toISOString(), type: 'interview', note: '安排技术二面，联系面试官', completed: true },
  { id: 'fu-004', talentId: 'talent-007', scheduledAt: new Date(Date.now() + 5 * 86400000).toISOString(), type: 'check-in', note: '入职1周跟进，了解适应情况', completed: false },
];
