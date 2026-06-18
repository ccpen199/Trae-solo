import { Search, Eye, Pencil, Sparkles, Plus } from 'lucide-react'
import { useState } from 'react'

export interface Policy {
  id: number
  title: string
  docNumber: string
  department: string
  date: string
  status: '有效' | '废止' | '草案'
  tags: string[]
}

export const mockPolicies: Policy[] = [
  { id: 1, title: '关于2026年调整退休人员基本养老金的通知', docNumber: '人社部发〔2026〕1号', department: '人力资源和社会保障部', date: '2026-01-15', status: '有效', tags: ['退休人员', '养老保险', '养老待遇'] },
  { id: 2, title: '关于完善灵活就业人员养老保险政策的通知', docNumber: '人社部发〔2026〕2号', department: '人力资源和社会保障部', date: '2026-02-10', status: '有效', tags: ['灵活就业人员', '养老保险'] },
  { id: 3, title: '关于做好2026年城乡居民基本医疗保险工作的通知', docNumber: '人社部发〔2026〕3号', department: '人力资源和社会保障部', date: '2026-03-05', status: '有效', tags: ['城乡居民', '医疗保险'] },
  { id: 4, title: '关于失业保险金标准调整的通知', docNumber: '人社部发〔2026〕4号', department: '人力资源和社会保障部', date: '2026-04-12', status: '有效', tags: ['失业保险', '失业待遇'] },
  { id: 5, title: '关于工伤保险费率调整的指导意见', docNumber: '人社部发〔2026〕5号', department: '人力资源和社会保障部', date: '2026-05-08', status: '草案', tags: ['工伤保险'] },
  { id: 6, title: '关于社保关系转移接续的补充规定', docNumber: '人社部发〔2025〕12号', department: '人力资源和社会保障部', date: '2025-11-20', status: '废止', tags: ['社保转移'] },
]

const statusStyles: Record<string, string> = {
  '有效': 'bg-green-50 text-green-600 border border-green-200',
  '废止': 'bg-red-50 text-red-600 border border-red-200',
  '草案': 'bg-gray-50 text-gray-600 border border-gray-200',
}

const tagColors = [
  'bg-blue-50 text-blue-600',
  'bg-purple-50 text-purple-600',
  'bg-amber-50 text-amber-600',
  'bg-teal-50 text-teal-600',
  'bg-rose-50 text-rose-600',
]

interface PolicyFileListProps {
  onTagClick: (policy: Policy) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  tagFilter: string
  onTagFilterChange: (v: string) => void
}

export default function PolicyFileList({ onTagClick, statusFilter, onStatusFilterChange, tagFilter, onTagFilterChange }: PolicyFileListProps) {
  const [search, setSearch] = useState('')

  const allTags = Array.from(new Set(mockPolicies.flatMap((p) => p.tags)))

  const filtered = mockPolicies.filter((p) => {
    if (statusFilter !== '全部' && p.status !== statusFilter) return false
    if (tagFilter && !p.tags.includes(tagFilter)) return false
    if (search && !p.title.includes(search) && !p.docNumber.includes(search)) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索政策文件..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5">
          <Plus size={16} />
          新增政策
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">状态：</span>
          {['全部', '有效', '废止', '草案'].map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-3 py-1 rounded-full transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">全部标签</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((policy) => (
          <div key={policy.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{policy.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{policy.docNumber}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[policy.status]}`}>
                {policy.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span>{policy.department}</span>
              <span>·</span>
              <span>{policy.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                {policy.tags.map((tag, i) => (
                  <span key={tag} className={`text-xs px-2 py-0.5 rounded ${tagColors[i % tagColors.length]}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors" title="查看">
                  <Eye size={15} />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors" title="编辑">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onTagClick(policy)}
                  className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-primary transition-colors"
                  title="打标签"
                >
                  <Sparkles size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">暂无匹配的政策文件</div>
        )}
      </div>
    </div>
  )
}
