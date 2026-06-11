export interface SkillTag {
  id: string
  name: string
  category: 'hard' | 'soft' | 'cert' | 'domain'
  level: number
  relatedSkills: string[]
  description: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  level: 'entry' | 'intermediate' | 'advanced' | 'expert'
  mappedSkills: string[]
  industryWeight: number
}

export interface ResumeData {
  id: string
  name: string
  title: string
  yearsOfExperience: number
  skills: string[]
  certifications: string[]
  projects: ProjectExperience[]
  education: Education[]
  workHistory: WorkExperience[]
  location: string
  annotatedKeywords: AnnotatedKeyword[]
  capabilityGaps: CapabilityGap[]
}

export interface ProjectExperience {
  id: string
  name: string
  vehicleModel?: string
  role: string
  duration: string
  description: string
  technologies: string[]
  testFieldExperience?: string
}

export interface Education {
  school: string
  degree: string
  major: string
  year: number
}

export interface WorkExperience {
  company: string
  position: string
  duration: string
  department: string
}

export interface AnnotatedKeyword {
  keyword: string
  type: 'skill' | 'cert' | 'domain' | 'project'
  matched: boolean
  source: string
}

export interface CapabilityGap {
  required: string
  current: string | null
  gap: string
  priority: 'high' | 'medium' | 'low'
}

export interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  salary: string
  description: string
  requiredSkills: string[]
  preferredSkills: string[]
  requiredCertifications: string[]
  vehicleModelBinding?: string
  testFieldRequired?: string
  iatfRequired?: boolean
  constraints: JobConstraint[]
  status: 'draft' | 'active' | 'paused' | 'closed'
  createdAt: string
  applicants: number
}

export interface JobConstraint {
  type: 'vehicle_model' | 'test_field' | 'certification' | 'experience' | 'education'
  label: string
  value: string
  required: boolean
}

export interface MatchResult {
  candidateId: string
  candidateName: string
  semanticScore: number
  networkScore: number
  regionalScore: number
  totalScore: number
  highlights: MatchHighlight[]
}

export interface MatchHighlight {
  type: 'semantic' | 'network' | 'regional'
  description: string
  detail: string
}

export interface FunnelData {
  stage: string
  count: number
  rate: number
}

export interface PositionFillCycle {
  position: string
  avgDays: number
  target: number
  trend: 'up' | 'down' | 'stable'
}

export interface HeadhunterROI {
  agency: string
  positions: number
  filled: number
  fillRate: number
  avgDays: number
  costPerHire: number
  roi: number
}

export const skillTags: SkillTag[] = [
  { id: 's1', name: 'CATIA V5/V6', category: 'hard', level: 5, relatedSkills: ['s2', 's3'], description: '达索3D设计软件，汽车车身/零部件设计核心工具' },
  { id: 's2', name: 'NX (UG)', category: 'hard', level: 4, relatedSkills: ['s1', 's4'], description: '西门子CAD/CAM/CAE一体化平台' },
  { id: 's3', name: 'ANSYS', category: 'hard', level: 5, relatedSkills: ['s5', 's6'], description: '有限元分析软件，结构/热/流体仿真' },
  { id: 's4', name: 'ADAMS', category: 'hard', level: 4, relatedSkills: ['s3', 's6'], description: '多体动力学仿真，悬架/底盘分析' },
  { id: 's5', name: 'ASPICE', category: 'hard', level: 5, relatedSkills: ['s7', 's8'], description: '汽车软件过程改进及能力评定' },
  { id: 's6', name: 'MATLAB/Simulink', category: 'hard', level: 4, relatedSkills: ['s3', 's9'], description: '控制系统设计与仿真' },
  { id: 's7', name: '功能安全 ISO 26262', category: 'cert', level: 5, relatedSkills: ['s5', 's8'], description: '汽车功能安全国际标准' },
  { id: 's8', name: 'AUTOSAR', category: 'hard', level: 5, relatedSkills: ['s5', 's10'], description: '汽车开放系统架构' },
  { id: 's9', name: 'CAN/LIN通信', category: 'hard', level: 4, relatedSkills: ['s8', 's10'], description: '车载网络通信协议' },
  { id: 's10', name: 'ROS2', category: 'hard', level: 3, relatedSkills: ['s9', 's11'], description: '机器人操作系统，自动驾驶开发框架' },
  { id: 's11', name: '深度学习', category: 'hard', level: 4, relatedSkills: ['s10', 's12'], description: '感知算法/目标检测/语义分割' },
  { id: 's12', name: 'C++/Python', category: 'hard', level: 5, relatedSkills: ['s10', 's11'], description: '嵌入式/算法开发核心语言' },
  { id: 's13', name: 'IATF 16949内审员', category: 'cert', level: 4, relatedSkills: ['s14', 's15'], description: '汽车质量管理体系审核资质' },
  { id: 's14', name: 'APQP/PPAP', category: 'domain', level: 4, relatedSkills: ['s13', 's15'], description: '产品质量先期策划/生产件批准程序' },
  { id: 's15', name: 'FMEA/SPC', category: 'domain', level: 4, relatedSkills: ['s13', 's14'], description: '失效模式分析/统计过程控制' },
  { id: 's16', name: '电池管理系统BMS', category: 'domain', level: 5, relatedSkills: ['s6', 's9'], description: '新能源电池监控与均衡控制' },
  { id: 's17', name: '电机控制', category: 'domain', level: 4, relatedSkills: ['s6', 's16'], description: '永磁同步电机FOC控制' },
  { id: 's18', name: '车载以太网', category: 'hard', level: 3, relatedSkills: ['s9', 's8'], description: 'SOME/IP/DDS高速车载通信' },
  { id: 's19', name: '激光雷达标定', category: 'hard', level: 3, relatedSkills: ['s11', 's10'], description: 'LiDAR点云处理与标定' },
  { id: 's20', name: '造型设计', category: 'domain', level: 4, relatedSkills: ['s1', 's2'], description: '汽车外观/内饰创意设计' },
]

