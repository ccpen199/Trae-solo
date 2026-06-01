import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Decision } from '@/types'
import { useSchemesStore } from '@/store/schemes'

interface DecisionRecordsProps {
  schemeId: number
}

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-100">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">争议点</h4>
        <p className="text-gray-700">{decision.dispute_point}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">备选方案</h4>
        <div className="space-y-2">
          {decision.alternatives.map((alt, index) => (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border',
                index === decision.chosen_index
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-sm',
                  index === decision.chosen_index ? 'text-green-800 font-medium' : 'text-gray-700'
                )}>
                  {alt}
                </span>
                {index === decision.chosen_index && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="w-3 h-3" />
                    已选择
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {decision.reason && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">决策原因</h4>
          <p className="text-gray-600 text-sm">{decision.reason}</p>
        </div>
      )}

      {decision.affected_pages.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">影响页面</h4>
          <div className="flex flex-wrap gap-2">
            {decision.affected_pages.map((page, i) => (
              <span key={i} className="px-2.5 py-1 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
                {page}
              </span>
            ))}
          </div>
        </div>
      )}

      {decision.verification_method && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">验证方式</h4>
          <p className="text-gray-600 text-sm">{decision.verification_method}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
        由 {decision.created_by_username} · {new Date(decision.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}

export default function DecisionRecords({ schemeId }: DecisionRecordsProps) {
  const { decisions, fetchDecisions, createDecision } = useSchemesStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    dispute_point: '',
    alternatives: '',
    chosen_index: 0,
    reason: '',
    affected_pages: '',
    verification_method: '',
  })

  useEffect(() => {
    fetchDecisions(schemeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dispute_point.trim()) return
    const alternatives = formData.alternatives.split('\n').map((s) => s.trim()).filter(Boolean)
    await createDecision(schemeId, {
      dispute_point: formData.dispute_point.trim(),
      alternatives,
      chosen_index: formData.chosen_index,
      reason: formData.reason.trim() || null,
      affected_pages: formData.affected_pages.split(',').map((s) => s.trim()).filter(Boolean),
      verification_method: formData.verification_method.trim() || null,
    })
    setFormData({
      dispute_point: '',
      alternatives: '',
      chosen_index: 0,
      reason: '',
      affected_pages: '',
      verification_method: '',
    })
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">决策记录</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#e8723a] text-white rounded-lg text-sm font-medium hover:bg-[#d6612a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建决策
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>

      {decisions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="text-gray-400">暂无决策记录</div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">创建决策记录</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">争议点</label>
                <input
                  type="text"
                  value={formData.dispute_point}
                  onChange={(e) => setFormData({ ...formData, dispute_point: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="请输入争议点"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备选方案（每行一个）</label>
                <textarea
                  value={formData.alternatives}
                  onChange={(e) => setFormData({ ...formData, alternatives: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                  placeholder="方案1&#10;方案2&#10;方案3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择方案索引（从0开始）</label>
                <input
                  type="number"
                  min="0"
                  value={formData.chosen_index}
                  onChange={(e) => setFormData({ ...formData, chosen_index: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">决策原因</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                  placeholder="请描述选择该方案的原因"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">影响页面（多个用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.affected_pages}
                  onChange={(e) => setFormData({ ...formData, affected_pages: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="页面1, 页面2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">验证方式</label>
                <textarea
                  value={formData.verification_method}
                  onChange={(e) => setFormData({ ...formData, verification_method: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                  placeholder="如何验证该决策的正确性"
                />
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
                  disabled={!formData.dispute_point.trim()}
                  className="flex-1 py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
