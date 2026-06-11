import { create } from 'zustand'
import type {
  User,
  Resume,
  ResumeCase,
  Application,
  ComplianceSettings,
  AuditLog,
} from '@/types'

const mockUser: User = {
  id: 'u-001',
  email: 'zhangsan@example.com',
  name: '张三',
  role: 'seeker',
  avatar: '',
  createdAt: '2025-01-15T08:00:00Z',
}

const mockResumes: Resume[] = [
  {
    id: 'r-001',
    userId: 'u-001',
    title: '前端工程师简历 - 社招',
    lang: 'zh',
    templateId: 'tpl-classic',
    sections: [
      {
        id: 's-001',
        type: 'personal',
        order: 1,
        content: {
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          location: '北京',
        },
      },
      {
        id: 's-002',
        type: 'education',
        order: 2,
        content: {
          school: '北京大学',
          degree: '本科',
          major: '计算机科学与技术',
          period: '2016-2020',
        },
      },
      {
        id: 's-003',
        type: 'experience',
        order: 3,
        content: {
          company: '字节跳动',
          position: '前端开发工程师',
          period: '2020-07 至今',
          description: '负责抖音Web端核心模块开发，使用React+TypeScript技术栈',
        },
      },
      {
        id: 's-004',
        type: 'skills',
        order: 4,
        content: {
          items: ['React', 'TypeScript', 'Node.js', 'Webpack', 'Tailwind CSS'],
        },
      },
    ],
    keywordDensity: {
      keywords: [
        { word: 'React', count: 3, density: 2.1 },
        { word: 'TypeScript', count: 2, density: 1.4 },
        { word: '前端', count: 4, density: 2.8 },
        { word: '开发', count: 3, density: 2.1 },
      ],
      atsScore: 85,
    },
    createdAt: '2025-03-10T10:00:00Z',
    updatedAt: '2025-05-20T14:30:00Z',
  },
  {
    id: 'r-002',
    userId: 'u-001',
    title: 'Frontend Engineer Resume',
    lang: 'en',
    templateId: 'tpl-modern',
    sections: [
      {
        id: 's-005',
        type: 'personal',
        order: 1,
        content: {
          name: 'Zhang San',
          phone: '+86 13800138000',
          email: 'zhangsan@example.com',
          location: 'Beijing, China',
        },
      },
      {
        id: 's-006',
        type: 'experience',
        order: 2,
        content: {
          company: 'ByteDance',
          position: 'Frontend Developer',
          period: 'Jul 2020 - Present',
          description: 'Built core modules for Douyin Web using React and TypeScript',
        },
      },
    ],
    keywordDensity: {
      keywords: [
        { word: 'React', count: 2, density: 1.8 },
        { word: 'Frontend', count: 3, density: 2.7 },
      ],
      atsScore: 78,
    },
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-05-18T16:00:00Z',
  },
]