export const certifications: Certification[] = [
  { id: 'c1', name: 'ISO 26262 功能安全工程师', issuer: 'TÜV/SGS', level: 'advanced', mappedSkills: ['s7'], industryWeight: 95 },
  { id: 'c2', name: 'ASPICE Assessor', issuer: 'intacs', level: 'advanced', mappedSkills: ['s5'], industryWeight: 90 },
  { id: 'c3', name: 'IATF 16949 内审员', issuer: 'IATF认可机构', level: 'intermediate', mappedSkills: ['s13', 's14', 's15'], industryWeight: 88 },
  { id: 'c4', name: 'AUTOSAR 认证工程师', issuer: 'AUTOSAR', level: 'advanced', mappedSkills: ['s8'], industryWeight: 85 },
  { id: 'c5', name: 'CATIA V5 专业认证', issuer: 'Dassault', level: 'intermediate', mappedSkills: ['s1'], industryWeight: 80 },
  { id: 'c6', name: '六西格玛黑带', issuer: 'ASQ', level: 'advanced', mappedSkills: ['s15'], industryWeight: 75 },
  { id: 'c7', name: 'PMP项目管理', issuer: 'PMI', level: 'intermediate', mappedSkills: [], industryWeight: 70 },
  { id: 'c8', name: 'CCF CSP软件能力', issuer: '中国计算机学会', level: 'intermediate', mappedSkills: ['s12'], industryWeight: 65 },
]

