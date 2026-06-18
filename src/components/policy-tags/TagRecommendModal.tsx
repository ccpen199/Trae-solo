import { useState } from 'react'
import { X, Sparkles, Plus, Check } from 'lucide-react'
import type { Policy } from './PolicyFileList'

interface TagRecommendModalProps {
  policy: Policy
  onClose: () => void
}

const aiRecommendations = [
  { name: '养老金调整', confidence: 95 },
  { name: '待遇核算', confidence: 87 },
  { name: '退休审批', confidence: 72 },
]

export default function TagRecommendModal({ policy, onClose }: TagRecommendModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([...policy.tags])
  const [recommendations, setRecommendations] = useState<typeof aiRecommendations | null>(null)
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAiRecommend = () => {
    setLoading(true)
    setTimeout(() => {
      setRecommendations(aiRecommendations)
      setLoading(false)
    }, 1200)
  }

  const toggleRecommend = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  const addManualTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">智能标签推荐</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">{policy.title}</h4>
            <p className="text-xs text-gray-400">{policy.docNumber} · {policy.department}</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              本政策文件涉及{policy.tags.join('、')}等相关内容，通过AI智能分析可推荐更多关联标签以提升政策检索精度。
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI推荐标签</span>
              <button
                onClick={handleAiRecommend}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
              >
                <Sparkles size={14} />
                {loading ? '分析中...' : recommendations ? '重新推荐' : 'AI推荐标签'}
              </button>
            </div>
            {recommendations && (
              <div className="flex flex-wrap gap-2 mb-3">
                {recommendations.map((rec) => (
                  <button
                    key={rec.name}
                    onClick={() => toggleRecommend(rec.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedTags.includes(rec.name)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                    }`}
                  >
                    {selectedTags.includes(rec.name) && <Check size={12} />}
                    {rec.name}
                    <span className="text-xs opacity-60">{rec.confidence}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">已选标签</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-primary-dark">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addManualTag()}
                placeholder="手动添加标签..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                onClick={addManualTag}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                添加
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  )
}