const mockCases: ResumeCase[] = [
  {
    id: 'c-001',
    industry: '互联网',
    level: 'P7',
    company: '阿里巴巴',
    summary: '10年经验资深前端架构师简历，突出技术深度与团队管理能力',
    highlights: [
      '主导微前端架构落地，覆盖20+业务线',
      '搭建前端监控体系，线上故障发现时间缩短60%',
      '管理12人前端团队，年度绩效A',
    ],
    sections: [
      {
        id: 'cs-001',
        type: 'personal',
        title: '个人信息',
        content: { name: '李**', title: '前端架构师' },
      },
      {
        id: 'cs-002',
        type: 'experience',
        title: '工作经历',
        content: {
          company: '阿里巴巴',
          position: '高级前端技术专家',
          period: '2018-2025',
        },
      },
    ],
    tags: ['架构', '微前端', '团队管理', 'P7'],
  },
  {
    id: 'c-002',
    industry: '金融科技',
    level: 'P6',
    company: '蚂蚁集团',
    summary: '5年经验前端开发工程师，专注金融场景下的复杂交互与性能优化',
    highlights: [
      '独立负责支付宝生活缴费模块重构',
      '首屏加载时间从3.2s优化至0.8s',
      '获得集团技术创新奖',
    ],
    sections: [
      {
        id: 'cs-003',
        type: 'personal',
        title: '个人信息',
        content: { name: '王**', title: '前端开发工程师' },
      },
      {
        id: 'cs-004',
        type: 'skills',
        title: '技能清单',
        content: { items: ['React', 'TypeScript', 'Performance Optimization'] },
      },
    ],
    tags: ['金融', '性能优化', 'React', 'P6'],
  },
  {
    id: 'c-003',
    industry: '人工智能',
    level: 'P8',
    company: '字节跳动',
    summary: '12年经验技术总监简历，展示从0到1搭建团队与技术体系的全景能力',
    highlights: [
      '从0搭建50人技术团队',
      '主导3个DAU千万级产品技术架构',
      '推动公司级前端标准化建设',
    ],
    sections: [
      {
        id: 'cs-005',
        type: 'experience',
        title: '工作经历',
        content: {
          company: '字节跳动',
          position: '技术总监',
          period: '2019-2025',
        },
      },
    ],
    tags: ['AI', '技术管理', 'P8', '团队搭建'],
  },
]

const mockApplications: Application[] = [
  {
    id: 'a-001',
    userId: 'u-001',
    company: '腾讯',
    position: '高级前端工程师',
    status: 'interview',
    resumeId: 'r-001',
    appliedAt: '2025-05-01T10:00:00Z',
    interviews: [
      {
        id: 'i-001',
        date: '2025-05-15T14:00:00Z',
        type: 'technical',
        notes: '算法与系统设计面试，面试官反馈良好',
      },
      {
        id: 'i-002',
        date: '2025-05-22T10:00:00Z',
        type: 'hr',
        notes: 'HR面，聊薪资期望',
      },
    ],
    notes: '内推渠道，已过二面',
  },
  {
    id: 'a-002',
    userId: 'u-001',
    company: '美团',
    position: '前端技术专家',
    status: 'applied',
    resumeId: 'r-001',
    appliedAt: '2025-05-10T09:00:00Z',
    interviews: [],
    notes: '官网投递，等待笔试通知',
  },
  {
    id: 'a-003',
    userId: 'u-001',
    company: '小红书',
    position: '前端开发工程师',
    status: 'offer',
    resumeId: 'r-002',
    appliedAt: '2025-04-20T08:00:00Z',
    interviews: [
      {
        id: 'i-003',
        date: '2025-04-28T15:00:00Z',
        type: 'phone',
        notes: '电话面，聊项目经验',
      },
      {
        id: 'i-004',
        date: '2025-05-05T14:00:00Z',
        type: 'onsite',
        notes: '现场面，3轮技术+1轮HR',
      },
    ],
    offer: {
      baseSalary: 450000,
      bonus: '3个月薪资',
      benefits: ['五险一金', '餐补', '健身房', '弹性工作'],
      equity: 'RSU 2000股/4年',
      deadline: '2025-06-15T23:59:59Z',
    },
    notes: 'Offer已到，考虑中',
  },
  {
    id: 'a-004',
    userId: 'u-001',
    company: '拼多多',
    position: '资深前端工程师',
    status: 'todo',
    resumeId: 'r-001',
    appliedAt: '',
    interviews: [],
    notes: '准备投递，需先优化简历',
  },
  {
    id: 'a-005',
    userId: 'u-001',
    company: '快手',
    position: '前端开发工程师',
    status: 'rejected',
    resumeId: 'r-002',
    appliedAt: '2025-04-15T10:00:00Z',
    interviews: [
      {
        id: 'i-005',
        date: '2025-04-22T11:00:00Z',
        type: 'technical',
        notes: '一面挂，算法题没做出来',
      },
    ],
    notes: '技术一面未通过',
  },
]

