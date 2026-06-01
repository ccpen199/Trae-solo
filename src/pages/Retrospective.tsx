import { useEffect, useState } from 'react'
import { useSchemesStore, issueTypeLabels } from '@/store/schemes'
import type { SchemeRound, Comment, IssueTypeCount } from '@/types'
import { roleLabels } from '@/types'
import { cn } from '@/lib/utils'

const issueTypeColors: Record<string, string> = {
  unclear_entry: 'bg-red-500',
  missing_state: 'bg-orange-500',
  uncovered_exception: 'bg-yellow-500',
  copy_risk: 'bg-purple-500',
  dev_cost: 'bg-blue-500',
  other: 'bg-gray-500',
}

const issueTypeBadgeColors: Record<string, string> = {
  unclear_entry: 'bg-red-100 text-red-600',
  missing_state: 'bg-orange-100 text-orange-600',
  uncovered_exception: 'bg-yellow-100 text-yellow-700',
  copy_risk: 'bg-purple-100 text-purple-600',
  dev_cost: 'bg-blue-100 text-blue-600',
  other: 'bg-gray-100 text-gray-600',
}

export default function Retrospective() {
  const { getIssues, getRounds, getRisks, getFeedback } = useSchemesStore()
  const [issueTypes, setIssueTypes] = useState<IssueTypeCount[]>([])
  const [rounds, setRounds] = useState<SchemeRound[]>([])
  const [risks, setRisks] = useState<Comment[]>([])
  const [feedback, setFeedback] = useState<Comment[]>([])

  useEffect(() => {
    getIssues().then((data) => setIssueTypes(data.issueTypes))
    getRounds().then(setRounds)
    getRisks().then(setRisks)
    getFeedback().then(setFeedback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maxCount = Math.max(...issueTypes.map((i) => i.count), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">复盘看板</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">问题类型分布</h3>
          <div className="space-y-3">
            {issueTypes.length > 0 ? issueTypes.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600 truncate">
                  {issueTypeLabels[item.type] || item.type}
                </span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={cn('h-full rounded-lg', issueTypeColors[item.type] || 'bg-gray-500')}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-medium text-gray-700">{item.count}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无数据</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">评审轮次统计</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">方案名称</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">步骤数</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">已通过</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">通过率</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length > 0 ? rounds.map((round) => {
                  const passRate = round.step_count > 0
                    ? Math.round((round.approved_step_count / round.step_count) * 100)
                    : 0
                  return (
                    <tr key={round.id} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-gray-900">{round.name}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{round.step_count}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{round.approved_step_count}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          passRate >= 80 ? 'bg-green-100 text-green-600' :
                          passRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'
                        )}>
                          {passRate}%
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">未关闭风险</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {risks.length > 0 ? risks.map((risk) => (
              <div key={risk.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {risk.issue_type && (
                    <span className={cn('px-2 py-0.5 text-xs rounded', issueTypeBadgeColors[risk.issue_type])}>
                      {issueTypeLabels[risk.issue_type]}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{risk.step_title}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{risk.content}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{risk.author_name}</span>
                  <span>·</span>
                  <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1e3a5f] rounded">
                    {roleLabels[risk.author_role]}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无未关闭风险</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">上线反馈</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {feedback.length > 0 ? feedback.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1e3a5f]">方案 #{item.scheme_id}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{item.author_name}</span>
                  <span>·</span>
                  <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1e3a5f] rounded">
                    {roleLabels[item.author_role]}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无上线反馈</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
