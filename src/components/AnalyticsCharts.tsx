import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FunnelAnalytics, FillCycleData, HeadhunterROI } from '@/types'
import { FieldBadge } from '@/components/Shared'

interface TooltipPayloadItem {
  color: string
  name: string
  value: number | string
}

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-steel-900 border border-steel-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-steel-300 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-steel-50 text-sm font-mono">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}

const stageLabels: Record<string, string> = {
  totalResumes: '简历',
  screened: '筛选',
  interviewed: '面试',
  offered: 'Offer',
}

export function FunnelChart({ data }: { data: FunnelAnalytics }) {
  const stages = data.total
  if (!stages?.length) return null

  const maxCount = Math.max(...stages.map((s) => s.count))

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
        const colors = ['bg-ice-500', 'bg-purple-500', 'bg-amber-500', 'bg-green-500']
        const rateFromPrev = i > 0 && stages[i - 1].count > 0
          ? ((stage.count / stages[i - 1].count) * 100).toFixed(1)
          : null

        return (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-steel-300 w-16">{stageLabels[stage.stage] || stage.stage}</span>
              <span className="font-mono text-steel-100">{stage.count.toLocaleString()}</span>
            </div>
            <div className="h-7 bg-steel-800 rounded-md overflow-hidden relative">
              <div
                className={`h-full ${colors[i]} rounded-md transition-all duration-700 flex items-center justify-end pr-2`}
                style={{ width: `${pct}%` }}
              >
                {pct > 20 && (
                  <span className="text-steel-950 text-xs font-mono font-semibold">
                    {stage.rate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            {rateFromPrev && (
              <div className="flex items-center gap-1 text-xs text-steel-500 pl-16">
                <span>转化率</span>
                <span className="font-mono text-amber-400">{rateFromPrev}%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function FillCycleTrend({ data }: { data: FillCycleData }) {
  if (!data.monthly?.length) return null

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A68" />
        <XAxis dataKey="month" stroke="#5A7FB3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#5A7FB3" tick={{ fontSize: 11 }} />
        <Tooltip content={<DarkTooltip />} />
        <Line
          type="monotone"
          dataKey="avgDays"
          name="平均天数"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ fill: '#F59E0B', r: 4 }}
          activeDot={{ r: 6, fill: '#FBBF24' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function FieldFillCycle({ data }: { data: FillCycleData }) {
  if (!data.byField?.length) return null

  const fieldColors: Record<string, string> = {
    '汽车制造': '#38BDF8',
    '零部件': '#A855F7',
    '新能源': '#22C55E',
    '智能驾驶': '#F59E0B',
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data.byField} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A68" />
        <XAxis dataKey="field" stroke="#5A7FB3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#5A7FB3" tick={{ fontSize: 11 }} />
        <Tooltip content={<DarkTooltip />} />
        <Bar dataKey="avgDays" name="平均天数" radius={[4, 4, 0, 0]}>
          {data.byField.map((entry, index) => (
            <Cell key={index} fill={fieldColors[entry.field] || '#5A7FB3'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HeadhunterROITable({ data }: { data: HeadhunterROI }) {
  if (!data.byField?.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-steel-700/50">
            <th className="text-left text-steel-400 py-2 px-2 font-medium">领域</th>
            <th className="text-right text-steel-400 py-2 px-2 font-medium">推荐</th>
            <th className="text-right text-steel-400 py-2 px-2 font-medium">面试</th>
            <th className="text-right text-steel-400 py-2 px-2 font-medium">录用</th>
            <th className="text-right text-steel-400 py-2 px-2 font-medium">费用</th>
            <th className="text-right text-steel-400 py-2 px-2 font-medium">ROI</th>
          </tr>
        </thead>
        <tbody>
          {data.byField.map((row) => (
            <tr key={row.field} className="border-b border-steel-800/50 hover:bg-steel-800/30 transition-colors">
              <td className="py-2.5 px-2"><FieldBadge field={row.field} /></td>
              <td className="text-right py-2.5 px-2 font-mono text-steel-200">{row.recommendations}</td>
              <td className="text-right py-2.5 px-2 font-mono text-steel-200">{row.interviews}</td>
              <td className="text-right py-2.5 px-2 font-mono text-steel-200">{row.hires}</td>
              <td className="text-right py-2.5 px-2 font-mono text-steel-200">¥{row.cost.toLocaleString()}</td>
              <td className="text-right py-2.5 px-2">
                <span className={`font-mono font-semibold ${row.roi >= 100 ? 'text-green-400' : row.roi >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {row.roi.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.overall && (
        <div className="mt-3 pt-3 border-t border-steel-700/50 flex gap-6 text-xs text-steel-400">
          <span>总费用: <span className="font-mono text-steel-200">¥{data.overall.totalCost.toLocaleString()}</span></span>
          <span>总录用: <span className="font-mono text-steel-200">{data.overall.totalHires}</span></span>
          <span>人均成本: <span className="font-mono text-steel-200">¥{data.overall.avgCostPerHire.toLocaleString()}</span></span>
        </div>
      )}
    </div>
  )
}