export const sampleResumes: ResumeData[] = [
  {
    id: 'r1',
    name: '张明远',
    title: '高级功能安全工程师',
    yearsOfExperience: 8,
    skills: ['s7', 's5', 's8', 's9', 's12', 's6'],
    certifications: ['c1', 'c2'],
    projects: [
      { id: 'p1', name: 'L3级自动驾驶功能安全开发', vehicleModel: '理想L9', role: '功能安全负责人', duration: '2022.03-2024.06', description: '负责L3自动驾驶系统功能安全概念设计，完成HARA分析，定义ASIL等级', technologies: ['ISO 26262', 'ASPICE', 'MATLAB'] },
      { id: 'p2', name: '整车电子电气架构升级', vehicleModel: '比亚迪汉EV', role: '系统工程师', duration: '2020.06-2022.02', description: '参与域控制器架构设计，完成CAN/LIN网络规划与信号路由', technologies: ['AUTOSAR', 'CAN', 'CAPL'], testFieldExperience: '襄阳试车场' },
    ],
    education: [{ school: '同济大学', degree: '硕士', major: '车辆工程', year: 2016 }],
    workHistory: [
      { company: '理想汽车', position: '功能安全高级工程师', duration: '2022.03-至今', department: '自动驾驶事业部' },
      { company: '比亚迪', position: '系统工程师', duration: '2018.07-2022.02', department: '电子电气架构部' },
    ],
    location: '北京',
    annotatedKeywords: [
      { keyword: '功能安全', type: 'domain', matched: true, source: 'ISO 26262' },
      { keyword: 'ASPICE', type: 'skill', matched: true, source: '项目经历' },
      { keyword: 'AUTOSAR', type: 'skill', matched: true, source: '项目经历' },
      { keyword: 'CATIA', type: 'skill', matched: false, source: 'JD要求' },
      { keyword: 'IATF 16949', type: 'cert', matched: false, source: 'JD要求' },
    ],
    capabilityGaps: [
      { required: 'CATIA V5 三维建模能力', current: null, gap: '缺少机械设计工具经验', priority: 'medium' },
      { required: 'IATF 16949审核经验', current: null, gap: '缺少质量体系审核资质', priority: 'low' },
    ],
  },
  {
    id: 'r2',
    name: '李思琪',
    title: 'BMS算法工程师',
    yearsOfExperience: 5,
    skills: ['s16', 's6', 's12', 's3', 's17'],
    certifications: ['c8'],
    projects: [
      { id: 'p3', name: 'CTP电池包BMS开发', vehicleModel: '蔚来ET5', role: '算法工程师', duration: '2021.08-2024.01', description: '开发SOC/SOH估算算法，实现电池均衡策略优化', technologies: ['MATLAB/Simulink', 'C++', 'Python'] },
      { id: 'p4', name: '热失控预警系统', vehicleModel: '小鹏G9', role: '核心开发', duration: '2023.03-2024.05', description: '基于多传感器融合的热失控预警算法研发', technologies: ['ANSYS', 'Python', '深度学习'], testFieldExperience: '黑河冬季测试场' },
    ],
    education: [{ school: '清华大学', degree: '硕士', major: '电气工程', year: 2019 }],
    workHistory: [
      { company: '蔚来汽车', position: 'BMS算法工程师', duration: '2021.08-至今', department: '电池系统部' },
      { company: '宁德时代', position: '算法工程师', duration: '2019.07-2021.07', department: 'BMS研发部' },
    ],
    location: '上海',
    annotatedKeywords: [
      { keyword: 'BMS', type: 'skill', matched: true, source: '项目经历' },
      { keyword: '电池管理', type: 'domain', matched: true, source: '项目经历' },
      { keyword: '功能安全', type: 'domain', matched: false, source: 'JD要求' },
      { keyword: 'AUTOSAR', type: 'skill', matched: false, source: 'JD要求' },
    ],
    capabilityGaps: [
      { required: '功能安全ISO 26262经验', current: null, gap: '缺少功能安全开发流程经验', priority: 'high' },
      { required: 'AUTOSAR架构经验', current: null, gap: '缺少AUTOSAR软件组件开发经验', priority: 'medium' },
    ],
  },
  {
    id: 'r3',
    name: '王浩然',
    title: '底盘悬架CAE工程师',
    yearsOfExperience: 10,
    skills: ['s1', 's3', 's4', 's6', 's14', 's15'],
    certifications: ['c5', 'c6'],
    projects: [
      { id: 'p5', name: '多连杆悬架优化', vehicleModel: '领克09', role: 'CAE负责人', duration: '2020.01-2022.12', description: '完成悬架K&C特性仿真，优化硬点设计，提升操控稳定性', technologies: ['ADAMS', 'ANSYS', 'CATIA'], testFieldExperience: '中汽中心盐城试车场' },
      { id: 'p6', name: '电动车平台底盘开发', vehicleModel: '极氪001', role: '高级工程师', duration: '2022.06-2024.08', description: '空气悬架系统匹配调校，完成整车操稳/平顺性开发', technologies: ['ADAMS', 'MATLAB', 'CATIA'], testFieldExperience: '牙克石冬季测试场' },
    ],
    education: [{ school: '吉林大学', degree: '博士', major: '车辆工程', year: 2014 }],
    workHistory: [
      { company: '吉利汽车', position: 'CAE高级工程师', duration: '2018.03-至今', department: '底盘开发中心' },
      { company: '一汽轿车', position: '悬架工程师', duration: '2014.07-2018.02', department: '底盘部' },
    ],
    location: '长春',
    annotatedKeywords: [
      { keyword: 'ADAMS', type: 'skill', matched: true, source: '项目经历' },
      { keyword: 'CATIA', type: 'skill', matched: true, source: '项目经历' },
      { keyword: 'FMEA', type: 'domain', matched: true, source: '项目经历' },
      { keyword: 'ASPICE', type: 'skill', matched: false, source: 'JD要求' },
    ],
    capabilityGaps: [
      { required: 'ASPICE流程经验', current: null, gap: '缺少汽车软件开发流程经验', priority: 'low' },
    ],
  },
]

