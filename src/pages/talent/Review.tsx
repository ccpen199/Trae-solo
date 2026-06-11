import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { reviewItems } from '@/mocks/talent'
import { useAppStore } from '@/store'

const dimensions = [
  { key: 'professional', label: '专业能力' },
  { key: 'innovation', label: '创新能力' },
  { key: 'achievement', label: '业绩成果' },
  { key: 'comprehensive', label: '综合素质' },
]

interface Scores {
  [key: string]: number
}

export default function Review() {
  const { id: pageId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addLog = useAppStore((s) => s.addLog)
  const [expandedId, setExpandedId] = useState<string | null>(pageId || null)
  const [scoresMap, setScoresMap] = useState<Record<string, Scores>>({})
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({})
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())

  const getScores = (itemId: string): Scores => {
    if (!scoresMap[itemId]) {
      const init: Scores = {}
      dimensions.forEach((d) => { init[d.key] = 5 })
      return init
    }
    return scoresMap[itemId]
  }

  const updateScore = (itemId: string, key: string, value: number) => {
    setScoresMap((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || getScores(itemId)), [key]: value },
    }))
  }

  const totalScore = (itemId: string) => {
    const s = scoresMap[itemId] || getScores(itemId)
    return Object.values(s).reduce((a, b) => a + b, 0)
  }

  const handleSubmit = (itemId: string) => {
    addLog('审核专家评审表', '人才服务')
    setSubmittedIds((prev) => new Set(prev).add(itemId))
    setExpandedId(null)
  }

  return (
    <div className="min-h-screen bg-gov-bg p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/talent')} className="flex items-center gap-1 text-gov-muted hover:text-primary-500 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>

        <h1 className="gov-section-title mb-6">专家评审</h1>

        <div className="space-y-3">
          {reviewItems.map((item) => {
            const isExpanded = expandedId === item.id
            const isSubmitted = submittedIds.has(item.id)
            const scores = scoresMap[item.id] || getScores(item.id)

            return (
              <div key={item.id} className="gov-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gov-text font-medium">{item.applicant}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded">{item.category}</span>
                      {isSubmitted && <span className="text-xs px-2 py-0.5 bg-green-100 text-gov-success rounded-full">已评审</span>}
                    </div>
                    <p className="text-sm text-gov-muted">申报：{item.targetTitle} · 提交时间：{item.submitTime}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gov-muted" /> : <ChevronDown className="w-5 h-5 text-gov-muted" />}
                </button>

                {isExpanded && !isSubmitted && (
                  <div className="px-4 pb-4 border-t border-gov-border pt-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gov-muted">申请人</span>
                        <p className="text-gov-text font-medium">{item.applicant}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gov-muted">申报职称</span>
                        <p className="text-gov-text font-medium">{item.targetTitle}</p>
                      </div>
                    </div>

                    <h3 className="text-sm font-medium text-gov-text mb-3">评分</h3>
                    <div className="space-y-4 mb-5">
                      {dimensions.map((d) => (
                        <div key={d.key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gov-text">{d.label}</span>
                            <span className="text-sm font-medium text-primary-600">{scores[d.key]}</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={scores[d.key]}
                            onChange={(e) => updateScore(item.id, d.key, Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg mb-5">
                      <span className="text-sm font-medium text-primary-700">总分</span>
                      <span className="text-2xl font-bold text-primary-600">{totalScore(item.id)}</span>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gov-text mb-1.5">评审意见</label>
                      <textarea
                        value={commentsMap[item.id] || ''}
                        onChange={(e) => setCommentsMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="gov-input min-h-[80px] resize-y"
                        placeholder="请输入评审意见"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => handleSubmit(item.id)} className="gov-btn-primary">提交评审</button>
                    </div>
                  </div>
                )}

                {isExpanded && isSubmitted && (
                  <div className="px-4 pb-4 border-t border-gov-border pt-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-gov-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">已完成评审，总分：{totalScore(item.id)}分</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
