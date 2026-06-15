/**
 * 项目权威类型定义
 * 本文件是整个项目唯一的类型来源，前后端共用
 * 所有类型定义必须在此文件中维护，禁止在其他地方重复定义
 */

// ==================== 枚举定义 ====================

/**
 * 中山市25个镇街的2字母编码
 */
export enum TownshipCode {
  SQ = 'SQ',
  DQ = 'DQ',
  XQ = 'XQ',
  NQ = 'NQ',
  WGS = 'WGS',
  XL = 'XL',
  GZ = 'GZ',
  DS = 'DS',
  DF = 'DF',
  FS = 'FS',
  HP = 'HP',
  NT = 'NT',
  SJ = 'SJ',
  MZ = 'MZ',
  NL = 'NL',
  GK = 'GK',
  SX = 'SX',
  DC = 'DC',
  BF = 'BF',
  SX2 = 'SX2',
  TZ = 'TZ',
  SW = 'SW',
  HL = 'HL',
  ZG = 'ZG',
  CH = 'CH',
}

/**
 * 行业标签
 */
export enum IndustryTag {
  HARDWARE = '五金',
  LIGHTING = '灯饰',
  CASUALWEAR = '休闲服',
  FURNITURE = '家具',
  ELECTRONICS = '电子',
  MACHINERY = '机械装备',
  APPLIANCE = '家电',
  FOOD = '食品',
  NEWENERGY = '新能源',
  ROBOTICS = '工业机器人',
}

/**
 * 求职者类型
 */
export enum JobSeekerType {
  BLUE_COLLAR = '蓝领',
  BLUECOLLAR = '蓝领',
  SKILLED_WORKER = '技工',
  SKILLED = '技工',
  FRESH_GRADUATE = '应届生',
  GRADUATE = '应届生',
}

/**
 * 面试阶段
 */
export enum InterviewStage {
  WRITTEN_EXAM = '笔试',
  WRITTEN = '笔试',
  AI_SCREENING = 'AI初筛',
  AISCREEN = 'AI初筛',
  TECHNICAL = '技术面',
  TECH = '技术面',
  HR_FINAL = 'HR终面',
  HR = 'HR面',
  DIRECTOR = '总监面',
}

/**
 * 投递状态
 */
export enum ApplicationStatus {
  APPLYING = '投递中',
  PENDING = '待处理',
  VIEWED = '已查看',
  SCREENING_PASSED = '初筛通过',
  SCREEN_PASS = '初筛通过',
  INTERVIEWING = '面试中',
  INTERVIEW = '面试中',
  OFFER_SENT = '已发Offer',
  OFFER = '已发Offer',
  ONBOARDED = '已入职',
  HIRED = '已录用',
  REJECTED = '已淘汰',
  UNSUITABLE = '不合适',
  ABANDONED = '已放弃',
}

/**
 * RPO项目阶段状态
 */
export enum RPOStageStatus {
  DEMAND_CONFIRM = '需求确认',
  SOURCING = '寻访中',
  SCREENING = '初筛',
  INTERVIEW_RECOMMEND = '推荐面试',
  OFFER_STAGE = 'Offer阶段',
  ONBOARD_STAGE = '入职阶段',
  GUARANTEE_PERIOD = '保用期',
  COMPLETED = '已完成',
}

export enum RPOStageEnum {
  REQUIREMENT = '需求确认',
  SEARCHING = '寻访中',
  SCREENING = '初筛中',
  RECOMMENDED = '已推荐',
  INTERVIEW = '面试中',
  OFFER = '已发Offer',
  ONBOARD = '待入职',
  PROBATION = '保用期',
  COMPLETED = '已完成',
  DEMAND = '需求确认',
  SOURCING = '寻访中',
  GUARANTEE = '保用期',
  CANCELLED = '已取消',
}

/**
 * 补贴类型
 */
