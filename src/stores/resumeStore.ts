import { create } from 'zustand';
import type { Resume, ResumeSection, ResumeItem, ResumeTheme } from '@/types/resume';

const defaultTheme: ResumeTheme = {
  primaryColor: '#0A2E1C',
  secondaryColor: '#00D68F',
  accentColor: '#D4A843',
  fontHeading: 'Playfair Display',
  fontBody: 'DM Sans',
  fontSize: 14,
  lineHeight: 1.6,
  sectionSpacing: 16,
};

const defaultSections: ResumeSection[] = [
  {
    id: 'summary',
    type: 'summary',
    title: '个人总结',
    order: 0,
    collapsed: false,
    items: [
      {
        id: 'summary-1',
        fields: {
          content: '拥有5年前端开发经验的全栈工程师，擅长React生态与性能优化。曾主导多个百万级用户产品的技术架构设计与落地，对工程质量与用户体验有极致追求。',
        },
      },
    ],
  },
  {
    id: 'experience',
    type: 'experience',
    title: '工作经历',
    order: 1,
    collapsed: false,
    items: [
      {
        id: 'exp-1',
        fields: {
          company: '字节跳动',
          position: '高级前端工程师',
          period: '2023.03 - 至今',
          description: '负责抖音电商核心交易链路的前端架构设计与性能优化，主导微前端改造项目',
          highlights: ['页面加载速度提升40%', '交易转化率提升15%', '构建微前端基础设施，支撑10+子应用'],
        },
        starRewrite: {
          original: '负责抖音电商核心交易链路的前端架构设计与性能优化，主导微前端改造项目',
          situation: '抖音电商交易链路面临页面加载慢、转化率低的问题，且多个团队并行开发导致代码冲突频繁',
          task: '需要设计并实施前端架构优化方案，提升用户体验和开发效率',
          action: '主导微前端架构改造，拆分10+子应用；引入SSR与智能预加载策略；建立性能监控体系与优化SOP',
          result: '页面加载速度提升40%，交易转化率提升15%，开发效率提升30%，方案推广至5个业务线',
        },
      },
      {
        id: 'exp-2',
        fields: {
          company: '阿里巴巴',
          position: '前端工程师',
          period: '2020.07 - 2023.02',
          description: '参与天猫双11主会场开发，负责互动玩法模块的前端实现',
          highlights: ['支撑千万级并发用户', '互动模块性能评分98+', '获得年度最佳新人奖'],
        },
      },
    ],
  },
  {
    id: 'project',
    type: 'project',
    title: '项目经历',
    order: 2,
    collapsed: false,
    items: [
      {
        id: 'proj-1',
        fields: {
          name: '智能简历生成器',
          period: '2024.01 - 2024.06',
          role: '技术负责人',
          description: '基于大语言模型的AI简历创作平台，支持自然语言对话生成、STAR法则重写与ATS优化',
          highlights: ['用户量突破10万', 'ATS通过率提升35%', '获得产品创新奖'],
        },
      },
    ],
  },
  {
    id: 'education',
    type: 'education',
    title: '教育背景',
    order: 3,
    collapsed: false,
    items: [
      {
        id: 'edu-1',
        fields: {
          school: '浙江大学',
          major: '计算机科学与技术',
          degree: '本科',
          period: '2016.09 - 2020.06',
          gpa: '3.8/4.0',
        },
      },
    ],
  },
  {
    id: 'skill',
    type: 'skill',
    title: '专业技能',
    order: 4,
    collapsed: false,
    items: [
      {
        id: 'skill-1',
        fields: {
          category: '前端技术',
          items: 'React, TypeScript, Next.js, Vue3, Webpack, Vite, Tailwind CSS',
        },
      },
      {
        id: 'skill-2',
        fields: {
          category: '后端技术',
          items: 'Node.js, Express, PostgreSQL, Redis, Docker',
        },
      },
      {
        id: 'skill-3',
        fields: {
          category: '工具与方法',
          items: 'Git, CI/CD, 性能优化, 微前端架构, TDD',
        },
      },
    ],
  },
];

const defaultResume: Resume = {
  id: 'resume-1',
  userId: 'user-1',
  title: '我的简历',
  templateId: 'modern-1',
  theme: defaultTheme,
  sections: defaultSections,
  versions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface ResumeState {
  resume: Resume;
  activeSection: string | null;
  selectedTemplate: string;
  setResume: (resume: Resume) => void;
  setTheme: (theme: Partial<ResumeTheme>) => void;
  setTemplate: (templateId: string) => void;
  addSection: (section: ResumeSection) => void;
  updateSection: (id: string, updates: Partial<ResumeSection>) => void;
  removeSection: (id: string) => void;
  reorderSections: (sectionIds: string[]) => void;
  addItem: (sectionId: string, item: ResumeItem) => void;
  updateItem: (sectionId: string, itemId: string, fields: Record<string, string | string[]>) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  setActiveSection: (id: string | null) => void;
  toggleSectionCollapse: (id: string) => void;
  saveVersion: (label: string) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resume: defaultResume,
  activeSection: null,
  selectedTemplate: 'modern-1',

  setResume: (resume) => set({ resume }),

  setTheme: (theme) =>
    set((state) => ({
      resume: {
        ...state.resume,
        theme: { ...state.resume.theme, ...theme },
      },
    })),

  setTemplate: (templateId) => set({ selectedTemplate: templateId }),

  addSection: (section) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: [...state.resume.sections, section],
      },
    })),

  updateSection: (id, updates) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),

  removeSection: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.filter((s) => s.id !== id),
      },
    })),

  reorderSections: (sectionIds) =>
    set((state) => {
      const sectionMap = new Map(state.resume.sections.map((s) => [s.id, s]));
      const reordered = sectionIds
        .map((id, index) => {
          const section = sectionMap.get(id);
          return section ? { ...section, order: index } : null;
        })
        .filter(Boolean) as ResumeSection[];
      return { resume: { ...state.resume, sections: reordered } };
    }),

  addItem: (sectionId, item) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.map((s) =>
          s.id === sectionId ? { ...s, items: [...s.items, item] } : s
        ),
      },
    })),

  updateItem: (sectionId, itemId, fields) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId ? { ...item, fields: { ...item.fields, ...fields } } : item
                ),
              }
            : s
        ),
      },
    })),

  removeItem: (sectionId, itemId) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.map((s) =>
          s.id === sectionId
            ? { ...s, items: s.items.filter((item) => item.id !== itemId) }
            : s
        ),
      },
    })),

  setActiveSection: (id) => set({ activeSection: id }),

  toggleSectionCollapse: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: state.resume.sections.map((s) =>
          s.id === id ? { ...s, collapsed: !s.collapsed } : s
        ),
      },
    })),

  saveVersion: (label) =>
    set((state) => ({
      resume: {
        ...state.resume,
        versions: [
          {
            id: `v-${Date.now()}`,
            snapshot: { ...state.resume },
            label,
            createdAt: new Date().toISOString(),
          },
          ...state.resume.versions,
        ],
      },
    })),
}));
