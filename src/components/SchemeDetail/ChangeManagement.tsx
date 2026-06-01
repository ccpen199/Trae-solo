import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Change } from '@/types'
import { useSchemesStore, syncStatusLabels } from '@/store/schemes'

const syncStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  syncing: 'bg-blue-100 text-blue-600',
  synced: 'bg-green-100 text-green-600',
}

interface ChangeManagementProps {
  schemeId: number
}

function ChangeItem({ change, isLast }: { change: Change; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[#e8723a] flex-shrink-0" />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" style={{ minHeight: '80px' }} />}
      </div>
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#1e3a5f]">v{change.version || '1.0'}</span>
              <span className="text-xs text-gray-400">
                {new Date(change.created_at).toLocaleDateString()}
              </span>
            </div>
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', syncStatusColors[change.sync_status])}>
              {syncStatusLabels[change.sync_status]}
            </span>
          </div>
          
          {change.summary && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500 mb-1">变更摘要</div>
              <p className="text-gray-700">{change.summary}</p>
            </div>
          )}

          {change.related_requirements.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500 mb-1">关联需求</div>
              <div className="flex flex-wrap gap-2">
                {change.related_requirements.map((req, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {change.pending_sync.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">待同步项</div>
              <div className="flex flex-wrap gap-2">
                {change.pending_sync.map((item, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs bg-orange-50 text-orange-600 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChangeManagement({ schemeId }: ChangeManagementProps) {
  const { changes, fetchChanges, createChange } = useSchemesStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    version: '',
    summary: '',
    related_requirements: '',
    pending_sync: '',
    sync_status: 'pending',
  })

  useEffect(() => {
    fetchChanges(schemeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createChange(schemeId, {
      version: formData.version.trim() || null,
      summary: formData.summary.trim() || null,
      related_requirements: formData.related_requirements.split(',').map((s) => s.trim()).filter(Boolean),
      pending_sync: formData.pending_sync.split(',').map((s) => s.trim()).filter(Boolean),
      sync_status: formData.sync_status,
    })
    setFormData({
      version: '',
      summary: '',
      related_requirements: '',
      pending_sync: '',
      sync_status: 'pending',
    })
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">变更管理</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#e8723a] text-white rounded-lg text-sm font-medium hover:bg-[#d6612a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建变更
        </button>
      </div>

      <div className="relative">
        {changes.length > 0 ? (
          <div className="space-y-1">
            {changes.map((change, index) => (
              <ChangeItem key={change.id} change={change} isLast={index === changes.length - 1} />
            ))}
          </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <div className="text-gray-400">暂无变更记录</div>
            </div>
          )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">创建变更记录</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变更摘要</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                  placeholder="请描述本次变更内容"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联需求（多个用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.related_requirements}
                  onChange={(e) => setFormData({ ...formData, related_requirements: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="需求1, 需求2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">待同步项（多个用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.pending_sync}
                  onChange={(e) => setFormData({ ...formData, pending_sync: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="待同步1, 待同步2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">同步状态</label>
                <select
                  value={formData.sync_status}
                  onChange={(e) => setFormData({ ...formData, sync_status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                >
                  {Object.entries(syncStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
