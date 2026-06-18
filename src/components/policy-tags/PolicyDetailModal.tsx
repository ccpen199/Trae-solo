import { useState } from 'react'
import { X, Tag, Users, Sparkles, Check, Plus } from 'lucide-react'
import type { Policy } from './EnhancedPolicyList'

interface PolicyDetailModalProps {
  policy: Policy
  onClose: () => void
}

interface Clause {
  id: number
  title: string
  content: string
  tags: string[]
  crowds: string[]
}

const clauseData: Record<number, Clause[]> = {
  1: [
    {
      id: 1,
      title: '第一条 调整范围',
      content: '2025年12月31日前已按规定办理退休手续并按月领取基本养老金的退休人员。',
      tags: ['调整范围', '退休人员'],
      crowds: ['退休人员', '企业职工', '机关事业单位'],
    },
    {
      id: 2,
      title: '第二条 调整水平',
      content: '全国调整比例按照2025年退休人员月人均基本养老金的3.5%确定。各省以全国调整比例为高限，确定本省调整比例和水平。',
      tags: ['调整水平', '3.5%'],
      crowds: ['退休人员'],
    },
    {
      id: 3,
      title: '第三条 调整办法',
      content: '采取定额调整、挂钩调整与适当倾斜相结合的办法，并实现企业和机关事业单位退休人员调整办法统一。定额调整要体现公平原则；挂钩调整要体现多缴多得、长缴多得的激励机制；对高龄退休人员、艰苦边远地区退休人员，可适当提高调整水平。',
      tags: ['调整办法', '定额调整', '挂钩调整'],
      crowds: ['退休人员', '高龄人员'],
    },
    {
      id: 4,
      title: '第四条 资金来源',
      content: '调整基本养老金所需资金，参加企业职工基本养老保险的从企业职工基本养老保险基金中列支，参加机关事业单位工作人员基本养老保险的从机关事业单位基本养老保险基金中列支。对中西部地区、老工业基地等地方，中央财政按规定给予适当补助。',
      tags: ['资金来源', '财政补助'],
      crowds: ['退休人员', '中西部地区'],
    },
  ],
}

const allTagsPool = ['调整范围', '调整水平', '调整办法', '资金来源', '缴费标准', '待遇计发', '参保范围', '高龄人员', '中西部地区', '3.5%']
const allCrowdsPool = ['企业职工', '退休人员', '灵活就业', '城乡居民', '机关事业单位', '失业人员', '工伤人员', '高龄人员', '中西部地区']

const crowdBadgeStyles: Record<string, string> = {
  '退休人员': 'bg-orange-50 text-orange-600 border border-orange-200',
  '企业职工': 'bg-blue-50 text-blue-600 border border-blue-200',
  '机关事业单位': 'bg-purple-50 text-purple-600 border border-purple-200',
  '灵活就业': 'bg-teal-50 text-teal-600 border border-teal-200',
  '城乡居民': 'bg-green-50 text-green-600 border border-green-200',
  '失业人员': 'bg-red-50 text-red-600 border border-red-200',
  '工伤人员': 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  '高龄人员': 'bg-amber-50 text-amber-600 border border-amber-200',
  '中西部地区': 'bg-cyan-50 text-cyan-600 border border-cyan-200',
}

const tagColors = ['bg-blue-50 text-blue-600', 'bg-green-50 text-green-600', 'bg-purple-50 text-purple-600', 'bg-amber-50 text-amber-600', 'bg-rose-50 text-rose-600']

