import { useState } from 'react'
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { rankings } from '@/data/mockData'

const periods = [
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' },
]

const medalStyles: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Trophy size={18} className="text-amber-500" /> },
  2: { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Medal size={18} className="text-gray-400" /> },
  3: { bg: 'bg-orange-50', text: 'text-orange-700', icon: <Medal size={18} className="text-orange-400" /> },
}

export default function Rankings() {
  const [activePeriod, setActivePeriod] = useState('month')

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="业绩排行" subtitle="直销团队业绩排名与数据概览" actions={
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setActivePeriod(p.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activePeriod === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      } />

      {rankings.slice(0, 3).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {rankings.slice(0, 3).map((r, idx) => {
            const rank = idx + 1
            const medal = medalStyles[rank]
            return (
              <div
                key={r.rank}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center animate-fade-in-up stagger-${idx + 1} ${
                  r.name === '李晓芳' ? 'ring-2 ring-emerald-200' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${medal.bg}`}>
                  {medal.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{r.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{r.region}</p>
                <p className="text-xl font-bold text-emerald-600 mt-2">¥{r.sales.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">+{r.growth}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Trophy size={16} className="text-emerald-600" />
          <span className="font-semibold text-gray-900">完整排行</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">排名</th>
                <th className="px-5 py-3 text-left font-medium">姓名</th>
                <th className="px-5 py-3 text-left font-medium">区域</th>
                <th className="px-5 py-3 text-right font-medium">销售额</th>
                <th className="px-5 py-3 text-right font-medium">增长率</th>
                <th className="px-5 py-3 text-center font-medium">团队规模</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rankings.map((r) => {
                const isMe = r.name === '李晓芳'
                const medal = medalStyles[r.rank]

                return (
                  <tr
                    key={r.rank}
                    className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="px-5 py-3">
                      {medal ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${medal.bg} ${medal.text} text-xs font-bold`}>
                          {r.rank}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 text-sm text-gray-500 font-medium">
                          {r.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{r.name}</span>
                        {isMe && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">我</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{r.region}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">¥{r.sales.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                        <TrendingUp size={12} />
                        +{r.growth}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                        <Users size={12} />{r.teamSize}人
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
