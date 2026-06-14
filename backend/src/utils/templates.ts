import { Template } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'tech-modern',
    name: '科技简约',
    industry: 'tech',
    description: '适合技术岗、工程师、开发人员，简洁专业，突出技术栈和项目经历',
    hasCover: false,
    hasLetter: false,
    hasCharts: true
  },
  {
    id: 'tech-creative',
    name: '互联网创意',
    industry: 'tech',
    description: '适合产品、运营、设计岗，多栏布局，视觉层次分明',
    hasCover: true,
    hasLetter: true,
    hasCharts: true
  },
  {
    id: 'product-pro',
    name: '产品经理专业',
    industry: 'product',
    description: '突出产品思维和数据成果，包含项目复盘展示区',
    hasCover: true,
    hasLetter: true,
    hasCharts: true
  },
  {
    id: 'design-creative',
    name: '设计师创意',
    industry: 'design',
    description: '视觉导向型，预留作品展示位，支持作品集嵌入',
    hasCover: true,
    hasLetter: true,
    hasCharts: true
  },
  {
    id: 'data-analyst',
    name: '数据分析',
    industry: 'data',
    description: '突出数据能力和分析成果，技能图表化展示',
    hasCover: false,
    hasLetter: false,
    hasCharts: true
  },
  {
    id: 'marketing-digital',
    name: '市场营销',
    industry: 'marketing',
    description: '突出案例和数据成果，适合市场、品牌、新媒体岗',
    hasCover: true,
    hasLetter: true,
    hasCharts: true
  },
  {
    id: 'hr-professional',
    name: '人力资源',
    industry: 'hr',
    description: '专业稳重，突出协调能力和组织发展经验',
    hasCover: false,
    hasLetter: true,
    hasCharts: false
  },
  {
    id: 'finance-conservative',
    name: '金融财务',
    industry: 'finance',
    description: '严谨专业，突出数字敏感度和合规意识',
    hasCover: false,
    hasLetter: true,
    hasCharts: true
  },
  {
    id: 'operation-growth',
    name: '运营增长',
    industry: 'operation',
    description: '突出数据指标和增长成果，适合各类运营岗',
    hasCover: true,
    hasLetter: false,
    hasCharts: true
  }
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByIndustry(industry: string): Template[] {
  return TEMPLATES.filter(t => t.industry === industry);
}