const mockCompliance: ComplianceSettings = {
  dataMinimization: true,
  encryptedStorage: true,
  retentionDays: 365,
  noExternalTraining: true,
}

const mockAuditLogs: AuditLog[] = [
  {
    id: 'al-001',
    userId: 'u-001',
    action: 'login',
    resource: 'auth',
    timestamp: '2025-05-20T08:00:00Z',
    details: '用户登录系统',
  },
  {
    id: 'al-002',
    userId: 'u-001',
    action: 'create',
    resource: 'resume/r-001',
    timestamp: '2025-03-10T10:00:00Z',
    details: '创建简历「前端工程师简历 - 社招」',
  },
  {
    id: 'al-003',
    userId: 'u-001',
    action: 'update',
    resource: 'resume/r-001',
    timestamp: '2025-05-20T14:30:00Z',
    details: '更新简历内容',
  },
  {
    id: 'al-004',
    userId: 'u-001',
    action: 'diagnosis',
    resource: 'resume/r-001',
    timestamp: '2025-05-19T16:00:00Z',
    details: '执行JD匹配诊断',
  },
  {
    id: 'al-005',
    userId: 'u-001',
    action: 'export',
    resource: 'resume/r-002',
    timestamp: '2025-05-18T16:00:00Z',
    details: '导出英文简历PDF',
  },
  {
    id: 'al-006',
    userId: 'u-001',
    action: 'create',
    resource: 'application/a-001',
    timestamp: '2025-05-01T10:00:00Z',
    details: '新增投递「腾讯 - 高级前端工程师」',
  },
  {
    id: 'al-007',
    userId: 'u-001',
    action: 'update_settings',
    resource: 'compliance',
    timestamp: '2025-04-01T09:00:00Z',
    details: '更新合规设置',
  },
]

interface StoreState {
  currentUser: User | null
  setCurrentUser: (user: User) => void
  logout: () => void

  resumes: Resume[]
  fetchResumes: () => void
  addResume: (resume: Resume) => void
  updateResume: (id: string, data: Partial<Resume>) => void
  deleteResume: (id: string) => void

  cases: ResumeCase[]
  fetchCases: () => void

  applications: Application[]
  fetchApplications: () => void
  addApplication: (application: Application) => void
  updateApplicationStatus: (id: string, status: Application['status']) => void

  compliance: ComplianceSettings
  fetchCompliance: () => void
  updateCompliance: (settings: Partial<ComplianceSettings>) => void

  auditLogs: AuditLog[]
  fetchAuditLogs: () => void

  currentRole: 'seeker' | 'hr'
  switchRole: (role: 'seeker' | 'hr') => void
}

export const useStore = create<StoreState>()((set) => ({
  currentUser: mockUser,
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),

  resumes: mockResumes,
  fetchResumes: () => set({ resumes: mockResumes }),
  addResume: (resume) =>
    set((state) => ({ resumes: [...state.resumes, resume] })),
  updateResume: (id, data) =>
    set((state) => ({
      resumes: state.resumes.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      ),
    })),
  deleteResume: (id) =>
    set((state) => ({ resumes: state.resumes.filter((r) => r.id !== id) })),

  cases: mockCases,
  fetchCases: () => set({ cases: mockCases }),

  applications: mockApplications,
  fetchApplications: () => set({ applications: mockApplications }),
  addApplication: (application) =>
    set((state) => ({ applications: [...state.applications, application] })),
  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),

  compliance: mockCompliance,
  fetchCompliance: () => set({ compliance: mockCompliance }),
  updateCompliance: (settings) =>
    set((state) => ({
      compliance: { ...state.compliance, ...settings },
    })),

  auditLogs: mockAuditLogs,
  fetchAuditLogs: () => set({ auditLogs: mockAuditLogs }),

  currentRole: 'seeker',
  switchRole: (role) => set({ currentRole: role }),
}))