export const samplePositions: JobPosition[] = [
  {
    id: 'j1',
    title: '功能安全经理',
    department: '自动驾驶事业部',
    location: '北京/上海',
    salary: '50-80K',
    description: '负责L2+/L3自动驾驶系统功能安全全流程管理，建立安全文化与流程体系',
    requiredSkills: ['s7', 's5', 's8'],
    preferredSkills: ['s9', 's12', 's6'],
    requiredCertifications: ['c1'],
    vehicleModelBinding: '全平台车型',
    iatfRequired: false,
    constraints: [
      { type: 'certification', label: '功能安全认证', value: 'ISO 26262功能安全工程师(TÜV/SGS)', required: true },
      { type: 'experience', label: '功能安全经验', value: '5年以上整车功能安全开发经验', required: true },
      { type: 'vehicle_model', label: '车型经验', value: '至少参与1个L2+及以上级别自动驾驶车型量产', required: true },
      { type: 'education', label: '学历', value: '车辆工程/自动化/计算机硕士及以上', required: true },
    ],
    status: 'active',
    createdAt: '2024-10-15',
    applicants: 47,
  },
  {
    id: 'j2',
    title: 'BMS高级算法工程师',
    department: '电池系统部',
    location: '上海/合肥',
    salary: '40-65K',
    description: '负责动力电池BMS核心算法开发，包括SOC/SOH估算、均衡策略、热管理算法',
    requiredSkills: ['s16', 's6', 's12'],
    preferredSkills: ['s3', 's17', 's7'],
    requiredCertifications: [],
    vehicleModelBinding: '800V高压平台',
    testFieldRequired: '黑河/牙克石冬季测试',
    iatfRequired: false,
    constraints: [
      { type: 'experience', label: 'BMS经验', value: '3年以上BMS算法开发经验', required: true },
      { type: 'vehicle_model', label: '车型经验', value: '至少参与1款新能源车型BMS量产', required: true },
      { type: 'test_field', label: '试验场', value: '具备黑河/牙克石冬季标定测试经历', required: false },
      { type: 'education', label: '学历', value: '电气工程/控制工程硕士及以上', required: true },
    ],
    status: 'active',
    createdAt: '2024-11-01',
    applicants: 32,
  },
  {
    id: 'j3',
    title: '底盘CAE高级工程师',
    department: '底盘开发中心',
    location: '长春/武汉',
    salary: '35-55K',
    description: '负责悬架系统多体动力学仿真与优化，支撑整车操稳平顺性开发',
    requiredSkills: ['s4', 's3', 's1'],
    preferredSkills: ['s6', 's14', 's15'],
    requiredCertifications: ['c5'],
    testFieldRequired: '中汽中心盐城/牙克石',
    iatfRequired: true,
    constraints: [
      { type: 'certification', label: '设计工具', value: 'CATIA V5专业认证', required: true },
      { type: 'certification', label: '质量体系', value: 'IATF 16949内审员资质', required: true },
      { type: 'experience', label: 'CAE经验', value: '5年以上悬架/底盘CAE分析经验', required: true },
      { type: 'test_field', label: '试验场', value: '具备盐城/牙克石调校测试经历', required: true },
      { type: 'vehicle_model', label: '车型经验', value: '至少参与2款车型底盘开发', required: false },
    ],
    status: 'active',
    createdAt: '2024-10-20',
    applicants: 23,
  },
]