export default function PolicyDetailModal({ policy, onClose }: PolicyDetailModalProps) {
  const clauses = clauseData[policy.id] || [
    { id: 1, title: '第一条 适用范围', content: policy.content.slice(0, 100), tags: ['适用范围'], crowds: policy.targetCrowds },
  ]
  const [clauseList, setClauseList] = useState(clauses)
  const [aiLoading, setAiLoading] = useState(false)

  const toggleClauseTag = (clauseId: number, tag: string) => {
    setClauseList((prev) =>
      prev.map((c) => {
        if (c.id !== clauseId) return c
        const hasTag = c.tags.includes(tag)
        return { ...c, tags: hasTag ? c.tags.filter((t) => t !== tag) : [...c.tags, tag] }
      })
    )
  }

  const toggleClauseCrowd = (clauseId: number, crowd: string) => {
    setClauseList((prev) =>
      prev.map((c) => {
        if (c.id !== clauseId) return c
        const has = c.crowds.includes(crowd)
        return { ...c, crowds: has ? c.crowds.filter((cc) => cc !== crowd) : [...c.crowds, crowd] }
      })
    )
  }

  const runAiTagging = () => {
    setAiLoading(true)
    setTimeout(() => {
      setClauseList((prev) =>
        prev.map((c) => ({
          ...c,
          tags: Array.from(new Set([...c.tags, 'AI推荐', '政策要点'])),
        }))
      )
      setAiLoading(false)
    }, 1500)
  }

  const allClauseTags = Array.from(new Set(clauseList.flatMap((c) => c.tags)))
  const allClauseCrowds = Array.from(new Set(clauseList.flatMap((c) => c.crowds)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{policy.title}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              <span>{policy.docNumber}</span>
              <span>·</span>
              <span>{policy.department}</span>
              <span>·</span>
              <span>{policy.date}发布</span>
              <span
                className={`px-2 py-0.5 rounded-full ${
                  policy.status === '有效' ? 'bg-green-50 text-green-600' : policy.status === '草案' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {policy.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">政策标签云</h3>
              </div>
              <button
                onClick={runAiTagging}
                disabled={aiLoading}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
              >
                <Sparkles size={12} />
                {aiLoading ? 'AI分析中...' : 'AI智能打标'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {allClauseTags.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs ${tagColors[i % tagColors.length]}`}>
                  {t}
                </span>
              ))}
              {policy.tags.map((t, i) => (
                <span key={t} className={`px-3 py-1 rounded-full text-xs ${tagColors[(i + allClauseTags.length) % tagColors.length]}`}>
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">适用人群徽章墙</h3>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-orange-50/30 rounded-lg">
              {allClauseCrowds.map((c) => (
                <span
                  key={c}
                  className={`px-3 py-1 rounded-full text-xs border ${crowdBadgeStyles[c] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">正文条款列表</h3>
            <div className="space-y-3">
              {clauseList.map((clause) => (
                <div key={clause.id} className="border border-gray-100 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{clause.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{clause.content}</p>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">条款标签:</span>
                      <button
                        onClick={() => {
                          const extra = allTagsPool.find((t) => !clause.tags.includes(t))
                          if (extra) toggleClauseTag(clause.id, extra)
                        }}
                        className="flex items-center gap-0.5 text-xs text-primary hover:text-primary-dark transition-colors"
                      >
                        <Plus size={10} />
                        新增
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {clause.tags.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleClauseTag(clause.id, t)}
                          className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <Check size={10} />
                          {t}
                        </button>
                      ))}
                      {allTagsPool.filter((t) => !clause.tags.includes(t)).slice(0, 3).map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleClauseTag(clause.id, t)}
                          className="px-2 py-0.5 rounded text-xs border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">适用人群:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {clause.crowds.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleClauseCrowd(clause.id, c)}
                          className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${
                            crowdBadgeStyles[c] || 'bg-gray-50 text-gray-600 border border-gray-200'
                          } hover:opacity-80 transition-opacity`}
                        >
                          <Check size={10} />
                          {c}
                        </button>
                      ))}
                      {allCrowdsPool.filter((cc) => !clause.crowds.includes(cc)).slice(0, 3).map((cc) => (
                        <button
                          key={cc}
                          onClick={() => toggleClauseCrowd(clause.id, cc)}
                          className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-colors"
                        >
                          +{cc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}