export enum SubsidyType {
  ENTERPRISE_HIRE = '企业吸纳就业',
  GRADUATE_EMPLOY = '高校毕业生就业',
  SKILL_UPGRADE = '技能提升',
  SOCIAL_INSURANCE = '社保补贴',
  RECRUITMENT = '招聘补贴',
  SOCIAL = '社保补贴',
  SKILL_TRAINING = '技能培训补贴',
  STABLE = '稳岗补贴',
}

/**
 * 补贴状态
 */
export enum SubsidyStatus {
  DRAFT = '草稿',
  SUBMITTED = '已提交',
  AUDITING = '审核中',
  REVIEWING = '审核中',
  APPROVED = '已通过',
  REJECTED = '已驳回',
  PAID = '已发放',
}

/**
 * 课程类型
 */
export enum CourseType {
  SELF_STUDY = '自考',
  ADULT_EDU = '成考',
  VOCATIONAL_QUAL = '职业资格',
}

/**
 * 学分银行同步状态
 */
export enum CreditBankStatus {
  NOT_SYNCED = '未同步',
  SYNCING = '同步中',
  SYNCED = '已同步',
  CERTIFIED = '已认证',
}

// ==================== 基础实体类型 ====================

/**
 * 技能项
 */
export interface SkillItem {
  id: string;
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  category: string;
  years?: number;
}

/**
 * 必填技能
 */
export interface RequiredSkill {
  id: string;
  name: string;
  weight: number;
  required: boolean;
  minProficiency?: 1 | 2 | 3 | 4 | 5;
}

/**
 * 教育经历
 */
export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: '高中' | '中专' | '大专' | '本科' | '硕士' | '博士';
  startDate: string;
  endDate: string;
  description?: string;
}

/**
 * 工作经历
 */
export interface WorkItem {
  id: string;
  company: string;
  position: string;
  department?: string;
  township?: TownshipCode;
  startDate: string;
  endDate: string;
  salary?: number;
  highlights: string[];
  skillsUsed?: string[];
}

/**
 * 项目经历
 */
export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
  skillsUsed?: string[];
}

/**
 * 证书
 */
export interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

/**
 * 求职者
 */
export interface JobSeeker {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  email?: string;
  avatar?: string;
  type: JobSeekerType;
  township: TownshipCode;
  expectPosition: string;
  expectSalaryMin: number;
  expectSalaryMax: number;
  status: '求职中' | '在职看机会' | '暂不考虑';
  workYears: number;
  highestDegree: '高中' | '中专' | '大专' | '本科' | '硕士' | '博士' | '初中';
  resumeId?: string;
  tags: string[];
  createdAt: string;
  [key: string]: any;
}

/**
 * 简历基本信息
 */
export interface ResumeBasicInfo {
  name: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  email?: string;
  location: TownshipCode;
  avatar?: string;
  education: '高中' | '中专' | '大专' | '本科' | '硕士' | '博士';
  workYears: number;
  jobSeekerType?: JobSeekerType;
  expectPosition?: string;
  expectSalary?: [number, number];
}

/**
 * 简历
 */
