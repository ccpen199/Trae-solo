import type { Category } from '@/types'

export const categories: Category[] = [
  { id: 'survey', name: '问卷调查', icon: 'ClipboardList', count: 28 },
  { id: 'data-entry', name: '数据录入', icon: 'Database', count: 19 },
  { id: 'content-review', name: '内容审核', icon: 'ShieldCheck', count: 15 },
  { id: 'design', name: '设计制图', icon: 'Palette', count: 12 },
  { id: 'translation', name: '翻译校对', icon: 'Languages', count: 9 },
  { id: 'customer-service', name: '客服支持', icon: 'Headphones', count: 7 },
  { id: 'testing', name: '测试体验', icon: 'Bug', count: 11 },
  { id: 'writing', name: '文案撰写', icon: 'PenTool', count: 8 },
  { id: 'video', name: '视频剪辑', icon: 'Video', count: 6 },
  { id: 'programming', name: '编程开发', icon: 'Code', count: 5 },
]
