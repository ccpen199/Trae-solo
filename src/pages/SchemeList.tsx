import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, ListTodo, MessageSquare, User } from 'lucide-react'
import type { Scheme } from '@/types'
import { useSchemesStore, schemeStatusLabels } from '@/store/schemes'
import { roleLabels } from '@/types'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_review: 'bg-blue-100 text-blue-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  archived: 'bg-gray-100 text-gray-600',
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'in_review', label: '评审中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'archived', label: '已归档' },
]

function SchemeCard({ scheme, onClick }: { scheme: Scheme; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-[#1e3a5f]/20"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">{scheme.name}</h3>
        <span className={cn('ml-2 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap', statusColors[scheme.status])}>
          {schemeStatusLabels[scheme.status]}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
        {scheme.business_goal || '暂无业务目标描述'}
      </p>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{scheme.created_by_username}</span>
          <span className="px-2 py-0.5 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
            {roleLabels[scheme.status] || '交互设计师'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <ListTodo className="w-4 h-4" />
            <span>{scheme.step_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{scheme.comment_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: { name: string; business_goal: string }) => Promise<void> }) {
  const [name, setName] = useState('')
  const [businessGoal, setBusinessGoal] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), business_goal: businessGoal.trim() })
      setName('')
      setBusinessGoal('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">创建新方案</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">方案名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
              placeholder="请输入方案名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">业务目标</label>
            <textarea
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
              placeholder="请描述业务目标"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SchemeList() {
  const { schemes, fetchSchemes, createScheme } = useSchemesStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSchemes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredSchemes = schemes.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.status === filter
    return matchSearch && matchFilter
  })

  const handleCreate = async (data: { name: string; business_goal: string }) => {
    await createScheme(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索方案名称..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filter === tab.key
                    ? 'bg-[#1e3a5f] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors"
        >
          <Plus className="w-5 h-5" />
          创建新方案
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            onClick={() => navigate(`/schemes/${scheme.id}`)}
          />
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-2">暂无方案</div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-[#e8723a] hover:underline"
          >
            创建第一个方案
          </button>
        </div>
      )}

      <CreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