export interface Resume {
  id: string;
  jobSeekerId: string;
  title: string;
  basicInfo?: ResumeBasicInfo;
  skills: SkillItem[];
  educationList: EducationItem[];
  workList: WorkItem[];
  projectList: ProjectItem[];
  certificates: CertificateItem[];
  selfEvaluation: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * 企业
 */
export interface Enterprise {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  licenseNo: string;
  legalRepresentative: string;
  industry: IndustryTag;
  township: TownshipCode;
  address: string;
  scale: '20人以下' | '20-99人' | '100-499人' | '500-999人' | '1000-9999人' | '10000人以上';
  registeredCapital?: number;
  establishedYear: number;
  description: string;
  welfare: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  verified: boolean;
  creditRating?: string;
  employeeCount: number;
  openPositionCount: number;
  createdAt: string;
  verifiedAt?: string;
  [key: string]: any;
}

/**
 * 职位
 */
export interface JobPosition {
  id: string;
  enterpriseId: string;
  enterpriseName?: string;
  title: string;
  department?: string;
  industry?: IndustryTag;
  township: TownshipCode;
  townshipName?: string;
  address?: string;
  type: JobSeekerType;
  salaryMin: number;
  salaryMax: number;
  salaryType: '月薪' | '日薪' | '年薪' | '计件' | '日结';
  experience: '不限' | '应届生' | '1-3年' | '3-5年' | '5-10年' | '10年以上';
  education: '不限' | '高中' | '中专' | '大专' | '本科' | '硕士' | '初中' | '博士';
  requiredSkills: RequiredSkill[];
  responsibilities: string[];
  requirements: string[];
  jobDescription: string;
  benefits: string[];
  hiringCount: number;
  status: '招聘中' | '已暂停' | '已关闭' | '已结束';
  urgent: boolean;
  publishedAt: string;
  deadline?: string;
  viewCount: number;
  applicationCount: number;
  channel: string;
  [key: string]: any;
}

// ==================== 匹配相关类型 ====================

/**
 * 匹配维度分数
 */
export interface MatchDimension {
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  salaryMatch: number;
}

/**
 * 差距分析
 */
export interface GapAnalysis {
  missingSkills: RequiredSkill[];
  improvementSuggestions: string[];
}

/**
 * 匹配结果
 */
export interface MatchResult {
  id: string;
  jobSeekerId: string;
  resumeId?: string;
  positionId: string;
  positionTitle?: string;
  enterpriseName?: string;
  overallScore: number;
  dimensions: MatchDimension;
  gapAnalysis: GapAnalysis;
  strengths: string[];
  matchedAt: string;
  recommended: boolean;
  [key: string]: any;
}

// ==================== RPO相关类型 ====================

/**
 * RPO阶段
 */
export interface RPOStage {
  name: string;
  startDate: string;
  endDate?: string;
  status: '待开始' | '进行中' | '已完成' | '已延期';
  assignees: string[];
  notes?: string;
  [key: string]: any;
}

/**
 * 联系记录
 */
export interface TouchRecord {
  date: string;
  type: '电话' | '微信' | '邮件' | '面试' | '短信';
  content: string;
  result: string;
}

/**
 * 背调项
 */
export interface BackgroundCheckItem {
  project: string;
  result: '通过' | '不通过' | '待核查';
  description?: string;
}

/**
 * 背调
 */
export interface BackgroundCheck {
  id: string;
  candidateId: string;
  authorizationUrl?: string;
  reportUrl?: string;
  resultLevel: '优秀' | '良好' | '合格' | '不合格';
  checkItems: BackgroundCheckItem[];
  operator: string;
  checkedAt: string;
  [key: string]: any;
}

/**
 * 人才候选人
 */
export interface TalentCandidate {
  id: string;
  rpoProjectId: string;
  resumeId: string;
  resumeName?: string;
  jobSeekerId: string;
  tags: string[];
  activityScore: number;
  stage: string;
  currentStage: InterviewStage | null;
  status: '待推荐' | '已推荐' | '已接受' | '已拒绝' | '面试中' | '已发Offer' | '已入职' | '已淘汰';
  touchHistory: TouchRecord[];
  backgroundCheck?: BackgroundCheck;
  recommendReason: string;
  feedback?: string;
  matchScore?: number;
  updatedAt: string;
  [key: string]: any;
}

/**
 * RPO项目
 */
export interface RPOProject {
  id: string;
  code?: string;
  name: string;
  enterpriseId: string;
  enterpriseName?: string;
  positionTitle: string;
  positionIds: string[];
  positionNames?: string[];
  industry: IndustryTag;
  township: TownshipCode;
  headcount: number;
  filledCount: number;
  salaryMin: number;
  salaryMax: number;
  status: RPOStageStatus;
  stages: RPOStage[];
  priority: '普通' | '加急' | '特急';
  feeRate: number;
  guaranteePeriod: number;
  consultant: string;
  consultantPhone?: string;
  budget: number;
  roi?: number;
  startDate: string;
  deadline: string;
  completedDate?: string;
  talentPoolIds: string[];
  candidates: TalentCandidate[];
  createdAt: string;
  description?: string;
  [key: string]: any;
}

// ==================== 投递相关类型 ====================

/**
 * 状态变更历史
 */
export interface ApplicationStatusHistory {
  status: ApplicationStatus;
  time: string;
  operator?: string;
  remark?: string;
}

/**
 * 投递记录
 */
export interface Application {
  id: string;
  jobSeekerId: string;
  positionId: string;
  enterpriseId: string;
  source: '主动投递' | '企业邀请' | 'AI推荐' | 'RPO推荐' | '校招';
  matchScore?: number;
  status: ApplicationStatus;
  currentStage: InterviewStage | null;
  appliedAt: string;
  viewedAt?: string;
  lastUpdatedAt: string;
  history: ApplicationStatusHistory[];
  [key: string]: any;
}

// ==================== 校园招聘相关类型 ====================

/**
 * 考题
 */
export interface ExamQuestion {
  id: string;
  type: '单选' | '多选' | '判断' | '简答';
  content: string;
  options?: string[];
  answer: string | string[];
  score: number;
  category: string;
  [key: string]: any;
}

/**
 * 笔试
 */
export interface WrittenExam {
  id: string;
  positionId: string;
  positionTitle?: string;
  duration: number;
  totalScore?: number;
  passScore: number;
  questions: ExamQuestion[];
  startTime?: string;
  endTime?: string;
  [key: string]: any;
}

/**
 * AI面试题
 */
export interface AIQuestion {
  id: string;
  question: string;
  expectedKeywords: string[];
  answerDuration: number;
  thinkTime?: number;
  type?: string;
  [key: string]: any;
}

/**
 * AI评分维度
 */
export interface AIScoreDimension {
  expression: number;
  speech: number;
  semantics: number;
}

/**
 * AI评分报告
 */
export interface AIScoreReport {
  id: string;
  interviewId: string;
  candidateId: string;
  overallScore: number;
  dimensions: AIScoreDimension;
  keywordHitRate: number;
  feedback: string;
  overallComment?: string;
  conductedAt?: string;
  [key: string]: any;
}

/**
 * AI面试
 */
export interface AIInterview {
  id: string;
  positionId: string;
  positionTitle?: string;
  questions: AIQuestion[];
  durationPerQuestion: number;
  aiWeights: AIScoreDimension;
  scoreReports?: AIScoreReport[];
  overallScore?: number;
  [key: string]: any;
}

/**
 * 校园宣讲会
 */
export interface CampusSession {
  id: string;
  code?: string;
  name: string;
  enterpriseIds: string[];
  enterpriseName?: string;
  university: string;
  school?: string;
  college?: string;
  date: string;
  format: '线上' | '线下' | '混合';
  venue: string;
  capacity: number;
  registered: number;
  replayUrl?: string;
  positionIds: string[];
  positionNames?: string[];
  status: '筹备中' | '进行中' | '已结束';
  participantCount?: number;
  hireTarget?: number;
  hiredCount?: number;
  description?: string;
  writtenExam?: WrittenExam;
  aiInterview?: AIInterview;
  createdAt: string;
  [key: string]: any;
}

// ==================== 学历教育相关类型 ====================

/**
 * 学历课程
 */
export interface EducationCourse {
  id: string;
  code?: string;
  title: string;
  provider: string;
  type: CourseType;
  targetDegree: string;
  major: string;
  duration: string;
  price: number;
  creditBankEligible: boolean;
  enrollmentLink: string;
  tags: string[];
  totalCredits?: number;
  startDate?: string;
  endDate?: string;
  township?: TownshipCode;
  location?: string;
  description?: string;
  rating?: number;
  enrollmentCount?: number;
  maxStudents?: number;
  status?: '招生中' | '已开班' | '已结束';
  createdAt?: string;
  [key: string]: any;
}

/**
 * 学分银行记录
 */
export interface CreditBankRecord {
  id: string;
  jobSeekerId: string;
  courseId: string;
  courseTitle?: string;
  earnedCredits: number;
  totalCredits: number;
  progress: number;
  estimatedCertDate: string;
  syncStatus: CreditBankStatus;
  earnedAt?: string;
  status?: string;
  [key: string]: any;
}

// ==================== 数据分析相关类型 ====================

/**
 * 渠道ROI
 */
export interface ChannelROI {
  id?: string;
  channel: string;
  cost: number;
  views: number;
  applications: number;
  interviews: number;
  hires: number;
  cpa: number;
  avgQualityScore: number;
  month: string;
  costPerHire?: number;
  conversionRate?: number;
  [key: string]: any;
}

/**
 * 漏斗指标
 */
export interface FunnelMetrics {
  id?: string;
  period: string;
  periodType?: '日' | '周' | '月' | '季度' | '年';
  views: number;
  clicks?: number;
  applications: number;
  screeningPass: number;
  interviews: number;
  offers: number;
  hires: number;
  retention30d: number;
  retention90d: number;
  retention180d?: number;
  viewToApplicationRate?: number;
  applicationToScreeningRate?: number;
  screeningToInterviewRate?: number;
  interviewToOfferRate?: number;
  offerToOnboardRate?: number;
  cost?: number;
  costPerHire?: number;
  [key: string]: any;
}

/**
 * 月度留存数据
 */
export interface MonthlyRetention {
  month: number;
  remaining: number;
  attritionReason?: string;
}

/**
 * 留存分析
 */
export interface RetentionAnalysis {
  id?: string;
  cohort: string;
  cohortSize: number;
  channel: string;
  positionType: JobSeekerType;
  township: TownshipCode;
  months: MonthlyRetention[];
  industry?: IndustryTag;
  onboardCount?: number;
  retention30d?: number;
  retention90d?: number;
  retention180d?: number;
  retention365d?: number;
  turnoverRate?: number;
  avgTenure?: number;
  [key: string]: any;
}

// ==================== 补贴相关类型 ====================

/**
 * 补贴材料
 */
export interface SubsidyDocument {
  name: string;
  uploaded: boolean;
  url?: string;
  required?: boolean;
}

/**
 * 审批步骤
 */
export interface AuditStep {
  id?: string;
  step: string;
  operator: string;
  comment?: string;
  status: '待审核' | '审核中' | '通过' | '驳回' | '待处理';
  operatedAt: string;
  role?: string;
  auditedAt?: string;
  [key: string]: any;
}

/**
 * 补贴申请
 */
export interface SubsidyApplication {
  id: string;
  code?: string;
  type: SubsidyType;
  applicantType: '企业' | '个人';
  applicantId: string;
  applicantName?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number;
  documents: SubsidyDocument[];
  status: SubsidyStatus;
  auditTrail: AuditStep[];
  auditSteps?: AuditStep[];
  appliedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt?: string;
  township?: TownshipCode;
  description?: string;
  reason?: string;
  [key: string]: any;
}

// ==================== 镇街相关类型 ====================

/**
 * 镇街信息
 */
export interface Township {
  code: TownshipCode;
  name: string;
  population: number;
  industryTags: IndustryTag[];
  description: string;
  openEnterpriseCount: number;
  openJobCount: number;
  housingInfo?: string;
  trafficInfo?: string;
  schoolInfo?: string;
  adjacentTownships?: TownshipCode[];
  enterpriseWeight?: Record<IndustryTag, number>;
  [key: string]: any;
}

// ==================== 通用类型 ====================

/**
 * 分页信息
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 通用API响应
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  pagination?: Pagination;
  error?: string;
  message?: string;
}
