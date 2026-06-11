export interface Job {
  id: string
  title: string
  company: string
  companyLogo: string
  salary: string
  location: string
  industry: string
  type: string
  tags: string[]
  matchScore: number
  matchReasons: string[]
  matchedSkills: string[]
  description: string
  requirements: string[]
  interviewSlots: InterviewSlot[]
  hasVideoInterview: boolean
}

export interface InterviewSlot {
  date: string
  time: string
  available: boolean
}

export const mySkillTags = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Figma', '数据分析', '项目管理']

export const jobList: Job[] = [
  {
    id: '1',
    title: '高级前端工程师',
    company: '华为技术有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20company%20logo%20blue%20minimal%20icon&image_size=square',
    salary: '25K-40K',
    location: '深圳',
    industry: '互联网/通信',
    type: '全职',
    tags: ['React', 'TypeScript', 'Node.js', '前端架构'],
    matchScore: 95,
    matchReasons: ['技能标签「React」「TypeScript」「Node.js」完全匹配', '5年前端经验符合岗位要求', '具备架构设计能力与岗位需求高度一致'],
    matchedSkills: ['React', 'TypeScript', 'Node.js'],
    description: '负责公司核心产品前端架构设计与开发，推动前端工程化体系建设，参与技术选型与方案评审，指导团队技术成长。',
    requirements: ['5年以上前端开发经验', '精通React技术栈', '具备大型项目架构设计能力', '良好的沟通协作能力'],
    interviewSlots: [
      { date: '2026-06-10', time: '10:00-10:30', available: true },
      { date: '2026-06-10', time: '14:00-14:30', available: true },
      { date: '2026-06-11', time: '10:00-10:30', available: false },
      { date: '2026-06-11', time: '15:00-15:30', available: true },
      { date: '2026-06-12', time: '09:30-10:00', available: true },
    ],
    hasVideoInterview: true,
  },
  {
    id: '2',
    title: 'Java高级开发工程师',
    company: '腾讯科技（深圳）有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20penguin%20logo%20blue%20icon&image_size=square',
    salary: '30K-50K',
    location: '深圳',
    industry: '互联网/游戏',
    type: '全职',
    tags: ['Java', '微服务', 'Spring Boot', '分布式'],
    matchScore: 82,
    matchReasons: ['项目管理技能与微服务架构经验相关', 'SQL技能与数据库设计需求匹配', 'Node.js后端经验可迁移至Java生态'],
    matchedSkills: ['SQL', '项目管理'],
    description: '参与公司核心业务系统的架构设计与开发，负责高并发、高可用系统设计与实现，推动技术架构演进。',
    requirements: ['5年以上Java开发经验', '精通Spring生态', '具备分布式系统设计经验', '熟悉MySQL、Redis等中间件'],
    interviewSlots: [
      { date: '2026-06-10', time: '11:00-11:30', available: true },
      { date: '2026-06-12', time: '14:00-14:30', available: true },
    ],
    hasVideoInterview: true,
  },
  {
    id: '3',
    title: '产品经理',
    company: '广州唯品会信息科技有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20e-commerce%20logo%20pink%20icon&image_size=square',
    salary: '20K-35K',
    location: '广州',
    industry: '电子商务',
    type: '全职',
    tags: ['产品规划', '用户研究', '数据分析', 'B端产品'],
    matchReasons: ['数据分析技能与产品决策需求匹配', '项目管理经验可迁移至产品管理', 'SQL能力支撑数据驱动产品迭代'],
    matchedSkills: ['数据分析', '项目管理', 'SQL'],
    matchScore: 76,
    description: '负责公司B端产品线的规划与迭代，深入理解业务需求，推动产品从0到1及持续优化。',
    requirements: ['3年以上产品经理经验', '具备B端产品经验', '优秀的需求分析能力', '数据驱动思维'],
    interviewSlots: [
      { date: '2026-06-11', time: '10:00-10:30', available: true },
      { date: '2026-06-12', time: '11:00-11:30', available: true },
    ],
    hasVideoInterview: true,
  },
  {
    id: '4',
    title: '数据分析师',
    company: '珠海格力电器股份有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20manufacturing%20logo%20blue%20icon&image_size=square',
    salary: '15K-25K',
    location: '珠海',
    industry: '制造业',
    type: '全职',
    tags: ['Python', 'SQL', '数据可视化', '统计分析'],
    matchScore: 68,
    matchReasons: ['Python和SQL技能直接匹配岗位核心要求', '数据分析能力符合业务需求', '缺乏Tableau/Power BI经验影响匹配度'],
    matchedSkills: ['Python', 'SQL', '数据分析'],
    description: '负责公司运营数据的采集、清洗、分析工作，输出数据报告，为业务决策提供数据支撑。',
    requirements: ['2年以上数据分析经验', '精通Python和SQL', '熟悉Tableau或Power BI', '统计学或数学背景优先'],
    interviewSlots: [
      { date: '2026-06-13', time: '09:00-09:30', available: true },
    ],
    hasVideoInterview: false,
  },
  {
    id: '5',
    title: 'UI/UX设计师',
    company: '广东OPPO移动通信有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20phone%20logo%20green%20icon&image_size=square',
    salary: '18K-30K',
    location: '东莞',
    industry: '智能硬件',
    type: '全职',
    tags: ['UI设计', '交互设计', 'Figma', '设计系统'],
    matchScore: 71,
    matchReasons: ['Figma技能与岗位设计工具要求直接匹配', '前端开发经验有助理解设计落地', '缺乏专业UI/UX作品集影响匹配度'],
    matchedSkills: ['Figma'],
    description: '负责公司移动端产品的UI/UX设计，建立和维护设计系统，推动产品体验升级。',
    requirements: ['3年以上UI/UX设计经验', '精通Figma等设计工具', '具备设计系统构建经验', '优秀的审美与用户体验意识'],
    interviewSlots: [
      { date: '2026-06-10', time: '15:00-15:30', available: true },
      { date: '2026-06-11', time: '14:00-14:30', available: true },
    ],
    hasVideoInterview: true,
  },
  {
    id: '6',
    title: '人力资源专员',
    company: '佛山美的集团股份有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20appliance%20logo%20blue%20white%20icon&image_size=square',
    salary: '10K-18K',
    location: '佛山',
    industry: '制造业',
    type: '全职',
    tags: ['招聘', '员工关系', 'HRBP', '组织发展'],
    matchScore: 55,
    matchReasons: ['项目管理经验可迁移至HR模块管理', '数据分析能力可支撑HR数据报表', '专业技能与HR岗位匹配度较低'],
    matchedSkills: ['项目管理', '数据分析'],
    description: '负责公司招聘、员工关系管理、培训组织等HR模块工作，支撑业务部门人才需求。',
    requirements: ['2年以上HR工作经验', '熟悉劳动法规', '良好的沟通协调能力', '有人力资源管理师证书优先'],
    interviewSlots: [
      { date: '2026-06-12', time: '10:00-10:30', available: true },
    ],
    hasVideoInterview: false,
  },
]