export const matchResults: MatchResult[] = [
  {
    candidateId: 'r1',
    candidateName: '张明远',
    semanticScore: 92,
    networkScore: 78,
    regionalScore: 85,
    totalScore: 86.3,
    highlights: [
      { type: 'semantic', description: '岗位描述高度匹配', detail: '功能安全开发经验与JD关键词重合度92%，L3自动驾驶项目经历直接匹配' },
      { type: 'network', description: '前司校友网络', detail: '3位同校校友在目标企业任职，2位前同事在职' },
      { type: 'regional', description: '北京产业集群', detail: '目标企业位于北京亦庄汽车智能产业园，人才密度高' },
    ],
  },
  {
    candidateId: 'r2',
    candidateName: '李思琪',
    semanticScore: 75,
    networkScore: 82,
    regionalScore: 90,
    totalScore: 80.5,
    highlights: [
      { type: 'semantic', description: '部分技能匹配', detail: 'BMS核心算法匹配，但功能安全经验缺失，需补充培训' },
      { type: 'network', description: '行业人脉广泛', detail: '5位同校校友在目标企业，蔚来前同事3人在职' },
      { type: 'regional', description: '上海新能源聚集', detail: '上海嘉定/临港新能源产业链完整，地域优势明显' },
    ],
  },
  {
    candidateId: 'r3',
    candidateName: '王浩然',
    semanticScore: 88,
    networkScore: 65,
    regionalScore: 95,
    totalScore: 82.0,
    highlights: [
      { type: 'semantic', description: 'CAE技能深度匹配', detail: 'ADAMS/ANSYS/CATIA技能完全匹配，底盘开发经验丰富' },
      { type: 'network', description: '人脉适中', detail: '吉林大学校友2人在目标企业，一汽前同事1人在职' },
      { type: 'regional', description: '长春汽车集群核心', detail: '长春一汽产业集群，地域匹配度最高' },
    ],
  },
]

export const funnelData: FunnelData[] = [
  { stage: '简历投递', count: 1240, rate: 100 },
  { stage: '初筛通过', count: 620, rate: 50 },
  { stage: '技术评估', count: 280, rate: 22.6 },
  { stage: '面试邀约', count: 145, rate: 11.7 },
  { stage: '终面通过', count: 52, rate: 4.2 },
  { stage: 'Offer发放', count: 35, rate: 2.8 },
  { stage: '入职到岗', count: 28, rate: 2.3 },
]

export const positionFillCycles: PositionFillCycle[] = [
  { position: '功能安全工程师', avgDays: 68, target: 45, trend: 'down' },
  { position: 'BMS算法工程师', avgDays: 55, target: 40, trend: 'stable' },
  { position: '底盘CAE工程师', avgDays: 42, target: 35, trend: 'up' },
  { position: '智能驾驶算法', avgDays: 75, target: 50, trend: 'down' },
  { position: '电机控制工程师', avgDays: 48, target: 38, trend: 'stable' },
  { position: '车载网络工程师', avgDays: 38, target: 30, trend: 'up' },
]

export const headhunterROI: HeadhunterROI[] = [
  { agency: '科锐国际', positions: 12, filled: 8, fillRate: 66.7, avgDays: 42, costPerHire: 85000, roi: 3.2 },
  { agency: '猎聘汽车', positions: 8, filled: 5, fillRate: 62.5, avgDays: 55, costPerHire: 72000, roi: 2.8 },
  { agency: '万宝盛华', positions: 6, filled: 4, fillRate: 66.7, avgDays: 38, costPerHire: 95000, roi: 2.5 },
  { agency: '米高蒲志', positions: 10, filled: 7, fillRate: 70.0, avgDays: 45, costPerHire: 88000, roi: 3.0 },
]

export const industryClusters = [
  { city: '长春', weight: 95, tags: ['一汽集团', '一汽大众', '一汽解放'], field: '传统制造' },
  { city: '武汉', weight: 88, tags: ['东风集团', '路特斯', '小鹏武汉'], field: '传统+新能源' },
  { city: '合肥', weight: 92, tags: ['蔚来', '大众安徽', '江淮'], field: '新能源' },
  { city: '上海', weight: 96, tags: ['上汽', '特斯拉', '蔚来R&D'], field: '全产业链' },
  { city: '北京', weight: 90, tags: ['理想', '小米汽车', '北汽'], field: '智能驾驶' },
  { city: '广州', weight: 87, tags: ['广汽埃安', '小鹏', '比亚迪'], field: '新能源' },
  { city: '重庆', weight: 82, tags: ['长安', '赛力斯', '阿维塔'], field: '传统+新能源' },
  { city: '深圳', weight: 91, tags: ['比亚迪', '华为车BU', '元戎启行'], field: '新能源+智驾' },
  { city: '常州', weight: 78, tags: ['理想常州', '中创新航', '宁德时代'], field: '新能源电池' },
  { city: '西安', weight: 75, tags: ['比亚迪西安', '陕汽'], field: '制造基地' },
]
